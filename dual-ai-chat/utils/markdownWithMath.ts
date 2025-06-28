import { marked } from 'marked';

// 配置 marked - 保留 GFM 但禁用自动换行转换
marked.use({
  gfm: true,
  breaks: false
});

/**
 * 解析 Markdown 为 HTML，同时保留 TeX 数学公式块和内联数学公式以供 MathJax 处理。
 *
 * 策略：在运行 marked 转换器之前，通过将所有 `$...$`（内联公式）和 `$$...$$`（公式块）
 * 替换为唯一占位符来"冻结"它们。在 Markdown → HTML 转换后，将占位符替换回原始内容，
 * 这样 MathJax 就能接收到未经修改的 LaTeX 源代码。
 */
export function parseMarkdownWithMath(markdown: string): string {
  // 按出现顺序存储原始 TeX 代码片段
  const mathStore: string[] = [];

  // 辅助函数：创建占位符并保存代码片段
  const freeze = (tex: string): string => {
    const index = mathStore.push(tex) - 1;
    return `[[MATH_${index}]]`;
  };

  // 1. 冻结公式块：$$...$$（跨行匹配，非贪婪模式）
  markdown = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (match) => freeze(match));

  // 2. 冻结内联公式：$...$（单个 $ 分隔符，避开 $$）
  markdown = markdown.replace(/\$(?!\$)([^\n$]+?)\$/g, (match) => freeze(match));

  // 3. 将剩余的 Markdown 转换为 HTML
  const html = marked.parse(markdown) as string;

  // 4. 恢复 TeX 代码片段
  const restoredHtml = html.replace(/\[\[MATH_(\d+)]]/g, (_, idx: string) => {
    const i = Number(idx);
    return mathStore[i] ?? '';
  });

  return restoredHtml;
}
