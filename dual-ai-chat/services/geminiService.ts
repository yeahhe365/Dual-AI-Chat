
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

let ai: GoogleGenAI | null = null;

const initializeGoogleAI = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not defined in environment variables.");
    throw new Error("API_KEY 未配置。无法初始化 Gemini API。");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

interface GeminiResponsePayload {
  text: string;
  durationMs: number;
  error?: string;
}

export const generateResponse = async (
  prompt: string,
  modelName: string,
  systemInstruction?: string,
  imagePart?: { inlineData: { mimeType: string; data: string } }, // Optional image part
  thinkingConfig?: { thinkingBudget: number } // Optional thinkingConfig
): Promise<GeminiResponsePayload> => {
  const startTime = performance.now();
  try {
    const genAI = initializeGoogleAI();
    
    const configForApi: { 
      systemInstruction?: string;
      thinkingConfig?: { thinkingBudget: number };
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

    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: modelName,
      contents: requestContents,
      config: Object.keys(configForApi).length > 0 ? configForApi : undefined,
    });
    
    const durationMs = performance.now() - startTime;
    return { text: response.text, durationMs };
  } catch (error) {
    console.error("调用Gemini API时出错:", error);
    const durationMs = performance.now() - startTime;
    let errorMessage = "与AI通信时发生未知错误。";
    let errorType = "Unknown AI error";
    if (error instanceof Error) {
      errorMessage = `与AI通信时出错: ${error.message}`;
      errorType = error.message;
      if (error.message.includes('API key not valid')) {
         errorMessage = "API密钥无效。请检查您的API密钥配置。";
         errorType = "API key not valid";
      }
    }
    return { text: errorMessage, durationMs, error: errorType };
  }
};