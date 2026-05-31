use anyhow::{anyhow, Result};
use futures_util::{future::join_all, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;
use tokio::fs;
use tokio::io::{AsyncWriteExt, BufWriter};
use tokio::process::Command;
use tokio::sync::RwLock;
use tokio::time::timeout;

const HUGGINGFACE_BASE_URLS: &[&str] = &["https://huggingface.co", "https://hf-mirror.com"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelStatus {
    Available,
    Missing,
    Downloading {
        progress: u8,
    },
    Error(String),
    Corrupted {
        file_size: u64,
        expected_min_size: u64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub downloaded_mb: f64,
    pub total_mb: f64,
    pub speed_mbps: f64,
    pub percent: f64,
}

impl DownloadProgress {
    fn new(downloaded: u64, total: u64, speed_mbps: f64) -> Self {
        let percent = if total > 0 {
            ((downloaded as f64 / total as f64) * 100.0).min(100.0)
        } else {
            0.0
        };

        Self {
            downloaded_bytes: downloaded,
            total_bytes: total,
            downloaded_mb: downloaded as f64 / 1_048_576.0,
            total_mb: total as f64 / 1_048_576.0,
            speed_mbps,
            percent,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub repo_id: String,
    pub path: PathBuf,
    pub size_mb: u32,
    pub accuracy: String,
    pub speed: String,
    pub status: ModelStatus,
    pub description: String,
}

#[derive(Debug, Deserialize)]
struct HuggingFaceModelInfo {
    siblings: Vec<HuggingFaceSibling>,
}

#[derive(Debug, Deserialize)]
struct HuggingFaceSibling {
    rfilename: String,
    size: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct QwenPythonResult {
    text: String,
}

#[derive(Debug, Clone)]
struct QwenModelConfig {
    name: &'static str,
    repo_id: &'static str,
    size_mb: u32,
    accuracy: &'static str,
    speed: &'static str,
    description: &'static str,
}

const MODEL_CONFIGS: &[QwenModelConfig] = &[
    QwenModelConfig {
        name: "Qwen3-ASR-0.6B",
        repo_id: "Qwen/Qwen3-ASR-0.6B",
        size_mb: 1900,
        accuracy: "High",
        speed: "Medium",
        description: "Smaller Qwen3-ASR model with multilingual and Chinese dialect support",
    },
    QwenModelConfig {
        name: "Qwen3-ASR-1.7B",
        repo_id: "Qwen/Qwen3-ASR-1.7B",
        size_mb: 4700,
        accuracy: "High",
        speed: "Slow",
        description: "Larger Qwen3-ASR model with stronger open-source ASR accuracy",
    },
];

pub struct Qwen3AsrEngine {
    models_dir: PathBuf,
    current_model_name: Arc<RwLock<Option<String>>>,
    pub(crate) available_models: Arc<RwLock<HashMap<String, ModelInfo>>>,
    pub(crate) active_downloads: Arc<RwLock<HashSet<String>>>,
    cancel_download_flag: Arc<RwLock<Option<String>>>,
}

impl Qwen3AsrEngine {
    pub fn new_with_models_dir(models_dir: Option<PathBuf>) -> Result<Self> {
        let models_dir = if let Some(dir) = models_dir {
            dir.join("qwen3-asr")
        } else {
            dirs::data_dir()
                .or_else(|| dirs::home_dir())
                .ok_or_else(|| anyhow!("Could not find system data directory"))?
                .join("Meetily")
                .join("models")
                .join("qwen3-asr")
        };

        if !models_dir.exists() {
            std::fs::create_dir_all(&models_dir)?;
        }

        Ok(Self {
            models_dir,
            current_model_name: Arc::new(RwLock::new(None)),
            available_models: Arc::new(RwLock::new(HashMap::new())),
            active_downloads: Arc::new(RwLock::new(HashSet::new())),
            cancel_download_flag: Arc::new(RwLock::new(None)),
        })
    }

    pub async fn discover_models(&self) -> Result<Vec<ModelInfo>> {
        let active_downloads = self.active_downloads.read().await;
        let mut models = Vec::new();

        for config in MODEL_CONFIGS {
            let model_path = self.models_dir.join(config.name);
            let status = if active_downloads.contains(config.name) {
                ModelStatus::Downloading { progress: 0 }
            } else if self.is_valid_model_dir(&model_path).await {
                ModelStatus::Available
            } else if model_path.exists() {
                let file_size = directory_size(&model_path).unwrap_or(0);
                ModelStatus::Corrupted {
                    file_size,
                    expected_min_size: (config.size_mb as u64 * 1_048_576) / 2,
                }
            } else {
                ModelStatus::Missing
            };

            models.push(ModelInfo {
                name: config.name.to_string(),
                repo_id: config.repo_id.to_string(),
                path: model_path,
                size_mb: config.size_mb,
                accuracy: config.accuracy.to_string(),
                speed: config.speed.to_string(),
                status,
                description: config.description.to_string(),
            });
        }

        let mut available_models = self.available_models.write().await;
        available_models.clear();
        for model in &models {
            available_models.insert(model.name.clone(), model.clone());
        }

        Ok(models)
    }

    pub async fn load_model(&self, model_name: &str) -> Result<()> {
        let models = self.available_models.read().await;
        let model = models
            .get(model_name)
            .ok_or_else(|| anyhow!("Qwen3-ASR model {} not found", model_name))?;

        match model.status {
            ModelStatus::Available => {
                *self.current_model_name.write().await = Some(model_name.to_string());
                Ok(())
            }
            ModelStatus::Missing => {
                Err(anyhow!("Qwen3-ASR model {} is not downloaded", model_name))
            }
            ModelStatus::Downloading { .. } => Err(anyhow!(
                "Qwen3-ASR model {} is currently downloading",
                model_name
            )),
            ModelStatus::Error(ref error) => Err(anyhow!(
                "Qwen3-ASR model {} has error: {}",
                model_name,
                error
            )),
            ModelStatus::Corrupted { .. } => Err(anyhow!(
                "Qwen3-ASR model {} is corrupted and cannot be loaded",
                model_name
            )),
        }
    }

    pub async fn unload_model(&self) -> bool {
        self.current_model_name.write().await.take().is_some()
    }

    pub async fn get_current_model(&self) -> Option<String> {
        self.current_model_name.read().await.clone()
    }

    pub async fn is_model_loaded(&self) -> bool {
        self.current_model_name.read().await.is_some()
    }

    pub async fn get_models_directory(&self) -> PathBuf {
        self.models_dir.clone()
    }

    pub async fn delete_model(&self, model_name: &str) -> Result<String> {
        let models = self.available_models.read().await;
        let model = models
            .get(model_name)
            .ok_or_else(|| anyhow!("Qwen3-ASR model '{}' not found", model_name))?
            .clone();
        drop(models);

        if model.path.exists() {
            fs::remove_dir_all(&model.path).await?;
        }

        if self.get_current_model().await.as_deref() == Some(model_name) {
            self.unload_model().await;
        }

        Ok(format!(
            "Successfully deleted Qwen3-ASR model '{}'",
            model_name
        ))
    }

    pub async fn download_model_detailed(
        &self,
        model_name: &str,
        progress_callback: Option<Box<dyn Fn(DownloadProgress) + Send>>,
    ) -> Result<()> {
        {
            let mut active = self.active_downloads.write().await;
            if !active.insert(model_name.to_string()) {
                return Err(anyhow!(
                    "Download already in progress for model: {}",
                    model_name
                ));
            }
        }

        let result = self
            .download_model_inner(model_name, progress_callback)
            .await;

        self.active_downloads.write().await.remove(model_name);
        result
    }

    async fn download_model_inner(
        &self,
        model_name: &str,
        progress_callback: Option<Box<dyn Fn(DownloadProgress) + Send>>,
    ) -> Result<()> {
        let config = MODEL_CONFIGS
            .iter()
            .find(|config| config.name == model_name)
            .ok_or_else(|| anyhow!("Unsupported Qwen3-ASR model: {}", model_name))?;

        *self.cancel_download_flag.write().await = None;

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(7200))
            .connect_timeout(Duration::from_secs(30))
            .build()?;

        let (selected_base_url, hf_model) =
            fetch_model_info_with_best_endpoint(&client, config.repo_id).await?;

        let files: Vec<_> = hf_model
            .siblings
            .into_iter()
            .filter(|file| !file.rfilename.ends_with(".md"))
            .collect();

        let total_bytes = files
            .iter()
            .filter_map(|file| file.size)
            .sum::<u64>()
            .max(config.size_mb as u64 * 1_048_576);

        let model_dir = self.models_dir.join(config.name);
        if model_dir.exists() {
            fs::remove_dir_all(&model_dir).await?;
        }
        fs::create_dir_all(&model_dir).await?;

        let start = Instant::now();
        let mut last_report = Instant::now();
        let mut last_percent = 0.0f64;
        let mut downloaded_bytes = 0u64;

        if let Some(callback) = progress_callback.as_ref() {
            callback(DownloadProgress::new(0, total_bytes, 0.0));
        }

        for file in files {
            if self.cancel_download_flag.read().await.as_deref() == Some(model_name) {
                return Err(anyhow!("Download cancelled"));
            }

            let mut response = None;
            let mut last_error = None;

            for base_url in ordered_huggingface_base_urls(&selected_base_url) {
                let file_url = format!(
                    "{}/{}/resolve/main/{}",
                    base_url, config.repo_id, file.rfilename
                );

                match client.get(&file_url).send().await {
                    Ok(resp) => match resp.error_for_status() {
                        Ok(resp) => {
                            if base_url != selected_base_url {
                                log::info!(
                                    "Qwen3-ASR download switched to fallback endpoint {} for {}",
                                    base_url,
                                    file.rfilename
                                );
                            }
                            response = Some(resp);
                            break;
                        }
                        Err(e) => {
                            last_error = Some(e.to_string());
                            log::warn!(
                                "Qwen3-ASR download endpoint {} failed for {}: {}",
                                base_url,
                                file.rfilename,
                                e
                            );
                        }
                    },
                    Err(e) => {
                        last_error = Some(e.to_string());
                        log::warn!(
                            "Qwen3-ASR download endpoint {} failed for {}: {}",
                            base_url,
                            file.rfilename,
                            e
                        );
                    }
                }
            }

            let response = response.ok_or_else(|| {
                anyhow!(
                    "Failed to download {} from Hugging Face endpoints: {}",
                    file.rfilename,
                    last_error.unwrap_or_else(|| "unknown error".to_string())
                )
            })?;
            let file_path = model_dir.join(&file.rfilename);
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent).await?;
            }

            let mut stream = response.bytes_stream();
            let file = fs::File::create(&file_path).await?;
            let mut writer = BufWriter::new(file);

            while let Some(chunk) = stream.next().await {
                if self.cancel_download_flag.read().await.as_deref() == Some(model_name) {
                    return Err(anyhow!("Download cancelled"));
                }

                let chunk = chunk?;
                writer.write_all(&chunk).await?;
                downloaded_bytes += chunk.len() as u64;

                if let Some(callback) = progress_callback.as_ref() {
                    let elapsed = start.elapsed().as_secs_f64().max(0.1);
                    let progress = DownloadProgress::new(
                        downloaded_bytes,
                        total_bytes,
                        downloaded_bytes as f64 / 1_048_576.0 / elapsed,
                    );

                    if (progress.percent - last_percent).abs() >= 0.1
                        || last_report.elapsed() >= Duration::from_millis(300)
                    {
                        last_percent = progress.percent;
                        last_report = Instant::now();
                        callback(progress);
                    }
                }
            }

            writer.flush().await?;
        }

        if !self.is_valid_model_dir(&model_dir).await {
            return Err(anyhow!("Downloaded model is incomplete or invalid"));
        }

        if let Some(callback) = progress_callback.as_ref() {
            let elapsed = start.elapsed().as_secs_f64().max(0.1);
            callback(DownloadProgress::new(
                total_bytes,
                total_bytes,
                total_bytes as f64 / 1_048_576.0 / elapsed,
            ));
        }

        Ok(())
    }

    pub async fn cancel_download(&self, model_name: &str) -> Result<()> {
        *self.cancel_download_flag.write().await = Some(model_name.to_string());
        Ok(())
    }

    pub async fn transcribe_audio(
        &self,
        audio_data: Vec<f32>,
        language: Option<String>,
    ) -> Result<String> {
        let model_name = self
            .get_current_model()
            .await
            .ok_or_else(|| anyhow!("No Qwen3-ASR model loaded"))?;
        let model_path = self.models_dir.join(model_name);

        let mut wav_file = NamedTempFile::new()?;
        write_wav_16k_mono(&mut wav_file, &audio_data)?;
        let wav_path = wav_file.path().to_path_buf();
        let language_arg = map_language(language);

        let script = r#"
import json
import sys
import torch
from qwen_asr import Qwen3ASRModel

model_path = sys.argv[1]
audio_path = sys.argv[2]
language = None if sys.argv[3] == "" else sys.argv[3]
device = "cuda:0" if torch.cuda.is_available() else "cpu"
dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
model = Qwen3ASRModel.from_pretrained(
    model_path,
    dtype=dtype,
    device_map=device,
    max_inference_batch_size=1,
    max_new_tokens=256,
)
result = model.transcribe(audio=audio_path, language=language)
print(json.dumps({"text": result[0].text}, ensure_ascii=False))
"#;

        let python =
            find_python_binary().ok_or_else(|| anyhow!("Python 3 is required to run Qwen3-ASR"))?;

        let output = Command::new(python)
            .arg("-c")
            .arg(script)
            .arg(model_path)
            .arg(wav_path)
            .arg(language_arg.unwrap_or_default())
            .output()
            .await?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow!(
                "Qwen3-ASR transcription failed. Install the official runtime with `pip install -U qwen-asr`. Details: {}",
                stderr.trim()
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let parsed: QwenPythonResult = serde_json::from_str(stdout.trim()).map_err(|e| {
            anyhow!(
                "Failed to parse Qwen3-ASR output: {} ({})",
                e,
                stdout.trim()
            )
        })?;

        Ok(parsed.text)
    }

    async fn is_valid_model_dir(&self, model_dir: &Path) -> bool {
        if !model_dir.exists() {
            return false;
        }

        let has_config = model_dir.join("config.json").exists();
        let has_tokenizer =
            model_dir.join("vocab.json").exists() || model_dir.join("tokenizer.json").exists();
        let has_weights = model_dir.join("model.safetensors").exists()
            || model_dir.join("model.safetensors.index.json").exists();

        has_config && has_tokenizer && has_weights
    }
}

async fn fetch_model_info_with_best_endpoint(
    client: &reqwest::Client,
    repo_id: &str,
) -> Result<(String, HuggingFaceModelInfo)> {
    log::info!(
        "Qwen3-ASR probing download endpoints for {}: {:?}",
        repo_id,
        HUGGINGFACE_BASE_URLS
    );

    let probes = HUGGINGFACE_BASE_URLS.iter().map(|base_url| {
        fetch_model_info_from_endpoint(client.clone(), (*base_url).to_string(), repo_id.to_string())
    });

    let probe_results = join_all(probes).await;
    let mut successful = Vec::new();

    for result in probe_results {
        match result {
            Ok((base_url, model_info, elapsed)) => {
                log::info!(
                    "Qwen3-ASR endpoint probe ok: {} latency={}ms reason=metadata_api_reachable",
                    base_url,
                    elapsed.as_millis()
                );
                successful.push((base_url, model_info, elapsed));
            }
            Err(probe_error) => {
                log::warn!(
                    "Qwen3-ASR endpoint probe failed: reason={}",
                    probe_error
                );
            }
        }
    }

    successful.sort_by_key(|(_, _, elapsed)| *elapsed);

    if let Some((base_url, model_info, elapsed)) = successful.into_iter().next() {
        log::info!(
            "Qwen3-ASR selected download endpoint: {} latency={}ms reason=fastest_successful_metadata_probe",
            base_url,
            elapsed.as_millis()
        );
        Ok((base_url, model_info))
    } else {
        Err(anyhow!(
            "Failed to reach Hugging Face or China mirror for model metadata"
        ))
    }
}

async fn fetch_model_info_from_endpoint(
    client: reqwest::Client,
    base_url: String,
    repo_id: String,
) -> Result<(String, HuggingFaceModelInfo, Duration)> {
    let started = Instant::now();
    let api_url = format!("{}/api/models/{}", base_url, repo_id);

    let model_info = timeout(Duration::from_secs(8), async {
        client
            .get(api_url)
            .send()
            .await?
            .error_for_status()?
            .json::<HuggingFaceModelInfo>()
            .await
    })
    .await
    .map_err(|_| anyhow!("endpoint={} error=timeout_after_8s", base_url))?
    .map_err(|e| anyhow!("endpoint={} error={}", base_url, e))?;

    Ok((base_url, model_info, started.elapsed()))
}

fn ordered_huggingface_base_urls(preferred_base_url: &str) -> Vec<&'static str> {
    let mut urls = Vec::with_capacity(HUGGINGFACE_BASE_URLS.len());

    for base_url in HUGGINGFACE_BASE_URLS {
        if *base_url == preferred_base_url {
            urls.push(*base_url);
        }
    }

    for base_url in HUGGINGFACE_BASE_URLS {
        if *base_url != preferred_base_url {
            urls.push(*base_url);
        }
    }

    urls
}

fn directory_size(path: &Path) -> Result<u64> {
    let mut size = 0;
    for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let metadata = entry.metadata()?;
        if metadata.is_dir() {
            size += directory_size(&entry.path())?;
        } else {
            size += metadata.len();
        }
    }
    Ok(size)
}

fn find_python_binary() -> Option<PathBuf> {
    if let Ok(current_dir) = std::env::current_dir() {
        for ancestor in current_dir.ancestors() {
            let venv_python = ancestor.join("backend").join("venv").join("bin").join("python");
            if venv_python.exists() {
                return Some(venv_python);
            }
        }
    }

    which::which("python3")
        .ok()
        .or_else(|| which::which("python").ok())
}

fn map_language(language: Option<String>) -> Option<String> {
    match language.as_deref() {
        None | Some("auto") | Some("auto-translate") => None,
        Some("zh") => Some("Chinese".to_string()),
        Some("en") => Some("English".to_string()),
        Some("yue") => Some("Cantonese".to_string()),
        Some("ja") => Some("Japanese".to_string()),
        Some("ko") => Some("Korean".to_string()),
        Some("fr") => Some("French".to_string()),
        Some("de") => Some("German".to_string()),
        Some("es") => Some("Spanish".to_string()),
        Some("pt") => Some("Portuguese".to_string()),
        Some("it") => Some("Italian".to_string()),
        Some("ru") => Some("Russian".to_string()),
        Some(other) => Some(other.to_string()),
    }
}

fn write_wav_16k_mono(file: &mut NamedTempFile, samples: &[f32]) -> Result<()> {
    let sample_rate = 16_000u32;
    let bits_per_sample = 16u16;
    let channels = 1u16;
    let data_len = samples.len() as u32 * 2;
    let byte_rate = sample_rate * channels as u32 * bits_per_sample as u32 / 8;
    let block_align = channels * bits_per_sample / 8;

    file.write_all(b"RIFF")?;
    file.write_all(&(36 + data_len).to_le_bytes())?;
    file.write_all(b"WAVE")?;
    file.write_all(b"fmt ")?;
    file.write_all(&16u32.to_le_bytes())?;
    file.write_all(&1u16.to_le_bytes())?;
    file.write_all(&channels.to_le_bytes())?;
    file.write_all(&sample_rate.to_le_bytes())?;
    file.write_all(&byte_rate.to_le_bytes())?;
    file.write_all(&block_align.to_le_bytes())?;
    file.write_all(&bits_per_sample.to_le_bytes())?;
    file.write_all(b"data")?;
    file.write_all(&data_len.to_le_bytes())?;

    for sample in samples {
        let pcm = (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        file.write_all(&pcm.to_le_bytes())?;
    }

    file.flush()?;
    Ok(())
}
