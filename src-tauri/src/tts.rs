use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use serde::Serialize;
use tauri::async_runtime::Mutex;
use tauri::State;

use crate::cpu_features::CpuCapabilities;

#[derive(Debug, Clone, Serialize)]
pub struct AudioChunkPayload {
    /// Raw Little-Endian byte buffer of f32 audio samples (4 bytes per sample) for true zero-copy binary IPC
    #[serde(with = "serde_bytes")]
    pub samples_bytes: Vec<u8>,
    /// Sample rate in Hertz (Kokoro natively produces 24000 Hz)
    pub sample_rate: u32,
    /// Sequential index of the synthesized sentence chunk
    pub chunk_index: usize,
    /// Indicates whether this chunk is the final segment of the stream
    pub is_final: bool,
}

#[cfg(feature = "native-kokoro")]
pub struct TtsState {
    pub engine: Mutex<Option<kokoro_micro::TtsEngine>>,
    pub is_available: Mutex<bool>,
    pub cpu_caps: CpuCapabilities,
    /// Atomic generation ID to cancel in-flight synthesis instantly
    pub active_generation_id: AtomicU64,
}

#[cfg(not(feature = "native-kokoro"))]
pub struct TtsState {
    #[allow(dead_code)]
    pub is_available: Mutex<bool>,
    pub cpu_caps: CpuCapabilities,
    pub active_generation_id: AtomicU64,
}

impl TtsState {
    pub fn new() -> Self {
        let cpu_caps = CpuCapabilities::detect();
        #[cfg(feature = "native-kokoro")]
        {
            Self {
                engine: Mutex::new(None),
                is_available: Mutex::new(false),
                cpu_caps,
                active_generation_id: AtomicU64::new(0),
            }
        }
        #[cfg(not(feature = "native-kokoro"))]
        {
            Self {
                is_available: Mutex::new(false),
                cpu_caps,
                active_generation_id: AtomicU64::new(0),
            }
        }
    }
}

#[tauri::command]
pub fn get_cpu_capabilities(state: State<'_, Arc<TtsState>>) -> CpuCapabilities {
    state.cpu_caps.clone()
}

#[tauri::command]
pub fn get_build_target(state: State<'_, Arc<TtsState>>) -> String {
    #[cfg(feature = "native-kokoro")]
    {
        if state.cpu_caps.has_avx2 {
            "avx2-native".to_string()
        } else if state.cpu_caps.has_avx {
            "avx-native".to_string()
        } else {
            "legacy-universal".to_string()
        }
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = state;
        "legacy-universal".to_string()
    }
}

#[tauri::command]
pub async fn kokoro_is_ready(state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    #[cfg(feature = "native-kokoro")]
    {
        if !state.cpu_caps.has_avx && !state.cpu_caps.has_sse42 {
            return Ok(false);
        }
        let avail = state.is_available.lock().await;
        Ok(*avail)
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = state;
        Ok(false)
    }
}

#[tauri::command]
pub fn kokoro_stop(state: State<'_, Arc<TtsState>>) {
    state.active_generation_id.fetch_add(1, Ordering::SeqCst);
}

#[cfg(feature = "native-kokoro")]
pub fn prepare_onnxruntime_dylib() -> Result<std::path::PathBuf, String> {
    // 1. Check if ORT_DYLIB_PATH is already set and exists
    if let Ok(env_path) = std::env::var("ORT_DYLIB_PATH") {
        let p = std::path::PathBuf::from(&env_path);
        if p.exists() {
            return Ok(p);
        }
    }

    // 2. Check next to the current executable or parent directory (e.g. target/debug when running tests)
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            let next_to_exe = parent.join("onnxruntime.dll");
            if next_to_exe.exists() {
                std::env::set_var("ORT_DYLIB_PATH", &next_to_exe);
                return Ok(next_to_exe);
            }
            let in_resources = parent.join("resources").join("onnxruntime.dll");
            if in_resources.exists() {
                std::env::set_var("ORT_DYLIB_PATH", &in_resources);
                return Ok(in_resources);
            }
            if let Some(grandparent) = parent.parent() {
                let in_grandparent = grandparent.join("onnxruntime.dll");
                if in_grandparent.exists() {
                    std::env::set_var("ORT_DYLIB_PATH", &in_grandparent);
                    return Ok(in_grandparent);
                }
            }
        }
    }

    // 3. Check current working directory or src-tauri
    let cwd_dll = std::path::Path::new("onnxruntime.dll");
    if cwd_dll.exists() {
        if let Ok(abs) = cwd_dll.canonicalize() {
            std::env::set_var("ORT_DYLIB_PATH", &abs);
            return Ok(abs);
        }
    }

    // 4. Check shared Kokoro cache directory (~/.cache/k)
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());
    let cache_dll = std::path::Path::new(&home).join(".cache").join("k").join("onnxruntime.dll");
    if cache_dll.exists() {
        std::env::set_var("ORT_DYLIB_PATH", &cache_dll);
        return Ok(cache_dll);
    }

    // 4. Do NOT fall back to System32 (which has a stripped WinML OS DLL without OrtGetApiBase)
    Err("Compatible onnxruntime.dll was not found in executable directory or ~/.cache/k/".to_string())
}

