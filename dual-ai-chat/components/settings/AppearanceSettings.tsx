
import React from 'react';
import { Type, Monitor } from 'lucide-react';

interface AppearanceSettingsProps {
  isLoading: boolean;
  fontSizeScale: number;
  onFontSizeScaleChange: (scale: number) => void;
}

const FONT_SIZE_OPTIONS = [
  { label: '紧凑', value: 0.875, desc: '小' },
  { label: '标准', value: 1.0, desc: '默认' },
  { label: '大', value: 1.125, desc: '大' },
  { label: '特大', value: 1.25, desc: '极大' },
];

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  isLoading,
  fontSizeScale,
  onFontSizeScaleChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
           <Monitor size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">显示选项</h4>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
           全局字体缩放
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {FONT_SIZE_OPTIONS.map((option) => {
            const isActive = fontSizeScale === option.value;
            return (
              <button
                key={option.value}
                onClick={() => !isLoading && onFontSizeScaleChange(option.value)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 border
                  ${isActive 
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/20' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <Type size={isActive ? 20 : 16} className={`mb-1.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">{option.label}</span>
                <span className="text-[10px] opacity-60 hidden sm:block mt-0.5">{option.desc}</span>
              </button>
            );
          })}
        </div>
        
        <div className="relative">
          <div className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            预览
          </div>
          <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden">
             <div style={{ fontSize: `${fontSizeScale}rem` }} className="transition-all duration-300 space-y-3">
                <div className="flex items-start space-x-3">
                   <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm shrink-0"></div>
                   <div className="space-y-2">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <p className="text-slate-700 leading-relaxed">
                        Dual AI Chat 界面可动态缩放。清晰易读对于跟踪 Cognito 和 Muse 之间的复杂讨论至关重要。
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;