
import React, { useState } from 'react';
import { ChatMessage, MessageSender, MessagePurpose, FailedStepPayload } from '../types';
import { Cpu, Sparkles, AlertTriangle, Copy, Check, RefreshCw, Info, Layers, Zap, Brain } from 'lucide-react';
import { renderMarkdown } from '../utils/appUtils';

const isSystemErrorMessage = (messageText: string, purpose: MessagePurpose): boolean => {
  if (purpose !== MessagePurpose.SystemNotification) return false;
  const lowerText = messageText.toLowerCase();
  return (
    lowerText.includes("error") ||
    lowerText.includes("错误") ||
    lowerText.includes("警告") ||
    lowerText.includes("critical") ||
    lowerText.includes("严重") ||
    lowerText.includes("失败")
  );
};

interface AvatarProps {
  sender: MessageSender;
}

const Avatar: React.FC<AvatarProps> = ({ sender }) => {
  const baseClass = "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm text-white shrink-0 mt-1";
  
  switch (sender) {
    case MessageSender.Cognito:
      return <div className={`${baseClass} bg-gradient-to-br from-teal-400 to-teal-600`}><Cpu size={16} /></div>;
    case MessageSender.Muse:
      return <div className={`${baseClass} bg-gradient-to-br from-fuchsia-400 to-fuchsia-600`}><Sparkles size={16} /></div>;
    case MessageSender.System:
      return <div className={`${baseClass} bg-slate-400`}><Info size={16} /></div>;
    default:
      return null;
  }
};

