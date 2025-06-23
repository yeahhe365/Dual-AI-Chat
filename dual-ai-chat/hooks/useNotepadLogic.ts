
import { useState, useCallback } from 'react';
import { MessageSender, NotepadUpdatePayload, MessagePurpose } from '../types'; // Added MessagePurpose
import { applyNotepadModifications, ParsedAIResponse } from '../utils/appUtils';

export const useNotepadLogic = (initialContent: string) => {
  const [notepadContent, setNotepadContent] = useState<string>(initialContent);
  const [lastNotepadUpdateBy, setLastNotepadUpdateBy] = useState<MessageSender | null>(null);
  
  const [notepadHistory, setNotepadHistory] = useState<string[]>([initialContent]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);

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
  ) => {
    const update = parsedResponse.notepadUpdate;
    if (!update) return;

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
      }
    }
    
    if (update.error) { 
      addSystemMessage(
        `[系统] ${sender} 尝试修改记事本时遇到问题: ${update.error}`,
        MessageSender.System,
        MessagePurpose.SystemNotification
      );
    }
  }, [notepadContent, _addHistoryEntry, currentHistoryIndex, notepadHistory]);

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
    lastNotepadUpdateBy,
    processNotepadUpdateFromAI,
    clearNotepadContent,
    // setNotepadContent is no longer exposed directly for external modification without history tracking
    undoNotepad,
    redoNotepad,
    canUndo,
    canRedo,
  };
};
