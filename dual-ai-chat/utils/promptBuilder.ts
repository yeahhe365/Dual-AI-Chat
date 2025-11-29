
import { MessageSender, DiscussionMode } from '../types';
import {
  NOTEPAD_INSTRUCTION_PROMPT_PART,
  AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART,
} from '../constants';
import { formatNotepadContentForAI } from './appUtils';

const getCommonPromptInstructions = (notepadContent: string, discussionMode: DiscussionMode) => {
  const discussionModeInstructionText = discussionMode === DiscussionMode.AiDriven ? AI_DRIVEN_DISCUSSION_INSTRUCTION_PROMPT_PART : "";
  return NOTEPAD_INSTRUCTION_PROMPT_PART.replace('{notepadContent}', formatNotepadContentForAI(notepadContent)) + discussionModeInstructionText;
};

export const buildCognitoInitialPrompt = (
  userQuery: string,
  imageInstruction: string,
  notepadContent: string,
  discussionMode: DiscussionMode
) => {
  const commonInstructions = getCommonPromptInstructions(notepadContent, discussionMode);
  return `### User Query (Chinese)
"${userQuery}"
${imageInstruction}

### Task (Cognito)
1. Analyze the user's query logically.
2. Provide your initial thoughts, factual breakdown, or solution.
3. Invite Muse to critique or expand on your points.
**Output Language:** Chinese (Simplified).

${commonInstructions}`;
};

export const buildDiscussionTurnPrompt = (
  userQuery: string,
  imageInstruction: string,
  discussionLog: string[],
  lastTurnText: string,
  notepadContent: string,
  discussionMode: DiscussionMode,
  previousAISignaledStop: boolean,
  targetSpeaker: MessageSender
) => {
  const commonInstructions = getCommonPromptInstructions(notepadContent, discussionMode);
  
  let previousSpeaker: MessageSender;
  let previousSpeakerDesc: string;

  if (targetSpeaker === MessageSender.Muse) {
    previousSpeaker = MessageSender.Cognito;
    previousSpeakerDesc = "(Logic)";
  } else {
    previousSpeaker = MessageSender.Muse;
    previousSpeakerDesc = "(Creative)";
  }

  let prompt = `### User Query
"${userQuery}"
${imageInstruction}

### Discussion History
${discussionLog.join("\n")}

### Last Message from ${previousSpeaker} ${previousSpeakerDesc}
"${lastTurnText}"

### Task (${targetSpeaker})
Reply to ${previousSpeaker}. Continue the rigorous discussion.
- If you disagree, explain why constructively.
- If you agree, add value or nuance.
**Output Language:** Chinese (Simplified).
**Tone:** Constructive & Concise.

${commonInstructions}`;
  
  if (discussionMode === DiscussionMode.AiDriven && previousAISignaledStop) {
    prompt += `\n**NOTE:** ${previousSpeaker} suggested ending the discussion (set discussion_complete: true). If you agree that the topic is fully exhausted, set "discussion_complete": true in your JSON. Otherwise, continue.`;
  }
  return prompt;
};

export const buildFinalAnswerPrompt = (
  userQuery: string,
  imageInstruction: string,
  discussionLog: string[],
  notepadContent: string,
  discussionMode: DiscussionMode
) => {
  const commonInstructions = getCommonPromptInstructions(notepadContent, discussionMode);
  return `### User Query
"${userQuery}"
${imageInstruction}

### Full Discussion History
${discussionLog.join("\n")}

### Final Task (Cognito)
1. Synthesize the entire discussion into a **comprehensive Final Answer** for the user.
2. **IMPORTANT:** You MUST update the Notepad with this Final Answer using the "replace_all" action in your JSON. The notepad is the primary delivery method for the final answer.
3. Your spoken reply (outside JSON) should be very brief (e.g., "I have updated the notepad with the final answer.").
**Output Language:** Chinese (Simplified).

${commonInstructions}`;
};
