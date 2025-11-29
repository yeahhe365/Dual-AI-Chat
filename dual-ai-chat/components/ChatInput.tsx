
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, Plus, X, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, imageFile?: File | null) => void;
  isLoading: boolean;
  isApiKeyMissing: boolean;
  onStopGenerating: () => void;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Custom Stop Icon mimicking All Model Chat
const IconStop = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" fill={color} />
  </svg>
);

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isApiKeyMissing, onStopGenerating }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setImagePreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setImagePreviewUrl(null);
  }, [selectedImage]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleImageFile = (file: File | null) => {
    if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImage(file);
    } else if (file) {
      alert('不支持的文件类型。请使用 JPG, PNG, GIF 或 WEBP。');
      setSelectedImage(null);
    } else {
      setSelectedImage(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const triggerSendMessage = () => {
    if ((inputValue.trim() || selectedImage) && !isLoading && !isApiKeyMissing) {
      onSendMessage(inputValue.trim(), selectedImage);
      setInputValue('');
      removeImage();
      // Reset height immediately
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) triggerSendMessage();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (ACCEPTED_IMAGE_TYPES.includes(items[i].type)) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, []);

  return (
    <div className={`max-w-4xl mx-auto w-full transition-transform duration-200 ${isDraggingOver ? 'scale-[1.01]' : ''}`}>
      <div 
        className={`
            flex flex-col gap-2 rounded-[26px] bg-white border p-3 sm:p-4 shadow-xl transition-all duration-300 relative
            ${isDraggingOver ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-50' : 'border-slate-200 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/20'}
        `}
      >
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleImageFile(e.target.files[0])}
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
        />

        {/* Image Preview Area */}
        {imagePreviewUrl && selectedImage && (
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 mb-1 custom-scrollbar">
                <div className="relative inline-block w-fit group animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 w-16 h-16 bg-slate-50 shadow-sm">
                        <img src={imagePreviewUrl} alt="预览" className="w-full h-full object-cover" />
                        <button
                            onClick={removeImage}
                            className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                        >
                            <X size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm border border-slate-100 p-0.5">
                        <ImageIcon size={10} className="text-sky-500" />
                    </div>
                </div>
            </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
          placeholder={isApiKeyMissing ? "缺少 API 密钥" : "给 Dual AI 发送消息..."}
          rows={1}
          className="w-full bg-transparent border-0 focus:ring-0 text-slate-700 placeholder-slate-400 px-1 py-1 resize-none max-h-[200px] min-h-[24px] text-base leading-relaxed custom-scrollbar outline-none"
          disabled={isLoading || isApiKeyMissing}
        />

        {/* Bottom Toolbar */}
        <div className="flex justify-between items-center pt-1">
            {/* Left Actions */}
            <div className="flex gap-1">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                    title="附加图片"
                    disabled={isLoading || isApiKeyMissing}
                >
                    <Plus size={20} strokeWidth={2} />
                </button>
            </div>

            {/* Right Actions (Send/Stop) */}
            <div>
                 <button
                    onClick={isLoading ? onStopGenerating : triggerSendMessage}
                    disabled={!isLoading && (isApiKeyMissing || (!inputValue.trim() && !selectedImage))}
                    className={`
                        flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1
                        ${isLoading 
                            ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-200' 
                            : 'bg-sky-600 hover:bg-sky-700 text-white disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none focus:ring-sky-200'
                        }
                    `}
                    title={isLoading ? "停止生成" : "发送消息"}
                >
                    {isLoading ? <IconStop size={12} /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </button>
            </div>
        </div>
      </div>
      
      {/* Footer / Helper text */}
      {isApiKeyMissing && (
        <div className="text-center mt-2 animate-in fade-in slide-in-from-bottom-2">
           <p className="text-[10px] text-slate-400 bg-white/50 inline-block px-2 py-0.5 rounded-full border border-slate-100">
              请在设置中配置 API 密钥以开始。
           </p>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