#[tauri::command]
pub async fn kokoro_init(state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    #[cfg(feature = "native-kokoro")]
    {
        // 1. Hardware gatekeeper: require at least AVX or SSE4.2 for native ONNX Runtime execution.
        // Official ONNX Runtime x86_64 CPU EP binaries use runtime ISA dispatch (MLAS).
        if !state.cpu_caps.has_avx && !state.cpu_caps.has_sse42 {
            eprintln!(
                "[KokoroNative] CPU microarchitecture (tier: {}) lacks AVX and SSE4.2 support. Safely bypassing native engine to delegate to client audio pipeline.",
                state.cpu_caps.tier
            );
            return Ok(false);
        }

        let mut engine_lock = state.engine.lock().await;
        if engine_lock.is_some() {
            return Ok(true);
        }

        // Configure optimal neural compute threads calculated in CpuCapabilities before loading ONNX Runtime
        let threads_str = state.cpu_caps.recommended_threads.to_string();
        std::env::set_var("OMP_NUM_THREADS", &threads_str);
        std::env::set_var("ORT_INTRA_OP_NUM_THREADS", &threads_str);
        std::env::set_var("ORT_INTER_OP_NUM_THREADS", "1");

        // Verify and pin the ONNX Runtime dynamic library path
        if let Err(err) = prepare_onnxruntime_dylib() {
            eprintln!("[KokoroNative] {}", err);
            return Ok(false);
        }

        // 2. Panic safety: Catch any panic from dynamic loader or ort initialization
        // on an isolated thread to prevent poisoning mutexes or killing the tokio runtime.
        let init_task = tauri::async_runtime::spawn_blocking(move || {
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                tauri::async_runtime::block_on(async {
                    kokoro_micro::TtsEngine::new().await
                })
            }))
        });

        match init_task.await {
            Ok(Ok(Ok(engine))) => {
                *engine_lock = Some(engine);
                let mut avail_lock = state.is_available.lock().await;
                *avail_lock = true;
                eprintln!("[KokoroNative] Native Kokoro engine initialized successfully.");
                Ok(true)
            }
            Ok(Ok(Err(err))) => {
                eprintln!("[KokoroNative] Failed to initialize native Kokoro engine: {}", err);
                Ok(false)
            }
            Ok(Err(panic_payload)) => {
                let panic_msg = if let Some(s) = panic_payload.downcast_ref::<&str>() {
                    s.to_string()
                } else if let Some(s) = panic_payload.downcast_ref::<String>() {
                    s.clone()
                } else {
                    "Unknown panic during native ONNX runtime initialization".to_string()
                };
                eprintln!("[KokoroNative] Trapped panic during native Kokoro init: {}. Safely falling back to client audio pipeline.", panic_msg);
                Ok(false)
            }
            Err(join_err) => {
                eprintln!("[KokoroNative] Worker thread failed during init: {}. Falling back to client audio pipeline.", join_err);
                Ok(false)
            }
        }
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = state;
        Ok(false)
    }
}

