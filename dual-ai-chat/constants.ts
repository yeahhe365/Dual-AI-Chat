
import type { AiModel } from './types';

export const GEMINI_3_PRO_MODEL_ID = 'gemini-3-pro-preview';
export const GEMINI_2_5_PRO_MODEL_ID = 'gemini-2.5-pro';
export const GEMINI_2_5_FLASH_MODEL_ID = 'gemini-2.5-flash';
export const GEMINI_2_5_FLASH_LITE_MODEL_ID = 'gemini-2.5-flash-lite';

export type { AiModel };

export const MODELS: AiModel[] = [
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3.0 Pro',
    apiName: GEMINI_3_PRO_MODEL_ID,
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    apiName: GEMINI_2_5_PRO_MODEL_ID,
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    apiName: GEMINI_2_5_FLASH_MODEL_ID,
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    apiName: GEMINI_2_5_FLASH_LITE_MODEL_ID,
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
];

export const DEFAULT_COGNITO_MODEL_API_NAME = GEMINI_3_PRO_MODEL_ID;
export const DEFAULT_MUSE_MODEL_API_NAME = GEMINI_3_PRO_MODEL_ID;

export const THINKING_BUDGET_RANGES: { [key: string]: { min: number; max: number } } = {
  [GEMINI_2_5_FLASH_MODEL_ID]: { min: 1024, max: 24576 },
  [GEMINI_2_5_PRO_MODEL_ID]: { min: 128, max: 32768 },
  [GEMINI_3_PRO_MODEL_ID]: { min: 128, max: 32768 },
  [GEMINI_2_5_FLASH_LITE_MODEL_ID]: { min: 512, max: 24576 },
};

export const GEMINI_3_RO_MODELS: string[] = [GEMINI_3_PRO_MODEL_ID];

// -1 represents "Auto"
export const DEFAULT_THINKING_BUDGET = -1;
export const DEFAULT_THINKING_LEVEL = 'HIGH';

// Legacy constant kept for reference, but prompt logic now uses JSON boolean
export const DISCUSSION_COMPLETE_TAG = "DISCUSSION_COMPLETE";

export const COGNITO_SYSTEM_PROMPT_HEADER = `You are Cognito, a highly logical, analytical, and precise AI assistant.
**Objective:** Collaborate with your partner, Muse, to produce the most accurate, comprehensive, and helpful response for the user.

**YOUR ROLE (Cognito):**
- **Logical Anchor:** Focus on facts, structure, consistency, and practical feasibility.
- **Directness:** Address the user's specific questions immediately and clearly.
- **Reasoning:** Provide step-by-step logical deductions.
- **Collaboration:** Engage with Muse. Defend your logic against Muse's skepticism, but incorporate Muse's creative insights if they add value.
- **Guidance:** If the discussion drifts, gently steer it back to the user's core query.

**CRITICAL RULES:**
1. **LANGUAGE:** You must **ALWAYS** speak and write in **Chinese** (Simplified).
2. **IDENTITY:** You are Cognito. Never speak for Muse.
3. **TONE:** Professional, objective, calm, and analytical.
4. **SIMPLE QUERIES:** If the user query is trivial, answer directly and signal completion via JSON.`;

export const MUSE_SYSTEM_PROMPT_HEADER = `You are Muse, a creative, skeptical, and innovative AI assistant.
**Objective:** Collaborate with your partner, Cognito, to ensure the final response is not just correct, but insightful, complete, and creative.

**YOUR ROLE (Muse):**
- **The Challenger:** Question assumptions. Ask "Why?", "What if?", and "Is this enough?".
- **The Creative:** Propose lateral thinking, analogies, and out-of-the-box solutions.
- **Perspective:** Consider emotional context, edge cases, and future implications that logic might miss.
- **Collaboration:** Push Cognito to be better. Do not just disagree for the sake of it; disagree to improve the quality of the answer.

**CRITICAL RULES:**
1. **LANGUAGE:** You must **ALWAYS** speak and write in **Chinese** (Simplified).
2. **IDENTITY:** You are Muse. Never speak for Cognito.
3. **TONE:** Inquisitive, imaginative, slightly provocative but constructive.
4. **SIMPLE QUERIES:** If Cognito has answered perfectly, agree and signal completion via JSON.`;

export const DEFAULT_MANUAL_FIXED_TURNS = 2;
export const MIN_MANUAL_FIXED_TURNS = 1;

