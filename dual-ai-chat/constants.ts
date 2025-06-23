
export const GEMINI_2_5_FLASH_MODEL_ID = 'gemini-2.5-flash';
export const GEMINI_PRO_MODEL_ID = 'gemini-2.5-pro';
export const GEMINI_FLASH_LITE_PREVIEW_MODEL_ID = 'gemini-2.5-flash-lite-preview-06-17';
export const GEMMA_3_27B_IT_MODEL_ID = 'gemma-3-27b-it';
export const GEMINI_2_5_PRO_PREVIEW_05_06_MODEL_ID = 'gemini-2.5-pro-preview-05-06';


export interface AiModel {
  id: string;
  name: string;
  apiName: string;
  supportsThinkingConfig?: boolean;
  supportsSystemInstruction?: boolean;
}

export const MODELS: AiModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    apiName: 'gemini-2.5-flash', 
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'pro-2.5',
    name: 'Gemini 2.5 Pro',
    apiName: GEMINI_PRO_MODEL_ID, // This constant needs to be updated or use the correct preview name if applicable
    supportsThinkingConfig: true, 
    supportsSystemInstruction: true,
  },
  {
    id: 'pro-2.5-preview-05-06',
    name: 'Gemini 2.5 Pro 0506',
    apiName: GEMINI_2_5_PRO_PREVIEW_05_06_MODEL_ID,
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Lite',
    apiName: GEMINI_FLASH_LITE_PREVIEW_MODEL_ID, // This constant needs to be updated or use the correct preview name if applicable
    supportsThinkingConfig: true,
    supportsSystemInstruction: true,
  },
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma-3-27B',
    apiName: GEMMA_3_27B_IT_MODEL_ID, // This constant needs to be updated or use the correct preview name if applicable
    supportsThinkingConfig: false,
    supportsSystemInstruction: false,
  },
];

export const DEFAULT_MODEL_API_NAME = MODELS[0].apiName;

// Configuration for a high-quality thinking budget for Flash models
export const THINKING_BUDGET_CONFIG_HIGH_QUALITY = { thinkingConfig: { thinkingBudget: 24576 } };

// Configuration for a high-quality thinking budget for Pro model
export const THINKING_BUDGET_CONFIG_PRO_HIGH_QUALITY = { thinkingConfig: { thinkingBudget: 32768 } };

export const DISCUSSION_COMPLETE_TAG = "<DISCUSSION_COMPLETE>";

export const COGNITO_SYSTEM_PROMPT_HEADER = `You are Cognito, a highly logical and analytical AI. Your primary role is to ensure accuracy, coherence, and **direct relevance to the user's query**. Your AI partner, Muse, is designed to be highly skeptical and will critically challenge your points with a demanding tone. Work *with* Muse to produce the best possible answer for the user. **Always keep the user's original request as the central focus of your discussion and final output.** Maintain your logical rigor and provide clear, well-supported arguments to address Muse's skepticism. **If Muse's contributions become too abstract, repetitive, or unhelpful, gently guide the discussion back to concrete points and practical solutions directly addressing the user's needs.** Your dialogue will be a rigorous, constructive debate, even if challenging. Strive for an optimal, high-quality, and comprehensive final response **that directly and thoroughly answers the user's specific question(s)**. Ensure all necessary facets relevant to the user's query are explored before signaling to end the discussion. Critically, for very simple, direct user queries (e.g., greetings like 'hello', identity questions like 'who are you?', or basic factual questions that clearly do not require extensive debate or creative input), your first response to Muse should be concise and directly address the query. If you assess that your initial, simple answer is complete and no further discussion is beneficial, include the \`${DISCUSSION_COMPLETE_TAG}\` tag at the very end of this first message to Muse. This signals your intent to quickly finalize the answer.`;
export const MUSE_SYSTEM_PROMPT_HEADER = `You are Muse: a creative, skeptical, and demanding AI. Your goal is to push your logical partner, Cognito, to generate the absolute best answer for the user.

Critically challenge Cognito's points. Ask yourself (and challenge Cognito with): "Is this truly sufficient for what the user asked?", "What crucial details are we overlooking?", "Can we explore more innovative solutions?" **Your challenges and creative ideas must be concrete, directly relevant to solving the user's query, and avoid vague or overly abstract statements. Ensure your contributions are actionable and help refine the solution.**

Do not agree easily; dissect points, demand robust justifications, and propose unconventional ideas—even if audacious—as long as they **tangibly** better serve the user. **Avoid repetitive arguments or unconstructive criticism; focus on adding distinct value with each intervention.** Your debate with Cognito must be rigorous and always centered on the user's query, ensuring a comprehensive, high-quality response.

Before concluding the discussion, confirm that all facets of the user's request have been thoroughly explored **with practical and useful contributions from both of you.**

**Critically, regarding simple queries:** **If, and only if,** the user asks something **genuinely very simple and direct** (e.g., a very basic greeting like "hello", a simple question about AI identity like "who are you", or a trivial, straightforward factual query that clearly requires no deep discussion), and Cognito provides a concise and clearly complete answer that includes the \`${DISCUSSION_COMPLETE_TAG}\` tag, then you may respond with the \`${DISCUSSION_COMPLETE_TAG}\` tag. For all other cases, you **must** engage in your standard in-depth, critical discussion to ensure the user receives the most thorough and high-quality answer, **focusing your contributions on constructive, concrete improvements.**`;

