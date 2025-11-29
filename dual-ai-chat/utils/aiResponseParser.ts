
import { NotepadAction, NotepadUpdatePayload, ParsedAIResponse } from '../types';

export { ParsedAIResponse };

export const parseAIResponse = (responseText: string): ParsedAIResponse => {
  let spokenText = responseText;
  let notepadModifications: NotepadAction[] = [];
  let discussionShouldEnd = false;
  let parsingError: string | undefined = undefined;

  // Regex to find a JSON block enclosed in ```json ... ``` or just ``` ... ``` at the end of the text
  // We use dotAll (s) and case insensitive (i) flags. We try to capture the last code block.
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  
  // Find all matches, take the last one as it is likely the instructions block
  const matches = [...responseText.matchAll(jsonBlockRegex)];
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const rawJson = lastMatch[1];
    const fullMatchString = lastMatch[0];

    try {
      // Clean up potential trailing commas or formatting issues if strict parsing fails
      // For now, assume standard JSON.
      const parsed = JSON.parse(rawJson);

      // Validate structure
      if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.notepad_modifications)) {
          notepadModifications = parsed.notepad_modifications;
        }
        if (typeof parsed.discussion_complete === 'boolean') {
          discussionShouldEnd = parsed.discussion_complete;
        }
      }
      
      // Remove the JSON block from the spoken text
      spokenText = responseText.replace(fullMatchString, '').trim();

    } catch (e) {
      console.error("JSON Parsing failed:", e);
      parsingError = "Failed to parse AI JSON response.";
      // Fallback: If parsing fails, leave text as is, but maybe mark error
    }
  } else {
    // Fallback strategy: Check if the text *ends* with a JSON-like structure not in code blocks
    // This is riskier but handles cases where AI forgets the code fences.
    const lastOpenBrace = responseText.lastIndexOf('{');
    const lastCloseBrace = responseText.lastIndexOf('}');
    
    if (lastOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > lastOpenBrace) {
      const potentialJson = responseText.substring(lastOpenBrace, lastCloseBrace + 1);
      // Heuristic: Check if it looks like our schema keys
      if (potentialJson.includes('"notepad_modifications"') || potentialJson.includes('"discussion_complete"')) {
         try {
            const parsed = JSON.parse(potentialJson);
             if (Array.isArray(parsed.notepad_modifications)) {
              notepadModifications = parsed.notepad_modifications;
            }
            if (typeof parsed.discussion_complete === 'boolean') {
              discussionShouldEnd = parsed.discussion_complete;
            }
             // Remove the JSON part
             spokenText = responseText.substring(0, lastOpenBrace).trim();
         } catch (e) {
           // Ignore parsing errors for heuristic fallback
         }
      }
    }
  }

  // Construct status text for the UI based on actions found
  let notepadActionText = notepadModifications.length > 0 ? `修改了记事本 (${notepadModifications.length} 项操作)` : "";
  let discussionActionText = discussionShouldEnd ? "建议结束讨论" : "";

  // Handle empty spoken text scenarios (AI only performed actions)
  if (!spokenText.trim()) {
    if (notepadActionText && discussionActionText) {
      spokenText = `(AI ${notepadActionText}并${discussionActionText})`;
    } else if (notepadActionText) {
      spokenText = `(AI ${notepadActionText})`;
    } else if (discussionActionText) {
      spokenText = `(AI ${discussionActionText})`;
    } else if (!parsingError) {
       spokenText = "(AI 未提供额外文本回复)";
    }
  }

  const notepadUpdate: NotepadUpdatePayload = notepadModifications.length > 0 || parsingError
    ? { modifications: notepadModifications.length > 0 ? notepadModifications : undefined, error: parsingError }
    : null;

  return { spokenText, notepadUpdate, discussionShouldEnd };
};
