
import { useCallback } from 'react';
import { MessageSender, MessagePurpose, DiscussionMode, ChatMessage, ChatLogicCommonDependencies } from '../types';
import { fileToBase64 } from '../utils/appUtils';
import { buildCognitoInitialPrompt, buildFinalAnswerPrompt } from '../utils/promptBuilder';
import { useChatState } from './useChatState';
import { useStepExecutor } from './useStepExecutor';
import { useDiscussionLoop } from './useDiscussionLoop';

interface UseChatProcessingProps extends ChatLogicCommonDependencies {
  state: ReturnType<typeof useChatState>;
  executeStep: ReturnType<typeof useStepExecutor>['executeStep'];
  runDiscussionLoop: ReturnType<typeof useDiscussionLoop>['runDiscussionLoop'];
}

export const useChatProcessing = ({
  state,
  executeStep,
  runDiscussionLoop,
  addMessage,
  processNotepadUpdateFromAI,
  setGlobalApiKeyStatus,
  cognitoModelDetails,
  discussionMode,
  manualFixedTurns,
  notepadContent,
  startProcessingTimer,
  stopProcessingTimer,
}: UseChatProcessingProps) => {
  const {
    isLoading, setIsLoading,
    setFailedStepInfo,
    setDiscussionLog,
    setCurrentDiscussionTurn,
    setIsInternalDiscussionActive,
    cancelRequestRef,
    failedStepInfo,
    setLastCompletedTurnCount
  } = state;

  const startChatProcessing = useCallback(async (userInput: string, imageFile?: File | null) => {
    if (isLoading) return;
    if (!userInput.trim() && !imageFile) return;

    cancelRequestRef.current = false;
    // Abort previous controller if it exists
    if (state.abortControllerRef.current) {
        state.abortControllerRef.current.abort();
    }
    state.abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setFailedStepInfo(null);
    setDiscussionLog([]);
    setCurrentDiscussionTurn(0);
    setIsInternalDiscussionActive(false);
    setGlobalApiKeyStatus({});
    startProcessingTimer();

    let userImageForDisplay: ChatMessage['image'] | undefined = undefined;
    let geminiImageApiPart: { inlineData: { mimeType: string; data: string } } | undefined = undefined;

    if (imageFile) {
      try {
        const dataUrl = URL.createObjectURL(imageFile);
        userImageForDisplay = { dataUrl, name: imageFile.name, type: imageFile.type };
        const base64Data = await fileToBase64(imageFile);
        geminiImageApiPart = { inlineData: { mimeType: imageFile.type, data: base64Data } };
      } catch (error) {
        console.error("图片处理失败:", error);
        addMessage("图片处理失败，请重试。", MessageSender.System, MessagePurpose.SystemNotification);
        setIsLoading(false);
        stopProcessingTimer();
        if (userImageForDisplay?.dataUrl.startsWith('blob:')) URL.revokeObjectURL(userImageForDisplay.dataUrl);
        return;
      }
    }

    addMessage(userInput, MessageSender.User, MessagePurpose.UserInput, undefined, userImageForDisplay);

    let currentLocalDiscussionLog: string[] = [];
    let lastTurnTextForLog = "";

    const imageInstructionForAI = geminiImageApiPart ? "用户还提供了一张图片。请在您的分析和回复中同时考虑此图片和文本查询。" : "";

    try {
      const cognitoInitialStepIdentifier = 'cognito-initial-to-muse';
      addMessage(`${MessageSender.Cognito} 正在为 ${MessageSender.Muse} 准备第一个观点 (使用 ${cognitoModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);

      const cognitoPromptText = buildCognitoInitialPrompt(
        userInput,
        imageInstructionForAI,
        notepadContent,
        discussionMode
      );

      const cognitoParsedResponse = await executeStep(
        cognitoInitialStepIdentifier, cognitoPromptText, cognitoModelDetails, MessageSender.Cognito, MessagePurpose.CognitoToMuse, geminiImageApiPart,
        userInput, geminiImageApiPart, []
      );
      if (cancelRequestRef.current) throw new Error("用户取消操作");
      const notepadError = processNotepadUpdateFromAI(cognitoParsedResponse, MessageSender.Cognito, addMessage);
      lastTurnTextForLog = cognitoParsedResponse.spokenText;
      currentLocalDiscussionLog.push(`${MessageSender.Cognito}: ${lastTurnTextForLog}`);
      if (notepadError) {
        currentLocalDiscussionLog.push(`(System Note: ${notepadError})`);
      }
      setDiscussionLog([...currentLocalDiscussionLog]);

      setIsInternalDiscussionActive(true);
      setCurrentDiscussionTurn(0);

      let previousAISignaledStop = discussionMode === DiscussionMode.AiDriven && (cognitoParsedResponse.discussionShouldEnd || false);
      if (previousAISignaledStop) addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);

      // Run Discussion Loop
      const loopResult = await runDiscussionLoop({
        startTurn: 0,
        initialLog: currentLocalDiscussionLog,
        initialLastTurnText: lastTurnTextForLog,
        initialPreviousAISignaledStop: previousAISignaledStop,
        skipMuseInFirstTurn: false,
        userInput: userInput,
        imageInstruction: imageInstructionForAI,
        imageApiPart: geminiImageApiPart
      });
      
      const finalTurnForStats = loopResult.finalTurnForStats;
      const resultingLog = loopResult.localDiscussionLog;

      if (cancelRequestRef.current) throw new Error("用户取消操作");

      const finalAnswerStepIdentifier = 'cognito-final-answer';
      addMessage(`${MessageSender.Cognito} 正在综合讨论内容，准备最终答案 (使用 ${cognitoModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);

      const finalAnswerPromptText = buildFinalAnswerPrompt(
        userInput,
        imageInstructionForAI,
        resultingLog,
        notepadContent,
        discussionMode
      );

      const finalAnswerParsedResponse = await executeStep(
        finalAnswerStepIdentifier, finalAnswerPromptText, cognitoModelDetails, MessageSender.Cognito, MessagePurpose.FinalResponse, geminiImageApiPart,
        userInput, geminiImageApiPart, [...resultingLog]
      );
      if (cancelRequestRef.current) throw new Error("用户取消操作");
      processNotepadUpdateFromAI(finalAnswerParsedResponse, MessageSender.Cognito, addMessage);

      // Successfully completed the flow
      if (discussionMode === DiscussionMode.FixedTurns) {
        setLastCompletedTurnCount(manualFixedTurns);
      } else {
        setLastCompletedTurnCount(finalTurnForStats + 1);
      }

    } catch (error) {
      const e = error as Error;
      if (cancelRequestRef.current || e.message === '用户取消操作') { /* User cancelled, handled by finally */ }
      else if (!e.message.includes("API密钥") && !e.message.toLowerCase().includes("api key") && !(e as any).isHandled) {
        console.error("聊天流程中发生错误:", error);
        addMessage(`错误: ${e.message}`, MessageSender.System, MessagePurpose.SystemNotification);
      }
      setIsInternalDiscussionActive(false);
    } finally {
      setIsLoading(false);
      stopProcessingTimer();
      setIsInternalDiscussionActive(false);

      // Reset turn count only if cancelled with no previous success state to preserve
      if (cancelRequestRef.current && !failedStepInfo) {
        setLastCompletedTurnCount(0);
      }

      if (userImageForDisplay?.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userImageForDisplay.dataUrl);
      }
      if (cancelRequestRef.current && !failedStepInfo) {
        addMessage("用户已停止AI响应。", MessageSender.System, MessagePurpose.SystemNotification);
      }
    }
  }, [
    isLoading, setIsLoading, setFailedStepInfo, setDiscussionLog, setCurrentDiscussionTurn, runDiscussionLoop,
    setIsInternalDiscussionActive, setGlobalApiKeyStatus, startProcessingTimer, stopProcessingTimer,
    addMessage, processNotepadUpdateFromAI, cognitoModelDetails, discussionMode,
    manualFixedTurns, notepadContent, executeStep, failedStepInfo, setLastCompletedTurnCount, cancelRequestRef
  ]);

  return { startChatProcessing };
};