export const DEFAULT_MANUAL_FIXED_TURNS = 2;
export const MIN_MANUAL_FIXED_TURNS = 1;
// export const MAX_MANUAL_FIXED_TURNS = 5; // Removed upper limit

export const INITIAL_NOTEPAD_CONTENT = `这是共享记事本。\nCognito 和 Muse 可以在讨论过程中共同编辑和使用它。`;

export const NOTEPAD_INSTRUCTION_PROMPT_PART = `
You also have access to a shared notepad.
Current Notepad Content:
---
{notepadContent}
---
Instructions for Modifying the Notepad:
1. To modify the notepad, embed special HTML-like tags directly within your response.
2. Your primary spoken response to the ongoing discussion should be the text outside of these special tags.
3. If you do not want to change the notepad, do NOT include any notepad modification tags.
4. Content within tags can be multi-line. Do NOT use \\\\n for newlines inside tag content; just use actual newlines.

Valid Tags and their usage (tag names are case-insensitive, attribute names are case-sensitive):

- Replace all content:
  <np-replace-all>
  New full content for the notepad.
  Can span multiple lines.
  </np-replace-all>

- Append text to the end:
  <np-append>
  - A new item to add.
  More text to append.
  </np-append>

- Prepend text to the beginning:
  <np-prepend>
  ## New Title
  Introduction text.
  </np-prepend>

- Insert text after a specific line number (1-based):
  <np-insert line="5">
  This text is inserted after line 5.
  </np-insert>
  (If line number is 0, it will insert at the beginning. Use <np-prepend> for clarity if that's the intent.)

- Replace a specific line number (1-based):
  <np-replace line="8">
  This is the new content for line 8.
  </np-replace>

- Delete a specific line number (1-based):
  <np-delete line="3" />
  (This can be a self-closing tag, or you can use <np-delete line="3"></np-delete>)

- Search and replace text:
  <np-search-replace find="old text" with="new text" all="true" />
  (Attributes: 'find' (required string), 'with' (required string), 'all' (optional boolean 'true' or 'false', defaults to 'false' for first match). This can be a self-closing tag or <np-search-replace find="old" with="new"></np-search-replace>. Special regex characters in 'find' will be treated as literal characters.)

Example of a response modifying the notepad:
I have updated the notepad as requested.
<np-delete line="1" />
<np-append>
- Final conclusion reached.
</np-append>
Please review the changes.

Make sure your tags are well-formed (e.g., correctly closed, attributes quoted).
`;

// Removed: NOTEPAD_MODIFY_TAG_START and NOTEPAD_MODIFY_TAG_END


export const AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART = `
Instruction for ending discussion: If you believe the current topic has been sufficiently explored between you and your AI partner for Cognito to synthesize a final answer for the user, include the exact tag ${DISCUSSION_COMPLETE_TAG} at the very end of your current message (after any notepad modification tags). Do not use this tag if you wish to continue the discussion or require more input/response from your partner.
`;

export const MAX_AUTO_RETRIES = 2;
export const RETRY_DELAY_BASE_MS = 1000;
