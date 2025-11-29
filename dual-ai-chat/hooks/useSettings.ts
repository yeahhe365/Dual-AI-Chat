
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MODELS,
  AiModel,
  DEFAULT_COGNITO_MODEL_API_NAME,
  DEFAULT_MUSE_MODEL_API_NAME,
  COGNITO_SYSTEM_PROMPT_HEADER,
  MUSE_SYSTEM_PROMPT_HEADER,
  DEFAULT_MANUAL_FIXED_TURNS,
  CUSTOM_API_ENDPOINT_STORAGE_KEY,
  CUSTOM_API_KEY_STORAGE_KEY,
  USE_CUSTOM_API_CONFIG_STORAGE_KEY,
  USE_OPENAI_API_CONFIG_STORAGE_KEY,
  OPENAI_API_BASE_URL_STORAGE_KEY,
  OPENAI_API_KEY_STORAGE_KEY,
  OPENAI_COGNITO_MODEL_ID_STORAGE_KEY,
  OPENAI_MUSE_MODEL_ID_STORAGE_KEY,
  DEFAULT_OPENAI_API_BASE_URL,
  DEFAULT_OPENAI_COGNITO_MODEL_ID,
  DEFAULT_OPENAI_MUSE_MODEL_ID,
  THINKING_BUDGET_STORAGE_KEY,
  THINKING_LEVEL_STORAGE_KEY,
  COGNITO_THINKING_BUDGET_STORAGE_KEY,
  COGNITO_THINKING_LEVEL_STORAGE_KEY,
  MUSE_THINKING_BUDGET_STORAGE_KEY,
  MUSE_THINKING_LEVEL_STORAGE_KEY,
  DEFAULT_THINKING_BUDGET,
  DEFAULT_THINKING_LEVEL,
} from '../constants';
import { DiscussionMode } from '../types';

const FONT_SIZE_STORAGE_KEY = 'dualAiChatFontSizeScale';
const DEFAULT_FONT_SIZE_SCALE = 0.875;
const DEFAULT_GEMINI_CUSTOM_API_ENDPOINT = 'https://generativelanguage.googleapis.com';