export const INITIAL_NOTEPAD_CONTENT = `这是共享记事本。\nCognito 和 Muse 可以在讨论过程中共同编辑和使用它。`;

export const NOTEPAD_INSTRUCTION_PROMPT_PART = `
**SHARED NOTEPAD & RESPONSE FORMAT:**
You share a "Notepad" with your partner. You must output your conversational response first, followed by a JSON block to manage the notepad and discussion state.
- **Current Notepad Content:**
---
{notepadContent}
---

**INSTRUCTIONS:**
1. Write your conversational response to your partner or user in plain text.
2. At the very end, provide a single valid JSON object wrapped in a code block \`\`\`json ... \`\`\`.

**JSON SCHEMA:**
\`\`\`json
{
  "notepad_modifications": [
    // Optional array of actions
    { "action": "replace_all", "content": "New full content" },
    { "action": "append", "content": "Text to add at bottom" },
    { "action": "prepend", "content": "Text to add at top" },
    { "action": "replace_section", "header": "Header Title", "content": "New content for section" },
    { "action": "append_to_section", "header": "Header Title", "content": "Text to append to section" },
    { "action": "search_and_replace", "find": "exact string", "replacement": "new string", "all": boolean }
  ],
  "discussion_complete": boolean // Set to true ONLY if the discussion is finished and ready for the user.
}
\`\`\`

**Action Details:**
- \`replace_section\`: Replaces everything under a specific Markdown header until the next header.
- \`append_to_section\`: Adds content to the end of a specific Markdown header section.
- \`replace_all\`: Use this for the Final Answer to set the notepad content.
`;


export const AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART = `
**ENDING THE DISCUSSION:**
If you believe the current topic has been sufficiently explored and ready for the Final Answer, set \`"discussion_complete": true\` in your JSON output. Both partners must agree to end the discussion.
`;

export const MAX_AUTO_RETRIES = 2;
export const RETRY_DELAY_BASE_MS = 1000;

// Gemini Custom API Config
export const CUSTOM_API_ENDPOINT_STORAGE_KEY = 'dualAiChatCustomApiEndpoint';
export const CUSTOM_API_KEY_STORAGE_KEY = 'dualAiChatCustomApiKey';
export const USE_CUSTOM_API_CONFIG_STORAGE_KEY = 'dualAiChatUseCustomApiConfig';

// OpenAI-Compatible API Config
export const USE_OPENAI_API_CONFIG_STORAGE_KEY = 'dualAiChatUseOpenAiApiConfig';
export const OPENAI_API_BASE_URL_STORAGE_KEY = 'dualAiChatOpenAiApiBaseUrl';
export const OPENAI_API_KEY_STORAGE_KEY = 'dualAiChatOpenAiApiKey';
export const OPENAI_COGNITO_MODEL_ID_STORAGE_KEY = 'dualAiChatOpenAiCognitoModelId';
export const OPENAI_MUSE_MODEL_ID_STORAGE_KEY = 'dualAiChatOpenAiMuseModelId';

export const DEFAULT_OPENAI_API_BASE_URL = 'https://api.openai.com/v1'; 
export const DEFAULT_OPENAI_COGNITO_MODEL_ID = 'o4-mini'; 
export const DEFAULT_OPENAI_MUSE_MODEL_ID = 'o4-mini';

// Thinking Config Keys
export const THINKING_BUDGET_STORAGE_KEY = 'dualAiChatThinkingBudget'; // Legacy/Fallback
export const THINKING_LEVEL_STORAGE_KEY = 'dualAiChatThinkingLevel';   // Legacy/Fallback

export const COGNITO_THINKING_BUDGET_STORAGE_KEY = 'dualAiChatCognitoThinkingBudget';
export const COGNITO_THINKING_LEVEL_STORAGE_KEY = 'dualAiChatCognitoThinkingLevel';
export const MUSE_THINKING_BUDGET_STORAGE_KEY = 'dualAiChatMuseThinkingBudget';
export const MUSE_THINKING_LEVEL_STORAGE_KEY = 'dualAiChatMuseThinkingLevel';

// Data Persistence Keys
export const NOTEPAD_CONTENT_STORAGE_KEY = 'dualAiChatNotepadContent';
export const CHAT_MESSAGES_STORAGE_KEY = 'dualAiChatMessages';
