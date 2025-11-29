
import React from 'react';
import { Info, RotateCcw, Cpu, Sparkles, UserCircle } from 'lucide-react';

interface PersonaSettingsProps {
  isLoading: boolean;
  supportsSystemInstruction: boolean;
  cognitoSystemPrompt: string;
  onCognitoPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onResetCognitoPrompt: () => void;
  museSystemPrompt: string;
  onMusePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onResetMusePrompt: () => void;
}

const PersonaCard = ({ 
  title, 
  subtitle,
  icon: Icon, 
  value, 
  onChange, 
  onReset, 
  disabled, 
  colorClass, 
  bgClass,
  borderColorClass
}: { 
  title: string, 
  subtitle: string,
  icon: any, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, 
  onReset: () => void, 
  disabled: boolean, 
  colorClass: string,
  bgClass: string,
  borderColorClass: string
}) => (
  <div className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
    {/* Header */}
    <div className={`px-6 py-5 ${bgClass} border-b ${borderColorClass} flex justify-between items-center`}>
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${colorClass}`}>
             <Icon size={20} strokeWidth={2.5} />
          </div>
          <div>
             <h4 className={`text-base font-bold ${colorClass}`}>{title}</h4>
             <p className={`text-xs font-medium opacity-80 ${colorClass}`}>{subtitle}</p>
          </div>
       </div>
       <button
        onClick={onReset}
        disabled={disabled}
        className="p-2 rounded-lg bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 transition-colors backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 disabled:opacity-0 focus:opacity-100"
        title="重置为默认"
      >
        <RotateCcw size={14} />
      </button>
    </div>

    {/* Body */}
    <div className="p-1 flex-1 bg-slate-50/30">
      <textarea
        value={value}
        onChange={onChange}
        className="w-full h-full min-h-[180px] p-5 bg-transparent border-none focus:ring-0 text-sm leading-relaxed text-slate-700 resize-none outline-none font-mono"
        disabled={disabled}
        placeholder={`定义系统指令...`}
        spellCheck={false}
      />
    </div>
    
    {/* Footer Status */}
    <div className="px-5 py-2 bg-white border-t border-slate-100 flex justify-between items-center">
       <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          <div className="w-2 h-2 rounded-full bg-slate-200"></div>
       </div>
       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
         {value.length} 字符
       </span>
    </div>
  </div>
);

const PersonaSettings: React.FC<PersonaSettingsProps> = ({
  isLoading,
  supportsSystemInstruction,
  cognitoSystemPrompt,
  onCognitoPromptChange,
  onResetCognitoPrompt,
  museSystemPrompt,
  onMusePromptChange,
  onResetMusePrompt,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
           <UserCircle size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">AI 角色定义</h4>
      </div>

      {!supportsSystemInstruction && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start shadow-sm mb-6">
          <Info size={18} className="mr-2 mt-0.5 shrink-0" />
          <span>当前选择的模型不支持系统指令。这些设置将被忽略。</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonaCard
          title="Cognito"
          subtitle="逻辑与分析引擎"
          icon={Cpu}
          value={cognitoSystemPrompt}
          onChange={onCognitoPromptChange}
          onReset={onResetCognitoPrompt}
          disabled={isLoading || !supportsSystemInstruction}
          colorClass="text-teal-700"
          bgClass="bg-gradient-to-r from-teal-50 to-teal-100/30"
          borderColorClass="border-teal-100"
        />

        <PersonaCard
          title="Muse"
          subtitle="创意与质疑引擎"
          icon={Sparkles}
          value={museSystemPrompt}
          onChange={onMusePromptChange}
          onReset={onResetMusePrompt}
          disabled={isLoading || !supportsSystemInstruction}
          colorClass="text-fuchsia-700"
          bgClass="bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/30"
          borderColorClass="border-fuchsia-100"
        />
      </div>
      
      <p className="text-xs text-slate-400 text-center pt-2 italic">
         修改系统指令可能会显著改变 AI 的个性和回答风格。
      </p>
    </div>
  );
};

export default PersonaSettings;
