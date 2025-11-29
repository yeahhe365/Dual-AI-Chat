
import { useCallback } from 'react';
import { MessageSender, MessagePurpose, DiscussionMode, ChatLogicCommonDependencies } from '../types';
import { buildDiscussionTurnPrompt } from '../utils/promptBuilder';
import { useChatState } from './useChatState';
import { useStepExecutor } from './useStepExecutor';

interface UseDiscussionLoopProps extends ChatLogicCommonDependencies {
  state: ReturnType<typeof useChatState>;
  executeStep: ReturnType<typeof useStepExecutor>['executeStep'];
}

export const useDiscussionLoop = ({
  state,
  executeStep,
  addMessage,
  processNotepadUpdateFromAI,
  cognitoModelDetails,
  museModelDetails,
  discussionMode,
  manualFixedTurns,
  notepadContent,
}: UseDiscussionLoopProps) => {
  const {
    cancelRequestRef,
    setIsInternalDiscussionActive,
    setCurrentDiscussionTurn,
    setDiscussionLog,
  } = state;

  const runDiscussionLoop = useCallback(async (params: {
    startTurn: number,
    initialLog: string[],
    initialLastTurnText: string,
    initialPreviousAISignaledStop: boolean,
    skipMuseInFirstTurn: boolean,
    userInput: string,
    imageInstruction: string,
    imageApiPart?: any
  }) => {
    let localDiscussionLog = [...params.initialLog];
    let localLastTurnText = params.initialLastTurnText;
    let localPreviousAISignaledStop = params.initialPreviousAISignaledStop;
    let finalTurnForStats = params.startTurn;

    setIsInternalDiscussionActive(true);

    for (let turn = params.startTurn; ; turn++) {
      setCurrentDiscussionTurn(turn);
      finalTurnForStats = turn;

      // Check exit conditions
      if (cancelRequestRef.current) break;
      if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns) break;
      
      // Special resume case where logic decided to stop before loop but we need to verify inside loop context
      if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && params.skipMuseInFirstTurn && turn > params.startTurn) break;

      // --- Muse Turn ---
      if (!(params.skipMuseInFirstTurn && turn === params.startTurn)) {
        const museStepIdentifier = `muse-reply-to-cognito-turn-${turn}`;
        addMessage(`${MessageSender.Muse} 正在回应 ${MessageSender.Cognito} (使用 ${museModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);

        const musePromptText = buildDiscussionTurnPrompt(
          params.userInput,
          params.imageInstruction,
          localDiscussionLog,
          localLastTurnText,
          notepadContent,
          discussionMode,
          localPreviousAISignaledStop,
          MessageSender.Muse
        );

        const museParsedResponse = await executeStep(
          museStepIdentifier, musePromptText, museModelDetails, MessageSender.Muse, MessagePurpose.MuseToCognito, params.imageApiPart,
          params.userInput, params.imageApiPart, [...localDiscussionLog], turn, localPreviousAISignaledStop
        );
        if (cancelRequestRef.current) break;
        const museNotepadError = processNotepadUpdateFromAI(museParsedResponse, MessageSender.Muse, addMessage);
        
        const signalFromCognitoBeforeMuse = localPreviousAISignaledStop;
        localLastTurnText = museParsedResponse.spokenText;
        localDiscussionLog.push(`${MessageSender.Muse}: ${localLastTurnText}`);
        if (museNotepadError) {
          localDiscussionLog.push(`(System Note: ${museNotepadError})`);
        }
        setDiscussionLog([...localDiscussionLog]);
        localPreviousAISignaledStop = museParsedResponse.discussionShouldEnd || false;

        if (discussionMode === DiscussionMode.AiDriven) {
          if (localPreviousAISignaledStop && signalFromCognitoBeforeMuse) {
            addMessage(`双方AI (${MessageSender.Cognito} 和 ${MessageSender.Muse}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
            setIsInternalDiscussionActive(false); 
            break;
          } else if (localPreviousAISignaledStop) {
            addMessage(`${MessageSender.Muse} 已建议结束讨论。等待 ${MessageSender.Cognito} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
          }
        }
      }

      // Reset skip flag after first iteration
      // eslint-disable-next-line no-param-reassign
      params.skipMuseInFirstTurn = false;

      // Mid-loop exit checks
      if (cancelRequestRef.current) break;
      if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && params.skipMuseInFirstTurn) { 
          // Logic specific to resume: if we skipped Muse (resume at Cognito) and previous was stop, we might exit.
          // Note: This matches original logic flow where we check before Cognito
          setIsInternalDiscussionActive(false); 
          break; 
      }
      if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns - 1) { 
          setIsInternalDiscussionActive(false); 
          break; 
      }

      // --- Cognito Turn ---
      const cognitoReplyStepIdentifier = `cognito-reply-to-muse-turn-${turn}`;
      addMessage(`${MessageSender.Cognito} 正在回应 ${MessageSender.Muse} (使用 ${cognitoModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);

      const cognitoReplyPromptText = buildDiscussionTurnPrompt(
        params.userInput,
        params.imageInstruction,
        localDiscussionLog,
        localLastTurnText,
        notepadContent,
        discussionMode,
        localPreviousAISignaledStop,
        MessageSender.Cognito
      );

      const cognitoReplyParsedResponse = await executeStep(
        cognitoReplyStepIdentifier, cognitoReplyPromptText, cognitoModelDetails, MessageSender.Cognito, MessagePurpose.CognitoToMuse, params.imageApiPart,
        params.userInput, params.imageApiPart, [...localDiscussionLog], turn, localPreviousAISignaledStop
      );
      if (cancelRequestRef.current) break;
      const cognitoNotepadError = processNotepadUpdateFromAI(cognitoReplyParsedResponse, MessageSender.Cognito, addMessage);
      
      const signalFromMuseBeforeCognito = localPreviousAISignaledStop;
      localLastTurnText = cognitoReplyParsedResponse.spokenText;
      localDiscussionLog.push(`${MessageSender.Cognito}: ${localLastTurnText}`);
      if (cognitoNotepadError) {
        localDiscussionLog.push(`(System Note: ${cognitoNotepadError})`);
      }
      setDiscussionLog([...localDiscussionLog]);
      localPreviousAISignaledStop = cognitoReplyParsedResponse.discussionShouldEnd || false;

      if (discussionMode === DiscussionMode.AiDriven) {
        if (localPreviousAISignaledStop && signalFromMuseBeforeCognito) {
          addMessage(`双方AI (${MessageSender.Muse} 和 ${MessageSender.Cognito}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
          setIsInternalDiscussionActive(false); 
          break;
        } else if (localPreviousAISignaledStop) {
          addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
        }
      }
    }
    
    setIsInternalDiscussionActive(false);
    return { localDiscussionLog, finalTurnForStats };

  }, [
    addMessage, executeStep, processNotepadUpdateFromAI, setDiscussionLog,
    discussionMode, manualFixedTurns, cognitoModelDetails, museModelDetails, notepadContent,
    setIsInternalDiscussionActive, setCurrentDiscussionTurn, cancelRequestRef
  ]);

  return { runDiscussionLoop };
};
