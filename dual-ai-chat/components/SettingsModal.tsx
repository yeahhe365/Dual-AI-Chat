
import React from 'react';
import { DiscussionMode } from '../types';
import { MIN_MANUAL_FIXED_TURNS } from '../constants'; 
import { X, Bot, MessagesSquare, SlidersHorizontal, Info, RotateCcw, CaseSensitive, KeyRound, Globe, Settings, Database, Brain, Sparkles } from 'lucide-react'; 

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
  
  // Gemini Custom API
  useCustomApiConfig: boolean; 
  onUseCustomApiConfigChange: () => void; 
  customApiEndpoint: string;
  onCustomApiEndpointChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customApiKey: string;
  onCustomApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // OpenAI Custom API
  useOpenAiApiConfig: boolean;
  onUseOpenAiApiConfigChange: () => void;
  openAiApiBaseUrl: string;
  onOpenAiApiBaseUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openAiApiKey: string;
  onOpenAiApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openAiCognitoModelId: string;
  onOpenAiCognitoModelIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openAiMuseModelId: string;
  onOpenAiMuseModelIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  useCustomApiConfig, 
  onUseCustomApiConfigChange, 
  customApiEndpoint,
  onCustomApiEndpointChange,
  customApiKey,
  onCustomApiKeyChange,
  useOpenAiApiConfig,
  onUseOpenAiApiConfigChange,
  openAiApiBaseUrl,
  onOpenAiApiBaseUrlChange,
  openAiApiKey,
  onOpenAiApiKeyChange,
  openAiCognitoModelId,
  onOpenAiCognitoModelIdChange,
  openAiMuseModelId,
  onOpenAiMuseModelIdChange,
}) => {
  if (!isOpen) return null;

  const handleDiscussionModeToggle = () => {
    if (!isLoading) {
      onDiscussionModeChange(discussionMode === DiscussionMode.FixedTurns ? DiscussionMode.AiDriven : DiscussionMode.FixedTurns);
    }
  };
  
  const actualSupportsThinkingConfig = supportsThinkingConfig && !useOpenAiApiConfig;
  const handleThinkingBudgetToggle = () => {
    if (!isLoading && actualSupportsThinkingConfig) {
      onThinkingBudgetToggle();
    }
  };

  const handleUseCustomGeminiApiConfigToggle = () => {
    if (!isLoading) {
      onUseCustomApiConfigChange(); 
    }
  }

  const handleUseOpenAiApiConfigToggle = () => {
    if (!isLoading) {
      onUseOpenAiApiConfigChange(); 
    }
  }

  const inputBaseClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";
  const sectionHeadingClass = "text-lg font-medium text-gray-800 mb-3 border-b pb-2";
  const toggleLabelBaseClass = "flex items-center text-sm font-medium";
  const toggleButtonContainerClass = "flex items-center";
  const toggleButtonClass = "relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500";
  const toggleButtonSwitchClass = "inline-block w-11 h-6 rounded-full";
  const toggleButtonKnobClass = "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform";
  const toggleTextClass = "ml-3 select-none text-sm text-gray-600 min-w-[3rem] text-left";

  return (
    <div 
        className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
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
          {/* API Configuration Section */}
          <section aria-labelledby="api-config-settings-heading">
            <h3 id="api-config-settings-heading" className={sectionHeadingClass}>API 配置</h3>
            <div className="space-y-5">
              {/* Gemini Custom API */}
              <div className={`p-4 border rounded-lg ${useCustomApiConfig ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="useCustomGeminiApiToggle" className={`${toggleLabelBaseClass} ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-sky-600'}`}
                    title={useCustomApiConfig ? "禁用自定义Gemini API配置" : "启用自定义Gemini API配置"}>
                    <Settings size={20} className="mr-2 text-sky-600" />
                    <span className="select-none">使用自定义 Gemini API 配置:</span>
                  </label>
                  <div className={toggleButtonContainerClass}>
                      <button
                          id="useCustomGeminiApiToggle"
                          onClick={handleUseCustomGeminiApiConfigToggle}
                          className={`${toggleButtonClass} ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                          disabled={isLoading} role="switch" aria-checked={useCustomApiConfig} >
                          <span className={`${toggleButtonSwitchClass} ${useCustomApiConfig ? 'bg-sky-500' : 'bg-gray-300'}`}></span>
                          <span className={`${toggleButtonKnobClass} ${useCustomApiConfig ? 'translate-x-4' : ''}`}></span>
                      </button>
                      <span className={toggleTextClass}>{useCustomApiConfig ? '开启' : '关闭'}</span>
                  </div>
                </div>
                <div className="space-y-3 pl-1">
                  <div>
                    <label htmlFor="customApiEndpoint" className={`flex items-center text-sm font-medium mb-1 ${useCustomApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <Globe size={16} className={`mr-2 ${useCustomApiConfig ? 'text-sky-600' : 'text-gray-400'}`} />
                      Gemini API 端点 (可选)
                    </label>
                    <input type="text" id="customApiEndpoint" value={customApiEndpoint} onChange={onCustomApiEndpointChange} className={inputBaseClass}
                      placeholder="例如: https://my-proxy.com/gemini" disabled={isLoading || !useCustomApiConfig} aria-label="自定义 Gemini API 端点" />
                    <p className={`text-xs mt-1 ${useCustomApiConfig ? 'text-gray-500' : 'text-gray-400'}`}>若留空，将使用默认 Google API 端点。</p>
                  </div>
                  <div>
                    <label htmlFor="customApiKey" className={`flex items-center text-sm font-medium mb-1 ${useCustomApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <KeyRound size={16} className={`mr-2 ${useCustomApiConfig ? 'text-sky-600' : 'text-gray-400'}`} />
                      Gemini API 密钥
                    </label>
                    <input type="password" id="customApiKey" value={customApiKey} onChange={onCustomApiKeyChange} className={inputBaseClass}
                      placeholder="输入您的 Gemini API 密钥" disabled={isLoading || !useCustomApiConfig} aria-label="自定义 Gemini API 密钥" required={useCustomApiConfig} />
                  </div>
                </div>
              </div>

              {/* OpenAI-Compatible API */}
              <div className={`p-4 border rounded-lg ${useOpenAiApiConfig ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                   <label htmlFor="useOpenAiApiToggle" className={`${toggleLabelBaseClass} ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-indigo-600'}`}
                    title={useOpenAiApiConfig ? "禁用OpenAI API配置" : "启用OpenAI API配置 (例如本地Ollama, LM Studio)"}>
                    <Database size={20} className="mr-2 text-indigo-600" />
                    <span className="select-none">使用 OpenAI 兼容 API 配置:</span>
                  </label>
                  <div className={toggleButtonContainerClass}>
                      <button
                          id="useOpenAiApiToggle"
                          onClick={handleUseOpenAiApiConfigToggle}
                          className={`${toggleButtonClass} ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                          disabled={isLoading} role="switch" aria-checked={useOpenAiApiConfig} >
                          <span className={`${toggleButtonSwitchClass} ${useOpenAiApiConfig ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
                          <span className={`${toggleButtonKnobClass} ${useOpenAiApiConfig ? 'translate-x-4' : ''}`}></span>
                      </button>
                      <span className={toggleTextClass}>{useOpenAiApiConfig ? '开启' : '关闭'}</span>
                  </div>
                </div>
                <div className="space-y-3 pl-1">
                  <div>
                    <label htmlFor="openAiApiBaseUrl" className={`flex items-center text-sm font-medium mb-1 ${useOpenAiApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <Globe size={16} className={`mr-2 ${useOpenAiApiConfig ? 'text-indigo-600' : 'text-gray-400'}`} />
                      API 基地址 (Base URL)
                    </label>
                    <input type="text" id="openAiApiBaseUrl" value={openAiApiBaseUrl} onChange={onOpenAiApiBaseUrlChange} className={inputBaseClass}
                      placeholder="例如: http://localhost:11434/v1" disabled={isLoading || !useOpenAiApiConfig} aria-label="OpenAI API 基地址" required={useOpenAiApiConfig}/>
                  </div>
                  <div>
                    <label htmlFor="openAiApiKey" className={`flex items-center text-sm font-medium mb-1 ${useOpenAiApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <KeyRound size={16} className={`mr-2 ${useOpenAiApiConfig ? 'text-indigo-600' : 'text-gray-400'}`} />
                      API 密钥 (可选)
                    </label>
                    <input type="password" id="openAiApiKey" value={openAiApiKey} onChange={onOpenAiApiKeyChange} className={inputBaseClass}
                      placeholder="输入您的 OpenAI API 密钥 (部分服务可能不需要)" disabled={isLoading || !useOpenAiApiConfig} aria-label="OpenAI API 密钥" />
                  </div>
                  <div>
                    <label htmlFor="openAiCognitoModelId" className={`flex items-center text-sm font-medium mb-1 ${useOpenAiApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <Brain size={16} className={`mr-2 ${useOpenAiApiConfig ? 'text-indigo-600' : 'text-gray-400'}`} />
                      Cognito 模型 ID
                    </label>
                    <input type="text" id="openAiCognitoModelId" value={openAiCognitoModelId} onChange={onOpenAiCognitoModelIdChange} className={inputBaseClass}
                      placeholder="例如: llama3, gpt-4-turbo" disabled={isLoading || !useOpenAiApiConfig} aria-label="OpenAI Cognito 模型 ID" required={useOpenAiApiConfig}/>
                  </div>
                  <div>
                    <label htmlFor="openAiMuseModelId" className={`flex items-center text-sm font-medium mb-1 ${useOpenAiApiConfig ? 'text-gray-700' : 'text-gray-400'}`}>
                      <Sparkles size={16} className={`mr-2 ${useOpenAiApiConfig ? 'text-purple-600' : 'text-gray-400'}`} />
                      Muse 模型 ID
                    </label>
                    <input type="text" id="openAiMuseModelId" value={openAiMuseModelId} onChange={onOpenAiMuseModelIdChange} className={inputBaseClass}
                      placeholder="例如: llama3, gpt-3.5-turbo" disabled={isLoading || !useOpenAiApiConfig} aria-label="OpenAI Muse 模型 ID" required={useOpenAiApiConfig}/>
                  </div>
                </div>
              </div>
              
              {!useCustomApiConfig && !useOpenAiApiConfig && (
                <p className="text-xs text-gray-600 text-center mt-1 p-2 bg-gray-100 rounded-md">当前配置为使用环境变量中的 Google Gemini API 密钥。</p>
              )}
            </div>
          </section>

          {/* Font Size Settings Section */}
          <section aria-labelledby="font-size-settings-heading">
            <h3 id="font-size-settings-heading" className={sectionHeadingClass}>文字大小</h3>
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
            <h3 id="discussion-settings-heading" className={sectionHeadingClass}>讨论设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="discussionModeToggleModal" className={`${toggleLabelBaseClass} ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-sky-600'}`}
                  title={discussionMode === DiscussionMode.FixedTurns ? "切换到AI驱动轮次模式" : "切换到固定轮次模式"}>
                  {discussionMode === DiscussionMode.FixedTurns ? <MessagesSquare size={20} className="mr-2 text-sky-600" /> : <Bot size={20} className="mr-2 text-sky-600" />}
                  <span className="select-none">对话轮数模式:</span>
                </label>
                <div className={toggleButtonContainerClass}>
                    <button
                        id="discussionModeToggleModal"
                        onClick={handleDiscussionModeToggle}
                         className={`${toggleButtonClass} ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={isLoading} role="switch" aria-checked={discussionMode === DiscussionMode.AiDriven}>
                        <span className={`${toggleButtonSwitchClass} ${discussionMode === DiscussionMode.AiDriven ? 'bg-sky-500' : 'bg-gray-300'}`}></span>
                        <span className={`${toggleButtonKnobClass} ${discussionMode === DiscussionMode.AiDriven ? 'translate-x-4' : ''}`}></span>
                    </button>
                    <span className={toggleTextClass}>
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
            <h3 id="performance-settings-heading" className={sectionHeadingClass}>模型性能</h3>
            <div className="flex items-center justify-between">
                <label htmlFor="thinkingBudgetToggleModal"
                    className={`${toggleLabelBaseClass} transition-opacity ${isLoading || !actualSupportsThinkingConfig ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-sky-600'}`}
                    title={actualSupportsThinkingConfig ? "切换AI思考预算 (仅Gemini Flash/Pro模型)。优质模式可获得更高质量回复。" : "当前模型或API配置不支持思考预算。"}>
                    <SlidersHorizontal size={20} className={`mr-2 ${actualSupportsThinkingConfig && isThinkingBudgetActive ? 'text-sky-600' : 'text-gray-400'}`} />
                    <span className="select-none">AI思考预算 (Gemini):</span>
                </label>
                <div className={toggleButtonContainerClass}>
                     <button
                        id="thinkingBudgetToggleModal"
                        onClick={handleThinkingBudgetToggle}
                        className={`${toggleButtonClass} ${isLoading || !actualSupportsThinkingConfig ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={isLoading || !actualSupportsThinkingConfig} role="switch" aria-checked={isThinkingBudgetActive && actualSupportsThinkingConfig}>
                        <span className={`${toggleButtonSwitchClass} ${actualSupportsThinkingConfig ? (isThinkingBudgetActive ? 'bg-sky-500' : 'bg-gray-300') : 'bg-gray-200'}`}></span>
                        <span className={`${toggleButtonKnobClass} ${actualSupportsThinkingConfig && isThinkingBudgetActive ? 'translate-x-4' : ''}`}></span>
                    </button>
                    <span className={toggleTextClass}>
                        {actualSupportsThinkingConfig ? (isThinkingBudgetActive ? '优质' : '标准') : 'N/A'}
                    </span>
                </div>
            </div>
             {!actualSupportsThinkingConfig && (
                <p className="text-xs text-gray-500 mt-1 pl-7">当前选定模型或API配置不支持思考预算功能。</p>
            )}
          </section>

          {/* AI Persona Settings Section */}
          <section aria-labelledby="persona-settings-heading">
            <h3 id="persona-settings-heading" className={`${sectionHeadingClass} mb-1`}>AI 角色设定 (系统提示词)</h3>
            {!supportsSystemInstruction && ( 
              <div className="mt-2 mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-700 flex items-start">
                <Info size={18} className="mr-2 mt-0.5 shrink-0" />
                当前选定模型或API配置可能不支持自定义系统提示词。以下设置可能无效。
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
                  rows={5}
                  className={`${inputBaseClass} resize-y min-h-[90px]`}
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
                  rows={5}
                  className={`${inputBaseClass} resize-y min-h-[90px]`}
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
