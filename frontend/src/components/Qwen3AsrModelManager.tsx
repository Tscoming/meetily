import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import {
  formatFileSize,
  getQwen3AsrDisplayName,
  getQwen3AsrTagline,
  ModelStatus,
  Qwen3AsrAPI,
  Qwen3AsrModelInfo,
} from '@/lib/qwen3Asr';

interface DownloadProgressEvent {
  modelName: string;
  progress: number;
  status?: string;
}

interface Qwen3AsrModelManagerProps {
  selectedModel?: string;
  onModelSelect?: (modelName: string) => void;
  autoSave?: boolean;
}

export function Qwen3AsrModelManager({
  selectedModel,
  onModelSelect,
  autoSave = false,
}: Qwen3AsrModelManagerProps) {
  const [models, setModels] = useState<Qwen3AsrModelInfo[]>([]);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<string | undefined>(selectedModel);

  useEffect(() => {
    setActiveModel(selectedModel);
  }, [selectedModel]);

  const refreshModels = async () => {
    await Qwen3AsrAPI.init();
    setModels(await Qwen3AsrAPI.getAvailableModels());
  };

  useEffect(() => {
    refreshModels()
      .catch((error) => toast.error('Failed to load Qwen3-ASR models', {
        description: error instanceof Error ? error.message : String(error),
      }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenComplete: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    const setup = async () => {
      unlistenProgress = await listen<DownloadProgressEvent>(
        'qwen3-asr-model-download-progress',
        (event) => {
          const { modelName, progress, status } = event.payload;
          if (status === 'cancelled') {
            setDownloadingModels((prev) => {
              const next = new Set(prev);
              next.delete(modelName);
              return next;
            });
            setModels((prev) => prev.map((model) => model.name === modelName ? { ...model, status: 'Missing' } : model));
            return;
          }

          const normalizedProgress = Math.max(0, Math.min(100, progress));
          setDownloadingModels((prev) => new Set(prev).add(modelName));
          setModels((prev) => prev.map((model) => (
            model.name === modelName
              ? { ...model, status: { Downloading: normalizedProgress } as ModelStatus }
              : model
          )));
        }
      );

      unlistenComplete = await listen<{ modelName: string }>(
        'qwen3-asr-model-download-complete',
        (event) => {
          const { modelName } = event.payload;
          setDownloadingModels((prev) => {
            const next = new Set(prev);
            next.delete(modelName);
            return next;
          });
          setModels((prev) => prev.map((model) => model.name === modelName ? { ...model, status: 'Available' } : model));
          toast.success(`${getQwen3AsrDisplayName(modelName)} is ready`);
          selectModel(modelName);
        }
      );

      unlistenError = await listen<{ modelName: string; error: string }>(
        'qwen3-asr-model-download-error',
        (event) => {
          const { modelName, error } = event.payload;
          setDownloadingModels((prev) => {
            const next = new Set(prev);
            next.delete(modelName);
            return next;
          });
          setModels((prev) => prev.map((model) => model.name === modelName ? { ...model, status: { Error: error } } : model));
          toast.error(`Failed to download ${getQwen3AsrDisplayName(modelName)}`, { description: error });
        }
      );
    };

    setup();
    return () => {
      unlistenProgress?.();
      unlistenComplete?.();
      unlistenError?.();
    };
  }, []);

  const saveModelSelection = async (modelName: string) => {
    if (!autoSave) return;
    await invoke('api_save_transcript_config', {
      provider: 'qwen3Asr',
      model: modelName,
      apiKey: null,
    });
  };

  const selectModel = async (modelName: string) => {
    setActiveModel(modelName);
    onModelSelect?.(modelName);
    await saveModelSelection(modelName);
  };

  const downloadModel = async (modelName: string) => {
    setDownloadingModels((prev) => new Set(prev).add(modelName));
    setModels((prev) => prev.map((model) => model.name === modelName ? { ...model, status: { Downloading: 0 } } : model));
    toast.info(`Downloading ${getQwen3AsrDisplayName(modelName)}`);
    await Qwen3AsrAPI.downloadModel(modelName);
  };

  const cancelDownload = async (modelName: string) => {
    await Qwen3AsrAPI.cancelDownload(modelName);
  };

  const deleteModel = async (modelName: string) => {
    await Qwen3AsrAPI.deleteModel(modelName);
    await refreshModels();
  };

  if (loading) {
    return <div className="text-sm text-gray-500 px-1">Loading Qwen3-ASR models...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => Qwen3AsrAPI.openModelsFolder()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <FolderOpen className="h-4 w-4" />
          Models folder
        </button>
      </div>

      <div className="space-y-2">
        {models.map((model) => (
          <Qwen3AsrModelCard
            key={model.name}
            model={model}
            selected={activeModel === model.name}
            downloading={downloadingModels.has(model.name)}
            onSelect={() => selectModel(model.name)}
            onDownload={() => downloadModel(model.name)}
            onCancel={() => cancelDownload(model.name)}
            onDelete={() => deleteModel(model.name)}
          />
        ))}
      </div>
    </div>
  );
}

interface Qwen3AsrModelCardProps {
  model: Qwen3AsrModelInfo;
  selected: boolean;
  downloading: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function Qwen3AsrModelCard({
  model,
  selected,
  downloading,
  onSelect,
  onDownload,
  onCancel,
  onDelete,
}: Qwen3AsrModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isAvailable = model.status === 'Available';
  const isMissing = model.status === 'Missing';
  const isDownloading = downloading || (typeof model.status === 'object' && 'Downloading' in model.status);
  const isError = typeof model.status === 'object' && 'Error' in model.status;
  const isCorrupted = typeof model.status === 'object' && 'Corrupted' in model.status;
  const progress = typeof model.status === 'object' && 'Downloading' in model.status
    ? typeof model.status.Downloading === 'number'
      ? model.status.Downloading
      : model.status.Downloading.progress
    : 0;
  const canDelete = isAvailable && !selected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative rounded-lg border-2 transition-all cursor-pointer
        ${selected && isAvailable
          ? 'border-blue-500 bg-blue-50'
          : isAvailable
            ? 'border-gray-200 hover:border-gray-300 bg-white'
            : 'border-gray-200 bg-gray-50'
        }
        ${isAvailable ? '' : 'cursor-default'}
      `}
      onClick={() => {
        if (isAvailable) onSelect();
      }}
    >
      {model.name === 'Qwen3-ASR-0.6B' && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          Recommended
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-2xl">🎧</span>
              <h3 className="font-semibold text-gray-900">{getQwen3AsrDisplayName(model.name)}</h3>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{getQwen3AsrTagline(model.name)}</span>
              {selected && isAvailable && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  ✓ 当前生效
                </motion.span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                Hugging Face
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 ml-9 mt-1.5">
              <span className="flex items-center space-x-1">
                <span>📦</span>
                <span>{formatFileSize(model.size_mb)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🎯</span>
                <span>{model.accuracy} accuracy</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>⚡</span>
                <span>{model.speed} processing</span>
              </span>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2">
            {isAvailable && (
              <>
                <div className="flex items-center gap-1.5 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">Ready</span>
                </div>
                <AnimatePresence>
                  {canDelete && isHovered && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete inactive model to free up space"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            )}

            {isMissing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            )}

            {!isDownloading && isError && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            )}

            {isCorrupted && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Re-download
                </button>
              </div>
            )}
          </div>
        </div>

        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">Downloading...</span>
                <span className="text-sm font-semibold text-blue-600">{formatProgress(progress)}%</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="text-xs text-gray-600 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                title="Cancel download"
              >
                Cancel
              </button>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {model.size_mb ? (
                <>
                  {formatFileSize(model.size_mb * progress / 100)} / {formatFileSize(model.size_mb)}
                </>
              ) : (
                'Downloading...'
              )}
            </p>
          </motion.div>
        )}

        {isError && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-red-600">
            {typeof model.status === 'object' && 'Error' in model.status ? model.status.Error : 'Download failed'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatProgress(progress: number): string {
  if (progress >= 10 || progress === 0) {
    return Math.round(progress).toString();
  }
  return progress.toFixed(1);
}
