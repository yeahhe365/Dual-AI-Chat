
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { AiResponsePayload } from "../types";

// Helper to create a GoogleGenAI instance with potential custom fetch
const createGoogleAIClient = (apiKey: string, customApiEndpoint?: string, signal?: AbortSignal): GoogleGenAI => {
  // Use 'any' to bypass strict type checking for 'fetch' property if it's not in the type definition
  const clientOptions: any = { apiKey };

  if ((customApiEndpoint && customApiEndpoint.trim() !== '') || signal) {
    clientOptions.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      // Merge signal into init options
      const fetchInit = { ...init, signal: signal || init?.signal };

      try {
        const sdkUrl = new URL(url.toString());
        // sdkUrl.pathname includes the leading slash e.g. /v1beta/models/..
        // sdkUrl.search includes the leading question mark e.g. ?alt=json
        // sdkUrl.hash includes the leading hash
        const sdkPathAndQuery = sdkUrl.pathname + sdkUrl.search + sdkUrl.hash;

        let basePath = customApiEndpoint?.trim();

        if (basePath) {
             // Ensure basePath does not end with a slash
            if (basePath.endsWith('/')) {
              basePath = basePath.slice(0, -1);
            }

            // Robust fix for potential double versioning (e.g. /v1beta/v1beta)
            // If the sdk path starts with a version (like /v1beta or /v1), and the custom endpoint 
            // ends with that same version, strip it from the custom endpoint to avoid duplication.
            const versionMatch = sdkUrl.pathname.match(/^\/(v1beta|v1)\b/);
            if (versionMatch && basePath.endsWith(`/${versionMatch[1]}`)) {
                 basePath = basePath.slice(0, - (`/${versionMatch[1]}`).length);
            }

            // sdkPathAndQuery already starts with '/'
            const finalUrl = basePath + sdkPathAndQuery;
            return fetch(finalUrl, fetchInit);
        }
        
        // If no custom endpoint, just use standard fetch with signal
        return fetch(url, fetchInit);
        
      } catch (e) {
        console.error(
          "Error constructing URL with custom endpoint or fetch override. Using original URL.",
          e
        );
        // Fallback to original URL with signal
        return fetch(url, fetchInit);
      }
    };
  }
  return new GoogleGenAI(clientOptions);
};

