
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
  thoughts?: string; // The internal thinking process content
  image?: { // Optional image data for user messages
    dataUrl: string; // base64 data URL for displaying the image
    name: string;
    type: string;
  };
}

// Unified response payload for AI services
export interface AiResponsePayload {
  text: string;
  thoughts?: string;
  durationMs: number;
  error?: string; // Standardized error key
}

// Updated types for structured notepad modifications based on JSON instructions
export type NotepadAction =
  | { action: 'replace_all'; content: string }
  | { action: 'append'; content: string }
  | { action: 'prepend'; content: string }
  | { action: 'replace_section'; header: string; content: string } // Replace content under a specific header
  | { action: 'append_to_section'; header: string; content: string } // New: Append content to the end of a section
  | { action: 'search_and_replace'; find: string; with: string; all?: boolean }; // Uses 'find' and 'with'

export type NotepadUpdatePayload = {
  modifications?: NotepadAction[];
  error?: string; // For reporting parsing errors or action application errors
} | null;

export interface ParsedAIResponse {
  spokenText: string;
  notepadUpdate: NotepadUpdatePayload;
  discussionShouldEnd?: boolean;
}

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

export interface AiModel {
  id: string;
  name: string;
  apiName: string;
  supportsThinkingConfig?: boolean;
  supportsSystemInstruction?: boolean;
}

export interface MutableRefObject<T> {
  current: T;
}

export interface ApiKeyStatus {
  isMissing?: boolean;
  isInvalid?: boolean;
  message?: string;
}

export interface ChatLogicCommonDependencies {
  addMessage: (text: string, sender: MessageSender, purpose: MessagePurpose, durationMs?: number, image?: ChatMessage['image'], thoughts?: string) => string;
  processNotepadUpdateFromAI: (parsedResponse: ParsedAIResponse, sender: MessageSender, addSystemMessage: ChatLogicCommonDependencies['addMessage']) => string | null;
  setGlobalApiKeyStatus: (status: { isMissing?: boolean, isInvalid?: boolean, message?: string }) => void;

  cognitoModelDetails: AiModel;
  museModelDetails: AiModel;

  // Gemini Custom Config
  useCustomApiConfig: boolean;
  customApiKey: string;
  customApiEndpoint: string;

  // OpenAI Custom Config
  useOpenAiApiConfig: boolean;
  openAiApiKey: string;
  openAiApiBaseUrl: string;
  openAiCognitoModelId: string;
  openAiMuseModelId: string;

  // Shared Settings
  discussionMode: DiscussionMode;
  manualFixedTurns: number;
  
  // Thinking Configs
  cognitoThinkingBudget: number;
  cognitoThinkingLevel: 'LOW' | 'HIGH';
  museThinkingBudget: number;
  museThinkingLevel: 'LOW' | 'HIGH';

  cognitoSystemPrompt: string;
  museSystemPrompt: string;
  notepadContent: string;
  startProcessingTimer: () => void;
  stopProcessingTimer: () => void;
  currentQueryStartTimeRef: MutableRefObject<number | null>;
}
