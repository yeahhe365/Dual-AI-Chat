

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MathJaxContext } from 'better-react-mathjax';

// MathJax 配置：支持 $...$ 与 \\(...\\) 行内公式
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
  },
};
import { ChatMessage, MessageSender, MessagePurpose, FailedStepPayload, DiscussionMode } from './types';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import Notepad from './components/Notepad';
import SettingsModal from './components/SettingsModal';
import {
  MODELS,
  DEFAULT_COGNITO_MODEL_API_NAME, 
  DEFAULT_MUSE_MODEL_API_NAME,    
  COGNITO_SYSTEM_PROMPT_HEADER,
  MUSE_SYSTEM_PROMPT_HEADER,
  DEFAULT_MANUAL_FIXED_TURNS,
  MIN_MANUAL_FIXED_TURNS,
  INITIAL_NOTEPAD_CONTENT,
  AiModel,
  // Gemini Custom API Keys
  CUSTOM_API_ENDPOINT_STORAGE_KEY,
  CUSTOM_API_KEY_STORAGE_KEY,
  USE_CUSTOM_API_CONFIG_STORAGE_KEY, 
  // OpenAI Custom API Keys
  USE_OPENAI_API_CONFIG_STORAGE_KEY,
  OPENAI_API_BASE_URL_STORAGE_KEY,
  OPENAI_API_KEY_STORAGE_KEY,
  OPENAI_COGNITO_MODEL_ID_STORAGE_KEY,
  OPENAI_MUSE_MODEL_ID_STORAGE_KEY,
  DEFAULT_OPENAI_API_BASE_URL,
  DEFAULT_OPENAI_COGNITO_MODEL_ID,
  DEFAULT_OPENAI_MUSE_MODEL_ID,
} from './constants';
import { BotMessageSquare, AlertTriangle, RefreshCcw as RefreshCwIcon, Settings2, Brain, Sparkles, Database } from 'lucide-react'; 

import { useChatLogic } from './hooks/useChatLogic';
import { useNotepadLogic } from './hooks/useNotepadLogic';
import { useAppUI } from './hooks/useAppUI';
import { generateUniqueId, getWelcomeMessageText } from './utils/appUtils';

const DEFAULT_CHAT_PANEL_PERCENT = 60; 
const FONT_SIZE_STORAGE_KEY = 'dualAiChatFontSizeScale';
const DEFAULT_FONT_SIZE_SCALE = 0.875;
const DEFAULT_GEMINI_CUSTOM_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

interface ApiKeyStatus {
  isMissing?: boolean;
  isInvalid?: boolean;
  message?: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
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


  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({});

