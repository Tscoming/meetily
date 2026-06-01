'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UiLocale = 'en' | 'zh-CN';

type TranslationKey =
  | 'common.back'
  | 'common.done'
  | 'common.unknownError'
  | 'common.retry'
  | 'common.tipLabel'
  | 'common.loadingPreferences'
  | 'settings.title'
  | 'settings.tabs.general'
  | 'settings.tabs.recording'
  | 'settings.tabs.transcription'
  | 'settings.tabs.summary'
  | 'settings.tabs.beta'
  | 'preferences.interfaceLanguage.title'
  | 'preferences.interfaceLanguage.description'
  | 'preferences.interfaceLanguage.english'
  | 'preferences.interfaceLanguage.simplifiedChinese'
  | 'preferences.notifications.title'
  | 'preferences.notifications.description'
  | 'preferences.storage.title'
  | 'preferences.storage.description'
  | 'preferences.storage.meetingRecordings'
  | 'preferences.storage.openFolder'
  | 'preferences.storage.noteLabel'
  | 'preferences.storage.note'
  | 'recording.title'
  | 'recording.notificationStarted'
  | 'recording.notificationStartedDescription'
  | 'recording.notificationDontShowAgain'
  | 'recording.notificationAcknowledged'
  | 'recording.description'
  | 'recording.saveAudio.title'
  | 'recording.saveAudio.description'
  | 'recording.saveLocation'
  | 'recording.defaultFolder'
  | 'recording.fileFormat'
  | 'recording.timestampNote'
  | 'recording.disabledNote'
  | 'recording.notification.title'
  | 'recording.notification.description'
  | 'recording.defaultDevices.title'
  | 'recording.defaultDevices.description'
  | 'recording.preferenceSaved'
  | 'recording.preferenceSaveFailed'
  | 'devices.title'
  | 'devices.microphone'
  | 'devices.systemAudio'
  | 'devices.selectMicrophone'
  | 'devices.selectSystemAudio'
  | 'devices.defaultMicrophone'
  | 'devices.defaultSystemAudio'
  | 'devices.noMicrophones'
  | 'devices.noSystemAudio'
  | 'devices.microphoneLevels'
  | 'devices.microphoneInfo'
  | 'devices.systemAudioInfo'
  | 'devices.micLevelsInfo'
  | 'devices.tip'
  | 'devices.selected'
  | 'devices.selectedDescription'
  | 'devices.preferencesSaved'
  | 'devices.preferencesSaveFailed'
  | 'setup.completeFirst'
  | 'setup.completeFirstDescription'
  | 'audioBackend.title'
  | 'audioBackend.tooltipTitle'
  | 'audioBackend.tooltipDescription'
  | 'audioBackend.active'
  | 'audioBackend.disabled'
  | 'audioBackend.systemOnly'
  | 'audioBackend.microphoneDefault'
  | 'audioBackend.newSessions'
  | 'transcript.model'
  | 'transcript.selectProvider'
  | 'transcript.selectModel'
  | 'transcript.advancedModels'
  | 'transcript.usingModelPrefix'
  | 'transcript.usingModelSuffix'
  | 'transcript.switchedToModel'
  | 'transcript.parakeetOption'
  | 'transcript.localWhisperOption'
  | 'transcript.apiKey'
  | 'transcript.enterApiKey'
  | 'transcript.unlockToEdit'
  | 'transcript.lockToPreventEditing'
  | 'summary.autoTitle'
  | 'summary.autoDescription'
  | 'summary.modelTitle'
  | 'summary.modelDescription'
  | 'model.settingsTitle'
  | 'model.summarizationModel'
  | 'model.selectProvider'
  | 'model.selectModel'
  | 'model.searchModels'
  | 'model.loadingModels'
  | 'model.noModelsFound'
  | 'model.builtinAiOption'
  | 'model.customEndpoint'
  | 'model.customEndpointDescription'
  | 'model.fetchModels'
  | 'model.fetching'
  | 'model.availableOllamaModels'
  | 'model.using'
  | 'model.builtinModels'
  | 'model.noBuiltinModels'
  | 'model.ready'
  | 'model.selected'
  | 'model.corrupted'
  | 'model.error'
  | 'model.notDownloaded'
  | 'model.download'
  | 'model.cancel'
  | 'model.retry'
  | 'model.delete'
  | 'model.deleteModel'
  | 'model.downloading'
  | 'model.corruptedDescription'
  | 'model.genericError'
  | 'model.failedToLoad'
  | 'model.downloaded'
  | 'model.downloadedDescription'
  | 'model.downloadFailed'
  | 'model.downloadCancelled'
  | 'model.downloadingModel'
  | 'model.downloadMayTake'
  | 'model.failedCancelDownload'
  | 'model.switchedTo'
  | 'model.deleted'
  | 'model.deletedDescription'
  | 'model.failedDelete'
  | 'model.readyTitle'
  | 'model.readyDescription'
  | 'model.readyClosing'
  | 'onboarding.downloadRetryFailed'
  | 'onboarding.summaryDownloadRetryFailed'
  | 'onboarding.checkConnectionRetry'
  | 'onboarding.transcriptionRequired'
  | 'onboarding.retryBeforeContinuing'
  | 'onboarding.downloadsContinue'
  | 'onboarding.downloadsContinueDescription'
  | 'onboarding.completeFailed'
  | 'onboarding.tryAgain'
  | 'database.importedReloading'
  | 'database.importFailed'
  | 'database.initializedStarting'
  | 'database.initializationFailed'
  | 'model.invalidOllamaEndpoint'
  | 'model.failedLoadOllama'
  | 'model.failedLoadOpenRouter'
  | 'model.customOpenAISaveFailed'
  | 'model.enterEndpointModel'
  | 'model.connectionSuccess'
  | 'model.alreadyDownloading'
  | 'model.progress'
  | 'beta.title'
  | 'beta.description'
  | 'beta.importTitle'
  | 'beta.importDescription'
  | 'beta.note'
  | 'sidebar.importAudio'
  | 'sidebar.meetingNotes'
  | 'sidebar.settings'
  | 'sidebar.recordingInProgress'
  | 'sidebar.startRecording'
  | 'about.title'
  | 'about.menuLabel'
  | 'about.tagline'
  | 'about.checking'
  | 'about.checkForUpdates'
  | 'about.latestVersion'
  | 'about.updateCheckFailed'
  | 'about.updateAvailable'
  | 'about.differentTitle'
  | 'about.privacyFirstTitle'
  | 'about.privacyFirstDescription'
  | 'about.anyModelTitle'
  | 'about.anyModelDescription'
  | 'about.costSmartTitle'
  | 'about.costSmartDescription'
  | 'about.worksEverywhereTitle'
  | 'about.worksEverywhereDescription'
  | 'about.comingSoonLabel'
  | 'about.comingSoonDescription'
  | 'about.ctaTitle'
  | 'about.ctaDescription'
  | 'about.ctaButton'
  | 'about.footer'
  | 'analytics.title'
  | 'analytics.description'
  | 'analytics.enableTitle'
  | 'analytics.updating'
  | 'analytics.anonymousPatterns'
  | 'analytics.userIdTitle'
  | 'analytics.userIdDescription'
  | 'analytics.copyUserId'
  | 'analytics.copied'
  | 'analytics.copy'
  | 'analytics.localPrivacy'
  | 'analytics.privacyPolicy'
  | 'analyticsModal.title'
  | 'analyticsModal.privacyTitle'
  | 'analyticsModal.privacyDescription'
  | 'analyticsModal.collectTitle'
  | 'analyticsModal.modelPreferencesTitle'
  | 'analyticsModal.modelPreferencesItem1'
  | 'analyticsModal.modelPreferencesItem2'
  | 'analyticsModal.modelPreferencesItem3'
  | 'analyticsModal.modelPreferencesHelp'
  | 'analyticsModal.meetingMetricsTitle'
  | 'analyticsModal.meetingMetricsItem1'
  | 'analyticsModal.meetingMetricsItem2'
  | 'analyticsModal.meetingMetricsItem3'
  | 'analyticsModal.meetingMetricsItem4'
  | 'analyticsModal.meetingMetricsHelp'
  | 'analyticsModal.deviceTypesTitle'
  | 'analyticsModal.deviceTypesItem1'
  | 'analyticsModal.deviceTypesItem2'
  | 'analyticsModal.deviceTypesHelp'
  | 'analyticsModal.usagePatternsTitle'
  | 'analyticsModal.usagePatternsItem1'
  | 'analyticsModal.usagePatternsItem2'
  | 'analyticsModal.usagePatternsItem3'
  | 'analyticsModal.usagePatternsItem4'
  | 'analyticsModal.usagePatternsHelp'
  | 'analyticsModal.platformInfoTitle'
  | 'analyticsModal.platformInfoItem1'
  | 'analyticsModal.platformInfoItem2'
  | 'analyticsModal.platformInfoItem3'
  | 'analyticsModal.platformInfoHelp'
  | 'analyticsModal.doNotCollectTitle'
  | 'analyticsModal.doNotCollectItem1'
  | 'analyticsModal.doNotCollectItem2'
  | 'analyticsModal.doNotCollectItem3'
  | 'analyticsModal.doNotCollectItem4'
  | 'analyticsModal.doNotCollectItem5'
  | 'analyticsModal.doNotCollectItem6'
  | 'analyticsModal.exampleEvent'
  | 'analyticsModal.keepEnabled'
  | 'analyticsModal.confirmDisable'
  | 'update.downloadingTitle'
  | 'update.errorTitle'
  | 'update.availableTitle'
  | 'update.downloadingDescription'
  | 'update.errorDescription'
  | 'update.newVersionDescription'
  | 'update.currentVersion'
  | 'update.newVersion'
  | 'update.releaseDate'
  | 'update.complete'
  | 'update.restartAfterInstall'
  | 'update.later'
  | 'update.downloadAndInstall'
  | 'update.close'
  | 'update.installedRestarting'
  | 'update.notificationTitle'
  | 'update.notificationDescription'
  | 'update.viewDetails'
  | 'importAudio.title'
  | 'importAudio.importingTitle'
  | 'importAudio.failedTitle'
  | 'importAudio.completeTitle'
  | 'importAudio.processing'
  | 'importAudio.errorDescription'
  | 'importAudio.description'
  | 'importAudio.completeToast'
  | 'importAudio.segmentsCreated'
  | 'importAudio.failedToast'
  | 'importAudio.cancelledToast'
  | 'importAudio.meetingTitle'
  | 'importAudio.meetingTitlePlaceholder'
  | 'importAudio.chooseDifferentFile'
  | 'importAudio.validating'
  | 'importAudio.selectFile'
  | 'importAudio.advancedOptions'
  | 'importAudio.language'
  | 'importAudio.selectLanguage'
  | 'importAudio.parakeetLanguageUnsupported'
  | 'importAudio.model'
  | 'importAudio.cancel'
  | 'importAudio.import'
  | 'importAudio.close'
  | 'importAudio.tryAgain'
  | 'importAudio.dropToImport'
  | 'importAudio.betaDisabled'
  | 'importAudio.betaDisabledDescription'
  | 'importAudio.dropAudioFile'
  | 'importAudio.supportedFormats'
  | 'recordingControls.processing'
  | 'recordingControls.start'
  | 'recordingControls.pause'
  | 'recordingControls.resume'
  | 'recordingControls.stop'
  | 'recordingControls.pausing'
  | 'recordingControls.resuming'
  | 'recordingControls.stopping'
  | 'recordingControls.validatingSpeech'
  | 'recordingControls.initFailed'
  | 'recordingControls.pauseFailed'
  | 'recordingControls.resumeFailed'
  | 'recordingControls.micUnavailableTitle'
  | 'recordingControls.micUnavailableMessage'
  | 'recordingControls.systemAudioUnavailableTitle'
  | 'recordingControls.systemAudioUnavailableMessage'
  | 'recordingControls.permissionRequiredTitle'
  | 'recordingControls.permissionRequiredMessage'
  | 'recordingControls.recordingFailedTitle'
  | 'recordingControls.recordingFailedMessage'
  | 'recordingStatus.paused'
  | 'recordingStatus.recording'
  | 'recordingStatus.finalizing'
  | 'recordingStatus.saving'
  | 'transcript.copy'
  | 'transcript.copyTitle'
  | 'transcript.language'
  | 'transcript.languageTitle'
  | 'transcript.languageSettings'
  | 'transcript.transcriptionLanguage'
  | 'transcript.autoDetectOriginal'
  | 'transcript.autoDetectTranslateEnglish'
  | 'transcript.languageSaved'
  | 'transcript.languageSavedDescription'
  | 'transcript.languageSaveFailed'
  | 'transcript.parakeetSupportTitle'
  | 'transcript.parakeetSupportDescription'
  | 'transcript.currentLanguage'
  | 'transcript.autoDetectWarningTitle'
  | 'transcript.autoDetectWarningDescription'
  | 'transcript.translationModeTitle'
  | 'transcript.translationModeDescription'
  | 'transcript.optimizedFor'
  | 'transcript.recordingPaused'
  | 'transcript.listening'
  | 'transcript.resumeHint'
  | 'transcript.speakHint'
  | 'transcript.welcome'
  | 'transcript.startHint'
  | 'permission.permissionsRequired'
  | 'permission.microphoneRequired'
  | 'permission.systemAudioRequired'
  | 'permission.openMicrophoneSettings'
  | 'permission.openScreenRecordingSettings'
  | 'permission.recheck'
  | 'permission.microphoneMissing'
  | 'permission.pleaseCheck'
  | 'permission.microphoneCheckConnected'
  | 'permission.microphoneCheckPermission'
  | 'permission.microphoneCheckExclusive'
  | 'permission.systemAudioMissingPartial'
  | 'permission.systemAudioMissingAlso'
  | 'permission.enableSystemAudioMac'
  | 'permission.installVirtualDevice'
  | 'permission.grantScreenRecording'
  | 'permission.configureAudioRouting'
  | 'recordingStart.modelDownloadTitle'
  | 'recordingStart.modelDownloadDescription'
  | 'recordingStart.modelMissingTitle'
  | 'recordingStart.modelMissingDescription'
  | 'recordingStart.modelSetupRequired'
  | 'recordingStart.initializing'
  | 'recordingStart.failed'
  | 'recordingStop.savedTitle'
  | 'recordingStop.savedDescription'
  | 'recordingStop.viewMeeting'
  | 'recordingStop.newMeeting'
  | 'recordingStop.waitingTranscription'
  | 'recordingStop.flushingBuffer'
  | 'recordingStop.savingDatabase'
  | 'recordingStop.saveFailed'
  | 'recovery.success'
  | 'recovery.transcriptsAndAudio'
  | 'recovery.transcriptsOnly'
  | 'recovery.failed'
  | 'recovery.unknownError'
  | 'meetingNotes.title'
  | 'meetingNotes.home'
  | 'meetingNotes.newCall'
  | 'meetingNotes.searchPlaceholder'
  | 'meetingNotes.searching'
  | 'meetingNotes.match'
  | 'meetingNotes.editMeetingTitle'
  | 'meetingNotes.meetingTitle'
  | 'meetingNotes.meetingTitlePlaceholder'
  | 'meetingNotes.deleteMeeting'
  | 'meetingNotes.deleteConfirm'
  | 'meetingNotes.confirmDelete'
  | 'meetingNotes.cancel'
  | 'meetingNotes.save'
  | 'meetingNotes.delete'
  | 'meetingNotes.titleEmpty'
  | 'meetingNotes.deleted'
  | 'meetingNotes.deletedDescription'
  | 'meetingNotes.titleUpdated'
  | 'meetingNotes.deleteFailed'
  | 'meetingNotes.titleUpdateFailed'
  | 'meetingDetails.contextPlaceholder'
  | 'meetingDetails.noTranscriptAvailable'
  | 'meetingDetails.copyTranscript'
  | 'meetingDetails.copy'
  | 'meetingDetails.openRecordingFolder'
  | 'meetingDetails.recording'
  | 'meetingDetails.enhance'
  | 'meetingDetails.enhanceTitle'
  | 'meetingDetails.generatingSummary'
  | 'meetingDetails.meetingSummary'
  | 'meetingDetails.keyPoints'
  | 'meetingDetails.actionItems'
  | 'meetingDetails.decisions'
  | 'meetingDetails.mainTopics'
  | 'meetingDetails.fullSummary'
  | 'meetingDetails.stopSummary'
  | 'meetingDetails.stop'
  | 'meetingDetails.loadingModelConfig'
  | 'meetingDetails.checkingModels'
  | 'meetingDetails.generateAiSummary'
  | 'meetingDetails.processing'
  | 'meetingDetails.generateSummary'
  | 'meetingDetails.summarySettings'
  | 'meetingDetails.aiModel'
  | 'meetingDetails.selectSummaryTemplate'
  | 'meetingDetails.template'
  | 'meetingDetails.saveChanges'
  | 'meetingDetails.saving'
  | 'meetingDetails.copySummary'
  | 'meetingDetails.noSummaryTitle'
  | 'meetingDetails.noSummaryDescription'
  | 'meetingDetails.selectModelFirst'
  | 'meetingDetails.processingTranscript'
  | 'meetingDetails.summaryCompletedStatus'
  | 'meetingDetails.errorGeneratingStatus'
  | 'meetingDetails.noTranscriptText'
  | 'meetingDetails.regeneratingSummary'
  | 'meetingDetails.generatingSummaryToast'
  | 'meetingDetails.usingModel'
  | 'meetingDetails.summaryRegenerationFailed'
  | 'meetingDetails.summaryGenerationFailed'
  | 'meetingDetails.previousSummaryRestored'
  | 'meetingDetails.connectionRefused'
  | 'meetingDetails.summaryReady'
  | 'meetingDetails.summaryReadyDescription'
  | 'meetingDetails.summaryEmpty'
  | 'meetingDetails.emptySummaryGenerated'
  | 'meetingDetails.fetchTranscriptsFailed'
  | 'meetingDetails.noTranscriptsForSummary'
  | 'meetingDetails.noOllamaModels'
  | 'meetingDetails.ollamaNotInstalled'
  | 'meetingDetails.ollamaInstallDescription'
  | 'meetingDetails.download'
  | 'meetingDetails.ollamaCheckFailed'
  | 'meetingDetails.noBuiltinModel'
  | 'meetingDetails.modelNotFound'
  | 'meetingDetails.modelInfoNotFound'
  | 'meetingDetails.modelDownloadInProgress'
  | 'meetingDetails.modelDownloadWait'
  | 'meetingDetails.modelNotDownloaded'
  | 'meetingDetails.modelDownloadRequired'
  | 'meetingDetails.modelFileCorrupted'
  | 'meetingDetails.modelDeleteRedownload'
  | 'meetingDetails.modelError'
  | 'meetingDetails.modelGenericError'
  | 'meetingDetails.modelUnavailable'
  | 'meetingDetails.modelCheckSettings'
  | 'meetingDetails.modelNotReady'
  | 'meetingDetails.modelEnsureDownloaded'
  | 'meetingDetails.modelValidationFailed'
  | 'meetingDetails.summaryStopped'
  | 'meetingDetails.summaryStoppedDescription'
  | 'meetingDetails.fetchTranscriptsCopyFailed'
  | 'meetingDetails.noTranscriptsToCopy'
  | 'meetingDetails.transcriptCopied'
  | 'meetingDetails.noSummaryToCopy'
  | 'meetingDetails.summaryCopied'
  | 'meetingDetails.summaryCopyFailed'
  | 'meetingDetails.templateSelected'
  | 'meetingDetails.templateSelectedDescription'
  | 'meetingDetails.modelSettingsSaved'
  | 'meetingDetails.modelSettingsSaveFailed'
  | 'meetingDetails.summarySettingsSaved'
  | 'meetingDetails.summarySettingsSaveFailed'
  | 'meetingDetails.changesSaved'
  | 'meetingDetails.changesSaveFailed'
  | 'meetingDetails.openFolderFailed'
  | 'retranscribe.title'
  | 'retranscribe.processingTitle'
  | 'retranscribe.failedTitle'
  | 'retranscribe.processingAudio'
  | 'retranscribe.errorDescription'
  | 'retranscribe.description'
  | 'retranscribe.languageHint'
  | 'retranscribe.modelHint'
  | 'retranscribe.start'
  | 'retranscribe.completeToast'
  | 'retranscribe.segmentsCreated'
  | 'retranscribe.cancelledToast'
  | 'retranscribe.folderMissing';

