
// Loosely based on GeminiResponsePayload for now
interface OpenAiResponsePayload {
  text: string;
  durationMs: number;
  error?: string;
}

interface OpenAiMessageContentPartText {
  type: 'text';
  text: string;
}
interface OpenAiMessageContentPartImage {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}
type OpenAiMessageContentPart = OpenAiMessageContentPartText | OpenAiMessageContentPartImage;


interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<OpenAiMessageContentPart>;
}

export const generateOpenAiResponse = async (
  prompt: string, // This will be the main user content for the 'user' role message
  modelId: string,
  apiKey: string,
  baseUrl: string,
  systemInstruction?: string,
  imagePart?: { mimeType: string; data: string } // Base64 data and mimeType
): Promise<OpenAiResponsePayload> => {
  const startTime = performance.now();
  const messages: OpenAiChatMessage[] = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  let userMessageContent: string | Array<OpenAiMessageContentPart>;
  if (imagePart && imagePart.data) {
    userMessageContent = [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: {
          url: `data:${imagePart.mimeType};base64,${imagePart.data}`,
          // detail: 'auto' // Optional: you can add detail if needed
        },
      },
    ];
  } else {
    userMessageContent = prompt;
  }
  messages.push({ role: 'user', content: userMessageContent });

  const requestBody = {
    model: modelId,
    messages: messages,
    // max_tokens: 1024, // Optional: Set a default or make it configurable
    // temperature: 0.7, // Optional
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        // If parsing error body fails, use status text
      }
      const errorMessage =
        errorBody?.error?.message ||
        response.statusText ||
        `请求失败，状态码: ${response.status}`;
        
      let errorType = "OpenAI API error";
      if (response.status === 401 || response.status === 403) {
        errorType = "API key invalid or permission denied";
      } else if (response.status === 429) {
        errorType = "Quota exceeded";
      }
      console.error("OpenAI API Error:", errorMessage, "Status:", response.status, "Body:", errorBody);
      return { text: errorMessage, durationMs, error: errorType };
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("OpenAI API: 无效的响应结构", data);
      return { text: "AI响应格式无效。", durationMs, error: "Invalid response structure" };
    }

    return { text: data.choices[0].message.content, durationMs };

  } catch (error) {
    console.error("调用OpenAI API时出错:", error);
    const durationMs = performance.now() - startTime;
    let errorMessage = "与AI通信时发生未知错误。";
    let errorType = "Unknown AI error";
    if (error instanceof Error) {
      errorMessage = `与AI通信时出错: ${error.message}`;
      errorType = error.name;
    }
    return { text: errorMessage, durationMs, error: errorType };
  }
};