export const useSettings = () => {
  // Gemini Custom API Config State
  const [useCustomApiConfig, setUseCustomApiConfig] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(USE_CUSTOM_API_CONFIG_STORAGE_KEY);
    return storedValue ? storedValue === 'true' : false;
  });
  const [customApiEndpoint, setCustomApiEndpoint] = useState<string>(() => localStorage.getItem(CUSTOM_API_ENDPOINT_STORAGE_KEY) || DEFAULT_GEMINI_CUSTOM_API_ENDPOINT);
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem(CUSTOM_API_KEY_STORAGE_KEY) || '');

  // OpenAI-Compatible API Config State
  const [useOpenAiApiConfig, setUseOpenAiApiConfig] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(USE_OPENAI_API_CONFIG_STORAGE_KEY);
    // If Gemini custom config was already enabled from old storage, default OpenAI to false.
    if (useCustomApiConfig && storedValue === null) return false;
    return storedValue ? storedValue === 'true' : false;
  });
  const [openAiApiBaseUrl, setOpenAiApiBaseUrl] = useState<string>(() => localStorage.getItem(OPENAI_API_BASE_URL_STORAGE_KEY) || DEFAULT_OPENAI_API_BASE_URL);
  const [openAiApiKey, setOpenAiApiKey] = useState<string>(() => localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '');
  const [openAiCognitoModelId, setOpenAiCognitoModelId] = useState<string>(() => localStorage.getItem(OPENAI_COGNITO_MODEL_ID_STORAGE_KEY) || DEFAULT_OPENAI_COGNITO_MODEL_ID);
  const [openAiMuseModelId, setOpenAiMuseModelId] = useState<string>(() => localStorage.getItem(OPENAI_MUSE_MODEL_ID_STORAGE_KEY) || DEFAULT_OPENAI_MUSE_MODEL_ID);

  // General Settings
  const [selectedCognitoModelApiName, setSelectedCognitoModelApiName] = useState<string>(DEFAULT_COGNITO_MODEL_API_NAME);
  const [selectedMuseModelApiName, setSelectedMuseModelApiName] = useState<string>(DEFAULT_MUSE_MODEL_API_NAME);
  const [discussionMode, setDiscussionMode] = useState<DiscussionMode>(DiscussionMode.AiDriven);
  const [manualFixedTurns, setManualFixedTurns] = useState<number>(DEFAULT_MANUAL_FIXED_TURNS);
  const [cognitoSystemPrompt, setCognitoSystemPrompt] = useState<string>(COGNITO_SYSTEM_PROMPT_HEADER);
  const [museSystemPrompt, setMuseSystemPrompt] = useState<string>(MUSE_SYSTEM_PROMPT_HEADER);
  const [fontSizeScale, setFontSizeScale] = useState<number>(() => {
    const storedScale = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return storedScale ? parseFloat(storedScale) : DEFAULT_FONT_SIZE_SCALE;
  });

  // Thinking Configuration - Separate for Cognito and Muse
  // Fallback to general keys if specific ones aren't found for migration
  const [cognitoThinkingBudget, setCognitoThinkingBudget] = useState<number>(() => {
    const stored = localStorage.getItem(COGNITO_THINKING_BUDGET_STORAGE_KEY);
    if (stored) return parseInt(stored, 10);
    const legacy = localStorage.getItem(THINKING_BUDGET_STORAGE_KEY);
    return legacy ? parseInt(legacy, 10) : DEFAULT_THINKING_BUDGET;
  });
  
  const [cognitoThinkingLevel, setCognitoThinkingLevel] = useState<'LOW' | 'HIGH'>(() => {
    const stored = localStorage.getItem(COGNITO_THINKING_LEVEL_STORAGE_KEY);
    if (stored === 'LOW' || stored === 'HIGH') return stored;
    const legacy = localStorage.getItem(THINKING_LEVEL_STORAGE_KEY);
    return (legacy === 'LOW' || legacy === 'HIGH') ? legacy : DEFAULT_THINKING_LEVEL;
  });

  const [museThinkingBudget, setMuseThinkingBudget] = useState<number>(() => {
    const stored = localStorage.getItem(MUSE_THINKING_BUDGET_STORAGE_KEY);
    if (stored) return parseInt(stored, 10);
    const legacy = localStorage.getItem(THINKING_BUDGET_STORAGE_KEY);
    return legacy ? parseInt(legacy, 10) : DEFAULT_THINKING_BUDGET;
  });
  
  const [museThinkingLevel, setMuseThinkingLevel] = useState<'LOW' | 'HIGH'>(() => {
    const stored = localStorage.getItem(MUSE_THINKING_LEVEL_STORAGE_KEY);
    if (stored === 'LOW' || stored === 'HIGH') return stored;
    const legacy = localStorage.getItem(THINKING_LEVEL_STORAGE_KEY);
    return (legacy === 'LOW' || legacy === 'HIGH') ? legacy : DEFAULT_THINKING_LEVEL;
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem(USE_CUSTOM_API_CONFIG_STORAGE_KEY, useCustomApiConfig.toString()); }, [useCustomApiConfig]);
  useEffect(() => { localStorage.setItem(CUSTOM_API_ENDPOINT_STORAGE_KEY, customApiEndpoint); }, [customApiEndpoint]);
  useEffect(() => { localStorage.setItem(CUSTOM_API_KEY_STORAGE_KEY, customApiKey); }, [customApiKey]);

  useEffect(() => { localStorage.setItem(USE_OPENAI_API_CONFIG_STORAGE_KEY, useOpenAiApiConfig.toString()); }, [useOpenAiApiConfig]);
  useEffect(() => { localStorage.setItem(OPENAI_API_BASE_URL_STORAGE_KEY, openAiApiBaseUrl); }, [openAiApiBaseUrl]);
  useEffect(() => { localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openAiApiKey); }, [openAiApiKey]);
  useEffect(() => { localStorage.setItem(OPENAI_COGNITO_MODEL_ID_STORAGE_KEY, openAiCognitoModelId); }, [openAiCognitoModelId]);
  useEffect(() => { localStorage.setItem(OPENAI_MUSE_MODEL_ID_STORAGE_KEY, openAiMuseModelId); }, [openAiMuseModelId]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizeScale * 100}%`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSizeScale.toString());
  }, [fontSizeScale]);

  useEffect(() => { localStorage.setItem(COGNITO_THINKING_BUDGET_STORAGE_KEY, cognitoThinkingBudget.toString()); }, [cognitoThinkingBudget]);
  useEffect(() => { localStorage.setItem(COGNITO_THINKING_LEVEL_STORAGE_KEY, cognitoThinkingLevel); }, [cognitoThinkingLevel]);
  useEffect(() => { localStorage.setItem(MUSE_THINKING_BUDGET_STORAGE_KEY, museThinkingBudget.toString()); }, [museThinkingBudget]);
  useEffect(() => { localStorage.setItem(MUSE_THINKING_LEVEL_STORAGE_KEY, museThinkingLevel); }, [museThinkingLevel]);

  // Handlers
  const handleUseCustomGeminiApiConfigChange = useCallback(() => {
    const newValue = !useCustomApiConfig;
    setUseCustomApiConfig(newValue);
    if (newValue && useOpenAiApiConfig) {
      setUseOpenAiApiConfig(false);
    }
  }, [useCustomApiConfig, useOpenAiApiConfig]);

  const handleUseOpenAiApiConfigChange = useCallback(() => {
    const newValue = !useOpenAiApiConfig;
    setUseOpenAiApiConfig(newValue);
    if (newValue && useCustomApiConfig) {
      setUseCustomApiConfig(false);
    }
  }, [useOpenAiApiConfig, useCustomApiConfig]);

  // Derived State
  const actualCognitoModelDetails: AiModel = useMemo(() => {
    if (useOpenAiApiConfig) {
      return {
        id: 'openai-cognito',
        name: `OpenAI Cognito: ${openAiCognitoModelId || '未指定'}`,
        apiName: openAiCognitoModelId || DEFAULT_OPENAI_COGNITO_MODEL_ID,
        supportsThinkingConfig: false,
        supportsSystemInstruction: true,
      };
    }
    return MODELS.find(m => m.apiName === selectedCognitoModelApiName) || MODELS[0];
  }, [useOpenAiApiConfig, openAiCognitoModelId, selectedCognitoModelApiName]);

  const actualMuseModelDetails: AiModel = useMemo(() => {
    if (useOpenAiApiConfig) {
      return {
        id: 'openai-muse',
        name: `OpenAI Muse: ${openAiMuseModelId || '未指定'}`,
        apiName: openAiMuseModelId || DEFAULT_OPENAI_MUSE_MODEL_ID,
        supportsThinkingConfig: false,
        supportsSystemInstruction: true,
      };
    }
    return MODELS.find(m => m.apiName === selectedMuseModelApiName) || MODELS[0];
  }, [useOpenAiApiConfig, openAiMuseModelId, selectedMuseModelApiName]);

  return {
    // Gemini Custom
    useCustomApiConfig,
    customApiEndpoint, setCustomApiEndpoint,
    customApiKey, setCustomApiKey,
    handleUseCustomGeminiApiConfigChange,

    // OpenAI Custom
    useOpenAiApiConfig,
    openAiApiBaseUrl, setOpenAiApiBaseUrl,
    openAiApiKey, setOpenAiApiKey,
    openAiCognitoModelId, setOpenAiCognitoModelId,
    openAiMuseModelId, setOpenAiMuseModelId,
    handleUseOpenAiApiConfigChange,

    // Models & Discussion
    selectedCognitoModelApiName, setSelectedCognitoModelApiName,
    selectedMuseModelApiName, setSelectedMuseModelApiName,
    discussionMode, setDiscussionMode,
    manualFixedTurns, setManualFixedTurns,
    cognitoSystemPrompt, setCognitoSystemPrompt,
    museSystemPrompt, setMuseSystemPrompt,
    
    // Thinking Config
    cognitoThinkingBudget, setCognitoThinkingBudget,
    cognitoThinkingLevel, setCognitoThinkingLevel,
    museThinkingBudget, setMuseThinkingBudget,
    museThinkingLevel, setMuseThinkingLevel,
    
    // Appearance
    fontSizeScale, setFontSizeScale,

    // Derived
    actualCognitoModelDetails,
    actualMuseModelDetails,
  };
};