type I18nContextType = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: (key: TranslationKey) => string;
};

const UI_LOCALE_STORAGE_KEY = 'uiLocale';

const translations: Record<UiLocale, Record<TranslationKey, string>> = {
  en: {
    'common.back': 'Back',
    'common.done': 'Done',
    'common.unknownError': 'Unknown error',
    'common.retry': 'Retry',
    'common.tipLabel': 'Tip:',
    'common.loadingPreferences': 'Loading Preferences...',
    'settings.title': 'Settings',
    'settings.tabs.general': 'General',
    'settings.tabs.recording': 'Recordings',
    'settings.tabs.transcription': 'Transcription',
    'settings.tabs.summary': 'Summary',
    'settings.tabs.beta': 'Beta',
    'preferences.interfaceLanguage.title': 'Interface Language',
    'preferences.interfaceLanguage.description': 'Choose the display language used by MeetVoice.',
    'preferences.interfaceLanguage.english': 'English',
    'preferences.interfaceLanguage.simplifiedChinese': 'Simplified Chinese',
    'preferences.notifications.title': 'Notifications',
    'preferences.notifications.description': 'Enable or disable notifications of start and end of meeting',
    'preferences.storage.title': 'Data Storage Locations',
    'preferences.storage.description': 'View and access where MeetVoice stores your data',
    'preferences.storage.meetingRecordings': 'Meeting Recordings',
    'preferences.storage.openFolder': 'Open Folder',
    'preferences.storage.noteLabel': 'Note:',
    'preferences.storage.note': 'Database and models are stored together in your application data directory for unified management.',
    'recording.title': 'Recording Settings',
    'recording.notificationStarted': 'Recording Started',
    'recording.notificationStartedDescription': 'Inform all participants this meeting is being recorded.',
    'recording.notificationDontShowAgain': "Don't show this again",
    'recording.notificationAcknowledged': "I've Notified Participants",
    'recording.description': 'Configure how your audio recordings are saved during meetings.',
    'recording.saveAudio.title': 'Save Audio Recordings',
    'recording.saveAudio.description': 'Automatically save audio files when recording stops',
    'recording.saveLocation': 'Save Location',
    'recording.defaultFolder': 'Default folder',
    'recording.fileFormat': 'File Format:',
    'recording.timestampNote': 'Recordings are saved with timestamp:',
    'recording.disabledNote': 'Audio recording is disabled. Enable "Save Audio Recordings" to automatically save your meeting audio.',
    'recording.notification.title': 'Recording Start Notification',
    'recording.notification.description': 'Show reminder to inform participants when recording starts',
    'recording.defaultDevices.title': 'Default Audio Devices',
    'recording.defaultDevices.description': 'Set your preferred microphone and system audio devices for recording. These will be automatically selected when starting new recordings.',
    'recording.preferenceSaved': 'Preference saved',
    'recording.preferenceSaveFailed': 'Failed to save preference',
    'devices.title': 'Audio Devices',
    'devices.microphone': 'Microphone',
    'devices.systemAudio': 'System Audio',
    'devices.selectMicrophone': 'Select Microphone',
    'devices.selectSystemAudio': 'Select System Audio',
    'devices.defaultMicrophone': 'Default Microphone',
    'devices.defaultSystemAudio': 'Default System Audio',
    'devices.noMicrophones': 'No microphone devices found',
    'devices.noSystemAudio': 'No system audio devices found',
    'devices.microphoneLevels': 'Microphone Levels:',
    'devices.microphoneInfo': 'Records your voice and ambient sound',
    'devices.systemAudioInfo': 'Records computer audio (music, calls, etc.)',
    'devices.micLevelsInfo': 'Green = good, Yellow = loud, Red = too loud',
    'devices.tip': 'Click "Test Mic" to check if your microphone is working',
    'devices.selected': 'Devices selected',
    'devices.selectedDescription': 'Microphone: {mic}, System Audio: {system}',
    'devices.preferencesSaved': 'Device preferences saved',
    'devices.preferencesSaveFailed': 'Failed to save device preferences',
    'setup.completeFirst': 'Please complete setup first',
    'setup.completeFirstDescription': 'You need to finish onboarding before you can start recording.',
    'audioBackend.title': 'System Audio Backend',
    'audioBackend.tooltipTitle': 'Audio Capture Methods:',
    'audioBackend.tooltipDescription': 'Try different backends to find which works best for your system.',
    'audioBackend.active': 'Active',
    'audioBackend.disabled': 'Disabled',
    'audioBackend.systemOnly': 'Backend selection only affects system audio capture',
    'audioBackend.microphoneDefault': 'Microphone always uses the default method',
    'audioBackend.newSessions': 'Changes apply to new recording sessions',
    'transcript.model': 'Transcript Model',
    'transcript.selectProvider': 'Select provider',
    'transcript.selectModel': 'Select model',
    'transcript.advancedModels': 'Advanced Models',
    'transcript.usingModelPrefix': 'Using',
    'transcript.usingModelSuffix': 'for transcription',
    'transcript.switchedToModel': 'Switched to',
    'transcript.parakeetOption': 'Parakeet (Recommended - Real-time / Accurate)',
    'transcript.localWhisperOption': 'Local Whisper (High Accuracy)',
    'transcript.apiKey': 'API Key',
    'transcript.enterApiKey': 'Enter your API key',
    'transcript.unlockToEdit': 'Unlock to edit',
    'transcript.lockToPreventEditing': 'Lock to prevent editing',
    'summary.autoTitle': 'Auto Summary',
    'summary.autoDescription': 'Auto generating summary after meeting completion (stopping)',
    'summary.modelTitle': 'Summary Model Configuration',
    'summary.modelDescription': 'Configure the AI model used for generating meeting summaries.',
    'model.settingsTitle': 'Model Settings',
    'model.summarizationModel': 'Summarization Model',
    'model.selectProvider': 'Select provider',
    'model.selectModel': 'Select model...',
    'model.searchModels': 'Search models...',
    'model.loadingModels': 'Loading models...',
    'model.noModelsFound': 'No models found.',
    'model.builtinAiOption': 'Built-in AI (Offline, No API needed)',
    'model.customEndpoint': 'Custom Endpoint (optional)',
    'model.customEndpointDescription': 'Leave empty or enter a custom endpoint (e.g., http://x.yy.zz:11434)',
    'model.fetchModels': 'Fetch Models',
    'model.fetching': 'Fetching...',
    'model.availableOllamaModels': 'Available Ollama Models',
    'model.using': 'Using:',
    'model.builtinModels': 'Built-in AI Models',
    'model.noBuiltinModels': 'No models found. Download a model to get started with Built-in AI.',
    'model.ready': 'Ready',
    'model.selected': 'Selected',
    'model.corrupted': 'Corrupted',
    'model.error': 'Error',
    'model.notDownloaded': 'Not Downloaded',
    'model.download': 'Download',
    'model.cancel': 'Cancel',
    'model.retry': 'Retry',
    'model.delete': 'Delete',
    'model.deleteModel': 'Delete model',
    'model.downloading': 'Downloading...',
    'model.corruptedDescription': 'File is corrupted. Retry download or delete.',
    'model.genericError': 'An error occurred',
    'model.failedToLoad': 'Failed to load models',
    'model.downloaded': 'Model downloaded successfully',
    'model.downloadedDescription': 'Model is now ready to use',
    'model.downloadFailed': 'Failed to download',
    'model.downloadCancelled': 'Download cancelled',
    'model.downloadingModel': 'Downloading',
    'model.downloadMayTake': 'This may take a few minutes',
    'model.failedCancelDownload': 'Failed to cancel download',
    'model.switchedTo': 'Switched to',
    'model.deleted': 'Model deleted',
    'model.deletedDescription': 'Model removed to free up space',
    'model.failedDelete': 'Failed to delete',
    'model.readyTitle': 'ready!',
    'model.readyDescription': 'Model downloaded and ready to use',
    'model.readyClosing': 'Model ready! Closing window...',
    'onboarding.downloadRetryFailed': 'Download retry failed',
    'onboarding.summaryDownloadRetryFailed': 'Summary model download retry failed',
    'onboarding.checkConnectionRetry': 'Please check your connection and try again.',
    'onboarding.transcriptionRequired': 'Transcription engine required',
    'onboarding.retryBeforeContinuing': 'Please retry the download before continuing.',
    'onboarding.downloadsContinue': 'Downloads will continue in the background',
    'onboarding.downloadsContinueDescription': 'You can start using the app. Recording will be available once speech recognition is ready.',
    'onboarding.completeFailed': 'Failed to complete setup',
    'onboarding.tryAgain': 'Please try again.',
    'database.importedReloading': 'Database imported successfully! Reloading...',
    'database.importFailed': 'Import failed',
    'database.initializedStarting': 'Database initialized successfully! Starting app...',
    'database.initializationFailed': 'Initialization failed',
    'model.invalidOllamaEndpoint': 'Invalid Ollama endpoint URL. Must start with http:// or https://',
    'model.failedLoadOllama': 'Failed to load Ollama models',
    'model.failedLoadOpenRouter': 'Failed to load OpenRouter models',
    'model.customOpenAISaveFailed': 'Failed to save custom OpenAI configuration',
    'model.enterEndpointModel': 'Please enter endpoint URL and model name first',
    'model.connectionSuccess': 'Connection successful!',
    'model.alreadyDownloading': 'is already downloading',
    'model.progress': 'Progress',
    'beta.title': 'Beta Features',
    'beta.description': 'These features are still being tested. You may encounter issues, and we appreciate your feedback.',
    'beta.importTitle': 'Import Audio & Retranscribe',
    'beta.importDescription': 'Import audio files to transcribe or retranscribe existing meetings with different language settings.',
    'beta.note': 'When disabled, beta features will be hidden. Your existing meetings remain unaffected.',
    'sidebar.importAudio': 'Import Audio',
    'sidebar.meetingNotes': 'Meeting Notes',
    'sidebar.settings': 'Settings',
    'sidebar.recordingInProgress': 'Recording in progress...',
    'sidebar.startRecording': 'Start Recording',
    'about.title': 'About MeetVoice',
    'about.menuLabel': 'About',
    'about.tagline': 'Local AI Meeting Notes',
    'about.checking': 'Checking...',
    'about.checkForUpdates': 'Check for Updates',
    'about.latestVersion': 'You are running the latest version',
    'about.updateCheckFailed': 'Failed to check for updates:',
    'about.updateAvailable': 'Update available:',
    'about.differentTitle': 'What makes MeetVoice different',
    'about.privacyFirstTitle': 'Privacy-first',
    'about.privacyFirstDescription': 'Your data & AI processing workflow can now stay within your premise. No cloud, no leaks.',
    'about.anyModelTitle': 'Use Any Model',
    'about.anyModelDescription': 'Prefer local open-source model? Great. Want to plug in an external API? Also fine. No lock-in.',
    'about.costSmartTitle': 'Cost-Smart',
    'about.costSmartDescription': 'Avoid pay-per-minute bills by running models locally (or pay only for the calls you choose).',
    'about.worksEverywhereTitle': 'Works everywhere',
    'about.worksEverywhereDescription': 'Google Meet, Zoom, Teams-online or offline.',
    'about.comingSoonLabel': 'Coming soon:',
    'about.comingSoonDescription': 'A library of on-device AI agents-automating follow-ups, action tracking, and more.',
    'about.ctaTitle': 'Ready to push your business further?',
    'about.ctaDescription': "If you're planning to build privacy-first custom AI agents or a fully tailored product for your business, we can help you build it.",
    'about.ctaButton': 'Chat with the Zackriya team',
    'about.footer': 'Built by Zackriya Solutions',
    'analytics.title': 'Usage Analytics',
    'analytics.description': 'Help us improve MeetVoice by sharing anonymous usage data. No personal content is collected-everything stays on your device.',
    'analytics.enableTitle': 'Enable Analytics',
    'analytics.updating': 'Updating...',
    'analytics.anonymousPatterns': 'Anonymous usage patterns only',
    'analytics.userIdTitle': 'Your User ID',
    'analytics.userIdDescription': 'Share this ID when reporting issues to help us investigate your issue logs',
    'analytics.copyUserId': 'Copy User ID',
    'analytics.copied': 'Copied!',
    'analytics.copy': 'Copy',
    'analytics.localPrivacy': 'Your meetings, transcripts, and recordings remain completely private and local.',
    'analytics.privacyPolicy': 'View Privacy Policy',
    'analyticsModal.title': 'What We Collect',
    'analyticsModal.privacyTitle': 'Your Privacy is Protected',
    'analyticsModal.privacyDescription': 'We collect anonymous usage data only. No meeting content, names, or personal information is ever collected.',
    'analyticsModal.collectTitle': 'Data We Collect:',
    'analyticsModal.modelPreferencesTitle': '1. Model Preferences',
    'analyticsModal.modelPreferencesItem1': 'Transcription model (e.g., "Whisper large-v3", "Parakeet")',
    'analyticsModal.modelPreferencesItem2': 'Summary model (e.g., "Llama 3.2", "Claude Sonnet")',
    'analyticsModal.modelPreferencesItem3': 'Model provider (e.g., "Local", "Ollama", "OpenRouter")',
    'analyticsModal.modelPreferencesHelp': 'Helps us understand which models users prefer',
    'analyticsModal.meetingMetricsTitle': '2. Anonymous Meeting Metrics',
    'analyticsModal.meetingMetricsItem1': 'Recording duration (e.g., "125 seconds")',
    'analyticsModal.meetingMetricsItem2': 'Pause duration (e.g., "5 seconds")',
    'analyticsModal.meetingMetricsItem3': 'Number of transcript segments',
    'analyticsModal.meetingMetricsItem4': 'Number of audio chunks processed',
    'analyticsModal.meetingMetricsHelp': 'Helps us optimize performance and understand usage patterns',
    'analyticsModal.deviceTypesTitle': '3. Device Types (Not Names)',
    'analyticsModal.deviceTypesItem1': 'Microphone type: "Bluetooth" or "Wired" or "Unknown"',
    'analyticsModal.deviceTypesItem2': 'System audio type: "Bluetooth" or "Wired" or "Unknown"',
    'analyticsModal.deviceTypesHelp': 'Helps us improve compatibility, NOT the actual device names',
    'analyticsModal.usagePatternsTitle': '4. App Usage Patterns',
    'analyticsModal.usagePatternsItem1': 'App started/stopped events',
    'analyticsModal.usagePatternsItem2': 'Session duration',
    'analyticsModal.usagePatternsItem3': 'Feature usage (e.g., "settings changed")',
    'analyticsModal.usagePatternsItem4': 'Error occurrences (helps us fix bugs)',
    'analyticsModal.usagePatternsHelp': 'Helps us improve user experience',
    'analyticsModal.platformInfoTitle': '5. Platform Information',
    'analyticsModal.platformInfoItem1': 'Operating system (e.g., "macOS", "Windows")',
    'analyticsModal.platformInfoItem2': 'App version (automatically included in all events)',
    'analyticsModal.platformInfoItem3': 'Architecture (e.g., "x86_64", "aarch64")',
    'analyticsModal.platformInfoHelp': 'Helps us prioritize platform support',
    'analyticsModal.doNotCollectTitle': "What We DON'T Collect:",
    'analyticsModal.doNotCollectItem1': 'Meeting names or titles',
    'analyticsModal.doNotCollectItem2': 'Meeting transcripts or content',
    'analyticsModal.doNotCollectItem3': 'Audio recordings',
    'analyticsModal.doNotCollectItem4': 'Device names (only types: Bluetooth/Wired)',
    'analyticsModal.doNotCollectItem5': 'Personal information',
    'analyticsModal.doNotCollectItem6': 'Any identifiable data',
    'analyticsModal.exampleEvent': 'Example Event:',
    'analyticsModal.keepEnabled': 'Keep Analytics Enabled',
    'analyticsModal.confirmDisable': 'Confirm: Disable Analytics',
    'update.downloadingTitle': 'Downloading Update',
    'update.errorTitle': 'Update Error',
    'update.availableTitle': 'Update Available',
    'update.downloadingDescription': 'Downloading the latest version...',
    'update.errorDescription': 'An error occurred while updating',
    'update.newVersionDescription': 'A new version is available',
    'update.currentVersion': 'Current Version:',
    'update.newVersion': 'New Version:',
    'update.releaseDate': 'Release Date:',
    'update.complete': 'complete',
    'update.restartAfterInstall': 'The app will restart automatically after installation',
    'update.later': 'Later',
    'update.downloadAndInstall': 'Download & Install',
    'update.close': 'Close',
    'update.installedRestarting': 'Update installed successfully. The app will restart...',
    'update.notificationTitle': 'Update Available',
    'update.notificationDescription': 'Version {version} is now available',
    'update.viewDetails': 'View Details',
    'importAudio.title': 'Import Audio File',
    'importAudio.importingTitle': 'Importing Audio...',
    'importAudio.failedTitle': 'Import Failed',
    'importAudio.completeTitle': 'Import Complete',
    'importAudio.processing': 'Processing audio...',
    'importAudio.errorDescription': 'An error occurred during import',
    'importAudio.description': 'Import an audio file to create a new meeting with transcripts',
    'importAudio.completeToast': 'Import complete!',
    'importAudio.segmentsCreated': 'segments created.',
    'importAudio.failedToast': 'Import failed',
    'importAudio.cancelledToast': 'Import cancelled',
    'importAudio.meetingTitle': 'Meeting Title',
    'importAudio.meetingTitlePlaceholder': 'Enter meeting title',
    'importAudio.chooseDifferentFile': 'Choose Different File',
    'importAudio.validating': 'Validating...',
    'importAudio.selectFile': 'Select Audio File',
    'importAudio.advancedOptions': 'Advanced Options',
    'importAudio.language': 'Language',
    'importAudio.selectLanguage': 'Select language',
    'importAudio.parakeetLanguageUnsupported': "Language selection isn't supported for Parakeet. It always uses automatic detection.",
    'importAudio.model': 'Model',
    'importAudio.cancel': 'Cancel',
    'importAudio.import': 'Import',
    'importAudio.close': 'Close',
    'importAudio.tryAgain': 'Try Again',
    'importAudio.dropToImport': 'Drop audio file to import',
    'importAudio.betaDisabled': 'Beta feature disabled',
    'importAudio.betaDisabledDescription': 'Enable "Import Audio & Retranscribe" in Settings > Beta to use this feature.',
    'importAudio.dropAudioFile': 'Please drop an audio file',
    'importAudio.supportedFormats': 'Supported formats:',
    'recordingControls.processing': 'Processing recording...',
    'recordingControls.start': 'Start recording',
    'recordingControls.pause': 'Pause recording',
    'recordingControls.resume': 'Resume recording',
    'recordingControls.stop': 'Stop recording',
    'recordingControls.pausing': 'Pausing...',
    'recordingControls.resuming': 'Resuming...',
    'recordingControls.stopping': 'Stopping...',
    'recordingControls.validatingSpeech': 'Validating speech recognition...',
    'recordingControls.initFailed': 'Failed to initialize recording. Please check the console for details.',
    'recordingControls.pauseFailed': 'Failed to pause recording. Please check the console for details.',
    'recordingControls.resumeFailed': 'Failed to resume recording. Please check the console for details.',
    'recordingControls.micUnavailableTitle': 'Microphone Not Available',
    'recordingControls.micUnavailableMessage': 'Unable to access your microphone. Please check that:\n• Your microphone is connected\n• The app has microphone permissions\n• No other app is using the microphone',
    'recordingControls.systemAudioUnavailableTitle': 'System Audio Not Available',
    'recordingControls.systemAudioUnavailableMessage': 'Unable to capture system audio. Please check that:\n• A virtual audio device (like BlackHole) is installed\n• The app has screen recording permissions (macOS)\n• System audio is properly configured',
    'recordingControls.permissionRequiredTitle': 'Permission Required',
    'recordingControls.permissionRequiredMessage': 'Recording permissions are required. Please:\n• Grant microphone access in System Settings\n• Grant screen recording access for system audio (macOS)\n• Restart the app after granting permissions',
    'recordingControls.recordingFailedTitle': 'Recording Failed',
    'recordingControls.recordingFailedMessage': 'Unable to start recording. Please check your audio device settings and try again.',
    'recordingStatus.paused': 'Paused',
    'recordingStatus.recording': 'Recording',
    'recordingStatus.finalizing': 'Finalizing transcription...',
    'recordingStatus.saving': 'Saving transcript...',
    'transcript.copy': 'Copy',
    'transcript.copyTitle': 'Copy Transcript',
    'transcript.language': 'Language',
    'transcript.languageTitle': 'Language',
    'transcript.languageSettings': 'Language Settings',
    'transcript.transcriptionLanguage': 'Transcription Language',
    'transcript.autoDetectOriginal': 'Auto Detect (Original Language)',
    'transcript.autoDetectTranslateEnglish': 'Auto Detect (Translate to English)',
    'transcript.languageSaved': 'Language preference saved',
    'transcript.languageSavedDescription': 'Transcription language set to',
    'transcript.languageSaveFailed': 'Failed to save language preference',
    'transcript.parakeetSupportTitle': 'Parakeet Language Support',
    'transcript.parakeetSupportDescription': 'Parakeet currently only supports automatic language detection. Manual language selection is not available. Use Whisper if you need to specify a particular language.',
    'transcript.currentLanguage': 'Current:',
    'transcript.autoDetectWarningTitle': 'Auto Detect may produce incorrect results',
    'transcript.autoDetectWarningDescription': 'For best accuracy, select your specific language (e.g., English, Spanish, etc.)',
    'transcript.translationModeTitle': 'Translation Mode Active',
    'transcript.translationModeDescription': 'All audio will be automatically translated to English. Best for multilingual meetings where you need English output.',
    'transcript.optimizedFor': 'Transcription will be optimized for',
    'transcript.recordingPaused': 'Recording paused',
    'transcript.listening': 'Listening for speech...',
    'transcript.resumeHint': 'Click resume to continue recording',
    'transcript.speakHint': 'Speak to see live transcription',
    'transcript.welcome': 'Welcome to MeetVoice!',
    'transcript.startHint': 'Start recording to see live transcription',
    'permission.permissionsRequired': 'Permissions Required',
    'permission.microphoneRequired': 'Microphone Permission Required',
    'permission.systemAudioRequired': 'System Audio Permission Required',
    'permission.openMicrophoneSettings': 'Open Microphone Settings',
    'permission.openScreenRecordingSettings': 'Open Screen Recording Settings',
    'permission.recheck': 'Recheck',
    'permission.microphoneMissing': 'MeetVoice needs access to your microphone to record meetings. No microphone devices were detected.',
    'permission.pleaseCheck': 'Please check:',
    'permission.microphoneCheckConnected': 'Your microphone is connected and powered on',
    'permission.microphoneCheckPermission': 'Microphone permission is granted in System Settings',
    'permission.microphoneCheckExclusive': 'No other app is exclusively using the microphone',
    'permission.systemAudioMissingPartial': "System audio capture is not available. You can still record with your microphone, but computer audio won't be captured.",
    'permission.systemAudioMissingAlso': 'System audio capture is also not available.',
    'permission.enableSystemAudioMac': 'To enable system audio on macOS:',
    'permission.installVirtualDevice': 'Install a virtual audio device (e.g., BlackHole 2ch)',
    'permission.grantScreenRecording': 'Grant Screen Recording permission to MeetVoice',
    'permission.configureAudioRouting': 'Configure your audio routing in Audio MIDI Setup',
    'recordingStart.modelDownloadTitle': 'Model download in progress',
    'recordingStart.modelDownloadDescription': 'Please wait for the transcription model to finish downloading before recording.',
    'recordingStart.modelMissingTitle': 'Transcription model not ready',
    'recordingStart.modelMissingDescription': 'Please download a transcription model before recording.',
    'recordingStart.modelSetupRequired': 'Transcription model setup required',
    'recordingStart.initializing': 'Initializing recording...',
    'recordingStart.failed': 'Failed to start recording',
    'recordingStop.savedTitle': 'Recording saved successfully!',
    'recordingStop.savedDescription': 'transcript segments saved.',
    'recordingStop.viewMeeting': 'View Meeting',
    'recordingStop.newMeeting': 'New Meeting',
    'recordingStop.waitingTranscription': 'Waiting for transcription...',
    'recordingStop.flushingBuffer': 'Flushing transcript buffer...',
    'recordingStop.savingDatabase': 'Saving meeting to database...',
    'recordingStop.saveFailed': 'Failed to save meeting',
    'recovery.success': 'Meeting recovered successfully!',
    'recovery.transcriptsAndAudio': 'Transcripts and audio recovered',
    'recovery.transcriptsOnly': 'Transcripts recovered (no audio available)',
    'recovery.failed': 'Failed to recover meeting',
    'recovery.unknownError': 'Unknown error occurred',
    'meetingNotes.title': 'Meeting Notes',
    'meetingNotes.home': 'Home',
    'meetingNotes.newCall': '+ New Call',
    'meetingNotes.searchPlaceholder': 'Search meeting content...',
    'meetingNotes.searching': 'Searching...',
    'meetingNotes.match': 'Match:',
    'meetingNotes.editMeetingTitle': 'Edit Meeting Title',
    'meetingNotes.meetingTitle': 'Meeting Title',
    'meetingNotes.meetingTitlePlaceholder': 'Enter meeting title',
    'meetingNotes.deleteMeeting': 'Delete meeting',
    'meetingNotes.deleteConfirm': 'Are you sure you want to delete this meeting? This action cannot be undone.',
    'meetingNotes.confirmDelete': 'Confirm Delete',
    'meetingNotes.cancel': 'Cancel',
    'meetingNotes.save': 'Save',
    'meetingNotes.delete': 'Delete',
    'meetingNotes.titleEmpty': 'Meeting title cannot be empty',
    'meetingNotes.deleted': 'Meeting deleted successfully',
    'meetingNotes.deletedDescription': 'The meeting and its data have been removed',
    'meetingNotes.titleUpdated': 'Meeting title updated successfully',
    'meetingNotes.deleteFailed': 'Failed to delete meeting',
    'meetingNotes.titleUpdateFailed': 'Failed to update meeting title',
    'meetingDetails.contextPlaceholder': 'Add context for AI summary. For example people involved, meeting overview, objective etc...',
    'meetingDetails.noTranscriptAvailable': 'No transcript available',
    'meetingDetails.copyTranscript': 'Copy Transcript',
    'meetingDetails.copy': 'Copy',
    'meetingDetails.openRecordingFolder': 'Open Recording Folder',
    'meetingDetails.recording': 'Recording',
    'meetingDetails.enhance': 'Enhance',
    'meetingDetails.enhanceTitle': 'Retranscribe to enhance your recorded audio',
    'meetingDetails.generatingSummary': 'Generating AI Summary...',
    'meetingDetails.meetingSummary': 'Meeting Summary',
    'meetingDetails.keyPoints': 'Key Points',
    'meetingDetails.actionItems': 'Action Items',
    'meetingDetails.decisions': 'Decisions',
    'meetingDetails.mainTopics': 'Main Topics',
    'meetingDetails.fullSummary': 'Full Summary',
    'meetingDetails.stopSummary': 'Stop summary generation',
    'meetingDetails.stop': 'Stop',
    'meetingDetails.loadingModelConfig': 'Loading model configuration...',
    'meetingDetails.checkingModels': 'Checking models...',
    'meetingDetails.generateAiSummary': 'Generate AI Summary',
    'meetingDetails.processing': 'Processing...',
    'meetingDetails.generateSummary': 'Generate Summary',
    'meetingDetails.summarySettings': 'Summary Settings',
    'meetingDetails.aiModel': 'AI Model',
    'meetingDetails.selectSummaryTemplate': 'Select summary template',
    'meetingDetails.template': 'Template',
    'meetingDetails.saveChanges': 'Save Changes',
    'meetingDetails.saving': 'Saving',
    'meetingDetails.copySummary': 'Copy Summary',
    'meetingDetails.noSummaryTitle': 'No Summary Generated Yet',
    'meetingDetails.noSummaryDescription': 'Generate an AI-powered summary of your meeting transcript to get key points, action items, and decisions.',
    'meetingDetails.selectModelFirst': 'Please select a model in Settings first',
    'meetingDetails.processingTranscript': 'Processing transcript...',
    'meetingDetails.summaryCompletedStatus': 'Summary completed',
    'meetingDetails.errorGeneratingStatus': 'Error generating summary',
    'meetingDetails.noTranscriptText': 'No transcript text available. Please add some text first.',
    'meetingDetails.regeneratingSummary': 'Regenerating summary...',
    'meetingDetails.generatingSummaryToast': 'Generating summary...',
    'meetingDetails.usingModel': 'Using',
    'meetingDetails.summaryRegenerationFailed': 'Failed to regenerate summary',
    'meetingDetails.summaryGenerationFailed': 'Failed to generate summary',
    'meetingDetails.previousSummaryRestored': 'Your previous summary has been restored.',
    'meetingDetails.connectionRefused': 'Could not connect to LLM service. Please ensure Ollama or your configured LLM provider is running.',
    'meetingDetails.summaryReady': 'Summary generated successfully!',
    'meetingDetails.summaryReadyDescription': 'Your meeting summary is ready',
    'meetingDetails.summaryEmpty': 'Summary generation completed but returned empty content.',
    'meetingDetails.emptySummaryGenerated': 'Empty summary generated',
    'meetingDetails.fetchTranscriptsFailed': 'Failed to fetch transcripts for summary generation',
    'meetingDetails.noTranscriptsForSummary': 'No transcripts available for summary',
    'meetingDetails.noOllamaModels': 'No Ollama models found. Please download gemma3:1b from Model Settings.',
    'meetingDetails.ollamaNotInstalled': 'Ollama is not installed',
    'meetingDetails.ollamaInstallDescription': 'Please download and install Ollama to use local models.',
    'meetingDetails.download': 'Download',
    'meetingDetails.ollamaCheckFailed': 'Failed to check Ollama models. Please ensure Ollama is running and download a model from Settings.',
    'meetingDetails.noBuiltinModel': 'No built-in AI model selected',
    'meetingDetails.modelNotFound': 'Model not found',
    'meetingDetails.modelInfoNotFound': 'Could not find information for model:',
    'meetingDetails.modelDownloadInProgress': 'Model download in progress',
    'meetingDetails.modelDownloadWait': 'is downloading. Please wait until download completes.',
    'meetingDetails.modelNotDownloaded': 'Built-in AI model not downloaded',
    'meetingDetails.modelDownloadRequired': 'needs to be downloaded. Please download it in model settings.',
    'meetingDetails.modelFileCorrupted': 'The model file is corrupted',
    'meetingDetails.modelDeleteRedownload': 'file is corrupted. Please delete and re-download.',
    'meetingDetails.modelError': 'Model error',
    'meetingDetails.modelGenericError': 'An error occurred with the model',
    'meetingDetails.modelUnavailable': 'Built-in AI model not available',
    'meetingDetails.modelCheckSettings': 'Please check model settings.',
    'meetingDetails.modelNotReady': 'Built-in AI model not ready',
    'meetingDetails.modelEnsureDownloaded': 'Please ensure the model is downloaded in settings',
    'meetingDetails.modelValidationFailed': 'Failed to validate built-in AI model',
    'meetingDetails.summaryStopped': 'Summary generation stopped',
    'meetingDetails.summaryStoppedDescription': 'You can generate a new summary anytime',
    'meetingDetails.fetchTranscriptsCopyFailed': 'Failed to fetch transcripts for copying',
    'meetingDetails.noTranscriptsToCopy': 'No transcripts available to copy',
    'meetingDetails.transcriptCopied': 'Transcript copied to clipboard',
    'meetingDetails.noSummaryToCopy': 'No summary content available to copy',
    'meetingDetails.summaryCopied': 'Summary copied to clipboard',
    'meetingDetails.summaryCopyFailed': 'Failed to copy summary',
    'meetingDetails.templateSelected': 'Template selected',
    'meetingDetails.templateSelectedDescription': 'Using template for summary generation:',
    'meetingDetails.modelSettingsSaved': 'Model settings saved successfully',
    'meetingDetails.modelSettingsSaveFailed': 'Failed to save model settings',
    'meetingDetails.summarySettingsSaved': 'Summary settings saved successfully',
    'meetingDetails.summarySettingsSaveFailed': 'Failed to save summary settings',
    'meetingDetails.changesSaved': 'Changes saved successfully',
    'meetingDetails.changesSaveFailed': 'Failed to save changes',
    'meetingDetails.openFolderFailed': 'Failed to open recording folder',
    'retranscribe.title': 'Retranscribe Meeting',
    'retranscribe.processingTitle': 'Retranscribing...',
    'retranscribe.failedTitle': 'Retranscription Failed',
    'retranscribe.processingAudio': 'Processing audio...',
    'retranscribe.errorDescription': 'An error occurred during retranscription',
    'retranscribe.description': 'Re-process the audio with different language settings',
    'retranscribe.languageHint': 'Select a specific language to improve accuracy, or use auto-detect',
    'retranscribe.modelHint': 'Choose a transcription model',
    'retranscribe.start': 'Start Retranscription',
    'retranscribe.completeToast': 'Retranscription complete!',
    'retranscribe.segmentsCreated': 'segments created.',
    'retranscribe.cancelledToast': 'Retranscription cancelled',
    'retranscribe.folderMissing': 'Meeting folder path not available',
  },
  'zh-CN': {
    'common.back': '返回',
    'common.done': '完成',
    'common.unknownError': '未知错误',
    'common.retry': '重试',
    'common.tipLabel': '提示：',
    'common.loadingPreferences': '正在加载偏好设置...',
    'settings.title': '设置',
    'settings.tabs.general': '通用',
    'settings.tabs.recording': '录音',
    'settings.tabs.transcription': '转写',
    'settings.tabs.summary': '摘要',
    'settings.tabs.beta': 'Beta',
    'preferences.interfaceLanguage.title': '界面语言',
    'preferences.interfaceLanguage.description': '选择会声记界面显示语言。',
    'preferences.interfaceLanguage.english': '英语',
    'preferences.interfaceLanguage.simplifiedChinese': '简体中文',
    'preferences.notifications.title': '通知',
    'preferences.notifications.description': '启用或禁用会议开始和结束通知',
    'preferences.storage.title': '数据存储位置',
    'preferences.storage.description': '查看并打开会声记存储数据的位置',
    'preferences.storage.meetingRecordings': '会议录音',
    'preferences.storage.openFolder': '打开文件夹',
    'preferences.storage.noteLabel': '注意：',
    'preferences.storage.note': '数据库和模型统一存储在应用数据目录中，便于集中管理。',
    'recording.title': '录音设置',
    'recording.notificationStarted': '录音已开始',
    'recording.notificationStartedDescription': '请告知所有参会者本次会议正在录音。',
    'recording.notificationDontShowAgain': '不再显示',
    'recording.notificationAcknowledged': '我已告知参会者',
    'recording.description': '配置会议期间音频录制的保存方式。',
    'recording.saveAudio.title': '保存录音文件',
    'recording.saveAudio.description': '录音停止后自动保存音频文件',
    'recording.saveLocation': '保存位置',
    'recording.defaultFolder': '默认文件夹',
    'recording.fileFormat': '文件格式：',
    'recording.timestampNote': '录音会按以下时间戳格式保存：',
    'recording.disabledNote': '录音保存已关闭。启用“保存录音文件”后会自动保存会议音频。',
    'recording.notification.title': '录音开始通知',
    'recording.notification.description': '录音开始时显示提醒，用于告知参会者',
    'recording.defaultDevices.title': '默认音频设备',
    'recording.defaultDevices.description': '设置录音首选的麦克风和系统音频设备。开始新录音时会自动选中这些设备。',
    'recording.preferenceSaved': '偏好设置已保存',
    'recording.preferenceSaveFailed': '偏好设置保存失败',
    'devices.title': '音频设备',
    'devices.microphone': '麦克风',
    'devices.systemAudio': '系统音频',
    'devices.selectMicrophone': '选择麦克风',
    'devices.selectSystemAudio': '选择系统音频',
    'devices.defaultMicrophone': '默认麦克风',
    'devices.defaultSystemAudio': '默认系统音频',
    'devices.noMicrophones': '未找到麦克风设备',
    'devices.noSystemAudio': '未找到系统音频设备',
    'devices.microphoneLevels': '麦克风音量：',
    'devices.microphoneInfo': '录制你的声音和环境声',
    'devices.systemAudioInfo': '录制电脑音频（音乐、通话等）',
    'devices.micLevelsInfo': '绿色 = 良好，黄色 = 偏大，红色 = 过大',
    'devices.tip': '点击“测试麦克风”检查麦克风是否正常工作',
    'devices.selected': '已选择设备',
    'devices.selectedDescription': '麦克风：{mic}，系统音频：{system}',
    'devices.preferencesSaved': '设备偏好已保存',
    'devices.preferencesSaveFailed': '保存设备偏好失败',
    'setup.completeFirst': '请先完成设置',
    'setup.completeFirstDescription': '完成初始引导后才能开始录音。',
    'audioBackend.title': '系统音频后端',
    'audioBackend.tooltipTitle': '音频捕获方式：',
    'audioBackend.tooltipDescription': '尝试不同后端，找到最适合当前系统的方式。',
    'audioBackend.active': '已启用',
    'audioBackend.disabled': '已禁用',
    'audioBackend.systemOnly': '后端选择只影响系统音频捕获',
    'audioBackend.microphoneDefault': '麦克风始终使用默认方式',
    'audioBackend.newSessions': '更改会在新的录音会话中生效',
    'transcript.model': '转写模型',
    'transcript.selectProvider': '选择提供方',
    'transcript.selectModel': '选择模型',
    'transcript.advancedModels': '高级模型',
    'transcript.usingModelPrefix': '正在使用',
    'transcript.usingModelSuffix': '进行转写',
    'transcript.switchedToModel': '已切换到',
    'transcript.parakeetOption': 'Parakeet（推荐 - 实时 / 准确）',
    'transcript.localWhisperOption': '本地 Whisper（高准确率）',
    'transcript.apiKey': 'API Key',
    'transcript.enterApiKey': '输入你的 API key',
    'transcript.unlockToEdit': '解锁以编辑',
    'transcript.lockToPreventEditing': '锁定以防误改',
    'summary.autoTitle': '自动摘要',
    'summary.autoDescription': '会议完成（停止录音）后自动生成摘要',
    'summary.modelTitle': '摘要模型配置',
    'summary.modelDescription': '配置用于生成会议摘要的 AI 模型。',
    'model.settingsTitle': '模型设置',
    'model.summarizationModel': '摘要模型',
    'model.selectProvider': '选择提供方',
    'model.selectModel': '选择模型...',
    'model.searchModels': '搜索模型...',
    'model.loadingModels': '正在加载模型...',
    'model.noModelsFound': '未找到模型。',
    'model.builtinAiOption': '内置 AI（离线，无需 API）',
    'model.customEndpoint': '自定义端点（可选）',
    'model.customEndpointDescription': '留空或输入自定义端点（例如：http://x.yy.zz:11434）',
    'model.fetchModels': '获取模型',
    'model.fetching': '正在获取...',
    'model.availableOllamaModels': '可用 Ollama 模型',
    'model.using': '使用：',
    'model.builtinModels': '内置 AI 模型',
    'model.noBuiltinModels': '未找到模型。下载一个模型即可开始使用内置 AI。',
    'model.ready': '就绪',
    'model.selected': '已选择',
    'model.corrupted': '已损坏',
    'model.error': '错误',
    'model.notDownloaded': '未下载',
    'model.download': '下载',
    'model.cancel': '取消',
    'model.retry': '重试',
    'model.delete': '删除',
    'model.deleteModel': '删除模型',
    'model.downloading': '正在下载...',
    'model.corruptedDescription': '文件已损坏。请重试下载或删除。',
    'model.genericError': '发生错误',
    'model.failedToLoad': '加载模型失败',
    'model.downloaded': '模型下载成功',
    'model.downloadedDescription': '模型已准备好，可以使用',
    'model.downloadFailed': '下载失败',
    'model.downloadCancelled': '下载已取消',
    'model.downloadingModel': '正在下载',
    'model.downloadMayTake': '这可能需要几分钟',
    'model.failedCancelDownload': '取消下载失败',
    'model.switchedTo': '已切换到',
    'model.deleted': '模型已删除',
    'model.deletedDescription': '模型已移除以释放空间',
    'model.failedDelete': '删除失败',
    'model.readyTitle': '已就绪！',
    'model.readyDescription': '模型已下载并准备好使用',
    'model.readyClosing': '模型已就绪，正在关闭窗口...',
    'onboarding.downloadRetryFailed': '重试下载失败',
    'onboarding.summaryDownloadRetryFailed': '摘要模型重试下载失败',
    'onboarding.checkConnectionRetry': '请检查网络连接后重试。',
    'onboarding.transcriptionRequired': '需要转写引擎',
    'onboarding.retryBeforeContinuing': '继续前请重试下载。',
    'onboarding.downloadsContinue': '下载将在后台继续',
    'onboarding.downloadsContinueDescription': '你可以开始使用应用。语音识别准备好后即可录音。',
    'onboarding.completeFailed': '完成设置失败',
    'onboarding.tryAgain': '请重试。',
    'database.importedReloading': '数据库导入成功！正在重新加载...',
    'database.importFailed': '导入失败',
    'database.initializedStarting': '数据库初始化成功！正在启动应用...',
    'database.initializationFailed': '初始化失败',
    'model.invalidOllamaEndpoint': 'Ollama 端点 URL 无效，必须以 http:// 或 https:// 开头',
    'model.failedLoadOllama': '加载 Ollama 模型失败',
    'model.failedLoadOpenRouter': '加载 OpenRouter 模型失败',
    'model.customOpenAISaveFailed': '保存自定义 OpenAI 配置失败',
    'model.enterEndpointModel': '请先输入端点 URL 和模型名称',
    'model.connectionSuccess': '连接成功！',
    'model.alreadyDownloading': '已在下载中',
    'model.progress': '进度',
    'beta.title': 'Beta 功能',
    'beta.description': '这些功能仍在测试中。你可能会遇到问题，欢迎反馈。',
    'beta.importTitle': '导入音频并重新转写',
    'beta.importDescription': '导入音频文件，或使用不同语言设置重新转写已有会议。',
    'beta.note': '禁用后，Beta 功能会被隐藏。已有会议不会受影响。',
    'sidebar.importAudio': '导入音频',
    'sidebar.meetingNotes': '会议笔记',
    'sidebar.settings': '设置',
    'sidebar.recordingInProgress': '正在录音...',
    'sidebar.startRecording': '开始录音',
    'about.title': '关于会声记',
    'about.menuLabel': '关于',
    'about.tagline': 'Local AI Meeting Notes',
    'about.checking': '正在检查...',
    'about.checkForUpdates': '检查更新',
    'about.latestVersion': '当前已是最新版本',
    'about.updateCheckFailed': '检查更新失败：',
    'about.updateAvailable': '发现更新：',
    'about.differentTitle': '会声记的不同之处',
    'about.privacyFirstTitle': '隐私优先',
    'about.privacyFirstDescription': '你的数据和 AI 处理流程可以保留在本地环境中。无需云端，避免泄露。',
    'about.anyModelTitle': '支持任意模型',
    'about.anyModelDescription': '偏好本地开源模型？可以。想接入外部 API？也可以。没有绑定。',
    'about.costSmartTitle': '成本友好',
    'about.costSmartDescription': '通过本地运行模型避免按分钟计费，也可以只为你选择的调用付费。',
    'about.worksEverywhereTitle': '适用于各类会议',
    'about.worksEverywhereDescription': 'Google Meet、Zoom、Teams，在线或离线均可使用。',
    'about.comingSoonLabel': '即将推出：',
    'about.comingSoonDescription': '本地 AI Agent 库，用于自动处理跟进、行动项追踪等任务。',
    'about.ctaTitle': '准备进一步推进你的业务？',
    'about.ctaDescription': '如果你计划构建隐私优先的定制 AI Agent，或为业务打造完全定制的产品，我们可以帮助你实现。',
    'about.ctaButton': '联系 Zackriya 团队',
    'about.footer': '由 Zackriya Solutions 构建',
    'analytics.title': '使用分析',
    'analytics.description': '分享匿名使用数据，帮助我们改进会声记。不会收集个人内容，所有内容都保留在你的设备上。',
    'analytics.enableTitle': '启用分析',
    'analytics.updating': '正在更新...',
    'analytics.anonymousPatterns': '仅匿名使用模式',
    'analytics.userIdTitle': '你的用户 ID',
    'analytics.userIdDescription': '报告问题时分享此 ID，可帮助我们排查相关日志',
    'analytics.copyUserId': '复制用户 ID',
    'analytics.copied': '已复制！',
    'analytics.copy': '复制',
    'analytics.localPrivacy': '你的会议、转写和录音都会保持完全私密并存储在本地。',
    'analytics.privacyPolicy': '查看隐私政策',
    'analyticsModal.title': '我们会收集什么',
    'analyticsModal.privacyTitle': '你的隐私受到保护',
    'analyticsModal.privacyDescription': '我们只收集匿名使用数据。不会收集会议内容、姓名或任何个人信息。',
    'analyticsModal.collectTitle': '我们收集的数据：',
    'analyticsModal.modelPreferencesTitle': '1. 模型偏好',
    'analyticsModal.modelPreferencesItem1': '转写模型（例如：“Whisper large-v3”、“Parakeet”）',
    'analyticsModal.modelPreferencesItem2': '摘要模型（例如：“Llama 3.2”、“Claude Sonnet”）',
    'analyticsModal.modelPreferencesItem3': '模型提供方（例如：“Local”、“Ollama”、“OpenRouter”）',
    'analyticsModal.modelPreferencesHelp': '帮助我们了解用户偏好的模型',
    'analyticsModal.meetingMetricsTitle': '2. 匿名会议指标',
    'analyticsModal.meetingMetricsItem1': '录音时长（例如：“125 秒”）',
    'analyticsModal.meetingMetricsItem2': '暂停时长（例如：“5 秒”）',
    'analyticsModal.meetingMetricsItem3': '转写片段数量',
    'analyticsModal.meetingMetricsItem4': '已处理音频块数量',
    'analyticsModal.meetingMetricsHelp': '帮助我们优化性能并了解使用模式',
    'analyticsModal.deviceTypesTitle': '3. 设备类型（不是设备名称）',
    'analyticsModal.deviceTypesItem1': '麦克风类型：“Bluetooth”、“Wired” 或 “Unknown”',
    'analyticsModal.deviceTypesItem2': '系统音频类型：“Bluetooth”、“Wired” 或 “Unknown”',
    'analyticsModal.deviceTypesHelp': '帮助我们提升兼容性，不会收集实际设备名称',
    'analyticsModal.usagePatternsTitle': '4. 应用使用模式',
    'analyticsModal.usagePatternsItem1': '应用启动/停止事件',
    'analyticsModal.usagePatternsItem2': '会话时长',
    'analyticsModal.usagePatternsItem3': '功能使用情况（例如：“settings changed”）',
    'analyticsModal.usagePatternsItem4': '错误发生情况（帮助我们修复问题）',
    'analyticsModal.usagePatternsHelp': '帮助我们改进用户体验',
    'analyticsModal.platformInfoTitle': '5. 平台信息',
    'analyticsModal.platformInfoItem1': '操作系统（例如：“macOS”、“Windows”）',
    'analyticsModal.platformInfoItem2': '应用版本（自动包含在所有事件中）',
    'analyticsModal.platformInfoItem3': '系统架构（例如：“x86_64”、“aarch64”）',
    'analyticsModal.platformInfoHelp': '帮助我们确定平台支持优先级',
    'analyticsModal.doNotCollectTitle': '我们不会收集：',
    'analyticsModal.doNotCollectItem1': '会议名称或标题',
    'analyticsModal.doNotCollectItem2': '会议转写或内容',
    'analyticsModal.doNotCollectItem3': '音频录音',
    'analyticsModal.doNotCollectItem4': '设备名称（只记录 Bluetooth/Wired 类型）',
    'analyticsModal.doNotCollectItem5': '个人信息',
    'analyticsModal.doNotCollectItem6': '任何可识别身份的数据',
    'analyticsModal.exampleEvent': '示例事件：',
    'analyticsModal.keepEnabled': '保持启用分析',
    'analyticsModal.confirmDisable': '确认：禁用分析',
    'update.downloadingTitle': '正在下载更新',
    'update.errorTitle': '更新错误',
    'update.availableTitle': '发现可用更新',
    'update.downloadingDescription': '正在下载最新版本...',
    'update.errorDescription': '更新过程中发生错误',
    'update.newVersionDescription': '发现新版本',
    'update.currentVersion': '当前版本：',
    'update.newVersion': '新版本：',
    'update.releaseDate': '发布日期：',
    'update.complete': '完成',
    'update.restartAfterInstall': '安装完成后应用会自动重启',
    'update.later': '稍后',
    'update.downloadAndInstall': '下载并安装',
    'update.close': '关闭',
    'update.installedRestarting': '更新安装成功。应用即将重启...',
    'update.notificationTitle': '发现可用更新',
    'update.notificationDescription': '版本 {version} 现已可用',
    'update.viewDetails': '查看详情',
    'importAudio.title': '导入音频文件',
    'importAudio.importingTitle': '正在导入音频...',
    'importAudio.failedTitle': '导入失败',
    'importAudio.completeTitle': '导入完成',
    'importAudio.processing': '正在处理音频...',
    'importAudio.errorDescription': '导入过程中发生错误',
    'importAudio.description': '导入音频文件，创建带转写内容的新会议',
    'importAudio.completeToast': '导入完成！',
    'importAudio.segmentsCreated': '个片段已创建。',
    'importAudio.failedToast': '导入失败',
    'importAudio.cancelledToast': '导入已取消',
    'importAudio.meetingTitle': '会议标题',
    'importAudio.meetingTitlePlaceholder': '输入会议标题',
    'importAudio.chooseDifferentFile': '选择其他文件',
    'importAudio.validating': '正在验证...',
    'importAudio.selectFile': '选择音频文件',
    'importAudio.advancedOptions': '高级选项',
    'importAudio.language': '语言',
    'importAudio.selectLanguage': '选择语言',
    'importAudio.parakeetLanguageUnsupported': 'Parakeet 不支持手动选择语言，它始终使用自动检测。',
    'importAudio.model': '模型',
    'importAudio.cancel': '取消',
    'importAudio.import': '导入',
    'importAudio.close': '关闭',
    'importAudio.tryAgain': '重试',
    'importAudio.dropToImport': '拖放音频文件以导入',
    'importAudio.betaDisabled': 'Beta 功能已禁用',
    'importAudio.betaDisabledDescription': '请在“设置 > Beta”中启用“导入音频并重新转写”功能。',
    'importAudio.dropAudioFile': '请拖放音频文件',
    'importAudio.supportedFormats': '支持的格式：',
    'recordingControls.processing': '正在处理录音...',
    'recordingControls.start': '开始录音',
    'recordingControls.pause': '暂停录音',
    'recordingControls.resume': '继续录音',
    'recordingControls.stop': '停止录音',
    'recordingControls.pausing': '正在暂停...',
    'recordingControls.resuming': '正在继续...',
    'recordingControls.stopping': '正在停止...',
    'recordingControls.validatingSpeech': '正在验证语音识别...',
    'recordingControls.initFailed': '录音初始化失败。请查看控制台了解详情。',
    'recordingControls.pauseFailed': '暂停录音失败。请查看控制台了解详情。',
    'recordingControls.resumeFailed': '继续录音失败。请查看控制台了解详情。',
    'recordingControls.micUnavailableTitle': '麦克风不可用',
    'recordingControls.micUnavailableMessage': '无法访问麦克风。请检查：\n• 麦克风已连接\n• 应用已有麦克风权限\n• 没有其他应用正在占用麦克风',
    'recordingControls.systemAudioUnavailableTitle': '系统音频不可用',
    'recordingControls.systemAudioUnavailableMessage': '无法捕获系统音频。请检查：\n• 已安装虚拟音频设备（如 BlackHole）\n• 应用已有屏幕录制权限（macOS）\n• 系统音频配置正确',
    'recordingControls.permissionRequiredTitle': '需要权限',
    'recordingControls.permissionRequiredMessage': '需要录音权限。请：\n• 在系统设置中授予麦克风权限\n• 为系统音频授予屏幕录制权限（macOS）\n• 授权后重启应用',
    'recordingControls.recordingFailedTitle': '录音失败',
    'recordingControls.recordingFailedMessage': '无法开始录音。请检查音频设备设置后重试。',
    'recordingStatus.paused': '已暂停',
    'recordingStatus.recording': '录音中',
    'recordingStatus.finalizing': '正在完成转写...',
    'recordingStatus.saving': '正在保存转写...',
    'transcript.copy': '复制',
    'transcript.copyTitle': '复制转写',
    'transcript.language': '语言',
    'transcript.languageTitle': '语言',
    'transcript.languageSettings': '语言设置',
    'transcript.transcriptionLanguage': '转写语言',
    'transcript.autoDetectOriginal': '自动检测（原始语言）',
    'transcript.autoDetectTranslateEnglish': '自动检测（翻译为英文）',
    'transcript.languageSaved': '语言偏好已保存',
    'transcript.languageSavedDescription': '转写语言已设置为',
    'transcript.languageSaveFailed': '保存语言偏好失败',
    'transcript.parakeetSupportTitle': 'Parakeet 语言支持',
    'transcript.parakeetSupportDescription': 'Parakeet 当前仅支持自动语言检测，无法手动选择语言。如需指定具体语言，请使用 Whisper。',
    'transcript.currentLanguage': '当前：',
    'transcript.autoDetectWarningTitle': '自动检测可能产生不准确结果',
    'transcript.autoDetectWarningDescription': '为获得最佳准确率，请选择具体语言（例如英语、西班牙语等）。',
    'transcript.translationModeTitle': '翻译模式已启用',
    'transcript.translationModeDescription': '所有音频都会自动翻译为英文。适合需要英文输出的多语言会议。',
    'transcript.optimizedFor': '转写将针对以下语言优化：',
    'transcript.recordingPaused': '录音已暂停',
    'transcript.listening': '正在聆听语音...',
    'transcript.resumeHint': '点击继续以恢复录音',
    'transcript.speakHint': '开始说话后会显示实时转写',
    'transcript.welcome': '欢迎使用会声记！',
    'transcript.startHint': '开始录音后可查看实时转写',
    'permission.permissionsRequired': '需要权限',
    'permission.microphoneRequired': '需要麦克风权限',
    'permission.systemAudioRequired': '需要系统音频权限',
    'permission.openMicrophoneSettings': '打开麦克风设置',
    'permission.openScreenRecordingSettings': '打开屏幕录制设置',
    'permission.recheck': '重新检查',
    'permission.microphoneMissing': '会声记需要访问麦克风才能录制会议。未检测到麦克风设备。',
    'permission.pleaseCheck': '请检查：',
    'permission.microphoneCheckConnected': '麦克风已连接并开启',
    'permission.microphoneCheckPermission': '已在系统设置中授予麦克风权限',
    'permission.microphoneCheckExclusive': '没有其他应用独占使用麦克风',
    'permission.systemAudioMissingPartial': '系统音频捕获不可用。你仍可使用麦克风录音，但不会捕获电脑音频。',
    'permission.systemAudioMissingAlso': '系统音频捕获也不可用。',
    'permission.enableSystemAudioMac': '在 macOS 上启用系统音频：',
    'permission.installVirtualDevice': '安装虚拟音频设备（例如 BlackHole 2ch）',
    'permission.grantScreenRecording': '授予会声记屏幕录制权限',
    'permission.configureAudioRouting': '在“音频 MIDI 设置”中配置音频路由',
    'recordingStart.modelDownloadTitle': '模型正在下载',
    'recordingStart.modelDownloadDescription': '请等待转写模型下载完成后再录音。',
    'recordingStart.modelMissingTitle': '转写模型未就绪',
    'recordingStart.modelMissingDescription': '请先下载转写模型再录音。',
    'recordingStart.modelSetupRequired': '需要设置转写模型',
    'recordingStart.initializing': '正在初始化录音...',
    'recordingStart.failed': '开始录音失败',
    'recordingStop.savedTitle': '录音保存成功！',
    'recordingStop.savedDescription': '个转写片段已保存。',
    'recordingStop.viewMeeting': '查看会议',
    'recordingStop.newMeeting': '新会议',
    'recordingStop.waitingTranscription': '正在等待转写...',
    'recordingStop.flushingBuffer': '正在刷新转写缓冲区...',
    'recordingStop.savingDatabase': '正在保存会议到数据库...',
    'recordingStop.saveFailed': '保存会议失败',
    'recovery.success': '会议恢复成功！',
    'recovery.transcriptsAndAudio': '转写和音频已恢复',
    'recovery.transcriptsOnly': '转写已恢复（无可用音频）',
    'recovery.failed': '恢复会议失败',
    'recovery.unknownError': '发生未知错误',
    'meetingNotes.title': '会议笔记',
    'meetingNotes.home': '首页',
    'meetingNotes.newCall': '+ 新通话',
    'meetingNotes.searchPlaceholder': '搜索会议内容...',
    'meetingNotes.searching': '正在搜索...',
    'meetingNotes.match': '匹配：',
    'meetingNotes.editMeetingTitle': '编辑会议标题',
    'meetingNotes.meetingTitle': '会议标题',
    'meetingNotes.meetingTitlePlaceholder': '输入会议标题',
    'meetingNotes.deleteMeeting': '删除会议',
    'meetingNotes.deleteConfirm': '确定要删除此会议吗？此操作无法撤销。',
    'meetingNotes.confirmDelete': '确认删除',
    'meetingNotes.cancel': '取消',
    'meetingNotes.save': '保存',
    'meetingNotes.delete': '删除',
    'meetingNotes.titleEmpty': '会议标题不能为空',
    'meetingNotes.deleted': '会议已删除',
    'meetingNotes.deletedDescription': '会议及其数据已移除',
    'meetingNotes.titleUpdated': '会议标题已更新',
    'meetingNotes.deleteFailed': '删除会议失败',
    'meetingNotes.titleUpdateFailed': '更新会议标题失败',
    'meetingDetails.contextPlaceholder': '为 AI 摘要添加上下文，例如参会人员、会议概览、目标等...',
    'meetingDetails.noTranscriptAvailable': '暂无转写内容',
    'meetingDetails.copyTranscript': '复制转写',
    'meetingDetails.copy': '复制',
    'meetingDetails.openRecordingFolder': '打开录音文件夹',
    'meetingDetails.recording': '录音',
    'meetingDetails.enhance': '增强',
    'meetingDetails.enhanceTitle': '重新转写以增强已录制音频',
    'meetingDetails.generatingSummary': '正在生成 AI 摘要...',
    'meetingDetails.meetingSummary': '会议摘要',
    'meetingDetails.keyPoints': '关键点',
    'meetingDetails.actionItems': '行动项',
    'meetingDetails.decisions': '决策',
    'meetingDetails.mainTopics': '主要议题',
    'meetingDetails.fullSummary': '完整摘要',
    'meetingDetails.stopSummary': '停止生成摘要',
    'meetingDetails.stop': '停止',
    'meetingDetails.loadingModelConfig': '正在加载模型配置...',
    'meetingDetails.checkingModels': '正在检查模型...',
    'meetingDetails.generateAiSummary': '生成 AI 摘要',
    'meetingDetails.processing': '处理中...',
    'meetingDetails.generateSummary': '生成摘要',
    'meetingDetails.summarySettings': '摘要设置',
    'meetingDetails.aiModel': 'AI 模型',
    'meetingDetails.selectSummaryTemplate': '选择摘要模板',
    'meetingDetails.template': '模板',
    'meetingDetails.saveChanges': '保存更改',
    'meetingDetails.saving': '正在保存',
    'meetingDetails.copySummary': '复制摘要',
    'meetingDetails.noSummaryTitle': '尚未生成摘要',
    'meetingDetails.noSummaryDescription': '为会议转写生成 AI 摘要，提取关键点、行动项和决策。',
    'meetingDetails.selectModelFirst': '请先在设置中选择模型',
    'meetingDetails.processingTranscript': '正在处理转写...',
    'meetingDetails.summaryCompletedStatus': '摘要已完成',
    'meetingDetails.errorGeneratingStatus': '生成摘要时出错',
    'meetingDetails.noTranscriptText': '没有可用的转写文本。请先添加一些文本。',
    'meetingDetails.regeneratingSummary': '正在重新生成摘要...',
    'meetingDetails.generatingSummaryToast': '正在生成摘要...',
    'meetingDetails.usingModel': '使用',
    'meetingDetails.summaryRegenerationFailed': '重新生成摘要失败',
    'meetingDetails.summaryGenerationFailed': '生成摘要失败',
    'meetingDetails.previousSummaryRestored': '已恢复之前的摘要。',
    'meetingDetails.connectionRefused': '无法连接到 LLM 服务。请确认 Ollama 或已配置的 LLM 提供方正在运行。',
    'meetingDetails.summaryReady': '摘要生成成功！',
    'meetingDetails.summaryReadyDescription': '会议摘要已准备好',
    'meetingDetails.summaryEmpty': '摘要生成完成，但返回内容为空。',
    'meetingDetails.emptySummaryGenerated': '生成的摘要为空',
    'meetingDetails.fetchTranscriptsFailed': '获取用于生成摘要的转写失败',
    'meetingDetails.noTranscriptsForSummary': '没有可用于生成摘要的转写',
    'meetingDetails.noOllamaModels': '未找到 Ollama 模型。请在模型设置中下载 gemma3:1b。',
    'meetingDetails.ollamaNotInstalled': '未安装 Ollama',
    'meetingDetails.ollamaInstallDescription': '请下载并安装 Ollama 以使用本地模型。',
    'meetingDetails.download': '下载',
    'meetingDetails.ollamaCheckFailed': '检查 Ollama 模型失败。请确认 Ollama 正在运行，并在设置中下载模型。',
    'meetingDetails.noBuiltinModel': '未选择内置 AI 模型',
    'meetingDetails.modelNotFound': '未找到模型',
    'meetingDetails.modelInfoNotFound': '无法找到该模型的信息：',
    'meetingDetails.modelDownloadInProgress': '模型正在下载',
    'meetingDetails.modelDownloadWait': '正在下载。请等待下载完成。',
    'meetingDetails.modelNotDownloaded': '内置 AI 模型未下载',
    'meetingDetails.modelDownloadRequired': '需要先下载。请在模型设置中下载。',
    'meetingDetails.modelFileCorrupted': '模型文件已损坏',
    'meetingDetails.modelDeleteRedownload': '文件已损坏。请删除后重新下载。',
    'meetingDetails.modelError': '模型错误',
    'meetingDetails.modelGenericError': '模型发生错误',
    'meetingDetails.modelUnavailable': '内置 AI 模型不可用',
    'meetingDetails.modelCheckSettings': '请检查模型设置。',
    'meetingDetails.modelNotReady': '内置 AI 模型未就绪',
    'meetingDetails.modelEnsureDownloaded': '请确认模型已在设置中下载',
    'meetingDetails.modelValidationFailed': '验证内置 AI 模型失败',
    'meetingDetails.summaryStopped': '摘要生成已停止',
    'meetingDetails.summaryStoppedDescription': '你可以随时重新生成摘要',
    'meetingDetails.fetchTranscriptsCopyFailed': '获取用于复制的转写失败',
    'meetingDetails.noTranscriptsToCopy': '没有可复制的转写',
    'meetingDetails.transcriptCopied': '转写已复制到剪贴板',
    'meetingDetails.noSummaryToCopy': '没有可复制的摘要内容',
    'meetingDetails.summaryCopied': '摘要已复制到剪贴板',
    'meetingDetails.summaryCopyFailed': '复制摘要失败',
    'meetingDetails.templateSelected': '已选择模板',
    'meetingDetails.templateSelectedDescription': '将使用以下模板生成摘要：',
    'meetingDetails.modelSettingsSaved': '模型设置已保存',
    'meetingDetails.modelSettingsSaveFailed': '保存模型设置失败',
    'meetingDetails.summarySettingsSaved': '摘要设置已保存',
    'meetingDetails.summarySettingsSaveFailed': '保存摘要设置失败',
    'meetingDetails.changesSaved': '更改已保存',
    'meetingDetails.changesSaveFailed': '保存更改失败',
    'meetingDetails.openFolderFailed': '打开录音文件夹失败',
    'retranscribe.title': '重新转写会议',
    'retranscribe.processingTitle': '正在重新转写...',
    'retranscribe.failedTitle': '重新转写失败',
    'retranscribe.processingAudio': '正在处理音频...',
    'retranscribe.errorDescription': '重新转写过程中发生错误',
    'retranscribe.description': '使用不同语言设置重新处理音频',
    'retranscribe.languageHint': '选择具体语言可提高准确率，也可以使用自动检测',
    'retranscribe.modelHint': '选择转写模型',
    'retranscribe.start': '开始重新转写',
    'retranscribe.completeToast': '重新转写完成！',
    'retranscribe.segmentsCreated': '个片段已创建。',
    'retranscribe.cancelledToast': '重新转写已取消',
    'retranscribe.folderMissing': '会议文件夹路径不可用',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function readInitialLocale(): UiLocale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const savedLocale = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
  if (savedLocale === 'en' || savedLocale === 'zh-CN') {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function translateUi(key: TranslationKey) {
  const locale = readInitialLocale();
  return translations[locale][key] ?? translations.en[key];
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(readInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: UiLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[locale][key] ?? translations.en[key];
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
