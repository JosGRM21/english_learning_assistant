use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::State;

pub struct TtsState {
    #[allow(dead_code)]
    pub is_available: Mutex<bool>,
}

impl TtsState {
    pub fn new() -> Self {
        Self {
            is_available: Mutex::new(false),
        }
    }
}

#[tauri::command]
pub async fn kokoro_is_ready(_state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    Ok(false)
}

#[tauri::command]
pub async fn kokoro_init(_state: State<'_, Arc<TtsState>>) -> Result<bool, String> {
    Err("Hardware constraint: Precompiled native ONNX Runtime binaries require AVX2 instructions, not supported by this host CPU architecture. Delegating to client audio pipeline.".to_string())
}

#[tauri::command]
pub async fn kokoro_get_voices(_state: State<'_, Arc<TtsState>>) -> Result<Vec<String>, String> {
    Ok(vec![
        "af_heart".to_string(),
        "af_sky".to_string(),
        "af_bella".to_string(),
        "af_nicole".to_string(),
        "am_adam".to_string(),
        "am_michael".to_string(),
        "bf_emma".to_string(),
        "bf_isabella".to_string(),
        "bm_george".to_string(),
        "bm_lewis".to_string(),
    ])
}

#[tauri::command]
pub async fn kokoro_synthesize(
    _state: State<'_, Arc<TtsState>>,
    _text: String,
    _voice: Option<String>,
    _speed: Option<f32>,
    _gain: Option<f32>,
) -> Result<Vec<u8>, String> {
    Err("Hardware constraint: Precompiled native ONNX Runtime binaries require AVX2 instructions, not supported by this host CPU architecture. Delegating to client audio pipeline.".to_string())
}
