
import React, { useState, useRef, useEffect } from 'react';
import { DiscussionMode } from '../types';
import { X, Settings as SettingsIcon, KeyRound, Cpu, Monitor, Info } from 'lucide-react';
import ApiSettings from './settings/ApiSettings';
import DiscussionSettings from './settings/DiscussionSettings';
import PersonaSettings from './settings/PersonaSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import AboutSettings from './settings/AboutSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussionMode: DiscussionMode;
  onDiscussionModeChange: (mode: DiscussionMode) => void;
  manualFixedTurns: number;
  onManualFixedTurnsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minManualFixedTurns: number;
  
  // Thinking Props
  cognitoThinkingBudget: number;
  setCognitoThinkingBudget: (val: number) => void;
  cognitoThinkingLevel: 'LOW' | 'HIGH';
  setCognitoThinkingLevel: (val: 'LOW' | 'HIGH') => void;
  
  museThinkingBudget: number;
  setMuseThinkingBudget: (val: number) => void;
  museThinkingLevel: 'LOW' | 'HIGH';
  setMuseThinkingLevel: (val: 'LOW' | 'HIGH') => void;

  supportsThinkingConfig: boolean; // General flag, though actual components check models individually
  
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
  
  // Model IDs for thinking control
  currentCognitoModelApiName: string; 
  currentMuseModelApiName: string;

  // Model Selectors
  onCognitoModelChange: (modelId: string) => void;
  onMuseModelChange: (modelId: string) => void;
}

