import React, { useState } from 'react';
import { ChatMessage, MessageSender, MessagePurpose, FailedStepPayload } from '../types';
import { Lightbulb, MessageSquareText, UserCircle, Zap, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface SenderIconProps {
  sender: MessageSender;
  purpose: MessagePurpose;
  messageText: string;
}

const SenderIcon: React.FC<SenderIconProps> = ({ sender, purpose, messageText }) => {
  const iconClass = "w-5 h-5 mr-2 flex-shrink-0";
  switch (sender) {
    case MessageSender.User:
      return <UserCircle className={`${iconClass} text-blue-500`} />;
    case MessageSender.Cognito:
      return <Lightbulb className={`${iconClass} text-green-500`} />;
    case MessageSender.Muse:
      return <Zap className={`${iconClass} text-purple-500`} />;
    case MessageSender.System:
      if (
        purpose === MessagePurpose.SystemNotification &&
        (messageText.toLowerCase().includes("error") ||
          messageText.toLowerCase().includes("错误") ||
          messageText.toLowerCase().includes("警告"))
      ) {
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      }
      return <MessageSquareText className={`${iconClass} text-gray-500`} />;
    default:
      return null;
  }
};

const getSenderNameStyle = (sender: MessageSender): string => {
  switch (sender) {
    case MessageSender.User: return "text-blue-600";
    case MessageSender.Cognito: return "text-green-600";
    case MessageSender.Muse: return "text-purple-600";
    case MessageSender.System: return "text-gray-600";
    default: return "text-gray-700";
  }
}

const getBubbleStyle = (sender: MessageSender, purpose: MessagePurpose, messageText: string): string => {
  let baseStyle = "mb-4 p-4 rounded-lg shadow-md max-w-xl break-words relative border "; 
  if (purpose === MessagePurpose.SystemNotification) {
    if (
      messageText.toLowerCase().includes("error") ||
      messageText.toLowerCase().includes("错误") ||
      messageText.toLowerCase().includes("警告") ||
      messageText.toLowerCase().includes("critical") ||
      messageText.toLowerCase().includes("严重") ||
      messageText.toLowerCase().includes("失败") 
    ) {
       return baseStyle + "bg-red-50 border-red-300 text-center text-sm italic mx-auto text-red-700";
    }
    return baseStyle + "bg-gray-100 border-gray-300 text-center text-sm italic mx-auto text-gray-600";
  }
  switch (sender) {
    case MessageSender.User:
      return baseStyle + "bg-blue-500 text-white border-blue-600 ml-auto rounded-bl-none";
    case MessageSender.Cognito:
      return baseStyle + "bg-green-50 border-green-300 text-green-800 mr-auto rounded-br-none";
    case MessageSender.Muse:
      return baseStyle + "bg-purple-50 border-purple-300 text-purple-800 mr-auto rounded-br-none";
    default:
      return baseStyle + "bg-white border-gray-300 text-gray-700 mr-auto";
  }
};

const getPurposePrefix = (purpose: MessagePurpose, sender: MessageSender): string => {
  switch (purpose) {
    case MessagePurpose.CognitoToMuse:
      return `致 ${MessageSender.Muse}的消息: `;
    case MessagePurpose.MuseToCognito:
      return `致 ${MessageSender.Cognito}的消息: `;
    case MessagePurpose.FinalResponse:
      return `最终答案: `;
    default:
      return "";
  }
}

interface MessageBubbleProps {
  message: ChatMessage;
  onManualRetry?: (payload: FailedStepPayload) => void;
  failedStepPayloadForThisMessage?: FailedStepPayload | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onManualRetry, failedStepPayloadForThisMessage }) => {
  const { text: messageText, sender, purpose, timestamp, durationMs, image, id: messageId } = message;
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [isCopied, setIsCopied] = useState(false);

  const isDiscussionStep = purpose === MessagePurpose.CognitoToMuse || purpose === MessagePurpose.MuseToCognito;
  const isFinalResponse = purpose === MessagePurpose.FinalResponse;
  const showDuration = durationMs !== undefined && durationMs > 0 && (isDiscussionStep || isFinalResponse || sender === MessageSender.Cognito || sender === MessageSender.Muse);

  const isPlaceholderAiMessage = (
    sender === MessageSender.Cognito || sender === MessageSender.Muse
  ) && messageText.startsWith("(AI") && messageText.endsWith(")");

  const shouldRenderMarkdown = 
    (sender === MessageSender.User || sender === MessageSender.Cognito || sender === MessageSender.Muse) &&
    !isPlaceholderAiMessage &&
    purpose !== MessagePurpose.SystemNotification; 

  let sanitizedHtml = '';
  if (shouldRenderMarkdown && messageText) {
    try {
      const rawHtml = marked.parse(messageText) as string;
      sanitizedHtml = DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error("Markdown parsing error:", e);
      sanitizedHtml = `<p><em>内容解析出错</em></p><pre>${DOMPurify.sanitize(messageText)}</pre>`; 
    }
  }

  const handleCopy = async () => {
    const prefix = getPurposePrefix(purpose, sender);
    const textToCopy = prefix + messageText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('无法复制文本: ', err);
    }
  };

  const canCopy = (sender === MessageSender.User || sender === MessageSender.Cognito || sender === MessageSender.Muse) && purpose !== MessagePurpose.SystemNotification && messageText.length > 0;
  const bubbleTextColorClass = sender === MessageSender.User ? 'text-gray-100' : 'text-gray-800';
  const bubblePurposePrefixColorClass = sender === MessageSender.User ? 'text-gray-200' : 'text-gray-700';
  const bubbleTimestampColorClass = sender === MessageSender.User ? 'text-blue-200' : 'text-gray-500';

  const showManualRetryButton = failedStepPayloadForThisMessage && 
                                messageId === failedStepPayloadForThisMessage.originalSystemErrorMsgId && 
                                onManualRetry &&
                                sender === MessageSender.System &&
                                messageText.toLowerCase().includes("失败");

  return (
    <div className={`flex ${sender === MessageSender.User ? 'justify-end' : 'justify-start'}`}>
      <div className={`${getBubbleStyle(sender, purpose, messageText)}`}>
        {canCopy && (
          <button
            onClick={handleCopy}
            title={isCopied ? "已复制!" : "复制消息"}
            aria-label={isCopied ? "已复制消息到剪贴板" : "复制消息内容"}
            className={`absolute top-1.5 right-1.5 p-1 ${sender === MessageSender.User ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-sky-600'} transition-colors rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500`}
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        )}
        <div className="flex items-center mb-1">
          <SenderIcon sender={sender} purpose={purpose} messageText={messageText} />
          <span className={`font-semibold ${getSenderNameStyle(sender)}`}>{sender}</span>
          {isDiscussionStep && <span className={`ml-2 text-xs ${sender === MessageSender.User ? 'text-blue-200' : 'text-gray-500'}`}>(内部讨论)</span>}
        </div>
        
        {messageText && ( 
          shouldRenderMarkdown ? (
            <>
              {(isDiscussionStep || isFinalResponse) && (
                <span className={`block font-medium ${bubblePurposePrefixColorClass} text-sm mb-0.5`}>
                  {getPurposePrefix(purpose, sender)}
                </span>
              )}
              <div
                className={`chat-markdown-content text-sm ${bubbleTextColorClass}`}
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            </>
          ) : (
            <p className={`text-sm ${bubbleTextColorClass} whitespace-pre-wrap`}>
              {(isDiscussionStep || isFinalResponse) && ( 
                <span className={`font-medium ${bubblePurposePrefixColorClass}`}>{getPurposePrefix(purpose, sender)}</span>
              )}
              {messageText}
            </p>
          )
        )}

        {image && sender === MessageSender.User && (
           <div className={`mt-2 ${messageText ? `pt-2 border-t ${sender === MessageSender.User ? 'border-blue-400' : 'border-gray-300'}` : ''}`}>
            <img 
              src={image.dataUrl} 
              alt={image.name || "用户上传的图片"} 
              className="max-w-xs max-h-64 rounded-md object-contain" 
            />
          </div>
        )}
        <div className={`text-xs ${bubbleTimestampColorClass} mt-2 flex justify-between items-center`}>
          <span>{formattedTime}</span>
          {showDuration && (
            <span className="italic"> (耗时: {(durationMs / 1000).toFixed(2)}s)</span>
          )}
        </div>
        {showManualRetryButton && failedStepPayloadForThisMessage && onManualRetry && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => onManualRetry(failedStepPayloadForThisMessage)}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-md text-xs font-semibold flex items-center shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 focus:ring-offset-red-50"
              aria-label="手动重试此步骤"
            >
              <RefreshCw size={14} className="mr-1.5" />
              手动重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;