
import React from 'react';
import SettingsModal from './SettingsModal';
import { useSettings } from '../hooks/useSettings';
import { MIN_MANUAL_FIXED_TURNS, DEFAULT_MANUAL_FIXED_TURNS, COGNITO_SYSTEM_PROMPT_HEADER, MUSE_SYSTEM_PROMPT_HEADER } from '../constants';

type SettingsType = ReturnType<typeof useSettings>;

interface AppSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  settings: SettingsType;
}

const AppSettingsDialog: React.FC<AppSettingsDialogProps> = ({
  isOpen,
  onClose,
  isLoading,
  settings,
}) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}

      // Discussion Mode
      discussionMode={settings.discussionMode}
      onDiscussionModeChange={settings.setDiscussionMode}
      manualFixedTurns={settings.manualFixedTurns}
      onManualFixedTurnsChange={(e) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) value = DEFAULT_MANUAL_FIXED_TURNS;
        value = Math.max(MIN_MANUAL_FIXED_TURNS, value);
        settings.setManualFixedTurns(value);
      }}
      minManualFixedTurns={MIN_MANUAL_FIXED_TURNS}
      
      // Thinking
      cognitoThinkingBudget={settings.cognitoThinkingBudget}
      setCognitoThinkingBudget={settings.setCognitoThinkingBudget}
      cognitoThinkingLevel={settings.cognitoThinkingLevel}
      setCognitoThinkingLevel={settings.setCognitoThinkingLevel}
      
      museThinkingBudget={settings.museThinkingBudget}
      setMuseThinkingBudget={settings.setMuseThinkingBudget}
      museThinkingLevel={settings.museThinkingLevel}
      setMuseThinkingLevel={settings.setMuseThinkingLevel}

      supportsThinkingConfig={settings.actualCognitoModelDetails.supportsThinkingConfig || settings.actualMuseModelDetails.supportsThinkingConfig}
      currentCognitoModelApiName={settings.selectedCognitoModelApiName}
      currentMuseModelApiName={settings.selectedMuseModelApiName}
      
      // Prompts
      cognitoSystemPrompt={settings.cognitoSystemPrompt}
      onCognitoPromptChange={(e) => settings.setCognitoSystemPrompt(e.target.value)}
      onResetCognitoPrompt={() => settings.setCognitoSystemPrompt(COGNITO_SYSTEM_PROMPT_HEADER)}
      museSystemPrompt={settings.museSystemPrompt}
      onMusePromptChange={(e) => settings.setMuseSystemPrompt(e.target.value)}
      onResetMusePrompt={() => settings.setMuseSystemPrompt(MUSE_SYSTEM_PROMPT_HEADER)}
      supportsSystemInstruction={settings.actualCognitoModelDetails.supportsSystemInstruction || settings.actualMuseModelDetails.supportsSystemInstruction}
      
      // Appearance
      fontSizeScale={settings.fontSizeScale}
      onFontSizeScaleChange={settings.setFontSizeScale}
      
      // Gemini Custom API Props
      useCustomApiConfig={settings.useCustomApiConfig}
      onUseCustomApiConfigChange={settings.handleUseCustomGeminiApiConfigChange}
      customApiEndpoint={settings.customApiEndpoint}
      onCustomApiEndpointChange={(e) => settings.setCustomApiEndpoint(e.target.value)}
      customApiKey={settings.customApiKey}
      onCustomApiKeyChange={(e) => settings.setCustomApiKey(e.target.value)}
      
      // OpenAI Custom API Props
      useOpenAiApiConfig={settings.useOpenAiApiConfig}
      onUseOpenAiApiConfigChange={settings.handleUseOpenAiApiConfigChange}
      openAiApiBaseUrl={settings.openAiApiBaseUrl}
      onOpenAiApiBaseUrlChange={(e) => settings.setOpenAiApiBaseUrl(e.target.value)}
      openAiApiKey={settings.openAiApiKey}
      onOpenAiApiKeyChange={(e) => settings.setOpenAiApiKey(e.target.value)}
      openAiCognitoModelId={settings.openAiCognitoModelId}
      onOpenAiCognitoModelIdChange={(e) => settings.setOpenAiCognitoModelId(e.target.value)}
      openAiMuseModelId={settings.openAiMuseModelId}
      onOpenAiMuseModelIdChange={(e) => settings.setOpenAiMuseModelId(e.target.value)}

      // Model Selectors
      onCognitoModelChange={settings.setSelectedCognitoModelApiName}
      onMuseModelChange={settings.setSelectedMuseModelApiName}
    />
  );
};

export default AppSettingsDialog;