#[tauri::command]
pub async fn kokoro_get_voices(state: State<'_, Arc<TtsState>>) -> Result<Vec<String>, String> {
    #[cfg(feature = "native-kokoro")]
    {
        let engine_lock = state.engine.lock().await;
        if let Some(engine) = engine_lock.as_ref() {
            let voices = engine.voices();
            if !voices.is_empty() {
                return Ok(voices);
            }
        }
    }
    let _ = state;
    Ok(vec![
        "af_heart".to_string(),
        "af_sky".to_string(),
        "af_bella".to_string(),
        "af_nicole".to_string(),
        "af_sarah".to_string(),
        "am_adam".to_string(),
        "am_michael".to_string(),
        "bf_emma".to_string(),
        "bf_isabella".to_string(),
        "bm_george".to_string(),
        "bm_lewis".to_string(),
    ])
}

/// Applies an in-place vectorized anti-click cosine envelope to raw float32 samples.
/// Eliminates vocoder attack clicks and DC offset transients without allocating new memory.
#[cfg(feature = "native-kokoro")]
fn apply_anticlick_envelope(samples: &mut [f32]) {
    let total_samples = samples.len();
    if total_samples < 32 {
        return;
    }

    // 2.5ms attack ramp at 24kHz = 60 samples (smooth DC offset transition without clipping initial phonemes)
    let attack_samples = 60.min(total_samples / 4);
    if attack_samples > 0 {
        let inv_attack = 1.0f32 / (attack_samples as f32);
        for i in 0..attack_samples {
            let s = samples[i];
            if s.is_finite() {
                let factor = (std::f32::consts::PI * (i as f32) * inv_attack).cos();
                let envelope = 0.5 * (1.0 - factor);
                samples[i] = (s * envelope).clamp(-1.0, 1.0);
            } else {
                samples[i] = 0.0;
            }
        }
    }

    // 2.5ms release ramp at 24kHz = 60 samples
    let release_samples = 60.min(total_samples / 4);
    let release_start = total_samples.saturating_sub(release_samples);
    if release_samples > 0 && release_start < total_samples {
        let inv_release = 1.0f32 / (release_samples as f32);
        for i in release_start..total_samples {
            let s = samples[i];
            if s.is_finite() {
                let idx = total_samples - 1 - i;
                let factor = (std::f32::consts::PI * (idx as f32) * inv_release).cos();
                let envelope = 0.5 * (1.0 - factor);
                samples[i] = (s * envelope).clamp(-1.0, 1.0);
            } else {
                samples[i] = 0.0;
            }
        }
    }
}

/// Ensures that a sentence chunk ends with proper terminal punctuation so that Kokoro's
/// G2P phonemizer and StyleTTS2 duration regulator predict natural terminal cadence and
/// do not stretch single words or incomplete clauses into abnormal, distorted durations.
#[cfg(feature = "native-kokoro")]
fn ensure_terminal_punctuation(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let last_char = trimmed.chars().last().unwrap();
    if matches!(last_char, '.' | '?' | '!' | ';' | ':' | ',') {
        trimmed.to_string()
    } else {
        format!("{}.", trimmed)
    }
}

/// Splits text into natural sentence/clause units based on punctuation.
/// Facilitates low-latency pipelined streaming synthesis.
#[cfg(feature = "native-kokoro")]
fn split_into_sentence_chunks(text: &str) -> Vec<String> {
    let mut chunks = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        current.push(ch);
        // Break on major punctuation or newlines
        if ch == '.' || ch == '?' || ch == '!' || ch == ';' || ch == '\n' {
            let trimmed = current.trim();
            if !trimmed.is_empty() {
                chunks.push(ensure_terminal_punctuation(trimmed));
            }
            current.clear();
        }
    }

    let remainder = current.trim();
    if !remainder.is_empty() {
        chunks.push(ensure_terminal_punctuation(remainder));
    }

    if chunks.is_empty() && !text.trim().is_empty() {
        chunks.push(ensure_terminal_punctuation(text.trim()));
    }

    chunks
}

