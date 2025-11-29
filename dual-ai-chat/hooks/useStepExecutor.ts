
import { useCallback } from 'react';
import { MessageSender, MessagePurpose, FailedStepPayload } from '../types';
import { generateResponse as generateGeminiResponse } from '../services/geminiService';
import { generateOpenAiResponse } from '../services/openaiService';
import {
  AiModel,
  MAX_AUTO_RETRIES,
  RETRY_DELAY_BASE_MS,
  GEMINI_3_PRO_MODEL_ID,
  GEMINI_2_5_PRO_MODEL_ID
} from '../constants';
import { parseAIResponse, ParsedAIResponse } from '../utils/appUtils';
import { useChatState } from './useChatState';

interface UseStepExecutorProps {
  state: ReturnType<typeof useChatState>;
  addMessage: (text: string, sender: MessageSender, purpose: MessagePurpose, durationMs?: number, image?: any, thoughts?: string) => string;
  setGlobalApiKeyStatus: (status: { isMissing?: boolean, isInvalid?: boolean, message?: string }) => void;
  
  // Configuration Props
  cognitoSystemPrompt: string;
  museSystemPrompt: string;
  useCustomApiConfig: boolean;
  customApiKey: string;
  customApiEndpoint: string;
  useOpenAiApiConfig: boolean;
  openAiApiKey: string;
  openAiApiBaseUrl: string;
  
  // Thinking Config
  cognitoThinkingBudget: number;
  cognitoThinkingLevel: 'LOW' | 'HIGH';
  museThinkingBudget: number;
  museThinkingLevel: 'LOW' | 'HIGH';
}

