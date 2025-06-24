
import React, { useState, useMemo } from 'react';
import { MessageSender } from '../types';
import { FileText, Eye, Code, Copy, Check, Maximize, Minimize, Undo2, Redo2, Download } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { exportNotebookToPDF, isPDFExportSupported } from '../utils/pdfExportUtils';

interface NotepadProps {
  content: string;
  lastUpdatedBy?: MessageSender | null;
  isLoading: boolean;
  isNotepadFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Notepad: React.FC<NotepadProps> = ({ 
  content, 
  lastUpdatedBy, 
  isLoading, 
  isNotepadFullscreen, 
  onToggleFullscreen,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const processedHtml = useMemo(() => {
    if (isPreviewMode) {
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml);
    }
    return '';
  }, [content, isPreviewMode]);

  const handleCopyNotepad = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('无法复制记事本内容: ', err);
    }
  };

  const handleExportToPDF = async () => {
    if (!isPDFExportSupported()) {
      alert('您的浏览器不支持PDF导出功能');
      return;
    }

    try {
      setIsExporting(true);
      // 先切换到预览模式以确保导出的是格式化后的内容
      const wasPreviewMode = isPreviewMode;
      if (!isPreviewMode) {
        setIsPreviewMode(true);
        // 给渲染一点时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await exportNotebookToPDF(content, 'notebook');
      
      // 如果之前不是预览模式，切回原来的模式
      if (!wasPreviewMode) {
        setIsPreviewMode(false);
      }
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const notepadBaseClasses = "h-full flex flex-col bg-gray-50 border-l border-gray-300";
  const fullscreenClasses = "fixed top-0 left-0 w-screen h-screen z-50 shadow-2xl";

  const lines = useMemo(() => content.split('\n'), [content]);
  
  const baseButtonClass = "p-1.5 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500";


  return (
    <div className={`${notepadBaseClasses} ${isNotepadFullscreen ? fullscreenClasses : ''}`}>
      <header className="p-3 border-b border-gray-300 flex items-center justify-between bg-gray-100 shrink-0">
        <div className="flex items-center">
          <FileText size={20} className="mr-2 text-sky-600" />
          <h2 className="text-lg font-semibold text-sky-700">Notebook</h2>
        </div>
        <div className="flex items-center space-x-1 md:space-x-1.5">
          {isLoading && !isNotepadFullscreen && <span className="text-xs text-gray-500 italic mr-1">AI 思考中...</span>}
          <button
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className={baseButtonClass}
            title="撤销记事本更改"
            aria-label="Undo notepad change"
            aria-disabled={!canUndo || isLoading}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className={baseButtonClass}
            title="重做记事本更改"
            aria-label="Redo notepad change"
            aria-disabled={!canRedo || isLoading}
          >
            <Redo2 size={18} />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true"></div>
          <button
            onClick={onToggleFullscreen}
            className={baseButtonClass}
            title={isNotepadFullscreen ? "退出全屏" : "全屏"}
            aria-label={isNotepadFullscreen ? "Exit fullscreen notepad" : "Enter fullscreen notepad"}
          >
            {isNotepadFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            onClick={handleCopyNotepad}
            className={baseButtonClass}
            title={isCopied ? "已复制!" : "复制记事本内容"}
            aria-label={isCopied ? "已复制记事本内容到剪贴板" : "复制记事本内容"}
          >
            {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button
            onClick={handleExportToPDF}
            disabled={isExporting}
            className={baseButtonClass}
            title={isExporting ? "导出中..." : "导出为PDF"}
            aria-label={isExporting ? "正在导出PDF" : "导出记事本为PDF文件"}
          >
            {isExporting ? (
              <span className="animate-spin inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
            ) : (
              <Download size={18} />
            )}
          </button>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={baseButtonClass}
            title={isPreviewMode ? "查看原始内容" : "预览 Markdown"}
            aria-label={isPreviewMode ? "Switch to raw text view" : "Switch to Markdown preview"}
          >
            {isPreviewMode ? <Code size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto relative bg-white">
        {isPreviewMode ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
            aria-label="Markdown 预览"
          />
        ) : (
          <div 
            className="w-full h-full p-3 bg-white text-gray-800 font-mono text-xl leading-relaxed"
            aria-label="共享记事本内容 (原始内容)"
          >
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span 
                  className="w-10 text-right pr-3 text-gray-400 select-none flex-shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
              </div>
            ))}
            {/* Add an empty line with number if content is empty to show the textarea-like behavior */}
            {content === '' && (
                 <div className="flex">
                    <span 
                        className="w-10 text-right pr-3 text-gray-400 select-none flex-shrink-0"
                        aria-hidden="true"
                    >
                        1
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all"></span>
                 </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notepad;
