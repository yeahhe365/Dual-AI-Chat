
import React, { useState, useEffect } from 'react';
import { Info, Cpu, Zap, Settings2, Ban, Gauge, Calculator, Sparkles } from 'lucide-react';
import { THINKING_BUDGET_RANGES, GEMINI_3_RO_MODELS } from '../../constants';

interface ThinkingControlProps {
  modelId: string;
  thinkingBudget: number;
  setThinkingBudget: (value: number) => void;
  thinkingLevel: 'LOW' | 'HIGH';
  setThinkingLevel: (value: 'LOW' | 'HIGH') => void;
  disabled: boolean;
}

export const ThinkingControl: React.FC<ThinkingControlProps> = ({
  modelId,
  thinkingBudget,
  setThinkingBudget,
  thinkingLevel,
  setThinkingLevel,
  disabled
}) => {
  const isGemini3 = GEMINI_3_RO_MODELS.includes(modelId) || modelId.includes('gemini-3-pro');
  const budgetConfig = THINKING_BUDGET_RANGES[modelId];
  
  const [customBudgetValue, setCustomBudgetValue] = useState(
    thinkingBudget > 0 ? String(thinkingBudget) : '1024'
  );
  
  const mode = thinkingBudget < 0 ? 'auto' : thinkingBudget === 0 ? 'off' : 'custom';
  const showThinkingControls = !!budgetConfig || isGemini3;

  useEffect(() => {
    if (thinkingBudget > 0) {
        setCustomBudgetValue(String(thinkingBudget));
    }
  }, [thinkingBudget]);

  const handleModeChange = (newMode: 'auto' | 'off' | 'custom') => {
      if (newMode === 'auto') {
          setThinkingBudget(-1);
      } else if (newMode === 'off') {
          setThinkingBudget(0);
      } else {
          if (budgetConfig && !isGemini3) {
              setThinkingBudget(budgetConfig.max);
          } else {
              const budget = parseInt(customBudgetValue, 10);
              const newBudget = budget > 0 ? budget : 1024;
              if (String(newBudget) !== customBudgetValue) setCustomBudgetValue(String(newBudget));
              setThinkingBudget(newBudget);
          }
      }
  };

  const handleCustomBudgetChange = (val: string) => {
      setCustomBudgetValue(val);
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal) && numVal > 0) {
          setThinkingBudget(numVal);
      }
  };

  if (!showThinkingControls) return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
        <p className="text-xs text-slate-400">
            所选模型不支持思考配置。
        </p>
    </div>
  );

  const showContent = (isGemini3 && mode === 'auto') || mode === 'custom' || mode === 'off';

  return (
    <div className={`space-y-3 pt-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Cpu size={16} className="text-sky-500" strokeWidth={2} />
                    思考过程
                </label>
                {mode !== 'off' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                        {isGemini3 ? 'Gemini 3.0 逻辑' : '思考已启用'}
                    </span>
                )}
            </div>
            
            {/* Segmented Control */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg select-none">
                <button
                    onClick={() => handleModeChange('auto')}
                    className={`flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${
                        mode === 'auto'
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Sparkles size={14} className={mode === 'auto' ? 'text-sky-500' : 'opacity-70'} />
                    {isGemini3 ? '预设' : '自动'}
                </button>

                <button
                    onClick={() => handleModeChange('custom')}
                    className={`flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${
                        mode === 'custom'
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Settings2 size={14} className={mode === 'custom' ? 'text-amber-500' : 'opacity-70'} />
                    自定义
                </button>

                <button
                    onClick={() => handleModeChange('off')}
                    className={`flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${
                        mode === 'off'
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Ban size={14} className={mode === 'off' ? 'text-red-500' : 'opacity-70'} />
                    关闭
                </button>
            </div>

            {/* Sub-controls */}
            {showContent && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    
                    {isGemini3 && mode === 'auto' && setThinkingLevel && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Gauge size={12} /> 强度级别
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <LevelButton 
                                    active={thinkingLevel === 'LOW'} 
                                    onClick={() => setThinkingLevel('LOW')} 
                                    label="低" 
                                    desc="较快"
                                    icon={<Zap size={14} />}
                                />
                                <LevelButton 
                                    active={thinkingLevel === 'HIGH'} 
                                    onClick={() => setThinkingLevel('HIGH')} 
                                    label="高" 
                                    desc="较深"
                                    icon={<Cpu size={14} />}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Calculator size={12} /> Token 预算
                                </label>
                                <span className="text-xs font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                    {parseInt(customBudgetValue).toLocaleString()} tokens
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1024"
                                    max="32768"
                                    step="1024"
                                    value={customBudgetValue}
                                    onChange={(e) => handleCustomBudgetChange(e.target.value)}
                                    className="flex-grow h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-600"
                                />
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={customBudgetValue}
                                        onChange={(e) => handleCustomBudgetChange(e.target.value)}
                                        className="w-full py-1 px-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'off' && (
                        <div className="flex items-center justify-center py-1">
                            <p className="text-xs text-slate-400 italic flex items-center gap-2">
                                思考过程已禁用。
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

const LevelButton = ({ active, onClick, label, desc, icon }: { active: boolean, onClick: () => void, label: string, desc: string, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-start p-3 rounded-lg border transition-all duration-200 text-left ${
            active
            ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-500 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
    >
        <div className={`flex items-center gap-2 mb-1 ${active ? 'text-sky-600' : 'text-slate-600'}`}>
            {icon}
            <span className="text-sm font-bold">{label}</span>
        </div>
        <span className="text-[10px] text-slate-500 leading-tight">{desc}</span>
    </button>
);