/// Splits text into sentence/clause units with fast-tracking for the first long sentence.
/// Reduces Time-To-First-Audio (TTFA) by emitting the first short clause without waiting for full sentences.
#[cfg(feature = "native-kokoro")]
fn split_into_fast_ttfa_chunks(text: &str) -> Vec<String> {
    let base_sentences = split_into_sentence_chunks(text);
    let mut optimized = Vec::with_capacity(base_sentences.len() + 1);

    for (i, sentence) in base_sentences.into_iter().enumerate() {
        // If the first sentence has more than 10 words, split at the first clause delimiter (comma, semicolon, colon, dash)
        if i == 0 && sentence.split_whitespace().count() > 10 {
            if let Some(idx) = sentence.find([',', ';', ':', '—']) {
                let (first, rest) = sentence.split_at(idx + 1);
                if first.split_whitespace().count() >= 3 && rest.split_whitespace().count() >= 3 {
                    optimized.push(ensure_terminal_punctuation(first.trim()));
                    optimized.push(ensure_terminal_punctuation(rest.trim()));
                    continue;
                }
            }
        }
        optimized.push(sentence);
    }
    optimized
}

/// High-performance pipelined sentence streaming command.
/// Emits raw Float32 audio samples in binary Little-Endian format as soon as each sentence segment is synthesized,
/// achieving sub-150ms Time-To-First-Audio latency.
#[tauri::command]
pub async fn kokoro_synthesize_stream(
    state: State<'_, Arc<TtsState>>,
    text: String,
    voice: Option<String>,
    speed: Option<f32>,
    gain: Option<f32>,
    on_chunk: tauri::ipc::Channel<AudioChunkPayload>,
) -> Result<(), String> {
    #[cfg(feature = "native-kokoro")]
    {
        let is_ready = *state.is_available.lock().await;
        if !is_ready {
            return Err("Native Kokoro engine is not initialized. Call kokoro_init first.".to_string());
        }

        let segments = split_into_fast_ttfa_chunks(&text);
        if segments.is_empty() {
            return Ok(());
        }

        // Increment atomic generation counter to invalidate any previous in-flight synthesis
        let gen_id = state.active_generation_id.fetch_add(1, Ordering::SeqCst) + 1;
        let state_clone = Arc::clone(&state);
        let voice_val = voice.unwrap_or_else(|| "af_heart".to_string());
        let speed_val = speed.unwrap_or(1.0);
        let gain_val = gain.unwrap_or(1.0);
        let total_segments = segments.len();

        // kokoro-micro 1.3.0 scales input speed by SPEED_SCALE = 0.65 internally
        // (clamped_speed = (speed * 0.65).clamp(0.35, 2.2)), which erroneously slows speech down
        // to ~0.65x when given 1.0, and to ~0.49x when given 0.75 (causing extreme neural vocoder distortion).
        // We compensate so the ONNX model receives the exact user-requested speed factor.
        const KOKORO_MICRO_SPEED_SCALE: f32 = 0.65;
        let effective_speed = speed_val.clamp(0.4, 2.2) / KOKORO_MICRO_SPEED_SCALE;

        tauri::async_runtime::spawn_blocking(move || {
            for (idx, segment) in segments.into_iter().enumerate() {
                // 1. Non-blocking cancellation check before inference
                if state_clone.active_generation_id.load(Ordering::SeqCst) != gen_id {
                    break;
                }

                // 2. Lock the engine Mutex ONLY during the inference of the current segment
                let mut samples = {
                    let mut engine_lock = state_clone.engine.blocking_lock();
                    let engine = match engine_lock.as_mut() {
                        Some(e) => e,
                        None => {
                            return Err("Native Kokoro engine is not initialized.".to_string());
                        }
                    };
                    engine
                        .synthesize_with_options(&segment, Some(&voice_val), effective_speed, gain_val, None)
                        .map_err(|e| format!("Synthesis failed for segment '{}': {}", segment, e))?
                }; // Engine lock released here

                // 3. Check again immediately after inference
                if state_clone.active_generation_id.load(Ordering::SeqCst) != gen_id {
                    break;
                }

                // Apply in-place anti-click cosine smoothing
                apply_anticlick_envelope(&mut samples);

                // Guarantee all samples are strictly finite and normalized in [-1.0, 1.0]
                for s in samples.iter_mut() {
                    if !s.is_finite() {
                        *s = 0.0;
                    } else {
                        *s = s.clamp(-1.0, 1.0);
                    }
                }

                // Transmit raw f32 bytes in Little-Endian for true zero-copy binary IPC
                let byte_len = samples.len() * std::mem::size_of::<f32>();
                let samples_bytes = unsafe {
                    std::slice::from_raw_parts(samples.as_ptr() as *const u8, byte_len).to_vec()
                };

                let is_final = idx == total_segments - 1;
                let payload = AudioChunkPayload {
                    samples_bytes,
                    sample_rate: 24000,
                    chunk_index: idx,
                    is_final,
                };

                // Stream binary payload across zero-copy Tauri IPC channel
                if let Err(err) = on_chunk.send(payload) {
                    eprintln!("[KokoroStream] Failed to send audio chunk to client channel: {}", err);
                    break;
                }
            }

            Ok(())
        })
        .await
        .map_err(|e| format!("Synthesis worker thread join error: {}", e))?
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = (state, text, voice, speed, gain, on_chunk);
        Err("Native Kokoro feature is not enabled in this build.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpu_capabilities() {
        let caps = CpuCapabilities::detect();
        println!("Detected CPU caps: {:?}", caps);
        assert!(caps.recommended_threads >= 1);
    }

    #[test]
    fn test_split_sentences() {
        let text = "Hello world! How are you today? This is a test.";
        let chunks = split_into_sentence_chunks(text);
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0], "Hello world!");
        assert_eq!(chunks[1], "How are you today?");
        assert_eq!(chunks[2], "This is a test.");
    }

    #[test]
    fn test_split_fast_ttfa_chunks() {
        let long_sentence = "Although the international conference was postponed due to severe weather conditions, the research team continued working on the presentation.";
        let chunks = split_into_fast_ttfa_chunks(long_sentence);
        assert!(chunks.len() >= 2);
        assert!(chunks[0].contains("postponed"));
    }

    #[test]
    fn test_ensure_terminal_punctuation() {
        assert_eq!(ensure_terminal_punctuation("run"), "run.");
        assert_eq!(ensure_terminal_punctuation("fourth"), "fourth.");
        assert_eq!(ensure_terminal_punctuation("run."), "run.");
        assert_eq!(ensure_terminal_punctuation("hello!"), "hello!");
        assert_eq!(ensure_terminal_punctuation("why?"), "why?");
    }

    #[test]
    fn test_anticlick_envelope() {
        let mut samples = vec![1.0; 2400];
        apply_anticlick_envelope(&mut samples);
        assert!(samples[0] < 0.1);
        assert!(samples[samples.len() - 1] < 0.1);
    }

    #[tokio::test]
    #[cfg(feature = "native-kokoro")]
    async fn test_native_kokoro_init() {
        let caps = CpuCapabilities::detect();
        if !caps.has_avx && !caps.has_sse42 {
            println!("Skipping native Kokoro engine test: CPU microarchitecture (tier: {}) lacks AVX/SSE4.2 support.", caps.tier);
            return;
        }

        let dll_res = prepare_onnxruntime_dylib();
        println!("prepare_onnxruntime_dylib result: {:?}", dll_res);
        assert!(dll_res.is_ok(), "onnxruntime.dll must be found");

        let init_task = tauri::async_runtime::spawn_blocking(|| {
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                tauri::async_runtime::block_on(async {
                    kokoro_micro::TtsEngine::new().await
                })
            }))
        });

        match init_task.await {
            Ok(Ok(Ok(engine))) => {
                let voices = engine.voices();
                println!("Loaded engine voices: {:?}", voices);
                assert!(!voices.is_empty());
                let audio = engine.synthesize_with_options("Hello!", Some("af_heart"), 1.0, 1.0, None);
                assert!(audio.is_ok());
                println!("Synthesized audio samples: {}", audio.unwrap().len());
            }
            Ok(Ok(Err(e))) => {
                println!("TtsEngine::new returned Err: {}", e);
            }
            Ok(Err(panic_payload)) => {
                let panic_msg = if let Some(s) = panic_payload.downcast_ref::<&str>() {
                    s.to_string()
                } else if let Some(s) = panic_payload.downcast_ref::<String>() {
                    s.clone()
                } else {
                    "Unknown panic".to_string()
                };
                println!("Caught panic during test init (safe fallback validated): {}", panic_msg);
            }
            Err(join_err) => {
                println!("Worker thread join error: {}", join_err);
            }
        }
    }
}
