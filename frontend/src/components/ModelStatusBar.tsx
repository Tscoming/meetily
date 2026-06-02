'use client';

import { useMemo } from 'react';
import { Database, Sparkles } from 'lucide-react';
import { SIDEBAR_COLLAPSED_WIDTH, useSidebar } from '@/components/Sidebar/SidebarProvider';
import { useConfig } from '@/contexts/ConfigContext';
import { useI18n } from '@/i18n';

export function ModelStatusBar() {
  const { t } = useI18n();
  const { isCollapsed, sidebarWidth } = useSidebar();
  const { transcriptModelConfig, modelConfig } = useConfig();

  const leftOffset = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth;
  const transcriptModelName = transcriptModelConfig.model || t('statusBar.notConfigured');
  const summaryModelName = useMemo(() => {
    if (modelConfig.provider === 'custom-openai') {
      return modelConfig.customOpenAIModel || modelConfig.model || t('statusBar.notConfigured');
    }

    return modelConfig.model || t('statusBar.notConfigured');
  }, [modelConfig, t]);

  return (
    <div
      className="fixed bottom-0 right-0 z-30 h-8 border-t border-gray-200 bg-white/95 text-xs text-gray-600 shadow-sm backdrop-blur transition-[left] duration-300"
      style={{ left: leftOffset }}
    >
      <div className="flex h-full min-w-0 items-center gap-4 px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <Database className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="flex-shrink-0 font-medium text-gray-700">{t('statusBar.transcriptionModel')}</span>
          <span className="truncate" title={transcriptModelName}>{transcriptModelName}</span>
        </div>
        <div className="h-4 w-px flex-shrink-0 bg-gray-200" />
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="flex-shrink-0 font-medium text-gray-700">{t('statusBar.summaryModel')}</span>
          <span className="truncate" title={summaryModelName}>{summaryModelName}</span>
        </div>
      </div>
    </div>
  );
}
