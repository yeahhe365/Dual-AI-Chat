
import { useState, useRef } from 'react';
import { FailedStepPayload } from '../types';

export const useChatState = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [discussionLog, setDiscussionLog] = useState<string[]>([]);
  const [failedStepInfo, setFailedStepInfo] = useState<FailedStepPayload | null>(null);
  const cancelRequestRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentDiscussionTurn, setCurrentDiscussionTurn] = useState<number>(0);
  const [isInternalDiscussionActive, setIsInternalDiscussionActive] = useState<boolean>(false);
  const [lastCompletedTurnCount, setLastCompletedTurnCount] = useState<number>(0);

  return {
    isLoading, setIsLoading,
    discussionLog, setDiscussionLog,
    failedStepInfo, setFailedStepInfo,
    cancelRequestRef,
    abortControllerRef,
    currentDiscussionTurn, setCurrentDiscussionTurn,
    isInternalDiscussionActive, setIsInternalDiscussionActive,
    lastCompletedTurnCount, setLastCompletedTurnCount
  };
};
