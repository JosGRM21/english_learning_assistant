// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use sha2::{Digest, Sha256};

mod tts;

fn derive_stronghold_key(password: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(b"com.ela.learningassistant.stronghold.v1:");
    hasher.update(password.as_bytes());
    hasher.finalize().to_vec()
}

fn main() {
    let tts_state = Arc::new(tts::TtsState::new());

    tauri::Builder::default()
        .manage(tts_state)
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                derive_stronghold_key(password)
            })
            .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tts::kokoro_is_ready,
            tts::kokoro_init,
            tts::kokoro_synthesize,
            tts::kokoro_get_voices,
            tts::get_build_target,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
