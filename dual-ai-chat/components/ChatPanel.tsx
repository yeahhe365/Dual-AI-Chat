
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChatMessage, DiscussionMode, FailedStepPayload } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  widthPercent: number;
  onSendMessage: (message: string, imageFile?: File | null) => void;
  isLoading: boolean;
  isApiKeyMissing: boolean;
  onStopGenerating: () => void;
  isInternalDiscussionActive: boolean;
  currentDiscussionTurn: number;
  discussionMode: DiscussionMode;
  manualFixedTurns: number;
  currentTotalProcessingTimeMs: number;
  failedStepInfo: FailedStepPayload | null;
  onManualRetry: (payload: FailedStepPayload) => void;
  isMobile: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  widthPercent,
  onSendMessage,
  isLoading,
  isApiKeyMissing,
  onStopGenerating,
  isInternalDiscussionActive,
  currentDiscussionTurn,
  discussionMode,
  manualFixedTurns,
  currentTotalProcessingTimeMs,
  failedStepInfo,
  onManualRetry,
  isMobile
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Handle auto-scroll when messages change
  useEffect(() => {
    if (messages.length === 0) {
      // Reset auto-scroll when chat is cleared
      setIsAutoScrollEnabled(true);
    } else if (isAutoScrollEnabled) {
      scrollToBottom();
    }
  }, [messages, isAutoScrollEnabled, scrollToBottom]);

  // Detect if user scrolled up to disable auto-scroll
  const handleChatScroll = useCallback(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAutoScrollEnabled(atBottom);
    }
  }, []);

  return (
    <div
      id="chat-panel-wrapper"
      className="flex flex-col h-full overflow-hidden bg-slate-50 relative"
      style={{ width: '100%' }} // Logic for width moved to parent container in App.tsx
    >
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar"
        onScroll={handleChatScroll}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 flex flex-col justify-start min-h-0 pb-32 md:pb-40">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              failedStepPayloadForThisMessage={failedStepInfo && msg.id === failedStepInfo.originalSystemErrorMsgId ? failedStepInfo : null}
              onManualRetry={onManualRetry}
            />
          ))}
          {/* Spacer to allow comfortable scrolling past the last message if needed */}
          <div className="h-2"></div>
        </div>
      </div>
      
      {/* Input Area - Floating at bottom */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
        <div className="bg-gradient-to-t from-slate-50 from-60% via-slate-50/90 to-transparent pt-12 pb-1">
          <div className="max-w-4xl mx-auto w-full px-4 pointer-events-auto">
             <ChatInput
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              isApiKeyMissing={isApiKeyMissing}
              onStopGenerating={onStopGenerating}
            />
             <div className="pt-1 pb-0.5 text-[10px] md:text-xs text-slate-400 text-center flex justify-center items-center space-x-2">
                {isLoading ? (
                  isInternalDiscussionActive ? (
                    <>
                      <span>
                        内部讨论: 第 {currentDiscussionTurn + 1} 轮
                        {discussionMode === DiscussionMode.FixedTurns && ` / ${manualFixedTurns}`}
                      </span>
                      {currentTotalProcessingTimeMs > 0 && (
                        <>
                          <span className="w-px h-3 bg-slate-300 mx-1"></span>
                          <span>{(currentTotalProcessingTimeMs / 1000).toFixed(1)}s</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>
                      AI 思考中...
                      {currentTotalProcessingTimeMs > 0 && ` (${(currentTotalProcessingTimeMs / 1000).toFixed(1)}s)`}
                    </span>
                  )
                ) : (
                  <span>
                    {currentTotalProcessingTimeMs > 0 && `上次耗时: ${(currentTotalProcessingTimeMs / 1000).toFixed(2)}s`}
                  </span>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
