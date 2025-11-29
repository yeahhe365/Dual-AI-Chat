
import React from 'react';
import { DiscussionMode } from '../../types';
import { Repeat, Zap, Layers, Cpu, Sparkles, ExternalLink } from 'lucide-react';
import { ThinkingControl } from './ThinkingControl';
import ModelSelector from '../ModelSelector';
import { MODELS } from '../../constants';

interface DiscussionSettingsProps {
  isLoading: boolean;
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

  actualSupportsThinkingConfig: boolean;
  currentCognitoModelApiName: string; 
  currentMuseModelApiName: string;

  // Model Selection Props
  onCognitoModelChange: (modelId: string) => void;
  onMuseModelChange: (modelId: string) => void;
  useOpenAiApiConfig: boolean;
}

const DiscussionSettings: React.FC<DiscussionSettingsProps> = ({
  isLoading,
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
  actualSupportsThinkingConfig,
  currentCognitoModelApiName,
  currentMuseModelApiName,
  onCognitoModelChange,
  onMuseModelChange,
  useOpenAiApiConfig
}) => {
  
  return (
    <div className="space-y-8">

      {/* 0. Model Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Cpu size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">模型选择</h4>
        </div>
        
        {useOpenAiApiConfig ? (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                <ExternalLink size={18} />
             </div>
             <div>
                <h5 className="text-sm font-bold text-indigo-800">正在使用 OpenAI 兼容模式</h5>
                <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
                   在此模式下，模型 ID 需要在 <strong>Key</strong> 选项卡中手动指定，无法使用下列选择器。
                </p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-semibold text-teal-700 mb-2 ml-1">Cognito (逻辑)</label>
                  <ModelSelector
                    label="Cognito"
                    icon={Cpu}
                    value={currentCognitoModelApiName}
                    onChange={onCognitoModelChange}
                    models={MODELS}
                    disabled={isLoading}
                    colorTheme="teal"
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-fuchsia-700 mb-2 ml-1">Muse (创意)</label>
                  <ModelSelector
                    label="Muse"
                    icon={Sparkles}
                    value={currentMuseModelApiName}
                    onChange={onMuseModelChange}
                    models={MODELS}
                    disabled={isLoading}
                    colorTheme="fuchsia"
                  />
              </div>
          </div>
        )}
      </section>
      
      {/* 1. Discussion Flow Control */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Layers size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">流程控制</h4>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex relative select-none">
           <button 
             onClick={() => !isLoading && onDiscussionModeChange(DiscussionMode.AiDriven)}
             className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 ${
               discussionMode === DiscussionMode.AiDriven 
               ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
               : 'text-slate-500 hover:text-slate-700'
             }`}
             disabled={isLoading}
           >
              <div className="flex items-center gap-2 mb-0.5">
                 <Zap size={16} className={discussionMode === DiscussionMode.AiDriven ? 'fill-amber-400 text-amber-500' : ''} />
                 <span className="font-semibold text-sm">AI 驱动</span>
              </div>
              <span className="text-[10px] opacity-60">自动检测结束</span>
           </button>

           <button 
             onClick={() => !isLoading && onDiscussionModeChange(DiscussionMode.FixedTurns)}
             className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 ${
               discussionMode === DiscussionMode.FixedTurns 
               ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
               : 'text-slate-500 hover:text-slate-700'
             }`}
             disabled={isLoading}
           >
              <div className="flex items-center gap-2 mb-0.5">
                 <Repeat size={16} className={discussionMode === DiscussionMode.FixedTurns ? 'text-indigo-500' : ''} />
                 <span className="font-semibold text-sm">固定轮次</span>
              </div>
              <span className="text-[10px] opacity-60">指定轮次数量</span>
           </button>
        </div>

        {/* Fixed Turns Slider (Conditional) */}
        {discussionMode === DiscussionMode.FixedTurns && (
          <div className="mt-4 bg-white rounded-xl p-5 border border-slate-200 animate-in slide-in-from-top-1 fade-in duration-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">每位 AI 轮次</span>
                <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                  {manualFixedTurns}
                </span>
             </div>
             <input
                type="range"
                min={minManualFixedTurns}
                max="10"
                value={manualFixedTurns}
                onChange={onManualFixedTurnsChange}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600"
                disabled={isLoading}
             />
             <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                <span>{minManualFixedTurns} 最小</span>
                <span>10 最大</span>
             </div>
          </div>
        )}
      </section>

      {/* 2. Advanced Thinking Section */}
      <section className="space-y-6">
         <div>
            <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Cognito 思考过程</h4>
             <ThinkingControl 
              modelId={currentCognitoModelApiName}
              thinkingBudget={cognitoThinkingBudget}
              setThinkingBudget={setCognitoThinkingBudget}
              thinkingLevel={cognitoThinkingLevel}
              setThinkingLevel={setCognitoThinkingLevel}
              disabled={isLoading || !actualSupportsThinkingConfig}
            />
         </div>

         <div>
            <h4 className="text-xs font-bold text-fuchsia-600 uppercase tracking-wider mb-2">Muse 思考过程</h4>
             <ThinkingControl 
              modelId={currentMuseModelApiName}
              thinkingBudget={museThinkingBudget}
              setThinkingBudget={setMuseThinkingBudget}
              thinkingLevel={museThinkingLevel}
              setThinkingLevel={setMuseThinkingLevel}
              disabled={isLoading || !actualSupportsThinkingConfig}
            />
         </div>
      </section>
    </div>
  );
};

export default DiscussionSettings;
