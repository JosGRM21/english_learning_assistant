use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::State;

#[cfg(feature = "native-kokoro")]
pub struct TtsState {
    pub engine: Mutex<Option<kokoro_micro::TtsEngine>>,
    pub is_available: Mutex<bool>,
}

#[cfg(not(feature = "native-kokoro"))]
pub struct TtsState {
    #[allow(dead_code)]
    pub is_available: Mutex<bool>,
}

impl TtsState {
    pub fn new() -> Self {
        #[cfg(feature = "native-kokoro")]
        {
            Self {
                engine: Mutex::new(None),
                is_available: Mutex::new(false),
            }
        }
        #[cfg(not(feature = "native-kokoro"))]
        {
            Self {
                is_available: Mutex::new(false),
            }
        }
    }
}

#[tauri::command]
pub fn get_build_target() -> &'static str {
    #[cfg(feature = "native-kokoro")]
    {
        "avx2-native"
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        "legacy-universal"
    }
}

#[tauri::command]
pub async fn kokoro_is_ready(state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    #[cfg(feature = "native-kokoro")]
    {
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
pub async fn kokoro_init(state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    #[cfg(feature = "native-kokoro")]
    {
        let mut engine_lock = state.engine.lock().await;
        if engine_lock.is_some() {
            return Ok(true);
        }
        match kokoro_micro::TtsEngine::new().await {
            Ok(engine) => {
                *engine_lock = Some(engine);
                let mut avail_lock = state.is_available.lock().await;
                *avail_lock = true;
                Ok(true)
            }
            Err(err) => Err(format!("Failed to initialize native Kokoro engine: {}", err)),
        }
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = state;
        Err("Legacy compatibility mode: Built without AVX2 native Kokoro feature. Delegating to client audio pipeline.".to_string())
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

#[cfg(feature = "native-kokoro")]
fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Vec<u8> {
    let num_channels: u16 = 1;
    let bits_per_sample: u16 = 16;
    let byte_rate = sample_rate * u32::from(num_channels) * u32::from(bits_per_sample / 8);
    let block_align = num_channels * (bits_per_sample / 8);
    let data_chunk_size = (samples.len() * 2) as u32;
    let total_file_size = 36 + data_chunk_size;

    let mut wav = Vec::with_capacity(44 + (samples.len() * 2));
    // RIFF chunk
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&total_file_size.to_le_bytes());
    wav.extend_from_slice(b"WAVE");

    // fmt sub-chunk
    wav.extend_from_slice(b"fmt ");
    wav.extend_from_slice(&16u32.to_le_bytes()); // Subchunk1Size (16 for PCM)
    wav.extend_from_slice(&1u16.to_le_bytes());  // AudioFormat (1 = PCM)
    wav.extend_from_slice(&num_channels.to_le_bytes());
    wav.extend_from_slice(&sample_rate.to_le_bytes());
    wav.extend_from_slice(&byte_rate.to_le_bytes());
    wav.extend_from_slice(&block_align.to_le_bytes());
    wav.extend_from_slice(&bits_per_sample.to_le_bytes());

    // data sub-chunk
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&data_chunk_size.to_le_bytes());

    let total_samples = samples.len();
    // 15ms at 24kHz = 360 samples for attack smoothing (eliminates vocoder start click / DC offset)
    let attack_samples = 360.min(total_samples / 4);
    // 10ms at 24kHz = 240 samples for release smoothing
    let release_samples = 240.min(total_samples / 4);
    let release_start = total_samples.saturating_sub(release_samples);

    // Pre-allocate payload buffer to eliminate repeated reallocations
    let data_offset = wav.len();
    wav.resize(data_offset + (total_samples * 2), 0);
    let pcm_bytes = &mut wav[data_offset..];

    // Pass 1: Attack envelope ramp
    if attack_samples > 0 {
        let inv_attack = 1.0f32 / (attack_samples as f32);
        for i in 0..attack_samples {
            let sample = samples[i];
            let pcm_sample = if sample.is_finite() {
                let factor = (std::f32::consts::PI * (i as f32) * inv_attack).cos();
                let envelope = 0.5 * (1.0 - factor);
                let smoothed = sample * envelope;
                (smoothed.max(-1.0).min(1.0) * 32767.0) as i16
            } else {
                0i16
            };
            let offset = i * 2;
            pcm_bytes[offset..offset + 2].copy_from_slice(&pcm_sample.to_le_bytes());
        }
    }

    // Pass 2: Middle body (vectorizable loop without envelope branches)
    let mid_start = attack_samples;
    let mid_end = release_start.max(mid_start);
    for i in mid_start..mid_end {
        let sample = samples[i];
        let pcm_sample = if sample.is_finite() {
            (sample.max(-1.0).min(1.0) * 32767.0) as i16
        } else {
            0i16
        };
        let offset = i * 2;
        pcm_bytes[offset..offset + 2].copy_from_slice(&pcm_sample.to_le_bytes());
    }

    // Pass 3: Release envelope ramp
    if release_samples > 0 && release_start < total_samples {
        let inv_release = 1.0f32 / (release_samples as f32);
        for i in release_start..total_samples {
            let sample = samples[i];
            let pcm_sample = if sample.is_finite() {
                let idx = total_samples - 1 - i;
                let factor = (std::f32::consts::PI * (idx as f32) * inv_release).cos();
                let envelope = 0.5 * (1.0 - factor);
                let smoothed = sample * envelope;
                (smoothed.max(-1.0).min(1.0) * 32767.0) as i16
            } else {
                0i16
            };
            let offset = i * 2;
            pcm_bytes[offset..offset + 2].copy_from_slice(&pcm_sample.to_le_bytes());
        }
    }

    wav
}

#[tauri::command]
pub async fn kokoro_synthesize(
    state: State<'_, Arc<TtsState>>,
    text: String,
    voice: Option<String>,
    speed: Option<f32>,
    gain: Option<f32>,
) -> Result<tauri::ipc::Response, String> {
    #[cfg(feature = "native-kokoro")]
    {
        let is_ready = *state.is_available.lock().await;
        if !is_ready {
            return Err("Native Kokoro engine is not initialized. Call kokoro_init first.".to_string());
        }

        let state_clone = Arc::clone(&state);
        let voice_val = voice.unwrap_or_else(|| "af_heart".to_string());
        let speed_val = speed.unwrap_or(1.0);
        let gain_val = gain.unwrap_or(1.0);

        tokio::task::spawn_blocking(move || {
            let mut engine_lock = state_clone
                .engine
                .blocking_lock();
            let engine = match engine_lock.as_mut() {
                Some(e) => e,
                None => {
                    return Err("Native Kokoro engine is not initialized.".to_string());
                }
            };

            let samples = engine
                .synthesize_with_options(&text, Some(&voice_val), speed_val, gain_val, None)
                .map_err(|e| format!("Synthesis failed: {}", e))?;

            let wav_bytes = samples_to_wav(&samples, 24000);
            Ok(tauri::ipc::Response::new(wav_bytes))
        })
        .await
        .map_err(|e| format!("Synthesis thread join error: {}", e))?
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = (state, text, voice, speed, gain);
        Err("Legacy compatibility mode: Built without AVX2 native Kokoro feature. Delegating to client audio pipeline.".to_string())
    }
}

