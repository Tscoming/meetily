import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingContainer } from '../OnboardingContainer';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DownloadModelType = 'transcription' | 'summary';

const TRANSCRIPTION_MODELS = [
  {
    name: 'parakeet-tdt-0.6b-v3-int8',
    label: 'Parakeet TDT 0.6B v3 Int8',
    size: '~670 MB',
  },
  {
    name: 'parakeet-tdt-0.6b-v2-int8',
    label: 'Parakeet TDT 0.6B v2 Int8',
    size: '~661 MB',
  },
  {
    name: 'Qwen3-ASR-0.6B',
    label: 'Qwen3-ASR 0.6B',
    size: '~1.9 GB',
  },
  {
    name: 'Qwen3-ASR-1.7B',
    label: 'Qwen3-ASR 1.7B',
    size: '~4.7 GB',
  },
];

const SUMMARY_MODELS = [
  {
    name: 'gemma3:1b',
    label: 'Gemma 3 1B',
    size: '~1.0 GB',
  },
  {
    name: 'gemma3:4b',
    label: 'Gemma 3 4B',
    size: '~2.4 GB',
  },
  {
    name: 'qwen3:1.7b',
    label: 'Qwen3 1.7B',
    size: '~1.0 GB',
  },
  {
    name: 'qwen3:4b',
    label: 'Qwen3 4B',
    size: '~2.4 GB',
  },
];

export function SetupOverviewStep() {
  const {
    goNext,
    selectedTranscriptionModel,
    setSelectedTranscriptionModel,
    selectedSummaryModel,
    setSelectedSummaryModel,
    setParakeetDownloaded,
    setSummaryModelDownloaded,
  } = useOnboarding();
  const [selectedModelType, setSelectedModelType] = useState<DownloadModelType>('transcription');
  const [isMac, setIsMac] = useState(false);

  // Fetch recommended model on mount
  useEffect(() => {
    const fetchRecommendedModel = async () => {
      try {
        const model = await invoke<string>('builtin_ai_get_recommended_model');
        setSelectedSummaryModel(model);
      } catch (error) {
        console.error('Failed to get recommended model:', error);
        // Keep default gemma3:1b
      }
    };
    fetchRecommendedModel();

    // Detect platform for totalSteps
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

  const selectedModel = selectedModelType === 'transcription'
    ? selectedTranscriptionModel
    : selectedSummaryModel;
  const modelOptions = selectedModelType === 'transcription'
    ? TRANSCRIPTION_MODELS
    : SUMMARY_MODELS;
  const selectedTranscriptionInfo = TRANSCRIPTION_MODELS.find((model) => model.name === selectedTranscriptionModel);
  const selectedSummaryInfo = SUMMARY_MODELS.find((model) => model.name === selectedSummaryModel);

  const handleModelChange = (modelName: string) => {
    if (selectedModelType === 'transcription') {
      setSelectedTranscriptionModel(modelName);
      setParakeetDownloaded(false);
      return;
    }

    setSelectedSummaryModel(modelName);
    setSummaryModelDownloaded(false);
  };

  const steps = [
    {
      number: 1,
      type: 'transcription',
      title: 'Download Transcription Engine',
    },
    {
      number: 2,
      type: 'summarization',
      title: 'Download Summarization Engine',
    },
  ];

  const handleContinue = () => {
    goNext();
  };

  return (
    <OnboardingContainer
      title="Setup Overview"
      description="MeetVoice requires the local transcription and summarization AI models before it can create meeting notes."
      step={2}
      totalSteps={isMac ? 4 : 3}
    >
      <div className="flex flex-col items-center space-y-10">
        {/* Steps Card */}
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-4">
            {steps.map((step, idx) => {
              return (
                <div
                  key={step.number}
                  className={`flex items-start gap-4 p-1`}
                >
                  <div className="flex-1 ml-1">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        Step {step.number} :  {step.title}

                        {step.type === "summarization" && (
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <Info className="w-4 h-4" />
                                </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-sm">
                                You can also select external AI providers like OpenAI, Claude, or
                                Ollama for summary generation in settings.
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        )}
                        </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Choose models for first download</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a model type, then choose which local model should be downloaded during setup.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Model type</label>
              <Select value={selectedModelType} onValueChange={(value) => setSelectedModelType(value as DownloadModelType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transcription">Transcription Engine</SelectItem>
                  <SelectItem value="summary">Summary Engine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Model</label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.label} ({model.size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex justify-between gap-3">
              <span>Transcription</span>
              <span className="text-right font-medium text-gray-900">
                {selectedTranscriptionInfo?.label} {selectedTranscriptionInfo?.size}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>Summary</span>
              <span className="text-right font-medium text-gray-900">
                {selectedSummaryInfo?.label} {selectedSummaryInfo?.size}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-xs space-y-4">
          <Button
            onClick={handleContinue}
            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white"
          >
            Let's Go
          </Button>
          <div className="text-center">
            <a
              href="https://github.com/Zackriya-Solutions/meeting-minutes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:underline"
            >
              Report issues on GitHub
            </a>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
