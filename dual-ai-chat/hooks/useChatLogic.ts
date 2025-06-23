
import { useState, useRef, useCallback } from 'react';
import { ChatMessage, MessageSender, MessagePurpose, FailedStepPayload, NotepadUpdatePayload, DiscussionMode } from '../types';
import { generateResponse } from '../services/geminiService';
import {
  AiModel,
  COGNITO_SYSTEM_PROMPT_HEADER,
  MUSE_SYSTEM_PROMPT_HEADER,
  NOTEPAD_INSTRUCTION_PROMPT_PART,
  DISCUSSION_COMPLETE_TAG,
  AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART,
  MAX_AUTO_RETRIES,
  RETRY_DELAY_BASE_MS,
  THINKING_BUDGET_CONFIG_HIGH_QUALITY,
  THINKING_BUDGET_CONFIG_PRO_HIGH_QUALITY,
  GEMINI_PRO_MODEL_ID,
  GEMINI_2_5_PRO_PREVIEW_05_06_MODEL_ID // Added import for the new model ID
} from '../constants';
import { parseAIResponse, fileToBase64, ParsedAIResponse, formatNotepadContentForAI } from '../utils/appUtils';

interface UseChatLogicProps {
  addMessage: (text: string, sender: MessageSender, purpose: MessagePurpose, durationMs?: number, image?: ChatMessage['image']) => string;
  processNotepadUpdateFromAI: (parsedResponse: ParsedAIResponse, sender: MessageSender, addSystemMessage: UseChatLogicProps['addMessage']) => void;
  setIsApiKeyMissingState: (isMissing: boolean) => void;
  currentModelDetails: AiModel;
  selectedModelApiName: string;
  discussionMode: DiscussionMode;
  manualFixedTurns: number;
  isThinkingBudgetActive: boolean;
  cognitoSystemPrompt: string;
  museSystemPrompt: string;
  notepadContent: string; // Read-only access for prompt construction
  startProcessingTimer: () => void;
  stopProcessingTimer: () => void;
  currentQueryStartTimeRef: React.MutableRefObject<number | null>; // To check if timer is running
}

