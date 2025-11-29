
import React, { useState } from 'react';
import { Globe, KeyRound, Database, Cpu, Sparkles, Check, CloudLightning, ShieldCheck, Info } from 'lucide-react';

interface ApiSettingsProps {
  isLoading: boolean;
  useCustomApiConfig: boolean;
  onUseCustomApiConfigChange: () => void;
  customApiEndpoint: string;
  onCustomApiEndpointChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customApiKey: string;
  onCustomApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

const Toggle = ({ checked, onChange, id }: { checked: boolean, onChange: () => void, id?: string }) => (
  <label htmlFor={id} className={`flex items-center cursor-pointer relative`}>
    <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} />
    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
  </label>
);

const ProviderCard = ({ 
  isActive, 
  onToggle, 
  icon: Icon, 
  title, 
  description, 
  children,
  colorClass 
}: { 
  isActive: boolean, 
  onToggle: () => void, 
  icon: any, 
  title: string, 
  description: string, 
  children?: React.ReactNode,
  colorClass: string
}) => {
  return (
    <div className={`rounded-xl border transition-all duration-200 ${isActive ? `border-${colorClass}-500 bg-${colorClass}-50/10` : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-lg ${isActive ? `bg-${colorClass}-100 text-${colorClass}-600` : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{description}</p>
            </div>
        </div>
        <div className="flex-shrink-0 ml-4">
            <Toggle checked={isActive} onChange={onToggle} />
        </div>
      </div>
      
      {isActive && children && (
         <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className={`p-4 rounded-lg border border-${colorClass}-100 bg-white space-y-4`}>
              {children}
            </div>
         </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, disabled, type = "text", helper }: any) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
        <Icon size={16} />
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm text-slate-800 placeholder-slate-400 disabled:opacity-60"
        placeholder={placeholder} 
        disabled={disabled} 
      />
    </div>
    {helper && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Info size={10}/> {helper}</p>}
  </div>
);

const ApiSettings: React.FC<ApiSettingsProps> = ({
  isLoading,
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
  
  const isDefaultActive = !useCustomApiConfig && !useOpenAiApiConfig;

  // Handler wrapper to ensure mutual exclusion
  const handleDefaultClick = () => {
      if (!isDefaultActive) {
          if (useCustomApiConfig) onUseCustomApiConfigChange();
          if (useOpenAiApiConfig) onUseOpenAiApiConfigChange();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
           <KeyRound size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">配置</h4>
      </div>

      {/* 1. Default Google Env */}
      <ProviderCard
        isActive={isDefaultActive}
        onToggle={handleDefaultClick}
        icon={CloudLightning}
        title="标准 Google Gemini"
        description="使用环境变量中配置的 API 密钥。"
        colorClass="emerald"
      >
         <div className="flex items-center space-x-2 text-emerald-700 text-sm p-2 bg-emerald-50 rounded-md border border-emerald-100">
            <ShieldCheck size={16} />
            <span className="font-medium">正在使用系统环境变量</span>
         </div>
      </ProviderCard>

      {/* 2. Custom Gemini API */}
      <ProviderCard
        isActive={useCustomApiConfig}
        onToggle={() => !isLoading && onUseCustomApiConfigChange()}
        icon={Globe}
        title="自定义 Gemini API"
        description="连接到自定义代理或 Google Vertex AI 端点。"
        colorClass="sky"
      >
        <InputGroup label="API 端点 (Base URL)" icon={Globe} value={customApiEndpoint} onChange={onCustomApiEndpointChange} placeholder="https://generativelanguage.googleapis.com" disabled={isLoading} />
        <InputGroup label="API 密钥" icon={KeyRound} value={customApiKey} onChange={onCustomApiKeyChange} placeholder="AIzaSy..." disabled={isLoading} type="password" />
      </ProviderCard>

      {/* 3. OpenAI Compatible */}
      <ProviderCard
        isActive={useOpenAiApiConfig}
        onToggle={() => !isLoading && onUseOpenAiApiConfigChange()}
        icon={Database}
        title="OpenAI 兼容接口"
        description="连接到 Ollama, LM Studio 或 OpenAI。支持任意模型 ID。"
        colorClass="indigo"
      >
        <div className="grid grid-cols-1 gap-4">
             <InputGroup label="API 基地址" icon={Globe} value={openAiApiBaseUrl} onChange={onOpenAiApiBaseUrlChange} placeholder="http://localhost:11434/v1" disabled={isLoading} />
             <InputGroup label="API 密钥" icon={KeyRound} value={openAiApiKey} onChange={onOpenAiApiKeyChange} placeholder="sk-..." disabled={isLoading} type="password" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <InputGroup label="Cognito 模型 ID" icon={Cpu} value={openAiCognitoModelId} onChange={onOpenAiCognitoModelIdChange} placeholder="gpt-4o, llama3" disabled={isLoading} helper="逻辑模型" />
                <InputGroup label="Muse 模型 ID" icon={Sparkles} value={openAiMuseModelId} onChange={onOpenAiMuseModelIdChange} placeholder="gpt-3.5-turbo" disabled={isLoading} helper="创意模型" />
             </div>
        </div>
      </ProviderCard>
    </div>
  );
};

export default ApiSettings;
