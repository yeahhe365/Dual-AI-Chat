
import { useCallback } from 'react';
import { ChatLogicCommonDependencies } from '../types';
import { useChatState } from './useChatState';
import { useStepExecutor } from './useStepExecutor';
import { useDiscussionLoop } from './useDiscussionLoop';
import { useRetryLogic } from './useRetryLogic';
import { useChatProcessing } from './useChatProcessing';

// Re-exporting the interface from types for convenience if needed by consumers, though they should use types.ts
export type UseChatLogicProps = ChatLogicCommonDependencies;

export const useChatLogic = (props: UseChatLogicProps) => {
  
  const state = useChatState();

  const { executeStep } = useStepExecutor({
    state,
    ...props
  });

  const { runDiscussionLoop } = useDiscussionLoop({
    state,
    executeStep,
    ...props
  });

  const { retryFailedStep } = useRetryLogic({
    state,
    executeStep,
    runDiscussionLoop,
    ...props
  });

  const { startChatProcessing } = useChatProcessing({
    state,
    executeStep,
    runDiscussionLoop,
    ...props
  });

  const stopGenerating = useCallback(() => {
    state.cancelRequestRef.current = true;
    if (state.abortControllerRef.current) {
      state.abortControllerRef.current.abort();
    }
    state.setIsInternalDiscussionActive(false);
  }, [state.setIsInternalDiscussionActive, state.cancelRequestRef, state.abortControllerRef]);

  return {
    ...state, // isLoading, discussionLog, etc.
    startChatProcessing,
    retryFailedStep,
    stopGenerating,
  };
};