const getPurposeBadge = (purpose: MessagePurpose): { text: string, className: string } | null => {
  switch (purpose) {
    case MessagePurpose.CognitoToMuse:
      return { text: "逻辑 > 创意", className: "text-teal-600 bg-teal-50 border-teal-100" };
    case MessagePurpose.MuseToCognito:
      return { text: "创意 > 逻辑", className: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" };
    case MessagePurpose.FinalResponse:
      return { text: "最终答案", className: "text-indigo-600 bg-indigo-50 border-indigo-100 font-bold" };
    default:
      return null;
  }
};

interface MessageBubbleProps {
  message: ChatMessage;
  onManualRetry?: (payload: FailedStepPayload) => void;
  failedStepPayloadForThisMessage?: FailedStepPayload | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onManualRetry, failedStepPayloadForThisMessage }) => {
  const { text: messageText, sender, purpose, timestamp, durationMs, image, id: messageId, thoughts } = message;
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [isCopied, setIsCopied] = useState(false);

  // System Notifications
  if (purpose === MessagePurpose.SystemNotification) {
    const isError = isSystemErrorMessage(messageText, purpose);
    
    // Check for new structured welcome message or legacy message
    const isWelcome = messageText.includes("Dual AI Chat 已就绪") || messageText.includes("欢迎使用Dual AI Chat");

    if (isWelcome) {
      // Parse structured text for the new layout
      // Format: "Dual AI Chat 已就绪\n模式：[Info]\nCognito：[Name]\nMuse：[Name]"
      const lines = messageText.split('\n');
      
      // If matches new format with enough lines, render card
      if (lines.length >= 4 && lines[0].includes("已就绪")) {
          const modeStr = lines[1].split('：')[1] || lines[1];
          const cognitoStr = lines[2].split('：')[1] || lines[2];
          const museStr = lines[3].split('：')[1] || lines[3];

          return (
            <div className="flex justify-center my-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-100/60 rounded-2xl p-5 max-w-2xl w-full mx-4">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base">Dual AI Chat 已就绪</h3>
                            <p className="text-[10px] text-slate-500 font-medium">系统初始化完成</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Mode */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5 transition-colors hover:border-slate-200">
                             <div className="flex items-center gap-1.5 text-slate-400">
                                <Zap size={12} className="text-amber-500 fill-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">运行模式</span>
                             </div>
                             <div className="font-semibold text-slate-700 text-sm truncate" title={modeStr}>
                                {modeStr}
                             </div>
                        </div>

                        {/* Cognito */}
                        <div className="bg-teal-50/40 rounded-xl p-3 border border-teal-100/60 flex flex-col gap-1.5 transition-colors hover:border-teal-200/60">
                             <div className="flex items-center gap-1.5 text-teal-600/70">
                                <Cpu size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">逻辑模型</span>
                             </div>
                             <div className="font-semibold text-teal-800 text-sm truncate" title={cognitoStr}>
                                {cognitoStr}
                             </div>
                        </div>

                        {/* Muse */}
                        <div className="bg-fuchsia-50/40 rounded-xl p-3 border border-fuchsia-100/60 flex flex-col gap-1.5 transition-colors hover:border-fuchsia-200/60">
                             <div className="flex items-center gap-1.5 text-fuchsia-600/70">
                                <Sparkles size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">创意模型</span>
                             </div>
                             <div className="font-semibold text-fuchsia-800 text-sm truncate" title={museStr}>
                                {museStr}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          );
      }
      
      // Fallback for legacy welcome message style
      return (
        <div className="flex justify-center my-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
           <div className="px-8 py-6 max-w-3xl bg-gradient-to-r from-sky-50/60 via-indigo-50/40 to-sky-50/60 border border-indigo-50/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] text-center">
              <div className="text-sm text-slate-600 leading-relaxed font-medium tracking-wide whitespace-pre-wrap">
                 {messageText}
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-4">
        <div className={`flex items-center px-4 py-2 rounded-full text-xs font-medium shadow-sm border max-w-lg text-center ${isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
           {isError && <AlertTriangle size={14} className="mr-2 shrink-0" />}
           <span className="whitespace-pre-wrap">{messageText}</span>
           {failedStepPayloadForThisMessage && onManualRetry && (
             <button
               onClick={() => onManualRetry(failedStepPayloadForThisMessage)}
               className="ml-3 p-1 hover:bg-red-100 rounded-full text-red-700 transition-colors"
               title="重试"
             >
               <RefreshCw size={12} />
             </button>
           )}
        </div>
      </div>
    );
  }

  const isUser = sender === MessageSender.User;
  const isDiscussionStep = purpose === MessagePurpose.CognitoToMuse || purpose === MessagePurpose.MuseToCognito;
  const isFinalResponse = purpose === MessagePurpose.FinalResponse;
  const showDuration = durationMs !== undefined && durationMs > 0 && !isUser;
  const purposeBadge = getPurposeBadge(purpose);
  
  const isPlaceholderAiMessage = !isUser && messageText.startsWith("(AI") && messageText.endsWith(")");
  const shouldRenderMarkdown = !isUser && !isPlaceholderAiMessage;

  let sanitizedHtml = '';
  if (shouldRenderMarkdown && messageText) {
    sanitizedHtml = renderMarkdown(messageText);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-4`}>
      {!isUser && (
        <div className="mr-3 pt-1 hidden sm:block">
          <Avatar sender={sender} />
        </div>
      )}
      
      <div className={`relative max-w-[95%] sm:max-w-[85%] lg:max-w-[75%] shadow-sm ${
        isUser 
          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
          : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm'
      }`}>
        
        {/* Header inside Bubble for AI */}
        {!isUser && (
           <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                 <div className="sm:hidden mr-1">
                    <Avatar sender={sender} />
                 </div>
                 <span className={`text-xs font-bold uppercase tracking-wider ${sender === MessageSender.Cognito ? 'text-teal-700' : 'text-fuchsia-700'}`}>
                    {sender}
                 </span>
                 {purposeBadge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${purposeBadge.className}`}>
                       {purposeBadge.text}
                    </span>
                 )}
              </div>
              <div className="flex items-center space-x-2">
                 {showDuration && <span className="text-[10px] text-slate-400 italic">{(durationMs / 1000).toFixed(2)}s</span>}
                 <button 
                    onClick={handleCopy} 
                    className="text-slate-400 hover:text-sky-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="复制"
                 >
                    {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                 </button>
              </div>
           </div>
        )}

        {/* User bubble copy button (absolute) */}
        {isUser && (
           <button 
              onClick={handleCopy} 
              className="absolute top-2 right-2 text-blue-200 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1"
              title="复制"
           >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
           </button>
        )}

        <div className={`px-4 py-3 ${isUser ? 'text-base' : 'text-sm'}`}>
          {image && (
             <div className="mb-3">
               <img src={image.dataUrl} alt="上传的附件" className="max-w-full max-h-60 rounded-lg object-contain bg-black/5" />
             </div>
          )}

          {/* Thoughts Section */}
          {thoughts && (
            <details className="mb-3 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden text-xs group/thoughts">
                <summary className="px-3 py-2 cursor-pointer font-medium text-slate-500 hover:bg-slate-100 select-none flex items-center gap-2 transition-colors">
                   <Brain size={14} className="text-slate-400 group-hover/thoughts:text-sky-500" /> 
                   <span>思考过程</span>
                </summary>
                <div className="px-3 pb-3 pt-1 text-slate-600 whitespace-pre-wrap leading-relaxed border-t border-slate-100 font-mono bg-white/50">
                    {thoughts}
                </div>
            </details>
          )}
          
          {shouldRenderMarkdown ? (
            <div 
               className="chat-markdown-content text-slate-700"
               dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
            />
          ) : (
            <div className={`whitespace-pre-wrap ${isPlaceholderAiMessage ? 'text-slate-400 italic text-xs' : ''}`}>
               {messageText}
            </div>
          )}
        </div>
        
        <div className={`px-4 pb-2 text-[10px] text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
           {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