type SettingsTab = 'model' | 'interface' | 'key' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  discussionMode,
  onDiscussionModeChange,
  manualFixedTurns,
  onManualFixedTurnsChange,
  minManualFixedTurns,
  cognitoThinkingBudget,
  setCognitoThinkingBudget,
  cognitoThinkingLevel,
  setCognitoThinkingLevel,
  museThinkingBudget,
  setMuseThinkingBudget,
  museThinkingLevel,
  setMuseThinkingLevel,
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
  currentCognitoModelApiName,
  currentMuseModelApiName,
  onCognitoModelChange,
  onMuseModelChange
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('model');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actualSupportsThinkingConfig = supportsThinkingConfig && !useOpenAiApiConfig;

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'model', label: '模型', icon: Cpu },
    { id: 'interface', label: '界面', icon: Monitor },
    { id: 'key', label: 'Key', icon: KeyRound },
    { id: 'about', label: '关于', icon: Info },
  ];

  const renderTabContent = () => {
    const animClass = "animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both";
    switch (activeTab) {
        case 'model':
            return (
                <div className={`${animClass} space-y-10`}>
                    <DiscussionSettings
                        isLoading={isLoading}
                        discussionMode={discussionMode}
                        onDiscussionModeChange={onDiscussionModeChange}
                        manualFixedTurns={manualFixedTurns}
                        onManualFixedTurnsChange={onManualFixedTurnsChange}
                        minManualFixedTurns={minManualFixedTurns}
                        
                        cognitoThinkingBudget={cognitoThinkingBudget}
                        setCognitoThinkingBudget={setCognitoThinkingBudget}
                        cognitoThinkingLevel={cognitoThinkingLevel}
                        setCognitoThinkingLevel={setCognitoThinkingLevel}
                        
                        museThinkingBudget={museThinkingBudget}
                        setMuseThinkingBudget={setMuseThinkingBudget}
                        museThinkingLevel={museThinkingLevel}
                        setMuseThinkingLevel={setMuseThinkingLevel}
                        
                        actualSupportsThinkingConfig={actualSupportsThinkingConfig}
                        currentCognitoModelApiName={currentCognitoModelApiName}
                        currentMuseModelApiName={currentMuseModelApiName}

                        onCognitoModelChange={onCognitoModelChange}
                        onMuseModelChange={onMuseModelChange}
                        useOpenAiApiConfig={useOpenAiApiConfig}
                    />
                    <div className="w-full h-px bg-slate-100"></div>
                    <PersonaSettings
                        isLoading={isLoading}
                        supportsSystemInstruction={supportsSystemInstruction}
                        cognitoSystemPrompt={cognitoSystemPrompt}
                        onCognitoPromptChange={onCognitoPromptChange}
                        onResetCognitoPrompt={onResetCognitoPrompt}
                        museSystemPrompt={museSystemPrompt}
                        onMusePromptChange={onMusePromptChange}
                        onResetMusePrompt={onResetMusePrompt}
                    />
                </div>
            );
        case 'interface':
            return (
                <div className={animClass}>
                    <AppearanceSettings
                        isLoading={isLoading}
                        fontSizeScale={fontSizeScale}
                        onFontSizeScaleChange={onFontSizeScaleChange}
                    />
                </div>
            );
        case 'key':
            return (
                <div className={animClass}>
                    <ApiSettings
                        isLoading={isLoading}
                        useCustomApiConfig={useCustomApiConfig}
                        onUseCustomApiConfigChange={onUseCustomApiConfigChange}
                        customApiEndpoint={customApiEndpoint}
                        onCustomApiEndpointChange={onCustomApiEndpointChange}
                        customApiKey={customApiKey}
                        onCustomApiKeyChange={onCustomApiKeyChange}
                        useOpenAiApiConfig={useOpenAiApiConfig}
                        onUseOpenAiApiConfigChange={onUseOpenAiApiConfigChange}
                        openAiApiBaseUrl={openAiApiBaseUrl}
                        onOpenAiApiBaseUrlChange={onOpenAiApiBaseUrlChange}
                        openAiApiKey={openAiApiKey}
                        onOpenAiApiKeyChange={onOpenAiApiKeyChange}
                        openAiCognitoModelId={openAiCognitoModelId}
                        onOpenAiCognitoModelIdChange={onOpenAiCognitoModelIdChange}
                        openAiMuseModelId={openAiMuseModelId}
                        onOpenAiMuseModelIdChange={onOpenAiMuseModelIdChange}
                    />
                </div>
            );
        case 'about':
            return (
                <div className={animClass}>
                    <AboutSettings />
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full h-[100dvh] sm:h-[85vh] max-h-[800px] sm:w-[90vw] max-w-6xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all">
        
        {/* Sidebar */}
        <aside className="flex-shrink-0 w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-5 flex-shrink-0">
                 <div className="hidden md:flex font-bold text-slate-800 items-center gap-2 text-lg">
                    <SettingsIcon size={20} className="text-slate-500" />
                    设置
                 </div>
                 {/* Mobile Close Button */}
                 <button 
                    ref={closeButtonRef}
                    onClick={onClose} 
                    className="md:hidden p-2 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                    aria-label="关闭设置"
                 >
                    <X size={20} strokeWidth={2} />
                 </button>
                 <span className="md:hidden font-semibold text-slate-800">设置</span>
                 <div className="w-8 md:hidden"></div>
            </div>
            
            {/* Navigation List */}
            <nav className="flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden custom-scrollbar px-2 pb-2 md:px-3 md:pb-3 flex md:flex-col gap-1 md:gap-1.5" role="tablist">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 text-sm font-medium rounded-lg transition-all outline-none select-none w-auto md:w-full text-left
                            ${isActive
                                ? 'bg-slate-200/60 text-slate-900' 
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }
                            focus-visible:ring-2 focus-visible:ring-slate-400
                            `}
                            role="tab"
                            aria-selected={isActive}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-slate-800" : "text-slate-400"} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
             {/* Desktop Header */}
             <header className="hidden md:flex items-center justify-between px-8 py-6 border-b border-slate-100 flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <button 
                    onClick={onClose} 
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                    aria-label="关闭"
                >
                    <X size={24} strokeWidth={2} />
                </button>
             </header>
             
             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar bg-white">
                <div className="max-w-3xl mx-auto pb-8">
                    {renderTabContent()}
                </div>
             </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsModal;
