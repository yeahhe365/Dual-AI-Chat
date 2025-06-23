
import React from 'react';
import { DiscussionMode } from '../types';
import { MIN_MANUAL_FIXED_TURNS } from '../constants'; 
import { X, Bot, MessagesSquare, SlidersHorizontal, Info, RotateCcw, CaseSensitive } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussionMode: DiscussionMode;
  onDiscussionModeChange: (mode: DiscussionMode) => void;
  manualFixedTurns: number;
  onManualFixedTurnsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minManualFixedTurns: number;
  isThinkingBudgetActive: boolean;
  onThinkingBudgetToggle: () => void;
  supportsThinkingConfig: boolean;
  cognitoSystemPrompt: string;
  onCognitoPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onResetCognitoPrompt: () => void;
  museSystemPrompt: string;
  onMusePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onResetMusePrompt: () => void;
  supportsSystemInstruction: boolean;
  isLoading: boolean;
  fontSizeScale: number;
  onFontSizeScaleChange: (scale: number) => void;
}

const FONT_SIZE_OPTIONS = [
  { label: '小', value: 0.875 },
  { label: '中', value: 1.0 },
  { label: '大', value: 1.125 },
  { label: '特大', value: 1.25 },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  discussionMode,
  onDiscussionModeChange,
  manualFixedTurns,
  onManualFixedTurnsChange,
  minManualFixedTurns,
  isThinkingBudgetActive,
  onThinkingBudgetToggle,
  supportsThinkingConfig,
  cognitoSystemPrompt,
  onCognitoPromptChange,
  onResetCognitoPrompt,
  museSystemPrompt,
  onMusePromptChange,
  onResetMusePrompt,
  supportsSystemInstruction,
  isLoading,
  fontSizeScale,
  onFontSizeScaleChange,
}) => {
  if (!isOpen) return null;

  const handleDiscussionModeToggle = () => {
    if (!isLoading) {
      onDiscussionModeChange(discussionMode === DiscussionMode.FixedTurns ? DiscussionMode.AiDriven : DiscussionMode.FixedTurns);
    }
  };
  
  const handleThinkingBudgetToggle = () => {
    if (!isLoading && supportsThinkingConfig) {
      onThinkingBudgetToggle();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
        <header className="p-4 border-b border-gray-300 flex items-center justify-between sticky top-0 bg-gray-50 rounded-t-lg z-10">
          <h2 id="settings-modal-title" className="text-xl font-semibold text-sky-700">应用程序设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="关闭设置面板"
            title="关闭设置"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto settings-modal-content-scrollbar">
          {/* Font Size Settings Section */}
          <section aria-labelledby="font-size-settings-heading">
            <h3 id="font-size-settings-heading" className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">文字大小</h3>
            <div className="flex items-center space-x-2">
                <CaseSensitive size={20} className="mr-1 text-sky-600 flex-shrink-0" />
                <label className="text-sm text-gray-700 font-medium whitespace-nowrap">界面文字:</label>
                <div className="flex flex-wrap gap-2">
                {FONT_SIZE_OPTIONS.map(option => (
                    <button
                    key={option.value}
                    onClick={() => !isLoading && onFontSizeScaleChange(option.value)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
                        ${fontSizeScale === option.value 
                            ? 'bg-sky-600 text-white border-sky-700' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'}
                    `}
                    aria-pressed={fontSizeScale === option.value}
                    >
                    {option.label}
                    </button>
                ))}
                </div>
            </div>
          </section>

          {/* Discussion Settings Section */}
          <section aria-labelledby="discussion-settings-heading">
            <h3 id="discussion-settings-heading" className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">讨论设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="discussionModeToggleModal" className={`flex items-center text-sm text-gray-700 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-sky-600'}`}
                  title={discussionMode === DiscussionMode.FixedTurns ? "切换到AI驱动轮次模式" : "切换到固定轮次模式"}>
                  {discussionMode === DiscussionMode.FixedTurns ? <MessagesSquare size={20} className="mr-2 text-sky-600" /> : <Bot size={20} className="mr-2 text-sky-600" />}
                  <span className="mr-2 select-none font-medium">对话轮数模式:</span>
                </label>
                <div className="flex items-center">
                    <button
                        id="discussionModeToggleModal"
                        onClick={handleDiscussionModeToggle}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={isLoading}
                        role="switch"
                        aria-checked={discussionMode === DiscussionMode.AiDriven}
                    >
                        <span className={`inline-block w-11 h-6 rounded-full ${discussionMode === DiscussionMode.AiDriven ? 'bg-sky-500' : 'bg-gray-300'}`}></span>
                        <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${discussionMode === DiscussionMode.AiDriven ? 'translate-x-4' : ''}`}></span>
                    </button>
                    <span className="ml-3 select-none text-sm text-gray-600 min-w-[5rem] text-left">
                        {discussionMode === DiscussionMode.FixedTurns ? '固定轮次' : 'AI驱动'}
                    </span>
                </div>
              </div>
              {discussionMode === DiscussionMode.FixedTurns && (
                <div className="flex items-center space-x-2 pl-7">
                  <label htmlFor="manualFixedTurnsInputModal" className="text-sm text-gray-700 font-medium">固定轮数:</label>
                  <input 
                    type="number" 
                    id="manualFixedTurnsInputModal" 
                    value={manualFixedTurns} 
                    onChange={onManualFixedTurnsChange}
                    min={minManualFixedTurns} 
                    disabled={isLoading}
                    className="w-20 bg-white border border-gray-300 text-gray-800 text-sm rounded-md p-1.5 text-center focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label={`设置固定对话轮数, 最小 ${minManualFixedTurns}`}
                  />
                  <span className="text-sm text-gray-600">轮 (最小: {minManualFixedTurns})</span>
                </div>
              )}
            </div>
          </section>

          {/* Model Performance Section */}
          <section aria-labelledby="performance-settings-heading">
            <h3 id="performance-settings-heading" className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">模型性能</h3>
            <div className="flex items-center justify-between">
                <label htmlFor="thinkingBudgetToggleModal"
                    className={`flex items-center text-sm text-gray-700 transition-opacity ${isLoading || !supportsThinkingConfig ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-sky-600'}`}
                    title={supportsThinkingConfig ? "切换AI思考预算。优质模式可获得更高质量回复，标准模式依赖API默认。" : "当前模型不支持思考预算配置。"}>
                    <SlidersHorizontal size={20} className={`mr-2 ${supportsThinkingConfig && isThinkingBudgetActive ? 'text-sky-600' : 'text-gray-400'}`} />
                    <span className="mr-2 select-none font-medium">AI思考预算:</span>
                </label>
                <div className="flex items-center">
                     <button
                        id="thinkingBudgetToggleModal"
                        onClick={handleThinkingBudgetToggle}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${isLoading || !supportsThinkingConfig ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={isLoading || !supportsThinkingConfig}
                        role="switch"
                        aria-checked={isThinkingBudgetActive && supportsThinkingConfig}
                    >
                        <span className={`inline-block w-11 h-6 rounded-full ${supportsThinkingConfig ? (isThinkingBudgetActive ? 'bg-sky-500' : 'bg-gray-300') : 'bg-gray-200'}`}></span>
                        <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${supportsThinkingConfig && isThinkingBudgetActive ? 'translate-x-4' : ''}`}></span>
                    </button>
                    <span className="ml-3 select-none text-sm text-gray-600 min-w-[4rem] text-left">
                        {supportsThinkingConfig ? (isThinkingBudgetActive ? '优质' : '标准') : 'N/A'}
                    </span>
                </div>
            </div>
             {!supportsThinkingConfig && (
                <p className="text-xs text-gray-500 mt-1 pl-7">当前选定模型不支持思考预算配置。</p>
            )}
          </section>

          {/* AI Persona Settings Section */}
          <section aria-labelledby="persona-settings-heading">
            <h3 id="persona-settings-heading" className="text-lg font-medium text-gray-800 mb-1 border-b pb-2">AI 角色设定 (系统提示词)</h3>
            {!supportsSystemInstruction && (
              <div className="mt-2 mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-700 flex items-start">
                <Info size={18} className="mr-2 mt-0.5 shrink-0" />
                当前选定模型不支持自定义系统提示词。以下设置将无效。
              </div>
            )}
            
            <div className="space-y-5 mt-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="cognitoPrompt" className="block text-sm font-medium text-gray-700">Cognito (逻辑AI) 提示词:</label>
                    <button 
                        onClick={onResetCognitoPrompt}
                        disabled={isLoading || !supportsSystemInstruction}
                        className="text-xs text-sky-600 hover:text-sky-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5"
                        title="重置为默认提示词"
                    >
                        <RotateCcw size={14} className="mr-1" /> 重置
                    </button>
                </div>
                <textarea
                  id="cognitoPrompt"
                  value={cognitoSystemPrompt}
                  onChange={onCognitoPromptChange}
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={isLoading || !supportsSystemInstruction}
                  aria-label="Cognito系统提示词"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="musePrompt" className="block text-sm font-medium text-gray-700">Muse (创意AI) 提示词:</label>
                     <button 
                        onClick={onResetMusePrompt}
                        disabled={isLoading || !supportsSystemInstruction}
                        className="text-xs text-sky-600 hover:text-sky-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5"
                        title="重置为默认提示词"
                    >
                        <RotateCcw size={14} className="mr-1" /> 重置
                    </button>
                </div>
                <textarea
                  id="musePrompt"
                  value={museSystemPrompt}
                  onChange={onMusePromptChange}
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={isLoading || !supportsSystemInstruction}
                  aria-label="Muse系统提示词"
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="p-4 border-t border-gray-300 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:bg-sky-300"
            disabled={isLoading}
            aria-label="完成并关闭设置"
          >
            完成
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
