
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// @ts-ignore
import katex from 'katex';

export const renderMarkdown = (text: string): string => {
  if (!text) return '';

  const mathSegments: { id: string; html: string }[] = [];

  const storeMath = (tex: string, displayMode: boolean) => {
    const id = `MATH_SEGMENT_${mathSegments.length}_${Math.random().toString(36).substr(2, 9)}`;
    let html = '';
    try {
      html = katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch (e) {
      console.error("KaTeX render error:", e);
      html = `<span style="color: red;">${DOMPurify.sanitize(tex)}</span>`;
    }
    mathSegments.push({ id, html });
    return id;
  };

  // 1. Block Math: $$ ... $$
  let processedText = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => storeMath(tex, true));

  // 2. Block Math: \[ ... \]
  processedText = processedText.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => storeMath(tex, true));

  // 3. Inline Math: \( ... \)
  processedText = processedText.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => storeMath(tex, false));

  // 4. Inline Math: $ ... $
  processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
      // Avoid matching empty or currency-like usage blindly if needed, 
      // but standard behavior is to process it.
      if (tex.trim().length === 0) return match;
      return storeMath(tex, false);
  });

  try {
    const rawHtml = marked.parse(processedText) as string;
    let cleanHtml = DOMPurify.sanitize(rawHtml);

    // Restore math segments into the sanitized HTML
    mathSegments.forEach(({ id, html }) => {
      cleanHtml = cleanHtml.replace(id, html);
    });

    return cleanHtml;
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return `<p><em>Markdown parsing error (内容解析出错)</em></p><pre>${DOMPurify.sanitize(text)}</pre>`;
  }
};