export const generateResponse = async (
  prompt: string,
  modelName: string,
  useCustomConfig: boolean, // New parameter to decide API config source
  customApiKey?: string,
  customApiEndpoint?: string,
  systemInstruction?: string,
  imagePart?: { inlineData: { mimeType: string; data: string } },
  thinkingConfig?: { thinkingBudget?: number, thinkingLevel?: 'LOW' | 'HIGH' }, // Flexible type
  signal?: AbortSignal
): Promise<AiResponsePayload> => {
  const startTime = performance.now();
  try {
    let apiKeyToUse: string | undefined;
    let endpointForClient: string | undefined;
    let missingKeyUserMessage = "";
    let invalidKeyUserMessage = "API密钥无效或权限不足。请检查您的API密钥配置和权限。";


    if (useCustomConfig) {
      apiKeyToUse = customApiKey?.trim();
      endpointForClient = customApiEndpoint; // createGoogleAIClient handles if it's empty/default
      missingKeyUserMessage = "自定义API密钥未在设置中提供。请在设置中输入密钥，或关闭“使用自定义API配置”以使用环境变量。";
      if (apiKeyToUse) { // If custom key is provided, tailor invalid message slightly
        invalidKeyUserMessage = "提供的自定义API密钥无效或权限不足。请检查设置中的密钥。";
      }
    } else {
      apiKeyToUse = process.env.API_KEY;
      endpointForClient = undefined; // Ensures default Google endpoint is used by SDK
      missingKeyUserMessage = "API密钥未在环境变量中配置。请配置该密钥，或在设置中启用并提供自定义API配置。";
      if (apiKeyToUse) { // If env key is present, tailor invalid message
         invalidKeyUserMessage = "环境变量中的API密钥无效或权限不足。请检查该密钥。";
      }
    }

    if (!apiKeyToUse) {
      console.error(missingKeyUserMessage);
      // This specific error "API key not configured" will be checked by useChatLogic
      return { text: missingKeyUserMessage, durationMs: performance.now() - startTime, error: "API key not configured" };
    }
    
    const genAI = createGoogleAIClient(apiKeyToUse, endpointForClient, signal);

    const configForApi: {
      systemInstruction?: string;
      thinkingConfig?: any;
    } = {};

    if (systemInstruction) {
      configForApi.systemInstruction = systemInstruction;
    }
    if (thinkingConfig) {
      configForApi.thinkingConfig = thinkingConfig;
    }

    const textPart: Part = { text: prompt };
    let requestContents: string | { parts: Part[] };

    if (imagePart) {
      requestContents = { parts: [imagePart, textPart] };
    } else {
      requestContents = prompt;
    }

    // Wrap the SDK call in a Promise that races against the AbortSignal.
    // This ensures that even if the SDK ignores the signal (or fetch isn't wired correctly),
    // the application flow halts immediately upon user cancellation.
    const generatePromise = genAI.models.generateContent({
      model: modelName,
      contents: requestContents,
      config: Object.keys(configForApi).length > 0 ? configForApi : undefined,
    });

    const response: GenerateContentResponse = await new Promise<GenerateContentResponse>((resolve, reject) => {
        // If already aborted, reject immediately
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }

        const onAbort = () => {
            reject(new DOMException('Aborted', 'AbortError'));
        };

        if (signal) {
            signal.addEventListener('abort', onAbort);
        }

        generatePromise.then(
            (res) => {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve(res);
            },
            (err) => {
                if (signal) signal.removeEventListener('abort', onAbort);
                reject(err);
            }
        );
    });

    // Extract text and thoughts
    let text = '';
    let thoughts = '';

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Check for 'thought' property (Gemini 2.5/3.0)
        // Note: The SDK types might vary, casting to any for checking the property is safer for now
        if ((part as any).thought) {
          thoughts += part.text;
        } else {
          text += part.text || '';
        }
      }
    }
    
    // Fallback: If parts didn't construct text (unlikely if iteration logic is correct), check response.text
    if (!text && !thoughts && response.text) {
      text = response.text;
    }

    const durationMs = performance.now() - startTime;
    return { text, thoughts: thoughts || undefined, durationMs };
  } catch (error) {
    // Check for AbortError from fetch or our wrapper
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Aborted'))) {
       return { text: "用户取消操作", durationMs: performance.now() - startTime, error: "AbortError" };
    }

    console.error("调用Gemini API时出错:", error);
    const durationMs = performance.now() - startTime;
    let errorMessage = "与AI通信时发生未知错误。";
    let errorType = "Unknown AI error";

    // Default messages, might be overridden by specific checks
    let specificMissingKeyMsg = "API密钥未配置。";
    let specificInvalidKeyMsg = "API密钥无效或权限不足。";

    if (useCustomConfig) {
        specificMissingKeyMsg = "自定义API密钥未在设置中提供。";
        specificInvalidKeyMsg = customApiKey?.trim() ? "提供的自定义API密钥无效或权限不足。" : specificMissingKeyMsg;
    } else {
        specificMissingKeyMsg = "API密钥未在环境变量中配置。";
        specificInvalidKeyMsg = process.env.API_KEY ? "环境变量中的API密钥无效或权限不足。" : specificMissingKeyMsg;
    }


    if (error instanceof Error) {
      errorMessage = `与AI通信时出错: ${error.message}`;
      errorType = error.name; 
      // Error messages from GenAI lib can be generic, map them to our standardized types
      if (error.message.includes('API key not valid') || 
          error.message.includes('API_KEY_INVALID') || 
          error.message.includes('permission-denied') || // Broader permission issue
          (error.message.includes('forbidden') && error.message.toLowerCase().includes('api key'))) { // Another way an invalid key might present
         errorMessage = specificInvalidKeyMsg;
         errorType = "API key invalid or permission denied";
      } else if (error.message.includes('Quota exceeded')) {
        errorMessage = "API配额已超出。请检查您的Google AI Studio配额。";
        errorType = "Quota exceeded";
      }
      // The "API key not configured" case is handled before calling createGoogleAIClient
      // and directly returned if apiKeyToUse is null/empty. This catch is for other errors.
    }
    return { text: errorMessage, durationMs, error: errorType };
  }
};
