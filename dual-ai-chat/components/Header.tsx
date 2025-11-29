
import React from 'react';
import { Bot, Cpu, Sparkles, Settings, RefreshCw, Layers } from 'lucide-react';
import { MODELS, AiModel } from '../constants';
import { FailedStepPayload } from '../types';
import ModelSelector from './ModelSelector';

interface HeaderProps {
  isNotepadFullscreen: boolean;
  useOpenAiApiConfig: boolean;
  openAiCognitoModelId: string;
  openAiMuseModelId: string;
  actualCognitoModelDetails: AiModel;
  actualMuseModelDetails: AiModel;
  selectedCognitoModelApiName: string;
  setSelectedCognitoModelApiName: (value: string) => void;
  selectedMuseModelApiName: string;
  setSelectedMuseModelApiName: (value: string) => void;
  isLoading: boolean;
  cancelRequestRef: React.MutableRefObject<boolean>;
  failedStepInfo: FailedStepPayload | null;
  openSettingsModal: () => void;
  handleClearChat: () => void;
}

const ModelBadge = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string, colorClass: string }) => (
  <div className={`flex items-center px-2 py-1 rounded-lg border bg-opacity-50 ${colorClass} backdrop-blur-sm`} title={`${label}: ${value}`}>
    <Icon size={14} className="mr-1.5 opacity-80" />
    <span className="text-xs font-semibold opacity-70 uppercase tracking-wider mr-1.5 hidden lg:inline">{label}</span>
    <span className="text-xs font-medium truncate max-w-[100px]">{value}</span>
  </div>
);

const Header: React.FC<HeaderProps> = ({
  isNotepadFullscreen,
  useOpenAiApiConfig,
  openAiCognitoModelId,
  openAiMuseModelId,
  actualCognitoModelDetails,
  actualMuseModelDetails,
  selectedCognitoModelApiName,
  setSelectedCognitoModelApiName,
  selectedMuseModelApiName,
  setSelectedMuseModelApiName,
  isLoading,
  cancelRequestRef,
  failedStepInfo,
  openSettingsModal,
  handleClearChat,
}) => {
  return (
    <header className={`h-16 md:h-20 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 transition-all duration-300 ${isNotepadFullscreen ? 'opacity-0 pointer-events-none h-0 p-0 overflow-hidden' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 text-white shrink-0">
           <Layers size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-tight">Dual AI Chat</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase hidden sm:block">协作智能</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="hidden md:flex items-center space-x-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
           {useOpenAiApiConfig ? (
             <>
                <ModelBadge icon={Cpu} label="Cognito" value={openAiCognitoModelId || 'N/A'} colorClass="bg-indigo-50 border-indigo-100 text-indigo-700" />
                <ModelBadge icon={Sparkles} label="Muse" value={openAiMuseModelId || 'N/A'} colorClass="bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700" />
             </>
           ) : (
             <>
               <ModelSelector
                 label="Cognito"
                 icon={Cpu}
                 value={selectedCognitoModelApiName}
                 onChange={setSelectedCognitoModelApiName}
                 models={MODELS}
                 disabled={isLoading}
                 colorTheme="teal"
               />
               <ModelSelector
                 label="Muse"
                 icon={Sparkles}
                 value={selectedMuseModelApiName}
                 onChange={setSelectedMuseModelApiName}
                 models={MODELS}
                 disabled={isLoading}
                 colorTheme="fuchsia"
               />
             </>
           )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

        <div className="flex items-center space-x-1 md:space-x-2">
          <button onClick={handleClearChat}
            className="p-2 md:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95"
            aria-label="清空聊天" title="清空聊天" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}
          ><RefreshCw size={18} className="md:w-5 md:h-5" />
          </button>
          <button onClick={openSettingsModal}
            className="p-2 md:p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-100 active:scale-95"
            aria-label="设置" title="设置" disabled={isLoading && !cancelRequestRef.current && !failedStepInfo}>
            <Settings size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
