export enum MessageSender {
  User = '用户',
  Cognito = 'Cognito', // Logical AI
  Muse = 'Muse',     // Creative AI
  System = '系统',
}

export enum MessagePurpose {
  UserInput = 'user-input',
  SystemNotification = 'system-notification',
  CognitoToMuse = 'cognito-to-muse',      // Cognito's message to Muse for discussion
  MuseToCognito = 'muse-to-cognito',      // Muse's response to Cognito
  FinalResponse = 'final-response',       // Final response from Cognito to User
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  purpose: MessagePurpose;
  timestamp: Date;
  durationMs?: number; // Time taken to generate this message (for AI messages)
  image?: { // Optional image data for user messages
    dataUrl: string; // base64 data URL for displaying the image
    name: string;
    type: string;
  };
}

// Updated types for structured notepad modifications based on HTML-like tags
export type NotepadAction =
  | { action: 'replace_all'; content: string }
  | { action: 'append'; content: string }
  | { action: 'prepend'; content: string }
  | { action: 'insert'; line: number; content: string } // Changed from insert_after_line, uses 'line'
  | { action: 'replace'; line: number; content: string } // Changed from replace_line, uses 'line'
  | { action: 'delete_line'; line: number } // Action name kept, uses 'line'
  | { action: 'search_and_replace'; find: string; with: string; all?: boolean }; // Uses 'find' and 'with'

export type NotepadUpdatePayload = {
  modifications?: NotepadAction[];
  error?: string; // For reporting parsing errors or action application errors
} | null;

export interface FailedStepPayload {
  stepIdentifier: string;
  prompt: string;
  modelName: string;
  systemInstruction?: string;
  imageApiPart?: { inlineData: { mimeType: string; data: string } };
  sender: MessageSender;
  purpose: MessagePurpose;
  originalSystemErrorMsgId: string;
  thinkingConfig?: { thinkingBudget: number };
  userInputForFlow: string;
  imageApiPartForFlow?: { inlineData: { mimeType: string; data: string } };
  discussionLogBeforeFailure: string[];
  currentTurnIndexForResume?: number;
  previousAISignaledStopForResume?: boolean;
}

export enum DiscussionMode {
  FixedTurns = 'fixed',
  AiDriven = 'ai-driven',
}
