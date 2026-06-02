#[path = "build/ffmpeg.rs"]
mod ffmpeg;

fn main() {
    emit_build_info();

    // GPU Acceleration Detection and Build Guidance
    detect_and_report_gpu_capabilities();

    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=Cocoa");
        println!("cargo:rustc-link-lib=framework=Foundation");

        // Let the enhanced_macos crate handle its own Swift compilation
        // The swift-rs crate build will be handled in the enhanced_macos crate's build.rs
    }

    // Download and bundle FFmpeg binary at build-time
    ffmpeg::ensure_ffmpeg_binary();

    tauri_build::build()
}

fn emit_build_info() {
    println!("cargo:rerun-if-changed=.git/HEAD");
    println!("cargo:rerun-if-changed=.git/index");
    println!("cargo:rerun-if-env-changed=MEETILY_GIT_COMMIT_SHORT");
    if let Some(ref_path) = git_head_ref_path() {
        println!("cargo:rerun-if-changed={ref_path}");
    }

    let version = std::env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "0.0.0".to_string());
    let commit = std::env::var("MEETILY_GIT_COMMIT_SHORT")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .or_else(git_commit_short)
        .unwrap_or_else(|| "unknown".to_string());
    let dirty = git_worktree_dirty();
    let build_version = if commit == "unknown" {
        version.clone()
    } else if dirty {
        format!("{version}+{commit}.dirty")
    } else {
        format!("{version}+{commit}")
    };

    println!("cargo:rustc-env=MEETILY_GIT_COMMIT_SHORT={commit}");
    println!("cargo:rustc-env=MEETILY_GIT_DIRTY={dirty}");
    println!("cargo:rustc-env=MEETILY_BUILD_VERSION={build_version}");
}

fn git_head_ref_path() -> Option<String> {
    let head = std::fs::read_to_string(".git/HEAD").ok()?;
    let ref_name = head.trim().strip_prefix("ref: ")?;
    Some(format!(".git/{ref_name}"))
}

fn git_commit_short() -> Option<String> {
    let output = std::process::Command::new("git")
        .args(["rev-parse", "--short=6", "HEAD"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let commit = String::from_utf8(output.stdout).ok()?.trim().to_string();
    (!commit.is_empty()).then_some(commit)
}

fn git_worktree_dirty() -> bool {
    let unstaged_clean = std::process::Command::new("git")
        .args(["diff", "--quiet", "--ignore-submodules", "--"])
        .status()
        .map(|status| status.success())
        .unwrap_or(false);

    let staged_clean = std::process::Command::new("git")
        .args(["diff", "--cached", "--quiet", "--ignore-submodules", "--"])
        .status()
        .map(|status| status.success())
        .unwrap_or(false);

    !(unstaged_clean && staged_clean)
}

/// Detects GPU acceleration capabilities and provides build guidance
fn detect_and_report_gpu_capabilities() {
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();

    println!("cargo:warning=🚀 Building MeetVoice for: {}", target_os);

    match target_os.as_str() {
        "macos" => {
            println!("cargo:warning=✅ macOS: Metal GPU acceleration ENABLED by default");
            #[cfg(feature = "coreml")]
            println!("cargo:warning=✅ CoreML acceleration ENABLED");
        }
        "windows" => {
            if cfg!(feature = "cuda") {
                println!("cargo:warning=✅ Windows: CUDA GPU acceleration ENABLED");
            } else if cfg!(feature = "vulkan") {
                println!("cargo:warning=✅ Windows: Vulkan GPU acceleration ENABLED");
            } else if cfg!(feature = "openblas") {
                println!("cargo:warning=✅ Windows: OpenBLAS CPU optimization ENABLED");
            } else {
                println!(
                    "cargo:warning=⚠️  Windows: Using CPU-only mode (no GPU or BLAS acceleration)"
                );
                println!("cargo:warning=💡 For NVIDIA GPU: cargo build --release --features cuda");
                println!(
                    "cargo:warning=💡 For AMD/Intel GPU: cargo build --release --features vulkan"
                );
                println!("cargo:warning=💡 For CPU optimization: cargo build --release --features openblas");

                // Try to detect NVIDIA GPU
                if which::which("nvidia-smi").is_ok() {
                    println!("cargo:warning=🎯 NVIDIA GPU detected! Consider rebuilding with --features cuda");
                }
            }
        }
        "linux" => {
            if cfg!(feature = "cuda") {
                println!("cargo:warning=✅ Linux: CUDA GPU acceleration ENABLED");
            } else if cfg!(feature = "vulkan") {
                println!("cargo:warning=✅ Linux: Vulkan GPU acceleration ENABLED");
            } else if cfg!(feature = "hipblas") {
                println!("cargo:warning=✅ Linux: AMD ROCm (HIP) acceleration ENABLED");
            } else if cfg!(feature = "openblas") {
                println!("cargo:warning=✅ Linux: OpenBLAS CPU optimization ENABLED");
            } else {
                println!(
                    "cargo:warning=⚠️  Linux: Using CPU-only mode (no GPU or BLAS acceleration)"
                );
                println!("cargo:warning=💡 For NVIDIA GPU: cargo build --release --features cuda");
                println!("cargo:warning=💡 For AMD GPU: cargo build --release --features hipblas");
                println!(
                    "cargo:warning=💡 For other GPUs: cargo build --release --features vulkan"
                );
                println!("cargo:warning=💡 For CPU optimization: cargo build --release --features openblas");

                // Try to detect NVIDIA GPU
                if which::which("nvidia-smi").is_ok() {
                    println!("cargo:warning=🎯 NVIDIA GPU detected! Consider rebuilding with --features cuda");
                }

                // Try to detect AMD GPU
                if which::which("rocm-smi").is_ok() {
                    println!("cargo:warning=🎯 AMD GPU detected! Consider rebuilding with --features hipblas");
                }
            }
        }
        _ => {
            println!("cargo:warning=ℹ️  Unknown platform: {}", target_os);
        }
    }

    // Performance guidance
    if !cfg!(feature = "cuda")
        && !cfg!(feature = "vulkan")
        && !cfg!(feature = "hipblas")
        && !cfg!(feature = "openblas")
        && target_os != "macos"
    {
        println!("cargo:warning=📊 Performance: CPU-only builds are significantly slower than GPU/BLAS builds");
        println!("cargo:warning=📚 See README.md for GPU/BLAS setup instructions");
    }
}
