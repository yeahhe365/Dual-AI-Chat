
import { NotepadAction } from '../types';
import { escapeRegExp } from './commonUtils';

export const applyNotepadModifications = (currentContent: string, modifications: NotepadAction[]): { newContent: string; errors: string[] } => {
  let newContent = currentContent;
  const errors: string[] = [];

  modifications.forEach((mod, index) => {
    let lines = newContent.split('\n');
    const actionNum = index + 1;

    switch (mod.action) {
      case 'replace_all':
        newContent = mod.content;
        break;
      case 'append':
        newContent = newContent + (newContent.endsWith('\n') ? '' : '\n') + mod.content;
        break;
      case 'prepend':
        newContent = mod.content + (mod.content.endsWith('\n') ? '' : '\n') + newContent;
        break;
      case 'replace_section': {
        const headerPattern = new RegExp(`^(#+)\\s*${escapeRegExp(mod.header)}\\s*$`, 'i');
        let startLineIndex = -1;
        let endLineIndex = lines.length;
        let headerLevel = 0;

        // 1. Find the header start
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(headerPattern);
          if (match) {
            startLineIndex = i;
            headerLevel = match[1].length;
            break;
          }
        }

        if (startLineIndex === -1) {
          errors.push(`操作 ${actionNum} ("replace_section") 失败: 未找到标题 "${mod.header}"。`);
          break;
        }

        // 2. Find the end (next header of same or higher importance)
        for (let i = startLineIndex + 1; i < lines.length; i++) {
          const match = lines[i].match(/^(#+)\s/);
          if (match) {
            const currentLevel = match[1].length;
            if (currentLevel <= headerLevel) {
              endLineIndex = i;
              break;
            }
          }
        }

        const before = lines.slice(0, startLineIndex + 1); // Keep the header line
        const after = lines.slice(endLineIndex); // Content after the section
        
        const contentToInsert = mod.content.startsWith('\n') ? mod.content : '\n' + mod.content;
        const finalContent = [...before, contentToInsert, ...after].join('\n');
        newContent = finalContent.replace(/\n{3,}/g, '\n\n');
        break;
      }
      case 'append_to_section': {
        // Find header, then find next header, insert content *before* next header.
        const headerPattern = new RegExp(`^(#+)\\s*${escapeRegExp(mod.header)}\\s*$`, 'i');
        let startLineIndex = -1;
        let insertionLineIndex = lines.length;
        let headerLevel = 0;

        // 1. Find the header start
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(headerPattern);
            if (match) {
                startLineIndex = i;
                headerLevel = match[1].length;
                break;
            }
        }

        if (startLineIndex === -1) {
            errors.push(`操作 ${actionNum} ("append_to_section") 失败: 未找到标题 "${mod.header}"。`);
            break;
        }

        // 2. Find the insertion point (start of next header or end of doc)
        for (let i = startLineIndex + 1; i < lines.length; i++) {
            const match = lines[i].match(/^(#+)\s/);
            if (match) {
                const currentLevel = match[1].length;
                if (currentLevel <= headerLevel) {
                    insertionLineIndex = i;
                    break;
                }
            }
        }

        const before = lines.slice(0, insertionLineIndex);
        const after = lines.slice(insertionLineIndex);

        // Ensure newline separation
        const lastLineOfSection = before[before.length - 1];
        let contentToInsert = mod.content;
        if (lastLineOfSection && lastLineOfSection.trim() !== '') {
            contentToInsert = '\n' + contentToInsert;
        }
        
        const finalContent = [...before, contentToInsert, ...after].join('\n');
        newContent = finalContent.replace(/\n{3,}/g, '\n\n');
        break;
      }
      case 'search_and_replace': {
        const safeSearchString = escapeRegExp(mod.find);
        if (!newContent.includes(mod.find) && !mod.all) {
           errors.push(`操作 ${actionNum} ("search_and_replace") 警告: 未找到文本 "${mod.find.substring(0, 20)}..."`);
        }
        
        if (mod.all) {
          const regex = new RegExp(safeSearchString, 'g');
          newContent = newContent.replace(regex, mod.with);
        } else {
          newContent = newContent.replace(safeSearchString, mod.with);
        }
        break;
      }
    }
  });

  return { newContent, errors };
};

export const formatNotepadContentForAI = (content: string): string => {
  if (!content.trim()) {
    return ""; 
  }
  return content;
};
