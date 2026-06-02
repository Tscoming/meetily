import React, { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Mic, Sparkles, Check, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingContainer } from '../OnboardingContainer';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';

const TRANSCRIPTION_MODEL_INFO: Record<string, { label: string; sizeMb: number; sizeLabel: string }> = {
  'parakeet-tdt-0.6b-v3-int8': {
    label: 'Parakeet TDT 0.6B v3 Int8',
    sizeMb: 670,
    sizeLabel: '~670 MB',
  },
  'parakeet-tdt-0.6b-v2-int8': {
    label: 'Parakeet TDT 0.6B v2 Int8',
    sizeMb: 661,
    sizeLabel: '~661 MB',
  },
  'Qwen3-ASR-0.6B': {
    label: 'Qwen3-ASR 0.6B',
    sizeMb: 1900,
    sizeLabel: '~1.9 GB',
  },
  'Qwen3-ASR-1.7B': {
    label: 'Qwen3-ASR 1.7B',
    sizeMb: 4700,
    sizeLabel: '~4.7 GB',
  },
};

const SUMMARY_MODEL_INFO: Record<string, { label: string; sizeMb: number; sizeLabel: string }> = {
  'gemma3:1b': {
    label: 'Gemma 3 1B',
    sizeMb: 1019,
    sizeLabel: '~1.0 GB',
  },
  'gemma3:4b': {
    label: 'Gemma 3 4B',
    sizeMb: 2374,
    sizeLabel: '~2.4 GB',
  },
  'qwen3:1.7b': {
    label: 'Qwen3 1.7B',
    sizeMb: 1056,
    sizeLabel: '~1.0 GB',
  },
  'qwen3:4b': {
    label: 'Qwen3 4B',
    sizeMb: 2382,
    sizeLabel: '~2.4 GB',
  },
};

function getTranscriptionProvider(modelName: string): 'parakeet' | 'qwen3Asr' {
  return modelName.startsWith('Qwen3-ASR') ? 'qwen3Asr' : 'parakeet';
}

type DownloadStatus = 'waiting' | 'downloading' | 'completed' | 'error';

interface DownloadState {
  status: DownloadStatus;
  progress: number;
  downloadedMb: number;
  totalMb: number;
  speedMbps: number;
  error?: string;
}

