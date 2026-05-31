use crate::qwen3_asr_engine::{DownloadProgress, ModelInfo, ModelStatus, Qwen3AsrEngine};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Emitter, Manager, Runtime};

pub static QWEN3_ASR_ENGINE: Mutex<Option<Arc<Qwen3AsrEngine>>> = Mutex::new(None);

static MODELS_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

pub fn set_models_directory<R: Runtime>(app: &AppHandle<R>) {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    let models_dir = app_data_dir.join("models");

    if !models_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(&models_dir) {
            log::error!("Failed to create models directory: {}", e);
            return;
        }
    }

    *MODELS_DIR.lock().unwrap() = Some(models_dir);
}

fn get_models_directory() -> Option<PathBuf> {
    MODELS_DIR.lock().unwrap().clone()
}

#[command]
pub async fn qwen3_asr_init() -> Result<(), String> {
    let mut guard = QWEN3_ASR_ENGINE.lock().unwrap();
    if guard.is_some() {
        return Ok(());
    }

    let engine = Qwen3AsrEngine::new_with_models_dir(get_models_directory())
        .map_err(|e| format!("Failed to initialize Qwen3-ASR engine: {}", e))?;
    *guard = Some(Arc::new(engine));
    Ok(())
}

#[command]
pub async fn qwen3_asr_get_available_models() -> Result<Vec<ModelInfo>, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover Qwen3-ASR models: {}", e))
}

#[command]
pub async fn qwen3_asr_load_model(model_name: String) -> Result<(), String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover Qwen3-ASR models: {}", e))?;
    engine
        .load_model(&model_name)
        .await
        .map_err(|e| format!("Failed to load Qwen3-ASR model: {}", e))
}

#[command]
pub async fn qwen3_asr_get_current_model() -> Result<Option<String>, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    Ok(engine.get_current_model().await)
}

#[command]
pub async fn qwen3_asr_is_model_loaded() -> Result<bool, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    Ok(engine.is_model_loaded().await)
}

#[command]
pub async fn qwen3_asr_has_available_models() -> Result<bool, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    let models = engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover Qwen3-ASR models: {}", e))?;
    Ok(models
        .iter()
        .any(|model| matches!(model.status, ModelStatus::Available)))
}

#[command]
pub async fn qwen3_asr_validate_model_ready<R: Runtime>(
    app: AppHandle<R>,
) -> Result<String, String> {
    qwen3_asr_validate_model_ready_with_config(&app).await
}

pub async fn qwen3_asr_validate_model_ready_with_config<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<String, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;

    let configured_model =
        match crate::api::api::api_get_transcript_config(app.clone(), app.state(), None).await {
            Ok(Some(config)) if config.provider == "qwen3Asr" && !config.model.is_empty() => {
                Some(config.model)
            }
            _ => None,
        };

    let models = engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover Qwen3-ASR models: {}", e))?;
    let available_models: Vec<_> = models
        .iter()
        .filter(|model| matches!(model.status, ModelStatus::Available))
        .collect();

    if available_models.is_empty() {
        return Err(
            "No Qwen3-ASR models are available. Please download a model in settings.".to_string(),
        );
    }

    let model_name = configured_model
        .filter(|model| {
            available_models
                .iter()
                .any(|available| available.name == *model)
        })
        .unwrap_or_else(|| available_models[0].name.clone());

    engine
        .load_model(&model_name)
        .await
        .map_err(|e| format!("Failed to load Qwen3-ASR model {}: {}", model_name, e))?;

    Ok(model_name)
}

#[command]
pub async fn qwen3_asr_transcribe_audio(audio_data: Vec<f32>) -> Result<String, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    engine
        .transcribe_audio(audio_data, None)
        .await
        .map_err(|e| format!("Qwen3-ASR transcription failed: {}", e))
}

#[command]
pub async fn qwen3_asr_get_models_directory() -> Result<String, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    Ok(engine
        .get_models_directory()
        .await
        .to_string_lossy()
        .to_string())
}

#[command]
pub async fn qwen3_asr_download_model<R: Runtime>(
    app_handle: AppHandle<R>,
    model_name: String,
) -> Result<(), String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    let app_handle_clone = app_handle.clone();
    let model_name_clone = model_name.clone();

    let progress_callback = Box::new(move |progress: DownloadProgress| {
        let _ = app_handle_clone.emit(
            "qwen3-asr-model-download-progress",
            serde_json::json!({
                "modelName": model_name_clone,
                "progress": progress.percent,
                "downloaded_bytes": progress.downloaded_bytes,
                "total_bytes": progress.total_bytes,
                "downloaded_mb": progress.downloaded_mb,
                "total_mb": progress.total_mb,
                "speed_mbps": progress.speed_mbps,
                "status": if progress.percent >= 100.0 { "completed" } else { "downloading" }
            }),
        );
    });

    engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover Qwen3-ASR models: {}", e))?;

    match engine
        .download_model_detailed(&model_name, Some(progress_callback))
        .await
    {
        Ok(()) => {
            let _ = app_handle.emit(
                "qwen3-asr-model-download-complete",
                serde_json::json!({ "modelName": model_name }),
            );
            crate::tray::update_tray_menu(&app_handle);
            Ok(())
        }
        Err(e) => {
            let _ = app_handle.emit(
                "qwen3-asr-model-download-error",
                serde_json::json!({
                    "modelName": model_name,
                    "error": e.to_string()
                }),
            );
            Err(format!("Failed to download Qwen3-ASR model: {}", e))
        }
    }
}

#[command]
pub async fn qwen3_asr_cancel_download<R: Runtime>(
    app_handle: AppHandle<R>,
    model_name: String,
) -> Result<(), String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    engine
        .cancel_download(&model_name)
        .await
        .map_err(|e| format!("Failed to cancel Qwen3-ASR download: {}", e))?;

    let _ = app_handle.emit(
        "qwen3-asr-model-download-progress",
        serde_json::json!({
            "modelName": model_name,
            "progress": 0,
            "status": "cancelled"
        }),
    );

    Ok(())
}

#[command]
pub async fn qwen3_asr_delete_model(model_name: String) -> Result<String, String> {
    let engine = get_engine().ok_or_else(|| "Qwen3-ASR engine not initialized".to_string())?;
    engine
        .delete_model(&model_name)
        .await
        .map_err(|e| format!("Failed to delete Qwen3-ASR model: {}", e))
}

#[command]
pub async fn open_qwen3_asr_models_folder() -> Result<(), String> {
    let models_dir = get_models_directory()
        .ok_or_else(|| "Qwen3-ASR models directory not initialized".to_string())?
        .join("qwen3-asr");

    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let folder_path = models_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&folder_path)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {}", e))?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&folder_path)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {}", e))?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(&folder_path)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {}", e))?;

    Ok(())
}

fn get_engine() -> Option<Arc<Qwen3AsrEngine>> {
    QWEN3_ASR_ENGINE.lock().unwrap().as_ref().cloned()
}
