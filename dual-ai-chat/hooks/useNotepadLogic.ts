
import { useState, useCallback, useMemo, useEffect } from 'react';
import { MessageSender, NotepadUpdatePayload, MessagePurpose } from '../types'; // Added MessagePurpose
import { applyNotepadModifications, ParsedAIResponse } from '../utils/appUtils';
import { INITIAL_NOTEPAD_CONTENT, NOTEPAD_CONTENT_STORAGE_KEY } from '../constants';

export const useNotepadLogic = (initialContent: string = INITIAL_NOTEPAD_CONTENT) => {
  const [notepadContent, setNotepadContent] = useState<string>(() => {
    const saved = localStorage.getItem(NOTEPAD_CONTENT_STORAGE_KEY);
    return saved !== null ? saved : initialContent;
  });
  const [lastNotepadUpdateBy, setLastNotepadUpdateBy] = useState<MessageSender | null>(null);
  
  const [notepadHistory, setNotepadHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(NOTEPAD_CONTENT_STORAGE_KEY);
    return saved !== null ? [saved] : [initialContent];
  });
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);

  // Persist notepad content changes
  useEffect(() => {
    localStorage.setItem(NOTEPAD_CONTENT_STORAGE_KEY, notepadContent);
  }, [notepadContent]);

  // Derived state for comparison
  const previousContent = useMemo(() => {
    return currentHistoryIndex > 0 ? notepadHistory[currentHistoryIndex - 1] : initialContent;
  }, [currentHistoryIndex, notepadHistory, initialContent]);

  const _addHistoryEntry = useCallback((newContent: string, updatedBy: MessageSender | null) => {
    const newHistorySlice = notepadHistory.slice(0, currentHistoryIndex + 1);
    const newFullHistory = [...newHistorySlice, newContent];
    
    setNotepadContent(newContent);
    setNotepadHistory(newFullHistory);
    setCurrentHistoryIndex(newFullHistory.length - 1);
    setLastNotepadUpdateBy(updatedBy);
  }, [notepadHistory, currentHistoryIndex]);

  const processNotepadUpdateFromAI = useCallback((
    parsedResponse: ParsedAIResponse,
    sender: MessageSender,
    addSystemMessage: (text: string, sender: MessageSender, purpose: MessagePurpose) => void
  ): string | null => {
    const update = parsedResponse.notepadUpdate;
    if (!update) return null;

    let aiFeedbackMsg: string | null = null;
    let currentNotepadForModification = notepadContent;
    // If we are in a past history state, apply modifications based on that state for accuracy,
    // then it will become a new history entry.
    if (currentHistoryIndex < notepadHistory.length - 1) {
        currentNotepadForModification = notepadHistory[currentHistoryIndex];
    }


    if (update.modifications && update.modifications.length > 0) {
      const { newContent, errors: applyErrors } = applyNotepadModifications(currentNotepadForModification, update.modifications);
      _addHistoryEntry(newContent, sender);
      
      if (applyErrors.length > 0) {
        const errorText = `[系统] ${sender} 的部分记事本修改操作未成功执行:\n- ${applyErrors.join('\n- ')}`;
        addSystemMessage(errorText, MessageSender.System, MessagePurpose.SystemNotification);
        aiFeedbackMsg = `[System Error] Notepad update failed: ${applyErrors.join('; ')}`;
      }
    }
    
    if (update.error) { 
      addSystemMessage(
        `[系统] ${sender} 尝试修改记事本时遇到问题: ${update.error}`,
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
      if (!aiFeedbackMsg) {
          aiFeedbackMsg = `[System Error] Notepad update parsing failed: ${update.error}`;
      }
    }
    return aiFeedbackMsg;
  }, [notepadContent, _addHistoryEntry, currentHistoryIndex, notepadHistory]);

  const updateNotepadManual = useCallback((newContent: string) => {
    if (newContent !== notepadContent) {
      _addHistoryEntry(newContent, MessageSender.User);
    }
  }, [notepadContent, _addHistoryEntry]);

  const clearNotepadContent = useCallback(() => {
    _addHistoryEntry(initialContent, null);
  }, [initialContent, _addHistoryEntry]);

  const undoNotepad = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setNotepadContent(notepadHistory[newIndex]);
      setLastNotepadUpdateBy(null); // Or determine from history if stored
    }
  }, [currentHistoryIndex, notepadHistory]);

  const redoNotepad = useCallback(() => {
    if (currentHistoryIndex < notepadHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setNotepadContent(notepadHistory[newIndex]);
      setLastNotepadUpdateBy(null); // Or determine from history if stored
    }
  }, [currentHistoryIndex, notepadHistory]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < notepadHistory.length - 1;

  return {
    notepadContent,
    previousContent,
    lastNotepadUpdateBy,
    processNotepadUpdateFromAI,
    updateNotepadManual,
    clearNotepadContent,
    // setNotepadContent is no longer exposed directly for external modification without history tracking
    undoNotepad,
    redoNotepad,
    canUndo,
    canRedo,
  };
};