export function DownloadProgressStep() {
  const { t } = useI18n();
  const {
    goNext,
    selectedTranscriptionModel,
    selectedSummaryModel,
    parakeetDownloaded,
    setParakeetDownloaded,
    summaryModelDownloaded,
    setSummaryModelDownloaded,
    startBackgroundDownloads,
    completeOnboarding,
  } = useOnboarding();

  const [isMac, setIsMac] = useState(false);

  const [parakeetState, setParakeetState] = useState<DownloadState>({
    status: parakeetDownloaded ? 'completed' : 'waiting',
    progress: parakeetDownloaded ? 100 : 0,
    downloadedMb: 0,
    totalMb: TRANSCRIPTION_MODEL_INFO[selectedTranscriptionModel]?.sizeMb ?? 670,
    speedMbps: 0,
  });

  const [gemmaState, setGemmaState] = useState<DownloadState>({
    status: summaryModelDownloaded ? 'completed' : 'waiting',
    progress: summaryModelDownloaded ? 100 : 0,
    downloadedMb: 0,
    totalMb: SUMMARY_MODEL_INFO[selectedSummaryModel]?.sizeMb ?? 1019,
    speedMbps: 0,
  });

  const [isCompleting, setIsCompleting] = useState(false);
  const downloadStartedRef = useRef(false);
  const retryingRef = useRef(false);
  const retryingSummaryRef = useRef(false);

  // Retry download handler
  const handleRetryDownload = async () => {
    // Prevent multiple simultaneous retries
    if (retryingRef.current) {
      console.log('[DownloadProgressStep] Retry already in progress, ignoring');
      return;
    }

    console.log('[DownloadProgressStep] Retrying Parakeet download');
    retryingRef.current = true;

    // Reset error state
    setParakeetState((prev) => ({
      ...prev,
      status: 'waiting',
      error: undefined,
      progress: 0,
      downloadedMb: 0,
      speedMbps: 0,
    }));

    try {
      if (getTranscriptionProvider(selectedTranscriptionModel) === 'qwen3Asr') {
        await invoke('qwen3_asr_init');
        await invoke('qwen3_asr_download_model', { modelName: selectedTranscriptionModel });
      } else {
        await invoke('parakeet_retry_download', { modelName: selectedTranscriptionModel });
      }
      // Progress events will update state
    } catch (error) {
      console.error('[DownloadProgressStep] Retry failed:', error);
      setParakeetState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Retry failed',
      }));

      toast.error(t('onboarding.downloadRetryFailed'), {
        description: t('onboarding.checkConnectionRetry'),
      });
    } finally {
      // Allow retry again after 2 seconds
      setTimeout(() => {
        retryingRef.current = false;
      }, 2000);
    }
  };

  // Retry summary download handler
  const handleRetrySummaryDownload = async () => {
    // Prevent multiple simultaneous retries
    if (retryingSummaryRef.current) {
      console.log('[DownloadProgressStep] Summary retry already in progress, ignoring');
      return;
    }

    console.log('[DownloadProgressStep] Retrying summary model download');
    retryingSummaryRef.current = true;

    // Reset error state
    setGemmaState((prev) => ({
      ...prev,
      status: 'downloading',
      error: undefined,
      progress: 0,
      downloadedMb: 0,
      speedMbps: 0,
    }));

    try {
      // Call download command directly (no retry command exists for built-in AI)
      await invoke('builtin_ai_download_model', { modelName: selectedSummaryModel });
    } catch (error) {
      console.error('[DownloadProgressStep] Summary retry failed:', error);
      setGemmaState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Retry failed',
      }));

      toast.error(t('onboarding.summaryDownloadRetryFailed'), {
        description: t('onboarding.checkConnectionRetry'),
      });
    } finally {
      // Allow retry again after 2 seconds
      setTimeout(() => {
        retryingSummaryRef.current = false;
      }, 2000);
    }
  };

  // Detect platform on mount
  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { platform } = await import('@tauri-apps/plugin-os');
        setIsMac(platform() === 'macos');
      } catch (e) {
        setIsMac(navigator.userAgent.includes('Mac'));
      }
    };

    checkPlatform();
  }, []);

  // Start downloads on mount
  useEffect(() => {
    if (downloadStartedRef.current) return;
    downloadStartedRef.current = true;

    startDownloads();
  }, []);

  // Listen to Parakeet download progress
  useEffect(() => {
    const unlistenProgress = listen<{
      modelName: string;
      progress: number;
      downloaded_mb?: number;
      total_mb?: number;
      speed_mbps?: number;
      status?: string;
    }>('parakeet-model-download-progress', (event) => {
      const { modelName, progress, downloaded_mb, total_mb, speed_mbps, status } = event.payload;
      if (getTranscriptionProvider(selectedTranscriptionModel) === 'parakeet' && modelName === selectedTranscriptionModel) {
        setParakeetState((prev) => ({
          ...prev,
          status: status === 'completed' ? 'completed' : 'downloading',
          progress,
          downloadedMb: downloaded_mb ?? prev.downloadedMb,
          totalMb: total_mb ?? prev.totalMb,
          speedMbps: speed_mbps ?? prev.speedMbps,
        }));

        if (status === 'completed' || progress >= 100) {
          setParakeetDownloaded(true);
        }
      }
    });

    const unlistenComplete = listen<{ modelName: string }>(
      'parakeet-model-download-complete',
      (event) => {
        if (getTranscriptionProvider(selectedTranscriptionModel) === 'parakeet' && event.payload.modelName === selectedTranscriptionModel) {
          setParakeetState((prev) => ({ ...prev, status: 'completed', progress: 100 }));
          setParakeetDownloaded(true);
        }
      }
    );

    const unlistenError = listen<{ modelName: string; error: string }>(
      'parakeet-model-download-error',
      (event) => {
        if (getTranscriptionProvider(selectedTranscriptionModel) === 'parakeet' && event.payload.modelName === selectedTranscriptionModel) {
          setParakeetState((prev) => ({
            ...prev,
            status: 'error',
            error: event.payload.error,
          }));
        }
      }
    );

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, [selectedTranscriptionModel]);

  // Listen to Qwen3-ASR download progress
  useEffect(() => {
    const unlistenProgress = listen<{
      modelName: string;
      progress: number;
      downloaded_mb?: number;
      total_mb?: number;
      speed_mbps?: number;
      status?: string;
    }>('qwen3-asr-model-download-progress', (event) => {
      const { modelName, progress, downloaded_mb, total_mb, speed_mbps, status } = event.payload;
      if (getTranscriptionProvider(selectedTranscriptionModel) === 'qwen3Asr' && modelName === selectedTranscriptionModel) {
        setParakeetState((prev) => ({
          ...prev,
          status: status === 'completed' ? 'completed' : 'downloading',
          progress,
          downloadedMb: downloaded_mb ?? prev.downloadedMb,
          totalMb: total_mb ?? prev.totalMb,
          speedMbps: speed_mbps ?? prev.speedMbps,
        }));

        if (status === 'completed' || progress >= 100) {
          setParakeetDownloaded(true);
        }
      }
    });

    const unlistenComplete = listen<{ modelName: string }>(
      'qwen3-asr-model-download-complete',
      (event) => {
        if (getTranscriptionProvider(selectedTranscriptionModel) === 'qwen3Asr' && event.payload.modelName === selectedTranscriptionModel) {
          setParakeetState((prev) => ({ ...prev, status: 'completed', progress: 100 }));
          setParakeetDownloaded(true);
        }
      }
    );

    const unlistenError = listen<{ modelName: string; error: string }>(
      'qwen3-asr-model-download-error',
      (event) => {
        if (getTranscriptionProvider(selectedTranscriptionModel) === 'qwen3Asr' && event.payload.modelName === selectedTranscriptionModel) {
          setParakeetState((prev) => ({
            ...prev,
            status: 'error',
            error: event.payload.error,
          }));
        }
      }
    );

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, [selectedTranscriptionModel]);

  // Listen to Gemma download progress (always downloading for builtin-ai)
  useEffect(() => {
    const unlisten = listen<{
      model: string;
      progress: number;
      downloaded_mb?: number;
      total_mb?: number;
      speed_mbps?: number;
      status: string;
      error?: string;
    }>('builtin-ai-download-progress', (event) => {
      const { model, progress, downloaded_mb, total_mb, speed_mbps, status, error } = event.payload;
      if (model === selectedSummaryModel) {
        setGemmaState((prev) => ({
          ...prev,
          status: status === 'completed'
            ? 'completed'
            : status === 'error'
            ? 'error'
            : 'downloading',
          progress,
          downloadedMb: downloaded_mb ?? prev.downloadedMb,
          totalMb: total_mb ?? prev.totalMb,
          speedMbps: speed_mbps ?? prev.speedMbps,
          error: status === 'error' ? error : undefined,
        }));

        if (status === 'completed' || progress >= 100) {
          setSummaryModelDownloaded(true);
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [selectedSummaryModel]);

  const startDownloads = async () => {
    // Always download both Parakeet and Gemma (system-recommended)
    if (!parakeetDownloaded || !summaryModelDownloaded) {
      try {
        if (!parakeetDownloaded) {
          setParakeetState((prev) => ({ ...prev, status: 'downloading' }));
        }
        if (!summaryModelDownloaded) {
          setGemmaState((prev) => ({ ...prev, status: 'downloading' }));
        }
        await startBackgroundDownloads(true);  // Always download both
      } catch (error) {
        console.error('Failed to start downloads:', error);
        if (!parakeetDownloaded) {
          setParakeetState((prev) => ({ ...prev, status: 'error', error: String(error) }));
        }
      }
    }
  };

  const handleContinue = async () => {
    // Verify actual model availability (catches state drift)
    try {
      const transcriptionProvider = getTranscriptionProvider(selectedTranscriptionModel);
      if (transcriptionProvider === 'qwen3Asr') {
        await invoke('qwen3_asr_init');
      } else {
        await invoke('parakeet_init');
      }
      const models = await invoke<any[]>(
        transcriptionProvider === 'qwen3Asr'
          ? 'qwen3_asr_get_available_models'
          : 'parakeet_get_available_models'
      );
      const selectedModel = models.find((model) => model.name === selectedTranscriptionModel);
      const status = selectedModel?.status;
      const actuallyAvailable = status === 'Available';

      if (actuallyAvailable && !parakeetDownloaded) {
        console.log('[DownloadProgressStep] Model available but state not updated');
        setParakeetDownloaded(true);
        setParakeetState((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
        }));
      } else if (!actuallyAvailable && parakeetState.status === 'error') {
        toast.error(t('onboarding.transcriptionRequired'), {
          description: t('onboarding.retryBeforeContinuing'),
        });
        return;
      }
    } catch (error) {
      console.warn('[DownloadProgressStep] Failed to verify model:', error);
    }

    // Check if downloads are complete for toast notification
    const downloadsComplete = parakeetState.status === 'completed' &&
      gemmaState.status === 'completed';

    // Show toast if downloads still in progress
    if (!downloadsComplete) {
      toast.info(t('onboarding.downloadsContinue'), {
        description: t('onboarding.downloadsContinueDescription'),
        duration: 5000,
      });
    }

    if (isMac) {
      // macOS: Go to Permissions step (will complete after permissions granted)
      goNext();
    } else {
      // Non-macOS: Complete onboarding immediately (downloads continue in background)
      setIsCompleting(true);
      try {
        await completeOnboarding();

        // Small delay to ensure state is saved before reload
        await new Promise(resolve => setTimeout(resolve, 100));

        window.location.reload();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        toast.error(t('onboarding.completeFailed'), {
          description: t('onboarding.tryAgain'),
        });
        setIsCompleting(false);
      }
    }
  };

  const renderDownloadCard = (
    title: string,
    icon: React.ReactNode,
    state: DownloadState,
    modelSize: string
  ) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{modelSize}</p>
          </div>
        </div>
        <div>
          {state.status === 'waiting' && (
            <span className="text-sm text-gray-500">Waiting...</span>
          )}
          {state.status === 'downloading' && (
            <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
          )}
          {state.status === 'completed' && (
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
          )}
          {state.status === 'error' && (
            <span className="text-sm text-red-500">Failed</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(state.status === 'downloading' || state.status === 'completed') && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-700 to-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {state.downloadedMb.toFixed(1)} MB / {state.totalMb.toFixed(1)} MB
            </span>
            <div className="flex items-center gap-2">
              {state.speedMbps > 0 && (
                <span className="text-gray-500">
                  {state.speedMbps.toFixed(1)} MB/s
                </span>
              )}
              <span className="font-semibold text-gray-900">
                {Math.round(state.progress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {state.status === 'error' && state.error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 font-medium">Download Error</p>
          <p className="text-xs text-red-500 mt-1">{state.error}</p>
          {(title === 'Transcription Engine' || title === 'Summary Engine') && (
            <button
              onClick={title === 'Transcription Engine' ? handleRetryDownload : handleRetrySummaryDownload}
              className="mt-3 w-full h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <OnboardingContainer
      title="Getting things ready"
      description="You can start using MeetVoice after downloading the Transcription Engine."
      step={3}
      totalSteps={isMac ? 4 : 3}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Download Cards */}
        <div className="w-full max-w-lg space-y-4">
          {renderDownloadCard(
            'Transcription Engine',
            <Mic className="w-5 h-5 text-gray-600" />,
            parakeetState,
            `${TRANSCRIPTION_MODEL_INFO[selectedTranscriptionModel]?.label ?? selectedTranscriptionModel} • ${TRANSCRIPTION_MODEL_INFO[selectedTranscriptionModel]?.sizeLabel ?? '~670 MB'}`
          )}

          {renderDownloadCard(
            'Summary Engine',
            <Sparkles className="w-5 h-5 text-gray-600" />,
            gemmaState,
            `${SUMMARY_MODEL_INFO[selectedSummaryModel]?.label ?? selectedSummaryModel} • ${SUMMARY_MODEL_INFO[selectedSummaryModel]?.sizeLabel ?? '~1.0 GB'}`
          )}
        </div>

        {/* Info Message - Only show when Parakeet is downloaded */}
        <AnimatePresence>
          {parakeetDownloaded && !summaryModelDownloaded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-lg bg-gray-100 rounded-lg p-4 text-sm text-gray-800"
            >
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">You can continue while this finishes</p>
                  <p className="text-gray-700 mt-1">
                    Download will continue in the background.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <div className="w-full max-w-xs">
          <Button
            onClick={handleContinue}
            disabled={!parakeetDownloaded || isCompleting}
            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isCompleting || !parakeetDownloaded) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </OnboardingContainer>
  );
}
