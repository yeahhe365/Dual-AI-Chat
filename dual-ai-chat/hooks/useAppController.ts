
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ChatMessage, MessageSender, MessagePurpose, ApiKeyStatus } from '../types';
import { useAppUI } from './useAppUI';
import { useNotepadLogic } from './useNotepadLogic';
import { useSettings } from './useSettings';
import { useChatLogic } from './useChatLogic';
import { generateUniqueId, getWelcomeMessageText } from '../utils/appUtils';
import { CHAT_MESSAGES_STORAGE_KEY } from '../constants';

const DEFAULT_CHAT_PANEL_PERCENT = 60;

export const useAppController = (panelsContainerRef: React.RefObject<HTMLDivElement>) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
    return [];
  });
  
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({});
  
  // Persist messages to local storage
  useEffect(() => {
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Keep a ref for accessing messages in callbacks without dependency loops
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  // UI State Hook
  const ui = useAppUI(DEFAULT_CHAT_PANEL_PERCENT, panelsContainerRef);

  // Notepad Logic Hook
  const notepad = useNotepadLogic(); 

  // Settings Hook
  const settings = useSettings();

  const addMessage = useCallback((
    text: string,
    sender: MessageSender,
    purpose: MessagePurpose,
    durationMs?: number,
    image?: ChatMessage['image'],
    thoughts?: string
  ): string => {
    const messageId = generateUniqueId();
    setMessages(prev => [...prev, {
      id: messageId,
      text,
      sender,
      purpose,
      timestamp: new Date(),
      durationMs,
      image,
      thoughts,
    }]);
    return messageId;
  }, []);

  const chat = useChatLogic({
    addMessage,
    processNotepadUpdateFromAI: notepad.processNotepadUpdateFromAI,
    setGlobalApiKeyStatus: setApiKeyStatus,
    cognitoModelDetails: settings.actualCognitoModelDetails,
    museModelDetails: settings.actualMuseModelDetails,
    // Gemini Custom Config
    useCustomApiConfig: settings.useCustomApiConfig,
    customApiKey: settings.customApiKey,
    customApiEndpoint: settings.customApiEndpoint,
    // OpenAI Custom Config
    useOpenAiApiConfig: settings.useOpenAiApiConfig,
    openAiApiKey: settings.openAiApiKey,
    openAiApiBaseUrl: settings.openAiApiBaseUrl,
    openAiCognitoModelId: settings.openAiCognitoModelId,
    openAiMuseModelId: settings.openAiMuseModelId,
    // Shared Settings
    discussionMode: settings.discussionMode,
    manualFixedTurns: settings.manualFixedTurns,
    
    // Thinking Config
    cognitoThinkingBudget: settings.cognitoThinkingBudget,
    cognitoThinkingLevel: settings.cognitoThinkingLevel,
    museThinkingBudget: settings.museThinkingBudget,
    museThinkingLevel: settings.museThinkingLevel,
    
    cognitoSystemPrompt: settings.cognitoSystemPrompt,
    museSystemPrompt: settings.museSystemPrompt,
    notepadContent: notepad.notepadContent,
    startProcessingTimer: ui.startProcessingTimer,
    stopProcessingTimer: ui.stopProcessingTimer,
    currentQueryStartTimeRef: ui.currentQueryStartTimeRef,
  });

  const initializeChat = useCallback((shouldClear = true) => {
    if (shouldClear) {
      setMessages([]);
      notepad.clearNotepadContent();
    }
    ui.setIsNotepadFullscreen(false);
    setApiKeyStatus({});

    let missingKeyMsg = "";
    if (settings.useOpenAiApiConfig) {
      if (!settings.openAiApiBaseUrl.trim() || !settings.openAiCognitoModelId.trim() || !settings.openAiMuseModelId.trim()) {
        missingKeyMsg = "OpenAI API 配置不完整 (需要基地址和Cognito/Muse的模型ID)。请在设置中提供，或关闭“使用OpenAI API配置”。";
      }
    } else if (settings.useCustomApiConfig) {
      if (!settings.customApiKey.trim()) {
        missingKeyMsg = "自定义 Gemini API 密钥未在设置中提供。请在设置中输入密钥，或关闭“使用自定义API配置”。";
      }
    } else {
      if (!(process.env.API_KEY && process.env.API_KEY.trim() !== "")) {
        missingKeyMsg = "Google Gemini API 密钥未在环境变量中配置。请配置该密钥，或在设置中启用并提供自定义API配置。";
      }
    }

    if (missingKeyMsg) {
      const fullWarning = `严重警告：${missingKeyMsg} 在此之前，应用程序功能将受限。`;
      addMessage(fullWarning, MessageSender.System, MessagePurpose.SystemNotification);
      setApiKeyStatus({ isMissing: true, message: missingKeyMsg });
    } else {
      const welcomeText = getWelcomeMessageText(
        settings.actualCognitoModelDetails.name,
        settings.actualMuseModelDetails.name,
        settings.discussionMode,
        settings.manualFixedTurns,
        settings.useOpenAiApiConfig,
        settings.openAiCognitoModelId,
        settings.openAiMuseModelId
      );
      
      // If we are clearing, we always add the welcome message.
      // If we are NOT clearing (restoring), we only add it if the chat is empty.
      if (shouldClear || messagesRef.current.length === 0) {
        addMessage(welcomeText, MessageSender.System, MessagePurpose.SystemNotification);
      }
    }
  }, [
    addMessage, notepad, ui, settings
  ]);

  // Initial setup and re-initialization on API config change
  // We pass false to initializeChat to attempt to keep history on reload/settings change
  useEffect(() => {
    initializeChat(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.useCustomApiConfig, settings.useOpenAiApiConfig]);

  // Update Welcome Message on settings change
  useEffect(() => {
    const welcomeMessage = messages.find(msg => msg.sender === MessageSender.System && msg.text.startsWith("Dual AI Chat 已就绪"));
    if (welcomeMessage && !apiKeyStatus.isMissing && !apiKeyStatus.isInvalid) {
      setMessages(msgs => msgs.map(msg =>
        msg.id === welcomeMessage.id
          ? {
            ...msg, text: getWelcomeMessageText(
              settings.actualCognitoModelDetails.name,
              settings.actualMuseModelDetails.name,
              settings.discussionMode,
              settings.manualFixedTurns,
              settings.useOpenAiApiConfig,
              settings.openAiCognitoModelId,
              settings.openAiMuseModelId
            )
          }
          : msg
      ));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.actualCognitoModelDetails.name, settings.actualMuseModelDetails.name, apiKeyStatus.isMissing, apiKeyStatus.isInvalid, settings.discussionMode, settings.manualFixedTurns, settings.useOpenAiApiConfig, settings.openAiCognitoModelId, settings.openAiMuseModelId]);

  // Timer Update
  useEffect(() => {
    let intervalId: number | undefined;
    if (chat.isLoading && ui.currentQueryStartTimeRef.current) {
      intervalId = window.setInterval(() => {
        if (ui.currentQueryStartTimeRef.current && !chat.cancelRequestRef.current) {
          ui.updateProcessingTimer();
        }
      }, 100);
    } else {
      if (intervalId) clearInterval(intervalId);
      if (!chat.isLoading && ui.currentQueryStartTimeRef.current !== null) {
        ui.updateProcessingTimer();
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [chat.isLoading, ui.updateProcessingTimer, ui.currentQueryStartTimeRef, chat.cancelRequestRef]);

  // Global Keyboard Events
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && ui.isNotepadFullscreen) {
        ui.toggleNotepadFullscreen();
      }
      if (event.key === 'Escape' && ui.isSettingsModalOpen) {
        ui.closeSettingsModal();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [ui.isNotepadFullscreen, ui.toggleNotepadFullscreen, ui.isSettingsModalOpen, ui.closeSettingsModal]);

  const handleClearChat = useCallback(() => {
    if (chat.isLoading) {
      chat.stopGenerating();
    }
    // Explicitly pass true to clear data when user clicks clear
    initializeChat(true);
  }, [chat, initializeChat]);

  const apiKeyBannerMessage = useMemo(() => {
    if (!apiKeyStatus.message) return null;
    if (settings.useOpenAiApiConfig) {
      if (apiKeyStatus.isMissing) return "OpenAI API 配置不完整 (需基地址和Cognito/Muse模型ID)。请在设置中提供，或关闭 OpenAI API 配置。";
      if (apiKeyStatus.isInvalid) return "提供的 OpenAI API 密钥无效或无法访问服务。请检查设置和网络。";
    } else if (settings.useCustomApiConfig) {
      if (apiKeyStatus.isMissing) return "自定义 Gemini API 密钥缺失。请在设置中提供，或关闭自定义 Gemini API 配置。";
      if (apiKeyStatus.isInvalid) return "提供的自定义 Gemini API 密钥无效或权限不足。请检查设置中的密钥。";
    } else {
      if (apiKeyStatus.isMissing) return "环境变量中的 Google Gemini API 密钥缺失。请配置，或启用自定义 API 配置。";
      if (apiKeyStatus.isInvalid) return "环境变量中的 Google Gemini API 密钥无效或权限不足。请检查该密钥。";
    }
    return apiKeyStatus.message;
  }, [apiKeyStatus, settings.useCustomApiConfig, settings.useOpenAiApiConfig]);

  return {
    messages,
    apiKeyStatus,
    apiKeyBannerMessage,
    ui,
    notepad,
    settings,
    chat,
    actions: {
      initializeChat,
      handleClearChat,
      addMessage,
    }
  };
};