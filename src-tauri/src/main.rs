// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

mod tts;

fn main() {
    let tts_state = Arc::new(tts::TtsState::new());

    tauri::Builder::default()
        .manage(tts_state)
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                password.as_bytes().to_vec()
            })
            .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tts::kokoro_is_ready,
            tts::kokoro_init,
            tts::kokoro_synthesize,
            tts::kokoro_get_voices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
