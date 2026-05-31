import { invoke } from '@tauri-apps/api/core';

export interface Qwen3AsrModelInfo {
  name: string;
  repo_id: string;
  path: string;
  size_mb: number;
  accuracy: 'High' | 'Good' | 'Decent' | string;
  speed: 'Slow' | 'Medium' | 'Fast' | 'Very Fast' | string;
  status: ModelStatus;
  description?: string;
}

export type ModelStatus =
  | 'Available'
  | 'Missing'
  | { Downloading: { progress: number } }
  | { Downloading: number }
  | { Error: string }
  | { Corrupted: { file_size: number; expected_min_size: number } };

export function formatFileSize(sizeMb: number): string {
  if (sizeMb >= 1000) {
    return `${(sizeMb / 1000).toFixed(1)}GB`;
  }
  return `${Math.round(sizeMb)}MB`;
}

export function getQwen3AsrDisplayName(modelName: string): string {
  return modelName === 'Qwen3-ASR-1.7B' ? 'Qwen3-ASR 1.7B' : 'Qwen3-ASR 0.6B';
}

export function getQwen3AsrTagline(modelName: string): string {
  return modelName === 'Qwen3-ASR-1.7B'
    ? 'Best accuracy • Larger download'
    : 'Balanced local ASR • Smaller download';
}

export class Qwen3AsrAPI {
  static async init(): Promise<void> {
    await invoke('qwen3_asr_init');
  }

  static async getAvailableModels(): Promise<Qwen3AsrModelInfo[]> {
    return await invoke('qwen3_asr_get_available_models');
  }

  static async loadModel(modelName: string): Promise<void> {
    await invoke('qwen3_asr_load_model', { modelName });
  }

  static async downloadModel(modelName: string): Promise<void> {
    await invoke('qwen3_asr_download_model', { modelName });
  }

  static async cancelDownload(modelName: string): Promise<void> {
    await invoke('qwen3_asr_cancel_download', { modelName });
  }

  static async deleteModel(modelName: string): Promise<string> {
    return await invoke('qwen3_asr_delete_model', { modelName });
  }

  static async openModelsFolder(): Promise<void> {
    await invoke('open_qwen3_asr_models_folder');
  }
}
