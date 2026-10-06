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

    for (i, &sample) in samples.iter().enumerate() {
        if !sample.is_finite() {
            wav.extend_from_slice(&0i16.to_le_bytes());
            continue;
        }

        let mut envelope = 1.0f32;
        if attack_samples > 0 && i < attack_samples {
            // Hann half-window ramp from 0.0 to 1.0
            let factor = (std::f32::consts::PI * (i as f32) / (attack_samples as f32)).cos();
            envelope = 0.5 * (1.0 - factor);
        } else if release_samples > 0 && i >= total_samples.saturating_sub(release_samples) {
            let idx = total_samples - 1 - i;
            let factor = (std::f32::consts::PI * (idx as f32) / (release_samples as f32)).cos();
            envelope = 0.5 * (1.0 - factor);
        }

        let smoothed = sample * envelope;
        let clamped = smoothed.max(-1.0).min(1.0);
        let pcm_sample = (clamped * 32767.0) as i16;
        wav.extend_from_slice(&pcm_sample.to_le_bytes());
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
) -> Result<Vec<u8>, String> {
    #[cfg(feature = "native-kokoro")]
    {
        let mut engine_lock = state.engine.lock().await;
        let engine = match engine_lock.as_mut() {
            Some(e) => e,
            None => {
                return Err("Native Kokoro engine is not initialized. Call kokoro_init first.".to_string());
            }
        };

        let voice_ref = voice.as_deref().unwrap_or("af_heart");
        let speed_val = speed.unwrap_or(1.0);
        let gain_val = gain.unwrap_or(1.0);

        let samples = engine
            .synthesize_with_options(&text, Some(voice_ref), speed_val, gain_val, None)
            .map_err(|e| format!("Synthesis failed: {}", e))?;

        let wav_bytes = samples_to_wav(&samples, 24000);
        Ok(wav_bytes)
    }
    #[cfg(not(feature = "native-kokoro"))]
    {
        let _ = (state, text, voice, speed, gain);
        Err("Legacy compatibility mode: Built without AVX2 native Kokoro feature. Delegating to client audio pipeline.".to_string())
    }
}
