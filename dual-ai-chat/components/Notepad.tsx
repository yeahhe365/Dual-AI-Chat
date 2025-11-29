
import React, { useState, useMemo, useEffect } from 'react';
import { MessageSender } from '../types';
import { FileText, Eye, Code, Copy, Check, Maximize, Minimize, Undo2, Redo2, GitCompare } from 'lucide-react';
import { renderMarkdown } from '../utils/appUtils';
import * as Diff from 'diff';

interface NotepadProps {
  content: string;
  previousContent: string;
  lastUpdatedBy?: MessageSender | null;
  isLoading: boolean;
  isNotepadFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onContentChange: (newContent: string) => void;
}

type ViewMode = 'edit' | 'preview' | 'diff';

const Notepad: React.FC<NotepadProps> = ({ 
  content, 
  previousContent,
  isLoading, 
  isNotepadFullscreen, 
  onToggleFullscreen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onContentChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isCopied, setIsCopied] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Sync local content with prop content (e.g. updates from AI or undo/redo)
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // If we are in diff mode but content is same as previous, might want to switch back or just show "No changes"
  // For now, we'll let the user control the view.

  const processedHtml = useMemo(() => {
    return viewMode === 'preview' ? renderMarkdown(typeof content === 'string' ? content : '') : '';
  }, [content, viewMode]);

  const diffElements = useMemo(() => {
    if (viewMode !== 'diff') return null;
    
    const diff = Diff.diffLines(previousContent || '', content || '');
    return diff.map((part, index) => {
      const colorClass = part.added ? 'bg-green-100 text-green-900' : part.removed ? 'bg-red-100 text-red-900 opacity-60' : 'text-slate-600';
      const sign = part.added ? '+' : part.removed ? '-' : ' ';
      return (
        <div key={index} className={`${colorClass} font-mono whitespace-pre-wrap leading-relaxed px-2 border-l-4 ${part.added ? 'border-green-400' : part.removed ? 'border-red-400' : 'border-transparent'}`}>
           {part.value}
        </div>
      );
    });
  }, [content, previousContent, viewMode]);

  const handleCopyNotepad = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleBlur = () => {
    if (localContent !== content) {
      onContentChange(localContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Optional: Allow Tab to indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = localContent.substring(0, start) + '  ' + localContent.substring(end);
      setLocalContent(newValue);
      
      // We need to defer setting selection because React state update is async-ish for render
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const toolbarBtnClass = "p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";
  const activeBtnClass = "p-2 text-sky-600 bg-sky-50 rounded-lg transition-colors font-medium ring-1 ring-sky-200";

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <header className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-20">
        <div className="flex items-center space-x-3">
           <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <FileText size={20} />
           </div>
           <h2 className="text-base font-bold text-slate-700">记事本</h2>
        </div>
        
        <div className="flex items-center space-x-1">
          <button onClick={onUndo} disabled={!canUndo || isLoading} className={toolbarBtnClass} title="撤销">
            <Undo2 size={18} />
          </button>
          <button onClick={onRedo} disabled={!canRedo || isLoading} className={toolbarBtnClass} title="重做">
            <Redo2 size={18} />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-2"></div>
          
          <button onClick={() => setViewMode('edit')} className={viewMode === 'edit' ? activeBtnClass : toolbarBtnClass} title="编辑源码">
             <Code size={18} />
          </button>
          <button onClick={() => setViewMode('preview')} className={viewMode === 'preview' ? activeBtnClass : toolbarBtnClass} title="预览 Markdown">
             <Eye size={18} />
          </button>
          <button onClick={() => setViewMode('diff')} className={viewMode === 'diff' ? activeBtnClass : toolbarBtnClass} title="查看变更对比">
             <GitCompare size={18} />
          </button>
          
          <div className="w-px h-5 bg-slate-200 mx-2"></div>
          
          <button onClick={handleCopyNotepad} className={toolbarBtnClass} title="复制内容">
            {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button onClick={onToggleFullscreen} className={toolbarBtnClass} title={isNotepadFullscreen ? "退出全屏" : "全屏"}>
             {isNotepadFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-grow overflow-hidden relative bg-white">
        {viewMode === 'preview' && (
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-4xl mx-auto min-h-full">
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            </div>
          </div>
        )}

        {viewMode === 'edit' && (
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="记事本内容..."
            className="w-full h-full p-6 text-slate-700 font-mono text-base leading-7 bg-slate-50/30 resize-none outline-none focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
            spellCheck={false}
          />
        )}

        {viewMode === 'diff' && (
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50">
             <div className="max-w-4xl mx-auto min-h-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  上次变更对比
                </h3>
                {content === previousContent ? (
                  <div className="text-center py-10 text-slate-400 italic">
                     没有检测到变更
                  </div>
                ) : (
                  <div className="text-sm font-mono overflow-x-auto">
                    {diffElements}
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notepad;
