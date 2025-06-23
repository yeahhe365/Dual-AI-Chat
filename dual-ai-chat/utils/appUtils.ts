
import { NotepadAction, NotepadUpdatePayload, MessageSender, DiscussionMode } from '../types';
import { DISCUSSION_COMPLETE_TAG } from '../constants';

export const generateUniqueId = (): string => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Return only the base64 part
    };
    reader.onerror = (error) => reject(error);
  });
};

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

export const parseAttributes = (attrString: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)\s*=\s*"(.*?)"/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};

export interface ParsedAIResponse {
  spokenText: string;
  notepadUpdate: NotepadUpdatePayload;
  discussionShouldEnd?: boolean;
}

export const parseAIResponse = (responseText: string): ParsedAIResponse => {
  let remainingText = responseText;
  const modifications: NotepadAction[] = [];
  const parsingErrors: string[] = [];
  let discussionShouldEnd = false;

  const tagDefinitions = [
    { name: 'np-replace-all', type: 'content' as const, action: 'replace_all' as const },
    { name: 'np-append', type: 'content' as const, action: 'append' as const },
    { name: 'np-prepend', type: 'content' as const, action: 'prepend' as const },
    { name: 'np-insert', type: 'content_attr' as const, action: 'insert' as const, attrs: [{ name: 'line', type: 'number' as const, required: true }] },
    { name: 'np-replace', type: 'content_attr' as const, action: 'replace' as const, attrs: [{ name: 'line', type: 'number' as const, required: true }] },
    { name: 'np-delete', type: 'attr_only' as const, action: 'delete_line' as const, attrs: [{ name: 'line', type: 'number' as const, required: true }] },
    { name: 'np-search-replace', type: 'attr_only' as const, action: 'search_and_replace' as const, attrs: [
        { name: 'find', type: 'string' as const, required: true },
        { name: 'with', type: 'string' as const, required: true },
        { name: 'all', type: 'boolean' as const, required: false, default: false }
    ]}
  ];

  const foundActions: Array<{ action: NotepadAction; startIndex: number; endIndex: number }> = [];

  for (const tagDef of tagDefinitions) {
    let regex;
    // Regex to match opening tag, content, and closing tag, or self-closing tag
    // It handles attributes within the opening tag.
    if (tagDef.type === 'content') {
      // Matches <tag>content</tag>
      regex = new RegExp(`<${tagDef.name}\\b[^>]*>([\\s\\S]*?)<\\/${tagDef.name}\\s*>`, 'gi');
    } else if (tagDef.type === 'content_attr') {
      // Matches <tag attr="val">content</tag>
      regex = new RegExp(`<${tagDef.name}\\b([^>]*?)>([\\s\\S]*?)<\\/${tagDef.name}\\s*>`, 'gi');
    } else { // attr_only
      // Matches <tag attr="val" /> or <tag attr="val"></tag>
      regex = new RegExp(`<${tagDef.name}\\b([^>]*?)\\s*(?:\\/>|<\\/${tagDef.name}\\s*>)`, 'gi');
    }

    let match;
    while ((match = regex.exec(responseText)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;
      let content = '';
      let attrString = '';

      if (tagDef.type === 'content') {
        content = match[1]; // Content is the first capturing group
      } else if (tagDef.type === 'content_attr') {
        attrString = match[1]; // Attributes are the first capturing group
        content = match[2];    // Content is the second capturing group
      } else { // attr_only
        attrString = match[1]; // Attributes are the first capturing group
      }

      const attributes = parseAttributes(attrString);
      const actionPayload: any = { action: tagDef.action };
      let validAttrs = true;

      if (tagDef.attrs) {
        for (const attrDef of tagDef.attrs) {
          const attrValue = attributes[attrDef.name];
          if (attrDef.required && attrValue === undefined) {
            parsingErrors.push(`标签 <${tagDef.name}> 缺少必需属性 "${attrDef.name}".`);
            validAttrs = false;
            break;
          }
          if (attrValue !== undefined) {
            if (attrDef.type === 'number') {
              const num = parseInt(attrValue, 10);
              if (isNaN(num)) {
                parsingErrors.push(`标签 <${tagDef.name}> 属性 "${attrDef.name}" 的值 "${attrValue}" 不是有效数字.`);
                validAttrs = false;
                break;
              }
              actionPayload[attrDef.name] = num;
            } else if (attrDef.type === 'boolean') {
              actionPayload[attrDef.name] = attrValue.toLowerCase() === 'true';
            } else {
              actionPayload[attrDef.name] = attrValue;
            }
          } else if ('default' in attrDef && attrDef.default !== undefined) {
             actionPayload[attrDef.name] = attrDef.default; // Apply default if attribute is missing
          }
        }
      }

      if (!validAttrs) continue; // Skip this tag if attributes are invalid

      if (tagDef.type === 'content' || tagDef.type === 'content_attr') {
        actionPayload.content = content.trim(); // Trim content for tags that have it
      }
      foundActions.push({ action: actionPayload as NotepadAction, startIndex, endIndex });
    }
  }

  // Sort actions by their start index to process them in order of appearance
  foundActions.sort((a, b) => a.startIndex - b.startIndex);

  // Reconstruct spoken text by taking parts of responseText that are not inside any matched tags
  let spokenTextParts: string[] = [];
  let lastIndex = 0;
  for (const found of foundActions) {
    if (found.startIndex > lastIndex) {
      spokenTextParts.push(responseText.substring(lastIndex, found.startIndex));
    }
    modifications.push(found.action);
    lastIndex = found.endIndex;
  }
  // Add any remaining text after the last tag
  if (lastIndex < responseText.length) {
    spokenTextParts.push(responseText.substring(lastIndex));
  }
  
  let spokenText = spokenTextParts.join('').trim();
  let notepadActionText = modifications.length > 0 ? `修改了记事本 (${modifications.length} 项操作)` : "";
  let discussionActionText = "";


  // Check for discussion complete tag *after* processing notepad tags
  if (spokenText.endsWith(DISCUSSION_COMPLETE_TAG)) {
    discussionShouldEnd = true;
    spokenText = spokenText.substring(0, spokenText.length - DISCUSSION_COMPLETE_TAG.length).trim();
    discussionActionText = "建议结束讨论";
  }
  
  // If spokenText is empty but actions occurred, create a placeholder
  if (!spokenText.trim() && (notepadActionText || discussionActionText)) {
    if (notepadActionText && discussionActionText) {
      spokenText = `(AI ${notepadActionText}并${discussionActionText})`;
    } else if (notepadActionText) {
      spokenText = `(AI ${notepadActionText})`;
    } else { // Only discussionActionText
      spokenText = `(AI ${discussionActionText})`;
    }
  } else if (!spokenText.trim() && modifications.length === 0 && !discussionShouldEnd && parsingErrors.length === 0) {
     // If truly no spoken text, no modifications, no discussion end signal, and no parsing errors
     spokenText = "(AI 未提供额外文本回复)";
  }


  const notepadUpdate: NotepadUpdatePayload = modifications.length > 0 || parsingErrors.length > 0
    ? { modifications: modifications.length > 0 ? modifications : undefined, error: parsingErrors.length > 0 ? parsingErrors.join(' ') : undefined }
    : null;

  return { spokenText, notepadUpdate, discussionShouldEnd };
};


export const applyNotepadModifications = (currentContent: string, modifications: NotepadAction[]): { newContent: string; errors: string[] } => {
  let newContent = currentContent;
  const errors: string[] = [];

  modifications.forEach((mod, index) => {
    let lines = newContent.split('\n');
    const actionNum = index + 1; // For user-friendly error messages

    switch (mod.action) {
      case 'replace_all':
        newContent = mod.content;
        break;
      case 'append':
        // Ensure there's a newline if current content doesn't end with one and new content is being added.
        // However, the AI is instructed to manage newlines within its content tag.
        // So, direct concatenation should be fine. If issues arise, can add:
        // newContent = newContent.length > 0 && !newContent.endsWith('\n') ? newContent + '\n' + mod.content : newContent + mod.content;
        newContent = newContent + mod.content;
        break;
      case 'prepend':
        // newContent = mod.content + (newContent.length > 0 && !newContent.startsWith('\n') ? '\n' + newContent : newContent);
        newContent = mod.content + newContent;
        break;
      case 'replace': { // Renamed from 'replace_line' in types, but logic is for line
        const lineIdx = mod.line - 1; // 0-indexed
        if (lineIdx >= 0 && lineIdx < lines.length) {
          lines[lineIdx] = mod.content;
          newContent = lines.join('\n');
        } else {
          errors.push(`操作 ${actionNum} ("replace") 失败: 行号 ${mod.line} 超出范围 (总行数: ${lines.length})。`);
        }
        break;
      }
      case 'insert': { // Renamed from 'insert_after_line' in types, logic is insert after line (or at line 0 for beginning)
        const lineIdx = mod.line - 1; // 0-indexed for splice insertion point
        if (mod.line === 0) { // Special case: insert at the very beginning
           lines.splice(0, 0, mod.content);
        } else if (lineIdx >= 0 && lineIdx < lines.length) {
          lines.splice(lineIdx + 1, 0, mod.content); // Insert after the specified line
        } else {
           // Error if line number (other than 0 for prepend) is out of bounds
           errors.push(`操作 ${actionNum} ("insert") 失败: 行号 ${mod.line} 超出范围 (总行数: ${lines.length})。若要在行首插入，请用行号 0。`);
        }
        newContent = lines.join('\n');
        break;
      }
      case 'delete_line': {
        const lineIdx = mod.line - 1; // 0-indexed
        if (lineIdx >= 0 && lineIdx < lines.length) {
          lines.splice(lineIdx, 1);
          newContent = lines.join('\n');
        } else {
          errors.push(`操作 ${actionNum} ("delete_line") 失败: 行号 ${mod.line} 超出范围 (总行数: ${lines.length})。`);
        }
        break;
      }
      case 'search_and_replace': {
        // Ensure 'find' string is treated literally, not as a regex pattern by default
        const safeSearchString = escapeRegExp(mod.find);
        if (mod.all) {
          const regex = new RegExp(safeSearchString, 'g');
          newContent = newContent.replace(regex, mod.with);
        } else {
          newContent = newContent.replace(safeSearchString, mod.with);
        }
        break;
      }
      // default:
      //   errors.push(`操作 ${actionNum} 失败: 未知操作 "${(mod as any).action}".`);
    }
  });

  return { newContent, errors };
};

export const formatNotepadContentForAI = (content: string): string => {
  if (!content.trim()) {
    return ""; // Return empty if content is just whitespace or empty
  }
  return content
    .split('\n')
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n');
};

export const getWelcomeMessageText = (
  cognitoModelNameFromDetails: string, // Actual name of Cognito's model from its details object
  museModelNameFromDetails: string,    // Actual name of Muse's model from its details object
  currentDiscussionMode: DiscussionMode,
  currentManualFixedTurns: number,
  isOpenAiActive: boolean,
  openAiCognitoModelId?: string, // If OpenAI active, this is Cognito's OpenAI model ID
  openAiMuseModelId?: string     // If OpenAI active, this is Muse's OpenAI model ID
): string => {
  let modeDescription = "";
  if (currentDiscussionMode === DiscussionMode.FixedTurns) {
    modeDescription = `固定轮次对话 (${currentManualFixedTurns}轮)`;
  } else {
    modeDescription = "AI驱动(不固定轮次)对话";
  }

  let modelInfo = "";
  if (isOpenAiActive) {
    const cognitoDisplay = openAiCognitoModelId || '未指定';
    const museDisplay = openAiMuseModelId || '未指定';
    if (cognitoDisplay === museDisplay) {
        modelInfo = `OpenAI 模型: ${cognitoDisplay}`;
    } else {
        modelInfo = `OpenAI Cognito: ${cognitoDisplay}, OpenAI Muse: ${museDisplay}`;
    }
  } else {
    // cognitoModelNameFromDetails and museModelNameFromDetails already contain the full Gemini model names
    modelInfo = `Cognito 模型: ${cognitoModelNameFromDetails}, Muse 模型: ${museModelNameFromDetails}`;
  }

  return `欢迎使用Dual AI Chat！当前模式: ${modeDescription}。\n${modelInfo}.\n在下方输入您的问题或上传图片。${MessageSender.Cognito} 和 ${MessageSender.Muse} 将进行讨论，然后 ${MessageSender.Cognito} 会将最终答案呈现在右侧的记事本中。`;
};