export const useStepExecutor = ({
  state,
  addMessage,
  setGlobalApiKeyStatus,
  cognitoSystemPrompt,
  museSystemPrompt,
  useCustomApiConfig,
  customApiKey,
  customApiEndpoint,
  useOpenAiApiConfig,
  openAiApiKey,
  openAiApiBaseUrl,
  cognitoThinkingBudget,
  cognitoThinkingLevel,
  museThinkingBudget,
  museThinkingLevel,
}: UseStepExecutorProps) => {

  const getThinkingConfigForGeminiModel = useCallback((
    modelDetails: AiModel,
    budget: number,
    level: 'LOW' | 'HIGH'
  ): { thinkingBudget?: number, thinkingLevel?: 'LOW' | 'HIGH' } | undefined => {
    // Only apply if OpenAI config is NOT active and model supports thinking
    if (!useOpenAiApiConfig && modelDetails.supportsThinkingConfig) {
      const isGemini3 = modelDetails.apiName === GEMINI_3_PRO_MODEL_ID;
      
      // If user disabled thinking (0), return undefined (don't send config)
      if (budget === 0) {
          return undefined; 
      }

      // Auto mode (-1)
      if (budget === -1) {
          if (isGemini3) {
              // Gemini 3 supports levels in Auto mode
              return { thinkingLevel: level };
          } else {
              // Fallback default for Gemini 2.5 series
              return { thinkingBudget: 1024 }; 
          }
      }

      // Custom Budget (>0)
      return { thinkingBudget: budget };
    }
    return undefined;
  }, [useOpenAiApiConfig]);

  const executeStep = useCallback(async (
    stepIdentifier: string,
    prompt: string,
    modelDetailsForStep: AiModel,
    senderForStep: MessageSender,
    purposeForStep: MessagePurpose,
    imageApiPartForStep?: { inlineData: { mimeType: string; data: string } },
    userInputForFlowContext?: string,
    imageApiPartForFlowContext?: { inlineData: { mimeType: string; data: string } },
    discussionLogBeforeFailureContext?: string[],
    currentTurnIndexForResumeContext?: number,
    previousAISignaledStopForResumeContext?: boolean
  ): Promise<ParsedAIResponse> => {
    let stepSuccess = false;
    let parsedResponse: ParsedAIResponse | null = null;
    let autoRetryCount = 0;

    const systemInstructionToUse = senderForStep === MessageSender.Cognito ? cognitoSystemPrompt : museSystemPrompt;
    
    // Determine specific thinking config for this step based on sender
    const specificThinkingBudget = senderForStep === MessageSender.Cognito ? cognitoThinkingBudget : museThinkingBudget;
    const specificThinkingLevel = senderForStep === MessageSender.Cognito ? cognitoThinkingLevel : museThinkingLevel;
    
    const thinkingConfigToUseForGemini = getThinkingConfigForGeminiModel(
      modelDetailsForStep, 
      specificThinkingBudget, 
      specificThinkingLevel
    );

    while (autoRetryCount <= MAX_AUTO_RETRIES && !stepSuccess) {
      if (state.cancelRequestRef.current) throw new Error("用户取消操作");
      try {
        let result: { text: string; durationMs: number; error?: string; thoughts?: string };
        const currentOpenAiModelId = modelDetailsForStep.apiName;

        if (useOpenAiApiConfig) {
          result = await generateOpenAiResponse(
            prompt,
            currentOpenAiModelId,
            openAiApiKey,
            openAiApiBaseUrl,
            modelDetailsForStep.supportsSystemInstruction ? systemInstructionToUse : undefined,
            imageApiPartForStep ? { mimeType: imageApiPartForStep.inlineData.mimeType, data: imageApiPartForStep.inlineData.data } : undefined,
            state.abortControllerRef.current?.signal
          );
        } else {
          // geminiService.ts generateResponse needs to update to accept thinkingLevel too if we want to support it fully type-wise
          // casting to any for config to pass level
          result = await generateGeminiResponse(
            prompt,
            modelDetailsForStep.apiName,
            useCustomApiConfig,
            customApiKey,
            customApiEndpoint,
            modelDetailsForStep.supportsSystemInstruction ? systemInstructionToUse : undefined,
            imageApiPartForStep,
            thinkingConfigToUseForGemini as any, // Type assertion for now until service updated
            state.abortControllerRef.current?.signal
          );
        }

        if (state.cancelRequestRef.current) throw new Error("用户取消操作");

        if (result.error) {
          // Check specifically for AbortError string returned from services
          if (result.error === 'AbortError' || result.text === '用户取消操作') {
             throw new Error("用户取消操作");
          }

          if (result.error === "API key not configured" || result.error.toLowerCase().includes("api key not provided")) {
            setGlobalApiKeyStatus({ isMissing: true, message: result.text });
            throw new Error(result.text);
          }
          if (result.error === "API key invalid or permission denied") {
            setGlobalApiKeyStatus({ isInvalid: true, message: result.text });
            throw new Error(result.text);
          }
          throw new Error(result.text || "AI 响应错误");
        }
        setGlobalApiKeyStatus({ isMissing: false, isInvalid: false, message: undefined });
        parsedResponse = parseAIResponse(result.text);
        
        // Pass thoughts to addMessage
        addMessage(parsedResponse.spokenText, senderForStep, purposeForStep, result.durationMs, undefined, result.thoughts);
        
        stepSuccess = true;
      } catch (e) {
        const error = e as Error;
        
        // IMMEDIATE CANCELLATION CHECK
        if (state.cancelRequestRef.current || error.name === 'AbortError' || error.message === '用户取消操作') {
           // Prevent any retries and rethrow to exit loop immediately
           throw new Error("用户取消操作");
        }

        if (error.message.includes("API密钥") || error.message.toLowerCase().includes("api key")) {
          throw error;
        }

        if (autoRetryCount < MAX_AUTO_RETRIES) {
          addMessage(`[${senderForStep} - ${stepIdentifier}] 调用失败，重试 (${autoRetryCount + 1}/${MAX_AUTO_RETRIES})... ${error.message}`, MessageSender.System, MessagePurpose.SystemNotification);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE_MS * (autoRetryCount + 1)));
        } else {
          const errorMsgId = addMessage(`[${senderForStep} - ${stepIdentifier}] 在 ${MAX_AUTO_RETRIES + 1} 次尝试后失败: ${error.message} 可手动重试。`, MessageSender.System, MessagePurpose.SystemNotification);

          // Prepare config for retry payload
          let thinkingConfigForPayload: any = undefined;
          if (!useOpenAiApiConfig) {
            thinkingConfigForPayload = thinkingConfigToUseForGemini;
          }

          state.setFailedStepInfo({
            stepIdentifier: stepIdentifier,
            prompt: prompt,
            modelName: modelDetailsForStep.apiName,
            systemInstruction: modelDetailsForStep.supportsSystemInstruction ? systemInstructionToUse : undefined,
            imageApiPart: imageApiPartForStep,
            sender: senderForStep,
            purpose: purposeForStep,
            originalSystemErrorMsgId: errorMsgId,
            thinkingConfig: thinkingConfigForPayload,
            userInputForFlow: userInputForFlowContext || "",
            imageApiPartForFlow: imageApiPartForFlowContext,
            discussionLogBeforeFailure: discussionLogBeforeFailureContext || [],
            currentTurnIndexForResume: currentTurnIndexForResumeContext,
            previousAISignaledStopForResume: previousAISignaledStopForResumeContext
          });
          state.setIsInternalDiscussionActive(false);
          // Mark error as handled to prevent duplicate logging
          (error as any).isHandled = true;
          throw error;
        }
      }
      autoRetryCount++;
    }
    if (!parsedResponse) {
      state.setIsInternalDiscussionActive(false);
      throw new Error("AI响应处理失败");
    }
    return parsedResponse;
  }, [
    state, addMessage, cognitoSystemPrompt, museSystemPrompt, getThinkingConfigForGeminiModel,
    useOpenAiApiConfig, openAiApiKey, openAiApiBaseUrl,
    useCustomApiConfig, customApiKey, customApiEndpoint,
    setGlobalApiKeyStatus, cognitoThinkingBudget, cognitoThinkingLevel, museThinkingBudget, museThinkingLevel
  ]);

  return { executeStep, getThinkingConfigForGeminiModel };
};
