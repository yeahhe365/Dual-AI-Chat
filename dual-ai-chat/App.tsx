
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, MessageSender, MessagePurpose, FailedStepPayload, DiscussionMode } from './types';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import Notepad from './components/Notepad';
import SettingsModal from './components/SettingsModal';
import {
  MODELS,
  DEFAULT_MODEL_API_NAME,
  COGNITO_SYSTEM_PROMPT_HEADER,
  MUSE_SYSTEM_PROMPT_HEADER,
  DEFAULT_MANUAL_FIXED_TURNS,
  MIN_MANUAL_FIXED_TURNS,
  INITIAL_NOTEPAD_CONTENT,
  AiModel,
} from './constants';
import { BotMessageSquare, AlertTriangle, RefreshCcw as RefreshCwIcon, Settings2 } from 'lucide-react';

import { useChatLogic } from './hooks/useChatLogic';
import { useNotepadLogic } from './hooks/useNotepadLogic';
import { useAppUI } from './hooks/useAppUI';
import { generateUniqueId, getWelcomeMessageText } from './utils/appUtils';

const DEFAULT_CHAT_PANEL_PERCENT = 60; // Notepad will be 40%
const FONT_SIZE_STORAGE_KEY = 'dualAiChatFontSizeScale';
const DEFAULT_FONT_SIZE_SCALE = 1.0;

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);

  // Settings State
  const [selectedModelApiName, setSelectedModelApiName] = useState<string>(DEFAULT_MODEL_API_NAME);
  const [discussionMode, setDiscussionMode] = useState<DiscussionMode>(DiscussionMode.AiDriven);
  const [manualFixedTurns, setManualFixedTurns] = useState<number>(DEFAULT_MANUAL_FIXED_TURNS);
  const [isThinkingBudgetActive, setIsThinkingBudgetActive] = useState<boolean>(true);
  const [cognitoSystemPrompt, setCognitoSystemPrompt] = useState<string>(COGNITO_SYSTEM_PROMPT_HEADER);
  const [museSystemPrompt, setMuseSystemPrompt] = useState<string>(MUSE_SYSTEM_PROMPT_HEADER);
  const [fontSizeScale, setFontSizeScale] = useState<number>(() => {
    const storedScale = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return storedScale ? parseFloat(storedScale) : DEFAULT_FONT_SIZE_SCALE;
  });
  
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  
  const currentModelDetails: AiModel = useMemo(() => MODELS.find(m => m.apiName === selectedModelApiName) || MODELS[0], [selectedModelApiName]);

  const {
    isLoading,
    failedStepInfo,
    startChatProcessing,
    retryFailedStep,
    stopGenerating: stopChatLogicGeneration, 
    cancelRequestRef, 
    currentDiscussionTurn,
    isInternalDiscussionActive,
  } = useChatLogic({
    addMessage,
    processNotepadUpdateFromAI,
    setIsApiKeyMissingState: setIsApiKeyMissing,
    currentModelDetails,
    selectedModelApiName,
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

  // Effect to apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizeScale * 100}%`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSizeScale.toString());
  }, [fontSizeScale]);


  const initializeChat = useCallback(() => {
    setMessages([]);
    clearNotepadContent();
    setIsNotepadFullscreen(false); 

    if (!process.env.API_KEY) {
      setIsApiKeyMissing(true);
      addMessage(
        "严重警告：API_KEY 未配置。请确保设置 API_KEY 环境变量，以便应用程序正常运行。",
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
    } else {
      setIsApiKeyMissing(false);
      addMessage(
        getWelcomeMessageText(currentModelDetails.name, discussionMode, manualFixedTurns),
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
    }
  }, [addMessage, clearNotepadContent, currentModelDetails.name, discussionMode, manualFixedTurns, setIsNotepadFullscreen]);

  useEffect(() => {
    initializeChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on initial mount

   useEffect(() => {
     const welcomeMessage = messages.find(msg => msg.sender === MessageSender.System && msg.text.startsWith("欢迎使用Dual AI Chat！"));
     if (welcomeMessage && !isApiKeyMissing) {
        setMessages(msgs => msgs.map(msg =>
            msg.id === welcomeMessage.id
            ? {...msg, text: getWelcomeMessageText(currentModelDetails.name, discussionMode, manualFixedTurns) }
            : msg
        ));
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModelDetails.name, isApiKeyMissing, discussionMode, manualFixedTurns]); // update welcome message if settings change


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
    setMessages([]);
    clearNotepadContent();
    setIsNotepadFullscreen(false);


     if (!isApiKeyMissing) {
       addMessage(
        getWelcomeMessageText(currentModelDetails.name, discussionMode, manualFixedTurns),
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
    } else {
         addMessage(
            "严重警告：API_KEY 未配置。请确保设置 API_KEY 环境变量，以便应用程序正常运行。",
            MessageSender.System,
            MessagePurpose.SystemNotification
      );
    }
  }, [isLoading, stopChatLogicGeneration, clearNotepadContent, setIsNotepadFullscreen, addMessage, isApiKeyMissing, currentModelDetails.name, discussionMode, manualFixedTurns]);

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

  return (
    <div className={`flex flex-col h-screen bg-white shadow-2xl overflow-hidden border-x border-gray-300 ${isNotepadFullscreen ? 'fixed inset-0 z-40' : 'relative'}`}>
      <header className={`p-4 bg-gray-50 border-b border-gray-300 flex items-center justify-between shrink-0 space-x-2 md:space-x-4 flex-wrap ${isNotepadFullscreen ? 'relative z-0' : 'relative z-10'}`}>
        <div className="flex items-center shrink-0">
          <BotMessageSquare size={28} className="mr-2 md:mr-3 text-sky-600" />
          <h1 className="text-xl md:text-2xl font-semibold text-sky-600">Dual AI Chat</h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 flex-wrap justify-end gap-y-2">
          <div className="flex items-center">
            <select id="modelSelector" value={selectedModelApiName} onChange={(e) => setSelectedModelApiName(e.target.value)}
              className="bg-white border border-gray-400 text-gray-800 text-sm rounded-md p-1.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed w-44"
              aria-label="选择AI模型" disabled={isLoading}>
              {MODELS.map((model) => (<option key={model.id} value={model.apiName}>{model.name}</option>))}
            </select>
          </div>
          <Separator />
           <button onClick={openSettingsModal}
            className="p-2 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-50 rounded-md shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="打开设置" title="打开设置" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}>
            <Settings2 size={22} />
          </button>
          <button onClick={handleClearChat}
            className="p-2 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-50 rounded-md shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="清空会话" title="清空会话" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}
            ><RefreshCwIcon size={22} />
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
              <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-200 scroll-smooth">
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
                isApiKeyMissing={isApiKeyMissing}
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

       {isApiKeyMissing &&
        !messages.some(msg => msg.text.includes("API_KEY 未配置") || msg.text.includes("API密钥无效")) &&
        !messages.some(msg => msg.text.includes("严重警告：API_KEY 未配置")) &&
        !isNotepadFullscreen &&
        (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-lg flex items-center text-sm z-50">
            <AlertTriangle size={20} className="mr-2" /> API密钥未配置或无效。请检查控制台获取更多信息。
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
          supportsThinkingConfig={currentModelDetails.supportsThinkingConfig === true}
          cognitoSystemPrompt={cognitoSystemPrompt}
          onCognitoPromptChange={(e) => setCognitoSystemPrompt(e.target.value)}
          onResetCognitoPrompt={() => setCognitoSystemPrompt(COGNITO_SYSTEM_PROMPT_HEADER)}
          museSystemPrompt={museSystemPrompt}
          onMusePromptChange={(e) => setMuseSystemPrompt(e.target.value)}
          onResetMusePrompt={() => setMuseSystemPrompt(MUSE_SYSTEM_PROMPT_HEADER)}
          supportsSystemInstruction={currentModelDetails.supportsSystemInstruction === true}
          isLoading={isLoading}
          fontSizeScale={fontSizeScale}
          onFontSizeScaleChange={setFontSizeScale}
        />
      )}
    </div>
  );
};

export default App;
