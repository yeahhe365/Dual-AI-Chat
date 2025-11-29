
import { useState, useRef, useCallback, useEffect } from 'react';

const MIN_PANEL_PERCENT = 20;
const MAX_PANEL_PERCENT = 80;

export const useAppUI = (initialChatPanelPercent: number, panelsContainerRef: React.RefObject<HTMLDivElement>) => {
  const [isNotepadFullscreen, setIsNotepadFullscreen] = useState<boolean>(false);
  const [chatPanelWidthPercent, setChatPanelWidthPercent] = useState<number>(initialChatPanelPercent);
  const [currentTotalProcessingTimeMs, setCurrentTotalProcessingTimeMs] = useState<number>(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  
  // Mobile specific state
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'notepad'>('chat');

  const isResizingRef = useRef<boolean>(false);
  const initialMouseXRef = useRef<number>(0);
  const initialChatPanelWidthPercentRef = useRef<number>(0);
  const currentQueryStartTimeRef = useRef<number | null>(null);

  const toggleNotepadFullscreen = useCallback(() => {
    setIsNotepadFullscreen(prev => !prev);
  }, []);

  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const startProcessingTimer = useCallback(() => {
    currentQueryStartTimeRef.current = performance.now();
    setCurrentTotalProcessingTimeMs(0);
  }, []);

  const stopProcessingTimer = useCallback(() => {
    if (currentQueryStartTimeRef.current) {
      setCurrentTotalProcessingTimeMs(performance.now() - currentQueryStartTimeRef.current);
    }
    currentQueryStartTimeRef.current = null;
  }, []);
  
  const updateProcessingTimer = useCallback(() => {
    if (currentQueryStartTimeRef.current) {
        setCurrentTotalProcessingTimeMs(performance.now() - currentQueryStartTimeRef.current);
    }
  }, []);

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the standard md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMoveOnDocument = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !panelsContainerRef.current) return;
    const containerWidth = panelsContainerRef.current.offsetWidth;
    if (containerWidth === 0) return;

    const deltaX = e.clientX - initialMouseXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    let newChatPanelWidthPercent = initialChatPanelWidthPercentRef.current + deltaPercent;

    newChatPanelWidthPercent = Math.max(MIN_PANEL_PERCENT, newChatPanelWidthPercent);
    newChatPanelWidthPercent = Math.min(MAX_PANEL_PERCENT, newChatPanelWidthPercent);
    
    setChatPanelWidthPercent(newChatPanelWidthPercent);
  }, [panelsContainerRef]);

  const handleMouseUpOnDocument = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveOnDocument);
    document.removeEventListener('mouseup', handleMouseUpOnDocument);
  }, [handleMouseMoveOnDocument]);

  const handleMouseDownOnResizer = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizingRef.current = true;
    initialMouseXRef.current = e.clientX;
    initialChatPanelWidthPercentRef.current = chatPanelWidthPercent;
    document.addEventListener('mousemove', handleMouseMoveOnDocument);
    document.addEventListener('mouseup', handleMouseUpOnDocument);
  }, [chatPanelWidthPercent, handleMouseMoveOnDocument, handleMouseUpOnDocument]);

  const handleResizerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const stepAmountPercent = 2; 

      setChatPanelWidthPercent(prevWidthPercent => {
        let newWidthPercent = prevWidthPercent;
        if (e.key === 'ArrowLeft') {
          newWidthPercent -= stepAmountPercent;
        } else if (e.key === 'ArrowRight') {
          newWidthPercent += stepAmountPercent;
        }
        
        newWidthPercent = Math.max(MIN_PANEL_PERCENT, newWidthPercent);
        newWidthPercent = Math.min(MAX_PANEL_PERCENT, newWidthPercent);
        return newWidthPercent;
      });
    }
  }, []);

  useEffect(() => {
    // Cleanup global event listeners when the component unmounts or hook is no longer used
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveOnDocument);
      document.removeEventListener('mouseup', handleMouseUpOnDocument);
    };
  }, [handleMouseMoveOnDocument, handleMouseUpOnDocument]);


  return {
    isNotepadFullscreen,
    setIsNotepadFullscreen, 
    chatPanelWidthPercent,
    setChatPanelWidthPercent,
    currentTotalProcessingTimeMs,
    isSettingsModalOpen,
    isMobile,
    activeMobileTab,
    setActiveMobileTab,
    toggleNotepadFullscreen,
    handleMouseDownOnResizer,
    handleResizerKeyDown,
    openSettingsModal,
    closeSettingsModal,
    startProcessingTimer,
    stopProcessingTimer,
    updateProcessingTimer,
    currentQueryStartTimeRef,
  };
};