  // Settings State
  const [selectedCognitoModelApiName, setSelectedCognitoModelApiName] = useState<string>(DEFAULT_COGNITO_MODEL_API_NAME);
  const [selectedMuseModelApiName, setSelectedMuseModelApiName] = useState<string>(DEFAULT_MUSE_MODEL_API_NAME);
  const [discussionMode, setDiscussionMode] = useState<DiscussionMode>(DiscussionMode.AiDriven);
  const [manualFixedTurns, setManualFixedTurns] = useState<number>(DEFAULT_MANUAL_FIXED_TURNS);
  const [isThinkingBudgetActive, setIsThinkingBudgetActive] = useState<boolean>(true); // Applicable to Gemini
  const [cognitoSystemPrompt, setCognitoSystemPrompt] = useState<string>(COGNITO_SYSTEM_PROMPT_HEADER);
  const [museSystemPrompt, setMuseSystemPrompt] = useState<string>(MUSE_SYSTEM_PROMPT_HEADER);
  const [fontSizeScale, setFontSizeScale] = useState<number>(() => {
    const storedScale = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return storedScale ? parseFloat(storedScale) : DEFAULT_FONT_SIZE_SCALE;
  });
  
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);


  const {
    isNotepadFullscreen,
    setIsNotepadFullscreen, 
    chatPanelWidthPercent,
    currentTotalProcessingTimeMs,
    isSettingsModalOpen,
    toggleNotepadFullscreen,
    handleMouseDownOnResizer,
    handleResizerKeyDown,
    openSettingsModal,
    closeSettingsModal,
    startProcessingTimer,
    stopProcessingTimer,
    updateProcessingTimer,
    currentQueryStartTimeRef, 
    setChatPanelWidthPercent, 
  } = useAppUI(DEFAULT_CHAT_PANEL_PERCENT, panelsContainerRef);

  const {
    notepadContent,
    lastNotepadUpdateBy,
    processNotepadUpdateFromAI,
    clearNotepadContent,
    undoNotepad,
    redoNotepad,
    canUndo,
    canRedo,
  } = useNotepadLogic(INITIAL_NOTEPAD_CONTENT);

  const addMessage = useCallback((
    text: string,
    sender: MessageSender,
    purpose: MessagePurpose,
    durationMs?: number,
    image?: ChatMessage['image']
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
    }]);
    return messageId;
  }, []);
  
  // Determine actual model details based on active API configuration
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


  const {
    isLoading,
    failedStepInfo,
    startChatProcessing,
    retryFailedStep,
    stopGenerating: stopChatLogicGeneration, 
    cancelRequestRef, 
    currentDiscussionTurn,
    isInternalDiscussionActive,
    lastCompletedTurnCount, // Added
  } = useChatLogic({
    addMessage,
    processNotepadUpdateFromAI,
    setGlobalApiKeyStatus: setApiKeyStatus,
    cognitoModelDetails: actualCognitoModelDetails, 
    museModelDetails: actualMuseModelDetails,    
    // Gemini Custom Config
    useCustomApiConfig, 
    customApiKey,
    customApiEndpoint,
    // OpenAI Custom Config
    useOpenAiApiConfig,
    openAiApiKey,
    openAiApiBaseUrl,
    openAiCognitoModelId,
    openAiMuseModelId,
    // Shared Settings
    discussionMode,
    manualFixedTurns,
    isThinkingBudgetActive, 
    cognitoSystemPrompt,
    museSystemPrompt,
    notepadContent, 
    startProcessingTimer,
    stopProcessingTimer,
    currentQueryStartTimeRef,
  });

  // Save Gemini custom config
  useEffect(() => { localStorage.setItem(USE_CUSTOM_API_CONFIG_STORAGE_KEY, useCustomApiConfig.toString()); }, [useCustomApiConfig]);
  useEffect(() => { localStorage.setItem(CUSTOM_API_ENDPOINT_STORAGE_KEY, customApiEndpoint); }, [customApiEndpoint]);
  useEffect(() => { localStorage.setItem(CUSTOM_API_KEY_STORAGE_KEY, customApiKey); }, [customApiKey]);

  // Save OpenAI custom config
  useEffect(() => { localStorage.setItem(USE_OPENAI_API_CONFIG_STORAGE_KEY, useOpenAiApiConfig.toString()); }, [useOpenAiApiConfig]);
  useEffect(() => { localStorage.setItem(OPENAI_API_BASE_URL_STORAGE_KEY, openAiApiBaseUrl); }, [openAiApiBaseUrl]);
  useEffect(() => { localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openAiApiKey); }, [openAiApiKey]);
  useEffect(() => { localStorage.setItem(OPENAI_COGNITO_MODEL_ID_STORAGE_KEY, openAiCognitoModelId); }, [openAiCognitoModelId]);
  useEffect(() => { localStorage.setItem(OPENAI_MUSE_MODEL_ID_STORAGE_KEY, openAiMuseModelId); }, [openAiMuseModelId]);


  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizeScale * 100}%`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSizeScale.toString());
  }, [fontSizeScale]);

  const isEffectivelyApiKeyMissing = useMemo(() => {
    if (useOpenAiApiConfig) {
      return !openAiApiBaseUrl.trim() || !openAiCognitoModelId.trim() || !openAiMuseModelId.trim();
    } else if (useCustomApiConfig) {
      return !customApiKey.trim();
    } else {
      return !(process.env.API_KEY && process.env.API_KEY.trim() !== "");
    }
  }, [useCustomApiConfig, customApiKey, useOpenAiApiConfig, openAiApiBaseUrl, openAiApiKey, openAiCognitoModelId, openAiMuseModelId]);

  const initializeChat = useCallback(() => {
    setMessages([]);
    clearNotepadContent();
    setIsNotepadFullscreen(false); 
    setIsAutoScrollEnabled(true);
    setApiKeyStatus({});

    let missingKeyMsg = "";
    if (useOpenAiApiConfig) {
      if (!openAiApiBaseUrl.trim() || !openAiCognitoModelId.trim() || !openAiMuseModelId.trim()) {
        missingKeyMsg = "OpenAI API 配置不完整 (需要基地址和Cognito/Muse的模型ID)。请在设置中提供，或关闭“使用OpenAI API配置”。";
      }
    } else if (useCustomApiConfig) {
      if (!customApiKey.trim()) {
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
      addMessage(
        getWelcomeMessageText(
            actualCognitoModelDetails.name, 
            actualMuseModelDetails.name, 
            discussionMode, 
            manualFixedTurns, 
            useOpenAiApiConfig, 
            openAiCognitoModelId, 
            openAiMuseModelId
        ),
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
    }
  }, [addMessage, clearNotepadContent, actualCognitoModelDetails.name, actualMuseModelDetails.name, discussionMode, manualFixedTurns, setIsNotepadFullscreen, useCustomApiConfig, customApiKey, useOpenAiApiConfig, openAiApiBaseUrl, openAiApiKey, openAiCognitoModelId, openAiMuseModelId]);

  useEffect(() => {
    initializeChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCustomApiConfig, useOpenAiApiConfig]); // Re-initialize if API config mode changes

   useEffect(() => {
     const welcomeMessage = messages.find(msg => msg.sender === MessageSender.System && msg.text.startsWith("欢迎使用Dual AI Chat！"));
     if (welcomeMessage && !apiKeyStatus.isMissing && !apiKeyStatus.isInvalid) {
        setMessages(msgs => msgs.map(msg =>
            msg.id === welcomeMessage.id
            ? {...msg, text: getWelcomeMessageText(
                actualCognitoModelDetails.name, 
                actualMuseModelDetails.name, 
                discussionMode, 
                manualFixedTurns, 
                useOpenAiApiConfig, 
                openAiCognitoModelId, 
                openAiMuseModelId
            ) }
            : msg
        ));
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualCognitoModelDetails.name, actualMuseModelDetails.name, apiKeyStatus.isMissing, apiKeyStatus.isInvalid, discussionMode, manualFixedTurns, useOpenAiApiConfig, openAiCognitoModelId, openAiMuseModelId]); 


  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading && currentQueryStartTimeRef.current) {
      intervalId = window.setInterval(() => {
        if (currentQueryStartTimeRef.current && !cancelRequestRef.current) { 
          updateProcessingTimer();
        }
      }, 100);
    } else {
      if (intervalId) clearInterval(intervalId);
      if (!isLoading && currentQueryStartTimeRef.current !== null) {
         updateProcessingTimer(); 
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, updateProcessingTimer, currentQueryStartTimeRef, cancelRequestRef]);

  const handleClearChat = useCallback(() => {
    if (isLoading) {
      stopChatLogicGeneration(); 
    }
    initializeChat(); 
  }, [isLoading, stopChatLogicGeneration, initializeChat]);

  const handleStopGeneratingAppLevel = useCallback(() => {
    stopChatLogicGeneration();
  }, [stopChatLogicGeneration]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isNotepadFullscreen) {
        toggleNotepadFullscreen();
      }
      if (event.key === 'Escape' && isSettingsModalOpen) {
        closeSettingsModal();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isNotepadFullscreen, toggleNotepadFullscreen, isSettingsModalOpen, closeSettingsModal]);

  const Separator = () => <div className="h-6 w-px bg-gray-300 mx-1 md:mx-1.5" aria-hidden="true"></div>;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    if (isAutoScrollEnabled && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAutoScrollEnabled, scrollToBottom]);

  const handleChatScroll = useCallback(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const atBottom = scrollHeight - scrollTop - clientHeight < 20;

      if (atBottom) {
        setIsAutoScrollEnabled(true);
      } else {
        setIsAutoScrollEnabled(false);
      }
    }
  }, []);

  const apiKeyBannerMessage = useMemo(() => {
    if (!apiKeyStatus.message) return null;
    if (useOpenAiApiConfig) {
        if (apiKeyStatus.isMissing) return "OpenAI API 配置不完整 (需基地址和Cognito/Muse模型ID)。请在设置中提供，或关闭 OpenAI API 配置。";
        if (apiKeyStatus.isInvalid) return "提供的 OpenAI API 密钥无效或无法访问服务。请检查设置和网络。";
    } else if (useCustomApiConfig) {
        if (apiKeyStatus.isMissing) return "自定义 Gemini API 密钥缺失。请在设置中提供，或关闭自定义 Gemini API 配置。";
        if (apiKeyStatus.isInvalid) return "提供的自定义 Gemini API 密钥无效或权限不足。请检查设置中的密钥。";
    } else {
        if (apiKeyStatus.isMissing) return "环境变量中的 Google Gemini API 密钥缺失。请配置，或启用自定义 API 配置。";
        if (apiKeyStatus.isInvalid) return "环境变量中的 Google Gemini API 密钥无效或权限不足。请检查该密钥。";
    }
    return apiKeyStatus.message; 
  }, [apiKeyStatus, useCustomApiConfig, useOpenAiApiConfig]);

  const modelSelectorBaseClass = "bg-white border border-gray-400 text-gray-800 text-sm rounded-md p-1.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed";
  const modelSelectorWidthClass = "w-40 md:w-44"; 

  const handleUseCustomGeminiApiConfigChange = () => {
    if (!isLoading) {
      const newValue = !useCustomApiConfig;
      setUseCustomApiConfig(newValue);
      if (newValue && useOpenAiApiConfig) { 
        setUseOpenAiApiConfig(false);      
      }
    }
  };

  const handleUseOpenAiApiConfigChange = () => {
    if (!isLoading) {
      const newValue = !useOpenAiApiConfig;
      setUseOpenAiApiConfig(newValue);
      if (newValue && useCustomApiConfig) { 
        setUseCustomApiConfig(false);       
      }
    }
  };


  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className={`flex flex-col h-screen bg-white shadow-2xl overflow-hidden border-x border-gray-300 ${isNotepadFullscreen ? 'fixed inset-0 z-40' : 'relative'}`}>
      <header className={`p-3 md:p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between shrink-0 space-x-2 md:space-x-3 flex-wrap ${isNotepadFullscreen ? 'relative z-0' : 'relative z-10'}`}>
        <div className="flex items-center shrink-0">
          <BotMessageSquare size={28} className="mr-2 md:mr-3 text-sky-600" />
          <h1 className="text-xl md:text-2xl font-semibold text-sky-600">Dual AI Chat</h1>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-wrap justify-end gap-y-2">
          {useOpenAiApiConfig ? (
            <>
              <div className="flex items-center p-1.5 bg-indigo-50 border border-indigo-300 rounded-md" title={`OpenAI Cognito: ${openAiCognitoModelId || '未指定'}`}>
                <Brain size={18} className="mr-1.5 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-indigo-700 whitespace-nowrap hidden sm:inline">Cognito:</span>
                <span className="text-sm font-medium text-indigo-700 whitespace-nowrap ml-1 sm:ml-0">{openAiCognitoModelId || '未指定'}</span>
              </div>
              <Separator />
              <div className="flex items-center p-1.5 bg-purple-50 border border-purple-300 rounded-md" title={`OpenAI Muse: ${openAiMuseModelId || '未指定'}`}>
                <Sparkles size={18} className="mr-1.5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-purple-700 whitespace-nowrap hidden sm:inline">Muse:</span>
                <span className="text-sm font-medium text-purple-700 whitespace-nowrap ml-1 sm:ml-0">{openAiMuseModelId || '未指定'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center" title={`Cognito Model: ${actualCognitoModelDetails.name}`}>
                 <label htmlFor="cognitoModelSelector" className="sr-only">Cognito AI 模型</label>
                 <Brain size={18} className="mr-1.5 text-green-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 mr-1 hidden sm:inline">Cognito:</span>
                <select 
                  id="cognitoModelSelector" 
                  value={selectedCognitoModelApiName} 
                  onChange={(e) => setSelectedCognitoModelApiName(e.target.value)}
                  className={`${modelSelectorBaseClass} ${modelSelectorWidthClass}`}
                  aria-label="选择Cognito的AI模型" 
                  disabled={isLoading || useOpenAiApiConfig}>
                  {MODELS.map((model) => (<option key={`cognito-${model.id}`} value={model.apiName}>{model.name}</option>))}
                </select>
              </div>
              <Separator />
              <div className="flex items-center" title={`Muse Model: ${actualMuseModelDetails.name}`}>
                <label htmlFor="museModelSelector" className="sr-only">Muse AI 模型</label>
                <Sparkles size={18} className="mr-1.5 text-purple-600 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700 mr-1 hidden sm:inline">Muse:</span>
                <select 
                  id="museModelSelector" 
                  value={selectedMuseModelApiName} 
                  onChange={(e) => setSelectedMuseModelApiName(e.target.value)}
                  className={`${modelSelectorBaseClass} ${modelSelectorWidthClass}`}
                  aria-label="选择Muse的AI模型" 
                  disabled={isLoading || useOpenAiApiConfig}>
                  {MODELS.map((model) => (<option key={`muse-${model.id}`} value={model.apiName}>{model.name}</option>))}
                </select>
              </div>
            </>
          )}
          <Separator />
           <button onClick={openSettingsModal}
            className="p-1.5 md:p-2 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-50 rounded-md shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="打开设置" title="打开设置" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}>
            <Settings2 size={20} /> 
          </button>
          <button onClick={handleClearChat}
            className="p-1.5 md:p-2 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-50 rounded-md shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="清空会话" title="清空会话" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}
            ><RefreshCwIcon size={20} /> 
          </button>
        </div>
      </header>

      <div ref={panelsContainerRef} className={`flex flex-row flex-grow overflow-hidden ${isNotepadFullscreen ? 'relative' : ''}`}>
        {!isNotepadFullscreen && (
          <div
            id="chat-panel-wrapper"
            className="flex flex-col h-full overflow-hidden"
            style={{ width: `${chatPanelWidthPercent}%` }}
          >
            <div className="flex flex-col flex-grow h-full"> 
              <div 
                ref={chatContainerRef} 
                className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-200 scroll-smooth"
                onScroll={handleChatScroll}
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    failedStepPayloadForThisMessage={failedStepInfo && msg.id === failedStepInfo.originalSystemErrorMsgId ? failedStepInfo : null}
                    onManualRetry={retryFailedStep} 
                  />
                ))}
              </div>
              <ChatInput
                onSendMessage={startChatProcessing} 
                isLoading={isLoading}
                isApiKeyMissing={apiKeyStatus.isMissing || apiKeyStatus.isInvalid || false}
                onStopGenerating={handleStopGeneratingAppLevel}
              />
              <div className="px-4 py-2 text-xs text-gray-600 text-center bg-gray-100">
                {isLoading ? (
                  isInternalDiscussionActive ? (
                    <>
                      <span>
                        AI 内部讨论: 第 {currentDiscussionTurn + 1} 轮
                        {discussionMode === DiscussionMode.FixedTurns && ` / ${manualFixedTurns} 轮`}
                      </span>
                      {currentTotalProcessingTimeMs > 0 && (
                        <>
                          <span className="mx-2" aria-hidden="true">|</span>
                          <span>耗时: {(currentTotalProcessingTimeMs / 1000).toFixed(2)}s</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>
                      AI 正在处理...
                      {currentTotalProcessingTimeMs > 0 && ` 耗时: ${(currentTotalProcessingTimeMs / 1000).toFixed(2)}s`}
                    </span>
                  )
                ) : (
                  <span>
                    准备就绪
                    {currentTotalProcessingTimeMs > 0 && ` | 上次耗时: ${(currentTotalProcessingTimeMs / 1000).toFixed(2)}s`}
                    {lastCompletedTurnCount > 0 && ` | 上次轮数: ${lastCompletedTurnCount}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!isNotepadFullscreen && (
          <div
            id="panel-resizer"
            className="w-1.5 h-full bg-gray-300 hover:bg-sky-500 cursor-col-resize select-none shrink-0 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-sky-600"
            onMouseDown={handleMouseDownOnResizer}
            onKeyDown={handleResizerKeyDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="拖动以调整聊天和记事本面板大小"
            aria-controls="chat-panel-wrapper notepad-panel-wrapper"
            aria-valuenow={chatPanelWidthPercent}
            aria-valuemin={20} 
            aria-valuemax={80} 
            tabIndex={0}
            title="拖动或使用方向键调整大小"
          />
        )}
        
        <div
          id="notepad-panel-wrapper"
          className={`h-full bg-gray-50 flex flex-col ${
            isNotepadFullscreen 
            ? 'fixed inset-0 z-50 w-screen' 
            : 'overflow-hidden'
          }`}
          style={!isNotepadFullscreen ? { width: `${100 - chatPanelWidthPercent}%` } : {}}
        >
          <Notepad 
            content={notepadContent} 
            lastUpdatedBy={lastNotepadUpdateBy} 
            isLoading={isLoading} 
            isNotepadFullscreen={isNotepadFullscreen}
            onToggleFullscreen={toggleNotepadFullscreen}
            onUndo={undoNotepad}
            onRedo={redoNotepad}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>

       {(apiKeyStatus.isMissing || apiKeyStatus.isInvalid) && apiKeyBannerMessage &&
        !isNotepadFullscreen &&
        (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-lg flex items-center text-sm z-50 max-w-md text-center">
            <AlertTriangle size={20} className="mr-2 shrink-0" /> {apiKeyBannerMessage}
        </div>
      )}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={closeSettingsModal}
          discussionMode={discussionMode}
          onDiscussionModeChange={(mode) => setDiscussionMode(mode)}
          manualFixedTurns={manualFixedTurns}
          onManualFixedTurnsChange={(e) => {
            let value = parseInt(e.target.value, 10);
            if (isNaN(value)) value = DEFAULT_MANUAL_FIXED_TURNS;
            value = Math.max(MIN_MANUAL_FIXED_TURNS, value); 
            setManualFixedTurns(value);
          }}
          minManualFixedTurns={MIN_MANUAL_FIXED_TURNS}
          isThinkingBudgetActive={isThinkingBudgetActive}
          onThinkingBudgetToggle={() => setIsThinkingBudgetActive(prev => !prev)}
          supportsThinkingConfig={actualCognitoModelDetails.supportsThinkingConfig || actualMuseModelDetails.supportsThinkingConfig} 
          cognitoSystemPrompt={cognitoSystemPrompt}
          onCognitoPromptChange={(e) => setCognitoSystemPrompt(e.target.value)}
          onResetCognitoPrompt={() => setCognitoSystemPrompt(COGNITO_SYSTEM_PROMPT_HEADER)}
          museSystemPrompt={museSystemPrompt}
          onMusePromptChange={(e) => setMuseSystemPrompt(e.target.value)}
          onResetMusePrompt={() => setMuseSystemPrompt(MUSE_SYSTEM_PROMPT_HEADER)}
          supportsSystemInstruction={actualCognitoModelDetails.supportsSystemInstruction || actualMuseModelDetails.supportsSystemInstruction} 
          isLoading={isLoading}
          fontSizeScale={fontSizeScale}
          onFontSizeScaleChange={setFontSizeScale}
          // Gemini Custom API Props
          useCustomApiConfig={useCustomApiConfig}
          onUseCustomApiConfigChange={handleUseCustomGeminiApiConfigChange}
          customApiEndpoint={customApiEndpoint}
          onCustomApiEndpointChange={(e) => setCustomApiEndpoint(e.target.value)}
          customApiKey={customApiKey}
          onCustomApiKeyChange={(e) => setCustomApiKey(e.target.value)}
          // OpenAI Custom API Props
          useOpenAiApiConfig={useOpenAiApiConfig}
          onUseOpenAiApiConfigChange={handleUseOpenAiApiConfigChange}
          openAiApiBaseUrl={openAiApiBaseUrl}
          onOpenAiApiBaseUrlChange={(e) => setOpenAiApiBaseUrl(e.target.value)}
          openAiApiKey={openAiApiKey}
          onOpenAiApiKeyChange={(e) => setOpenAiApiKey(e.target.value)}
          openAiCognitoModelId={openAiCognitoModelId}
          onOpenAiCognitoModelIdChange={(e) => setOpenAiCognitoModelId(e.target.value)}
          openAiMuseModelId={openAiMuseModelId}
          onOpenAiMuseModelIdChange={(e) => setOpenAiMuseModelId(e.target.value)}
        />
      )}
      </div>
    </MathJaxContext>
  );
};

export default App;