export const useChatLogic = ({
  addMessage,
  processNotepadUpdateFromAI,
  setIsApiKeyMissingState,
  currentModelDetails,
  selectedModelApiName,
  discussionMode,
  manualFixedTurns,
  isThinkingBudgetActive,
  cognitoSystemPrompt,
  museSystemPrompt,
  notepadContent,
  startProcessingTimer,
  stopProcessingTimer,
  currentQueryStartTimeRef,
}: UseChatLogicProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [discussionLog, setDiscussionLog] = useState<string[]>([]);
  const [failedStepInfo, setFailedStepInfo] = useState<FailedStepPayload | null>(null);
  const cancelRequestRef = useRef<boolean>(false);
  const [currentDiscussionTurn, setCurrentDiscussionTurn] = useState<number>(0);
  const [isInternalDiscussionActive, setIsInternalDiscussionActive] = useState<boolean>(false);


  const commonAIStepExecution = async (
    stepIdentifier: string,
    prompt: string,
    modelName: string,
    sender: MessageSender,
    purpose: MessagePurpose,
    systemInstruction?: string,
    imageApiPart?: { inlineData: { mimeType: string; data: string } },
    thinkingConfig?: { thinkingBudget: number },
    // For retrying the whole flow if a step fails that needs these:
    userInputForFlow?: string,
    imageApiPartForFlow?: { inlineData: { mimeType: string; data: string } },
    discussionLogBeforeFailure?: string[],
    currentTurnIndexForResume?: number,
    previousAISignaledStopForResume?: boolean
  ): Promise<ParsedAIResponse> => {
    let stepSuccess = false;
    let parsedResponse: ParsedAIResponse | null = null;
    let autoRetryCount = 0;

    while (autoRetryCount <= MAX_AUTO_RETRIES && !stepSuccess) {
      if (cancelRequestRef.current) throw new Error("用户取消操作");
      try {
        const result = await generateResponse(prompt, modelName, systemInstruction, imageApiPart, thinkingConfig);
        if (cancelRequestRef.current) throw new Error("用户取消操作");
        if (result.error) {
          if (result.error.includes("API key not valid")) {
            const apiKeyError = Object.assign(new Error(result.text), { isApiKeyError: true });
            setIsApiKeyMissingState(true);
            addMessage(`错误: ${apiKeyError.message}`, MessageSender.System, MessagePurpose.SystemNotification);
            throw apiKeyError;
          }
          throw new Error(result.text);
        }
        parsedResponse = parseAIResponse(result.text);
        addMessage(parsedResponse.spokenText, sender, purpose, result.durationMs);
        stepSuccess = true;
      } catch (e) {
        const error = e as Error & {isApiKeyError?: boolean};
        if (error.isApiKeyError) throw error; // Propagate API key error immediately

        if (autoRetryCount < MAX_AUTO_RETRIES) {
          addMessage(`[${sender} - ${stepIdentifier}] 调用失败，重试 (${autoRetryCount + 1}/${MAX_AUTO_RETRIES})... ${error.message}`, MessageSender.System, MessagePurpose.SystemNotification);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE_MS * (autoRetryCount + 1)));
        } else {
          const errorMsgId = addMessage(`[${sender} - ${stepIdentifier}] 在 ${MAX_AUTO_RETRIES + 1} 次尝试后失败: ${error.message} 可手动重试。`, MessageSender.System, MessagePurpose.SystemNotification);
          setFailedStepInfo({
            stepIdentifier, prompt, modelName, systemInstruction, imageApiPart, sender, purpose, originalSystemErrorMsgId: errorMsgId, thinkingConfig,
            userInputForFlow: userInputForFlow || "", // Ensure defined
            imageApiPartForFlow,
            discussionLogBeforeFailure: discussionLogBeforeFailure || [], // Ensure defined
            currentTurnIndexForResume,
            previousAISignaledStopForResume
          });
          setIsInternalDiscussionActive(false); // Stop showing turn count if discussion leads to error
          throw error; // Propagate error to stop current flow
        }
      }
      autoRetryCount++;
    }
    if (!parsedResponse) {
        setIsInternalDiscussionActive(false); // Stop showing turn count
        throw new Error("AI响应处理失败");
    }
    return parsedResponse;
  };

  const continueDiscussionAfterSuccessfulRetry = async (
    retriedStepPayload: FailedStepPayload,
    retryResponse: ParsedAIResponse
  ) => {
    const {
      stepIdentifier: retriedStepId,
      userInputForFlow,
      imageApiPartForFlow,
    } = retriedStepPayload;

    let localDiscussionLog = [...retriedStepPayload.discussionLogBeforeFailure!]; // Assert as it's set in commonAIStepExecution failure
    localDiscussionLog.push(`${retriedStepPayload.sender}: ${retryResponse.spokenText}`);
    setDiscussionLog(localDiscussionLog);

    let localLastTurnTextForLog = retryResponse.spokenText;
    let localPreviousAISignaledStop = (discussionMode === DiscussionMode.AiDriven && (retryResponse.discussionShouldEnd || false));
    if (discussionMode === DiscussionMode.AiDriven && retriedStepPayload.previousAISignaledStopForResume && retryResponse.discussionShouldEnd) {
        localPreviousAISignaledStop = true;
    }

    let activeThinkingConfig: { thinkingBudget: number } | undefined = undefined;
    if (currentModelDetails.supportsThinkingConfig && isThinkingBudgetActive) {
      activeThinkingConfig = (currentModelDetails.apiName === GEMINI_PRO_MODEL_ID || currentModelDetails.apiName === GEMINI_2_5_PRO_PREVIEW_05_06_MODEL_ID)
        ? THINKING_BUDGET_CONFIG_PRO_HIGH_QUALITY.thinkingConfig
        : THINKING_BUDGET_CONFIG_HIGH_QUALITY.thinkingConfig;
    }

    const effectiveCognitoSysInstruction = currentModelDetails.supportsSystemInstruction ? cognitoSystemPrompt : undefined;
    const effectiveMuseSysInstruction = currentModelDetails.supportsSystemInstruction ? museSystemPrompt : undefined;

    const imageInstructionForAI = imageApiPartForFlow ? "用户还提供了一张图片。请在您的分析和回复中同时考虑此图片和文本查询。" : "";
    const discussionModeInstructionText = discussionMode === DiscussionMode.AiDriven ? AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART : "";
    const commonPromptInstructions = () => NOTEPAD_INSTRUCTION_PROMPT_PART.replace('{notepadContent}', formatNotepadContentForAI(notepadContent)) + discussionModeInstructionText;

    let initialLoopTurn = 0;
    let skipMuseInFirstIteration = false;

    if (retriedStepId === 'cognito-initial-to-muse') {
        initialLoopTurn = 0;
        setIsInternalDiscussionActive(true); // Discussion starts/resumes
        setCurrentDiscussionTurn(0);
        if (localPreviousAISignaledStop) addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
    } else if (retriedStepId.startsWith('muse-reply-to-cognito-turn-')) {
        initialLoopTurn = retriedStepPayload.currentTurnIndexForResume ?? 0;
        setIsInternalDiscussionActive(true); // Discussion continues
        setCurrentDiscussionTurn(initialLoopTurn);
        skipMuseInFirstIteration = true; // Muse just responded, so Cognito's turn
        if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && retriedStepPayload.previousAISignaledStopForResume) {
            addMessage(`双方AI (${MessageSender.Cognito} 和 ${MessageSender.Muse}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
             setIsInternalDiscussionActive(false);
        } else if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop) {
             addMessage(`${MessageSender.Muse} 已建议结束讨论。等待 ${MessageSender.Cognito} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
        }
    } else if (retriedStepId.startsWith('cognito-reply-to-muse-turn-')) {
        initialLoopTurn = (retriedStepPayload.currentTurnIndexForResume ?? 0) + 1;
        setIsInternalDiscussionActive(true); // Discussion continues for Muse's turn
        setCurrentDiscussionTurn(initialLoopTurn); // Muse will start this turn
         if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && retriedStepPayload.previousAISignaledStopForResume) {
             addMessage(`双方AI (${MessageSender.Muse} 和 ${MessageSender.Cognito}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
             setIsInternalDiscussionActive(false);
        } else if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop) {
             addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
        }
    } else if (retriedStepId === 'cognito-final-answer') {
        setIsInternalDiscussionActive(false); // Final answer means discussion is over
        return;
    }


    try {
      let discussionLoopShouldRun = true;
      if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && retriedStepPayload.previousAISignaledStopForResume) {
          discussionLoopShouldRun = false;
      }
      if (retriedStepId === 'cognito-final-answer') discussionLoopShouldRun = false;

      if (discussionLoopShouldRun && isInternalDiscussionActive) { // ensure isInternalDiscussionActive is true before loop
        for (let turn = initialLoopTurn; ; turn++) {
          setCurrentDiscussionTurn(turn);
          if (cancelRequestRef.current) break;
          if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns) break;
          if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && retriedStepPayload.previousAISignaledStopForResume && turn > initialLoopTurn) break;

          if (!(skipMuseInFirstIteration && turn === initialLoopTurn)) {
            const museStepIdentifier = `muse-reply-to-cognito-turn-${turn}`;
            addMessage(`${MessageSender.Muse} 正在回应 ${MessageSender.Cognito} (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
            let musePrompt = `${effectiveMuseSysInstruction ? effectiveMuseSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInputForFlow}". ${imageInstructionForAI} 当前讨论 (均为中文):\n${localDiscussionLog.join("\n")}\n${MessageSender.Cognito} (逻辑AI) 刚刚说 (中文): "${localLastTurnTextForLog}". 请回复 ${MessageSender.Cognito}。继续讨论。保持您的回复简洁并使用中文。\n${commonPromptInstructions()}`;
            if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop) musePrompt += `\n${MessageSender.Cognito} 已包含 ${DISCUSSION_COMPLETE_TAG} 建议结束讨论。如果您同意，请在您的回复中也包含 ${DISCUSSION_COMPLETE_TAG}。否则，请继续讨论。`;

            const museParsedResponse = await commonAIStepExecution(
                museStepIdentifier, musePrompt, selectedModelApiName, MessageSender.Muse, MessagePurpose.MuseToCognito, effectiveMuseSysInstruction, imageApiPartForFlow, activeThinkingConfig,
                userInputForFlow, imageApiPartForFlow, [...localDiscussionLog], turn, localPreviousAISignaledStop
            );
            if (cancelRequestRef.current) return;
            processNotepadUpdateFromAI(museParsedResponse, MessageSender.Muse, addMessage);
            const prevSignalBeforeMuse = localPreviousAISignaledStop;
            localLastTurnTextForLog = museParsedResponse.spokenText; localDiscussionLog.push(`${MessageSender.Muse}: ${localLastTurnTextForLog}`); setDiscussionLog([...localDiscussionLog]);
            localPreviousAISignaledStop = museParsedResponse.discussionShouldEnd || false;

            if (discussionMode === DiscussionMode.AiDriven) {
                if (localPreviousAISignaledStop && prevSignalBeforeMuse) {
                    addMessage(`双方AI (${MessageSender.Cognito} 和 ${MessageSender.Muse}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
                    setIsInternalDiscussionActive(false); break;
                } else if (localPreviousAISignaledStop) {
                    addMessage(`${MessageSender.Muse} 已建议结束讨论。等待 ${MessageSender.Cognito} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
                }
            }
          }
          skipMuseInFirstIteration = false;
          if (cancelRequestRef.current) break;
          if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop && retriedStepPayload.previousAISignaledStopForResume) { setIsInternalDiscussionActive(false); break; }
          if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns -1) { setIsInternalDiscussionActive(false); break; }


          const cognitoReplyStepIdentifier = `cognito-reply-to-muse-turn-${turn}`;
          addMessage(`${MessageSender.Cognito} 正在回应 ${MessageSender.Muse} (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
          let cognitoReplyPrompt = `${effectiveCognitoSysInstruction ? effectiveCognitoSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInputForFlow}". ${imageInstructionForAI} 当前讨论 (均为中文):\n${localDiscussionLog.join("\n")}\n${MessageSender.Muse} (创意AI) 刚刚说 (中文): "${localLastTurnTextForLog}". 请回复 ${MessageSender.Muse}。继续讨论。保持您的回复简洁并使用中文。\n${commonPromptInstructions()}`;
          if (discussionMode === DiscussionMode.AiDriven && localPreviousAISignaledStop) cognitoReplyPrompt += `\n${MessageSender.Muse} 已包含 ${DISCUSSION_COMPLETE_TAG} 建议结束讨论。如果您同意，请在您的回复中也包含 ${DISCUSSION_COMPLETE_TAG}。否则，请继续讨论。`;

          const cognitoReplyParsedResponse = await commonAIStepExecution(
              cognitoReplyStepIdentifier, cognitoReplyPrompt, selectedModelApiName, MessageSender.Cognito, MessagePurpose.CognitoToMuse, effectiveCognitoSysInstruction, imageApiPartForFlow, activeThinkingConfig,
              userInputForFlow, imageApiPartForFlow, [...localDiscussionLog], turn, localPreviousAISignaledStop
          );
          if (cancelRequestRef.current) return;
          processNotepadUpdateFromAI(cognitoReplyParsedResponse, MessageSender.Cognito, addMessage);
          const prevSignalBeforeCognito = localPreviousAISignaledStop;
          localLastTurnTextForLog = cognitoReplyParsedResponse.spokenText; localDiscussionLog.push(`${MessageSender.Cognito}: ${localLastTurnTextForLog}`); setDiscussionLog([...localDiscussionLog]);
          localPreviousAISignaledStop = cognitoReplyParsedResponse.discussionShouldEnd || false;

          if (discussionMode === DiscussionMode.AiDriven) {
              if (localPreviousAISignaledStop && prevSignalBeforeCognito) {
                  addMessage(`双方AI (${MessageSender.Muse} 和 ${MessageSender.Cognito}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
                  setIsInternalDiscussionActive(false); break;
              } else if (localPreviousAISignaledStop) {
                  addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
              }
          }
          if (cancelRequestRef.current) break;
        }
      }
      setIsInternalDiscussionActive(false); // Ensure it's false after loop or if loop didn't run

      if (cancelRequestRef.current) return;

      const finalAnswerStepIdentifier = 'cognito-final-answer';
      addMessage(`${MessageSender.Cognito} 正在综合讨论内容，准备最终答案 (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);

      const finalAnswerPrompt = `${effectiveCognitoSysInstruction ? effectiveCognitoSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInputForFlow}". ${imageInstructionForAI} 您 (${MessageSender.Cognito}) 和 ${MessageSender.Muse} 进行了以下讨论 (均为中文):\n${localDiscussionLog.join("\n")}

**您的最终任务是为用户生成最终答案，并将其放入记事本中。**

**指令:**
1.  **生成最终答案:** 基于整个对话和当前记事本内容，综合所有要点，为用户创建一个全面、结构良好、易于理解的最终答案。答案必须是中文，并使用 Markdown 格式化以提高可读性。
2.  **更新记事本:** 使用 <np-replace-all> 标签将完整的最终答案放入记事本。这将是用户看到的主要输出。
3.  **口头回复:** 你的口头回复 (在 <np-replace-all> 标签之前的部分) 应该非常简短。只需告诉用户最终答案已在记事本中准备好。例如：“最终答案已为您准备好，请查看右侧的记事本。”

**严格遵守以上指令。最终答案必须在记事本中。**
\n${commonPromptInstructions()}`;

      const finalAnswerParsedResponse = await commonAIStepExecution(
          finalAnswerStepIdentifier, finalAnswerPrompt, selectedModelApiName, MessageSender.Cognito, MessagePurpose.FinalResponse, effectiveCognitoSysInstruction, imageApiPartForFlow, activeThinkingConfig,
          userInputForFlow, imageApiPartForFlow, [...localDiscussionLog]
      );
      if (cancelRequestRef.current) return;
      processNotepadUpdateFromAI(finalAnswerParsedResponse, MessageSender.Cognito, addMessage);

    } catch (error) {
      const catchedError = error as Error & {isApiKeyError?: boolean};
      if (cancelRequestRef.current && !catchedError.isApiKeyError) { /* User cancelled */ }
      else if (!catchedError.isApiKeyError) {
        console.error("继续讨论流程中发生错误:", catchedError);
      }
      setIsInternalDiscussionActive(false);
    } finally {
      if (!failedStepInfo || cancelRequestRef.current) {
         setIsLoading(false);
         stopProcessingTimer();
      }
      if (cancelRequestRef.current && !failedStepInfo) {
        addMessage("用户已停止AI响应。", MessageSender.System, MessagePurpose.SystemNotification);
      }
      setIsInternalDiscussionActive(false);
    }
  };

  const startChatProcessing = async (userInput: string, imageFile?: File | null) => {
    if (isLoading) return;
    if (!userInput.trim() && !imageFile) return;

    cancelRequestRef.current = false;
    setIsLoading(true);
    setFailedStepInfo(null);
    setDiscussionLog([]);
    setCurrentDiscussionTurn(0);
    setIsInternalDiscussionActive(false);
    startProcessingTimer();

    let userImageForDisplay: ChatMessage['image'] | undefined = undefined;
    let imageApiPart: { inlineData: { mimeType: string; data: string } } | undefined = undefined;

    if (imageFile) {
      try {
        const dataUrl = URL.createObjectURL(imageFile);
        userImageForDisplay = { dataUrl, name: imageFile.name, type: imageFile.type };
        const base64Data = await fileToBase64(imageFile);
        imageApiPart = { inlineData: { mimeType: imageFile.type, data: base64Data } };
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

    let activeThinkingConfig: { thinkingBudget: number } | undefined = undefined;
    if (currentModelDetails.supportsThinkingConfig && isThinkingBudgetActive) {
      activeThinkingConfig = (currentModelDetails.apiName === GEMINI_PRO_MODEL_ID || currentModelDetails.apiName === GEMINI_2_5_PRO_PREVIEW_05_06_MODEL_ID)
        ? THINKING_BUDGET_CONFIG_PRO_HIGH_QUALITY.thinkingConfig
        : THINKING_BUDGET_CONFIG_HIGH_QUALITY.thinkingConfig;
    }

    const effectiveCognitoSysInstruction = currentModelDetails.supportsSystemInstruction ? cognitoSystemPrompt : undefined;
    const effectiveMuseSysInstruction = currentModelDetails.supportsSystemInstruction ? museSystemPrompt : undefined;

    const imageInstructionForAI = imageApiPart ? "用户还提供了一张图片。请在您的分析和回复中同时考虑此图片和文本查询。" : "";
    const discussionModeInstructionText = discussionMode === DiscussionMode.AiDriven ? AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART : "";
    const commonPromptInstructions = () => NOTEPAD_INSTRUCTION_PROMPT_PART.replace('{notepadContent}', formatNotepadContentForAI(notepadContent)) + discussionModeInstructionText;

    try {
      const cognitoInitialStepIdentifier = 'cognito-initial-to-muse';
      addMessage(`${MessageSender.Cognito} 正在为 ${MessageSender.Muse} 准备第一个观点 (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
      const cognitoPrompt = `${effectiveCognitoSysInstruction ? effectiveCognitoSysInstruction + " " : ""}${`用户的查询 (中文) 是: "${userInput}". ${imageInstructionForAI} 请针对此查询提供您的初步想法或分析，以便 ${MessageSender.Muse} (创意型AI) 可以回应并与您开始讨论。用中文回答。`}\n${commonPromptInstructions()}`;

      const cognitoParsedResponse = await commonAIStepExecution(
          cognitoInitialStepIdentifier, cognitoPrompt, selectedModelApiName, MessageSender.Cognito, MessagePurpose.CognitoToMuse, effectiveCognitoSysInstruction, imageApiPart, activeThinkingConfig,
          userInput, imageApiPart, []
      );
      if (cancelRequestRef.current) throw new Error("用户取消操作");
      processNotepadUpdateFromAI(cognitoParsedResponse, MessageSender.Cognito, addMessage);
      lastTurnTextForLog = cognitoParsedResponse.spokenText;
      currentLocalDiscussionLog.push(`${MessageSender.Cognito}: ${lastTurnTextForLog}`);
      setDiscussionLog([...currentLocalDiscussionLog]);

      setIsInternalDiscussionActive(true); // Discussion begins AFTER Cognito's first message to Muse
      setCurrentDiscussionTurn(0); // Start of turn 0 (first exchange)

      let previousAISignaledStop = discussionMode === DiscussionMode.AiDriven && (cognitoParsedResponse.discussionShouldEnd || false);
      if (previousAISignaledStop) addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);

      for (let turn = 0; ; turn++) {
        setCurrentDiscussionTurn(turn);
        if (cancelRequestRef.current) break;
        if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns) break;

        const museStepIdentifier = `muse-reply-to-cognito-turn-${turn}`;
        addMessage(`${MessageSender.Muse} 正在回应 ${MessageSender.Cognito} (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
        let musePrompt = `${effectiveMuseSysInstruction ? effectiveMuseSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInput}". ${imageInstructionForAI} 当前讨论 (均为中文):\n${currentLocalDiscussionLog.join("\n")}\n${MessageSender.Cognito} (逻辑AI) 刚刚说 (中文): "${lastTurnTextForLog}". 请回复 ${MessageSender.Cognito}。继续讨论。保持您的回复简洁并使用中文。\n${commonPromptInstructions()}`;
        if (discussionMode === DiscussionMode.AiDriven && previousAISignaledStop) musePrompt += `\n${MessageSender.Cognito} 已包含 ${DISCUSSION_COMPLETE_TAG} 建议结束讨论。如果您同意，请在您的回复中也包含 ${DISCUSSION_COMPLETE_TAG}。否则，请继续讨论。`;

        const museParsedResponse = await commonAIStepExecution(
            museStepIdentifier, musePrompt, selectedModelApiName, MessageSender.Muse, MessagePurpose.MuseToCognito, effectiveMuseSysInstruction, imageApiPart, activeThinkingConfig,
            userInput, imageApiPart, [...currentLocalDiscussionLog], turn, previousAISignaledStop
        );
        if (cancelRequestRef.current) break;
        processNotepadUpdateFromAI(museParsedResponse, MessageSender.Muse, addMessage);
        const signalFromCognitoBeforeMuse = previousAISignaledStop;
        lastTurnTextForLog = museParsedResponse.spokenText; currentLocalDiscussionLog.push(`${MessageSender.Muse}: ${lastTurnTextForLog}`); setDiscussionLog([...currentLocalDiscussionLog]);
        previousAISignaledStop = museParsedResponse.discussionShouldEnd || false;

        if (discussionMode === DiscussionMode.AiDriven) {
            if (previousAISignaledStop && signalFromCognitoBeforeMuse) {
                addMessage(`双方AI (${MessageSender.Cognito} 和 ${MessageSender.Muse}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
                setIsInternalDiscussionActive(false); break;
            } else if (previousAISignaledStop) {
                addMessage(`${MessageSender.Muse} 已建议结束讨论。等待 ${MessageSender.Cognito} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
            }
        }

        if (cancelRequestRef.current) break;
        if (discussionMode === DiscussionMode.FixedTurns && turn >= manualFixedTurns -1) { setIsInternalDiscussionActive(false); break; }

        const cognitoReplyStepIdentifier = `cognito-reply-to-muse-turn-${turn}`;
        addMessage(`${MessageSender.Cognito} 正在回应 ${MessageSender.Muse} (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
        let cognitoReplyPrompt = `${effectiveCognitoSysInstruction ? effectiveCognitoSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInput}". ${imageInstructionForAI} 当前讨论 (均为中文):\n${currentLocalDiscussionLog.join("\n")}\n${MessageSender.Muse} (创意AI) 刚刚说 (中文): "${lastTurnTextForLog}". 请回复 ${MessageSender.Muse}。继续讨论。保持您的回复简洁并使用中文。\n${commonPromptInstructions()}`;
        if (discussionMode === DiscussionMode.AiDriven && previousAISignaledStop) cognitoReplyPrompt += `\n${MessageSender.Muse} 已包含 ${DISCUSSION_COMPLETE_TAG} 建议结束讨论。如果您同意，请在您的回复中也包含 ${DISCUSSION_COMPLETE_TAG}。否则，请继续讨论。`;

        const cognitoReplyParsedResponse = await commonAIStepExecution(
            cognitoReplyStepIdentifier, cognitoReplyPrompt, selectedModelApiName, MessageSender.Cognito, MessagePurpose.CognitoToMuse, effectiveCognitoSysInstruction, imageApiPart, activeThinkingConfig,
            userInput, imageApiPart, [...currentLocalDiscussionLog], turn, previousAISignaledStop
        );
        if (cancelRequestRef.current) break;
        processNotepadUpdateFromAI(cognitoReplyParsedResponse, MessageSender.Cognito, addMessage);
        const signalFromMuseBeforeCognito = previousAISignaledStop;
        lastTurnTextForLog = cognitoReplyParsedResponse.spokenText; currentLocalDiscussionLog.push(`${MessageSender.Cognito}: ${lastTurnTextForLog}`); setDiscussionLog([...currentLocalDiscussionLog]);
        previousAISignaledStop = cognitoReplyParsedResponse.discussionShouldEnd || false;

        if (discussionMode === DiscussionMode.AiDriven) {
            if (previousAISignaledStop && signalFromMuseBeforeCognito) {
                addMessage(`双方AI (${MessageSender.Muse} 和 ${MessageSender.Cognito}) 已同意结束讨论。`, MessageSender.System, MessagePurpose.SystemNotification);
                setIsInternalDiscussionActive(false); break;
            } else if (previousAISignaledStop) {
                addMessage(`${MessageSender.Cognito} 已建议结束讨论。等待 ${MessageSender.Muse} 的回应。`, MessageSender.System, MessagePurpose.SystemNotification);
            }
        }
      }
      setIsInternalDiscussionActive(false); // End of discussion loop

      if (cancelRequestRef.current) throw new Error("用户取消操作");

      const finalAnswerStepIdentifier = 'cognito-final-answer';
      addMessage(`${MessageSender.Cognito} 正在综合讨论内容，准备最终答案 (使用 ${currentModelDetails.name})...`, MessageSender.System, MessagePurpose.SystemNotification);
      const finalAnswerPrompt = `${effectiveCognitoSysInstruction ? effectiveCognitoSysInstruction + " " : ""}用户的查询 (中文) 是: "${userInput}". ${imageInstructionForAI} 您 (${MessageSender.Cognito}) 和 ${MessageSender.Muse} 进行了以下讨论 (均为中文):\n${currentLocalDiscussionLog.join("\n")}

**您的最终任务是为用户生成最终答案，并将其放入记事本中。**

**指令:**
1.  **生成最终答案:** 基于整个对话和当前记事本内容，综合所有要点，为用户创建一个全面、结构良好、易于理解的最终答案。答案必须是中文，并使用 Markdown 格式化以提高可读性。
2.  **更新记事本:** 使用 <np-replace-all> 标签将完整的最终答案放入记事本。这将是用户看到的主要输出。
3.  **口头回复:** 你的口头回复 (在 <np-replace-all> 标签之前的部分) 应该非常简短。只需告诉用户最终答案已在记事本中准备好。例如：“最终答案已为您准备好，请查看右侧的记事本。”

**严格遵守以上指令。最终答案必须在记事本中。**
\n${commonPromptInstructions()}`;

      const finalAnswerParsedResponse = await commonAIStepExecution(
          finalAnswerStepIdentifier, finalAnswerPrompt, selectedModelApiName, MessageSender.Cognito, MessagePurpose.FinalResponse, effectiveCognitoSysInstruction, imageApiPart, activeThinkingConfig,
          userInput, imageApiPart, [...currentLocalDiscussionLog]
      );
      if (cancelRequestRef.current) throw new Error("用户取消操作");
      processNotepadUpdateFromAI(finalAnswerParsedResponse, MessageSender.Cognito, addMessage);

    } catch (error) {
      const catchedError = error as Error & {isApiKeyError?: boolean};
      if (cancelRequestRef.current && !catchedError.isApiKeyError) { /* User cancelled, handled by finally */ }
      else if (!catchedError.isApiKeyError && !failedStepInfo) {
        console.error("聊天流程中发生错误:", catchedError);
        addMessage(`错误: ${catchedError.message}`, MessageSender.System, MessagePurpose.SystemNotification);
      }
      setIsInternalDiscussionActive(false);
    } finally {
      setIsLoading(false);
      stopProcessingTimer();
      setIsInternalDiscussionActive(false); // Ensure it's false when processing ends
      if (userImageForDisplay?.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userImageForDisplay.dataUrl);
      }
      if (cancelRequestRef.current && !failedStepInfo) {
        addMessage("用户已停止AI响应。", MessageSender.System, MessagePurpose.SystemNotification);
      }
    }
  };

  const retryFailedStep = async (stepToRetry: FailedStepPayload) => {
    if (isLoading) return;

    setIsLoading(true);
    cancelRequestRef.current = false;
    startProcessingTimer();

    const originalErrorMsgId = stepToRetry.originalSystemErrorMsgId;
    setFailedStepInfo(null);
    // isInternalDiscussionActive and currentDiscussionTurn will be set by continueDiscussionAfterSuccessfulRetry if needed

    addMessage(
      `[${stepToRetry.sender} - ${stepToRetry.stepIdentifier}] 正在手动重试...`,
      MessageSender.System,
      MessagePurpose.SystemNotification
    );

    let systemInstructionForRetry: string | undefined;
    if (currentModelDetails.supportsSystemInstruction) {
        systemInstructionForRetry = stepToRetry.sender === MessageSender.Cognito ? cognitoSystemPrompt : museSystemPrompt;
    }
    const updatedStepToRetry = { ...stepToRetry, systemInstruction: systemInstructionForRetry };


    try {
      const result = await generateResponse(
        updatedStepToRetry.prompt,
        updatedStepToRetry.modelName,
        updatedStepToRetry.systemInstruction,
        updatedStepToRetry.imageApiPart,
        updatedStepToRetry.thinkingConfig
      );

      if (cancelRequestRef.current) throw new Error("用户已停止手动重试");
      if (result.error) {
        if(result.error.includes("API key not valid")) {
            setIsApiKeyMissingState(true);
            throw Object.assign(new Error(result.text), {isApiKeyError: true});
        }
        throw new Error(result.text);
      }

      const parsedResponseFromRetry = parseAIResponse(result.text);
      addMessage(parsedResponseFromRetry.spokenText, updatedStepToRetry.sender, updatedStepToRetry.purpose, result.durationMs);
      processNotepadUpdateFromAI(parsedResponseFromRetry, updatedStepToRetry.sender, addMessage);
      addMessage(`[${updatedStepToRetry.sender} - ${updatedStepToRetry.stepIdentifier}] 手动重试成功。后续流程将继续。`, MessageSender.System, MessagePurpose.SystemNotification);

      // continueDiscussionAfterSuccessfulRetry will manage isLoading, timer, and internal discussion states
      await continueDiscussionAfterSuccessfulRetry(updatedStepToRetry, parsedResponseFromRetry);

    } catch (error) {
      const catchedError = error as Error & {isApiKeyError?: boolean};
      if (cancelRequestRef.current && !catchedError.isApiKeyError) { /* User cancelled */ }
      else {
        console.error("手动重试失败:", catchedError);
        const errorMsg = catchedError.message || "未知错误";

        let systemInstructionForNewFailure: string | undefined;
        if (currentModelDetails.supportsSystemInstruction) {
            systemInstructionForNewFailure = updatedStepToRetry.sender === MessageSender.Cognito ? cognitoSystemPrompt
                                          : updatedStepToRetry.sender === MessageSender.Muse ? museSystemPrompt
                                          : undefined;
        }

        const newErrorMsgId = addMessage(
            `[${updatedStepToRetry.sender} - ${updatedStepToRetry.stepIdentifier}] 手动重试失败: ${errorMsg}. 您可以再次尝试。`,
            MessageSender.System,
            MessagePurpose.SystemNotification
        );
        if (catchedError.isApiKeyError) setIsApiKeyMissingState(true);
        setFailedStepInfo({ ...updatedStepToRetry, originalSystemErrorMsgId: newErrorMsgId, systemInstruction: systemInstructionForNewFailure });
      }
       // Only stop loading if the retry itself fails or is cancelled before continuation
      if (!cancelRequestRef.current || failedStepInfo) { // If not cancelled or if failedStepInfo is set (meaning retry failed)
          setIsLoading(false);
          stopProcessingTimer();
      }
      setIsInternalDiscussionActive(false); // Ensure this is false on any retry failure path
      if (cancelRequestRef.current && !failedStepInfo) {
          addMessage("用户已停止手动重试。", MessageSender.System, MessagePurpose.SystemNotification);
      }
    }
  };


  const stopGenerating = () => {
    cancelRequestRef.current = true;
    setIsInternalDiscussionActive(false);
    // setIsLoading and stopProcessingTimer are handled by the finally blocks of the active async operations.
  };

  return {
    isLoading,
    discussionLog,
    failedStepInfo,
    startChatProcessing,
    retryFailedStep,
    stopGenerating,
    cancelRequestRef,
    currentDiscussionTurn,
    isInternalDiscussionActive,
  };
};
