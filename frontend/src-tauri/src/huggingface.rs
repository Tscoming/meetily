use anyhow::{anyhow, Result};
use futures_util::{future::join_all, StreamExt};
use reqwest::Client;
use serde::Deserialize;
use std::time::{Duration, Instant};
use tokio::time::timeout;
use url::Url;

pub const HUGGINGFACE_BASE_URLS: &[&str] = &["https://huggingface.co", "https://hf-mirror.com"];
const SPEED_TEST_BYTES: u64 = 5 * 1_048_576;

#[derive(Debug, Clone, Deserialize)]
pub struct HuggingFaceModelInfo {
    pub siblings: Vec<HuggingFaceSibling>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HuggingFaceSibling {
    pub rfilename: String,
    pub size: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct HuggingFaceResolveUrl {
    pub repo_id: String,
    pub revision: String,
    pub file_path: String,
}

#[derive(Debug, Clone)]
pub struct EndpointPlan {
    pub base_urls: Vec<String>,
    pub model_info: HuggingFaceModelInfo,
}

#[derive(Clone)]
struct MetadataProbe {
    base_url: String,
    model_info: HuggingFaceModelInfo,
    elapsed: Duration,
}

struct SpeedProbe {
    metadata: MetadataProbe,
    downloaded_bytes: u64,
    elapsed: Duration,
}

impl SpeedProbe {
    fn bytes_per_second(&self) -> f64 {
        self.downloaded_bytes as f64 / self.elapsed.as_secs_f64().max(0.001)
    }
}

pub fn parse_huggingface_resolve_url(download_url: &str) -> Option<HuggingFaceResolveUrl> {
    let url = Url::parse(download_url).ok()?;
    let host = url.host_str()?;
    if host != "huggingface.co" && host != "hf-mirror.com" {
        return None;
    }

    let segments: Vec<_> = url.path_segments()?.collect();
    let resolve_index = segments.iter().position(|segment| *segment == "resolve")?;
    if resolve_index < 2 || segments.len() <= resolve_index + 2 {
        return None;
    }

    Some(HuggingFaceResolveUrl {
        repo_id: format!("{}/{}", segments[0], segments[1]),
        revision: segments[resolve_index + 1].to_string(),
        file_path: segments[resolve_index + 2..].join("/"),
    })
}

pub fn resolve_file_url(base_url: &str, repo_id: &str, revision: &str, file_path: &str) -> String {
    format!(
        "{}/{}/resolve/{}/{}",
        base_url, repo_id, revision, file_path
    )
}

pub async fn endpoint_plan_for_repo(
    client: &Client,
    repo_id: &str,
    probe_file_path: Option<&str>,
    log_prefix: &str,
) -> Result<EndpointPlan> {
    log::info!(
        "{} probing download endpoints for {}: {:?}",
        log_prefix,
        repo_id,
        HUGGINGFACE_BASE_URLS
    );

    let probes = HUGGINGFACE_BASE_URLS.iter().map(|base_url| {
        fetch_model_info_from_endpoint(client.clone(), (*base_url).to_string(), repo_id.to_string())
    });

    let probe_results = join_all(probes).await;
    let mut metadata_successes = Vec::new();

    for result in probe_results {
        match result {
            Ok(probe) => {
                log::info!(
                    "{} endpoint metadata ok: {} latency={}ms",
                    log_prefix,
                    probe.base_url,
                    probe.elapsed.as_millis()
                );
                metadata_successes.push(probe);
            }
            Err(error) => {
                log::warn!("{} endpoint metadata failed: {}", log_prefix, error);
            }
        }
    }

    if metadata_successes.is_empty() {
        return Err(anyhow!(
            "Failed to reach Hugging Face endpoints for model metadata"
        ));
    }

    let mut ordered_metadata = metadata_successes.clone();
    ordered_metadata.sort_by_key(|probe| probe.elapsed);

    let Some(probe_file_path) = probe_file_path else {
        let base_urls = ordered_metadata
            .iter()
            .map(|probe| probe.base_url.clone())
            .collect();
        return Ok(EndpointPlan {
            base_urls,
            model_info: ordered_metadata[0].model_info.clone(),
        });
    };

    let speed_probes = metadata_successes.into_iter().map(|metadata| {
        speed_test_endpoint(
            client.clone(),
            metadata,
            repo_id.to_string(),
            probe_file_path.to_string(),
        )
    });

    let speed_results = join_all(speed_probes).await;
    let mut speed_successes = Vec::new();

    for result in speed_results {
        match result {
            Ok(probe) => {
                log::info!(
                    "{} endpoint speed ok: {} downloaded={}KB elapsed={}ms speed={:.2}MB/s",
                    log_prefix,
                    probe.metadata.base_url,
                    probe.downloaded_bytes / 1024,
                    probe.elapsed.as_millis(),
                    probe.bytes_per_second() / 1_048_576.0
                );
                speed_successes.push(probe);
            }
            Err(error) => {
                log::warn!("{} endpoint speed failed: {}", log_prefix, error);
            }
        }
    }

    if speed_successes.is_empty() {
        log::warn!(
            "{} all endpoint speed probes failed; falling back to metadata latency order",
            log_prefix
        );
        let base_urls = ordered_metadata
            .iter()
            .map(|probe| probe.base_url.clone())
            .collect();
        return Ok(EndpointPlan {
            base_urls,
            model_info: ordered_metadata[0].model_info.clone(),
        });
    }

    speed_successes.sort_by(|a, b| {
        b.bytes_per_second()
            .partial_cmp(&a.bytes_per_second())
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.metadata.elapsed.cmp(&b.metadata.elapsed))
    });

    let selected = &speed_successes[0];
    log::info!(
        "{} selected download endpoint: {} speed={:.2}MB/s metadata_latency={}ms reason=metadata_reachable_and_fastest_range_probe",
        log_prefix,
        selected.metadata.base_url,
        selected.bytes_per_second() / 1_048_576.0,
        selected.metadata.elapsed.as_millis()
    );

    let base_urls = speed_successes
        .iter()
        .map(|probe| probe.metadata.base_url.clone())
        .collect();

    Ok(EndpointPlan {
        base_urls,
        model_info: selected.metadata.model_info.clone(),
    })
}

async fn fetch_model_info_from_endpoint(
    client: Client,
    base_url: String,
    repo_id: String,
) -> Result<MetadataProbe> {
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
    .map_err(|_| anyhow!("endpoint={} error=metadata_timeout_after_8s", base_url))?
    .map_err(|e| anyhow!("endpoint={} error={}", base_url, e))?;

    Ok(MetadataProbe {
        base_url,
        model_info,
        elapsed: started.elapsed(),
    })
}

async fn speed_test_endpoint(
    client: Client,
    metadata: MetadataProbe,
    repo_id: String,
    file_path: String,
) -> Result<SpeedProbe> {
    let file_url = resolve_file_url(&metadata.base_url, &repo_id, "main", &file_path);
    let started = Instant::now();

    let downloaded_bytes = timeout(Duration::from_secs(20), async {
        let response = client
            .get(file_url)
            .header("Range", format!("bytes=0-{}", SPEED_TEST_BYTES - 1))
            .send()
            .await?
            .error_for_status()?;

        let mut stream = response.bytes_stream();
        let mut downloaded = 0u64;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            downloaded += chunk.len() as u64;
            if downloaded >= SPEED_TEST_BYTES {
                break;
            }
        }

        Result::<u64>::Ok(downloaded)
    })
    .await
    .map_err(|_| {
        anyhow!(
            "endpoint={} error=speed_timeout_after_20s",
            metadata.base_url
        )
    })??;

    if downloaded_bytes == 0 {
        return Err(anyhow!(
            "endpoint={} error=speed_probe_downloaded_zero_bytes",
            metadata.base_url
        ));
    }

    Ok(SpeedProbe {
        metadata,
        downloaded_bytes,
        elapsed: started.elapsed(),
    })
}
