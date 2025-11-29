
import React, { useRef } from 'react';
import Notepad from './components/Notepad';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import ResizeHandle from './components/ResizeHandle';
import AlertBanner from './components/AlertBanner';
import AppSettingsDialog from './components/AppSettingsDialog';
import { useAppController } from './hooks/useAppController';
import { MessageSquare, FileText } from 'lucide-react';

const App: React.FC = () => {
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    apiKeyStatus,
    apiKeyBannerMessage,
    ui,
    notepad,
    settings,
    chat,
    actions
  } = useAppController(panelsContainerRef);

  return (
    <div className={`flex flex-col h-screen bg-slate-50 overflow-hidden ${ui.isNotepadFullscreen ? 'fixed inset-0 z-40' : 'relative'}`}>
      <Header
        isNotepadFullscreen={ui.isNotepadFullscreen}
        useOpenAiApiConfig={settings.useOpenAiApiConfig}
        openAiCognitoModelId={settings.openAiCognitoModelId}
        openAiMuseModelId={settings.openAiMuseModelId}
        actualCognitoModelDetails={settings.actualCognitoModelDetails}
        actualMuseModelDetails={settings.actualMuseModelDetails}
        selectedCognitoModelApiName={settings.selectedCognitoModelApiName}
        setSelectedCognitoModelApiName={settings.setSelectedCognitoModelApiName}
        selectedMuseModelApiName={settings.selectedMuseModelApiName}
        setSelectedMuseModelApiName={settings.setSelectedMuseModelApiName}
        isLoading={chat.isLoading}
        cancelRequestRef={chat.cancelRequestRef}
        failedStepInfo={chat.failedStepInfo}
        openSettingsModal={ui.openSettingsModal}
        handleClearChat={actions.handleClearChat}
      />

      <div ref={panelsContainerRef} className={`flex flex-grow overflow-hidden ${ui.isNotepadFullscreen ? 'relative' : 'flex-col md:flex-row'}`}>
        {!ui.isNotepadFullscreen && (
          <div 
             className={`${ui.isMobile && ui.activeMobileTab !== 'chat' ? 'hidden' : 'block'} md:block h-full shrink-0`} 
             style={{ width: ui.isMobile ? '100%' : `${ui.chatPanelWidthPercent}%` }}
          >
            <ChatPanel 
              messages={messages}
              widthPercent={ui.chatPanelWidthPercent}
              onSendMessage={chat.startChatProcessing}
              isLoading={chat.isLoading}
              isApiKeyMissing={apiKeyStatus.isMissing || apiKeyStatus.isInvalid || false}
              onStopGenerating={chat.stopGenerating}
              isInternalDiscussionActive={chat.isInternalDiscussionActive}
              currentDiscussionTurn={chat.currentDiscussionTurn}
              discussionMode={settings.discussionMode}
              manualFixedTurns={settings.manualFixedTurns}
              currentTotalProcessingTimeMs={ui.currentTotalProcessingTimeMs}
              failedStepInfo={chat.failedStepInfo}
              onManualRetry={chat.retryFailedStep}
              isMobile={ui.isMobile}
            />
          </div>
        )}

        {!ui.isNotepadFullscreen && !ui.isMobile && (
          <ResizeHandle 
            onMouseDown={ui.handleMouseDownOnResizer}
            onKeyDown={ui.handleResizerKeyDown}
          />
        )}

        <div
          id="notepad-panel-wrapper"
          className={`h-full bg-white flex flex-col shadow-xl z-20 transition-transform duration-300
            ${ui.isNotepadFullscreen ? 'fixed inset-0 z-50 w-screen' : ''}
            ${!ui.isNotepadFullscreen && ui.isMobile && ui.activeMobileTab !== 'notepad' ? 'hidden' : 'flex-1'}
            ${!ui.isNotepadFullscreen && !ui.isMobile ? 'border-l border-slate-200' : ''}
          `}
          style={ui.isNotepadFullscreen ? { width: '100%' } : { minWidth: 0 }}
        >
          <Notepad
            content={notepad.notepadContent}
            previousContent={notepad.previousContent}
            lastUpdatedBy={notepad.lastNotepadUpdateBy}
            isLoading={chat.isLoading}
            isNotepadFullscreen={ui.isNotepadFullscreen}
            onToggleFullscreen={ui.toggleNotepadFullscreen}
            onUndo={notepad.undoNotepad}
            onRedo={notepad.redoNotepad}
            canUndo={notepad.canUndo}
            canRedo={notepad.canRedo}
            onContentChange={notepad.updateNotepadManual}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {ui.isMobile && !ui.isNotepadFullscreen && (
        <div className="h-16 bg-white border-t border-slate-200 flex justify-around items-center px-4 z-50 shrink-0">
           <button 
             onClick={() => ui.setActiveMobileTab('chat')}
             className={`flex flex-col items-center justify-center space-y-1 w-full h-full ${ui.activeMobileTab === 'chat' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <div className={`p-1 rounded-lg ${ui.activeMobileTab === 'chat' ? 'bg-sky-50' : 'bg-transparent'}`}>
                <MessageSquare size={20} className={ui.activeMobileTab === 'chat' ? 'fill-sky-600/20' : ''} />
              </div>
              <span className="text-[10px] font-medium">聊天</span>
           </button>
           <button 
             onClick={() => ui.setActiveMobileTab('notepad')}
             className={`flex flex-col items-center justify-center space-y-1 w-full h-full ${ui.activeMobileTab === 'notepad' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <div className={`p-1 rounded-lg ${ui.activeMobileTab === 'notepad' ? 'bg-sky-50' : 'bg-transparent'}`}>
                <FileText size={20} className={ui.activeMobileTab === 'notepad' ? 'fill-sky-600/20' : ''} />
              </div>
              <span className="text-[10px] font-medium">记事本</span>
           </button>
        </div>
      )}

      <AlertBanner 
        message={apiKeyBannerMessage}
        isVisible={!!(apiKeyStatus.isMissing || apiKeyStatus.isInvalid) && !!apiKeyBannerMessage && !ui.isNotepadFullscreen}
      />

      {ui.isSettingsModalOpen && (
        <AppSettingsDialog 
           isOpen={ui.isSettingsModalOpen}
           onClose={ui.closeSettingsModal}
           isLoading={chat.isLoading}
           settings={settings}
        />
      )}
    </div>
  );
};

export default App;
