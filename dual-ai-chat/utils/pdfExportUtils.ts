import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * 将markdown内容导出为PDF文件
 * @param content - markdown格式的内容
 * @param filename - 导出的PDF文件名（不包含扩展名）
 */
export const exportNotebookToPDF = async (content: string, filename: string = 'notebook'): Promise<void> => {
  try {
    // 创建一个临时的隐藏容器来渲染markdown内容
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; // 设置固定宽度以便渲染
    tempContainer.style.padding = '40px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = '#333';
    
    // 添加CSS样式来美化markdown渲染
    const style = document.createElement('style');
    style.innerHTML = `
      .temp-pdf-container h1 {
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0 16px 0;
        color: #0f172a;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
      }
      .temp-pdf-container h2 {
        font-size: 20px;
        font-weight: bold;
        margin: 18px 0 14px 0;
        color: #1e293b;
      }
      .temp-pdf-container h3 {
        font-size: 16px;
        font-weight: bold;
        margin: 16px 0 12px 0;
        color: #334155;
      }
      .temp-pdf-container p {
        margin: 12px 0;
        text-align: justify;
      }
      .temp-pdf-container ul, .temp-pdf-container ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      .temp-pdf-container li {
        margin: 6px 0;
      }
      .temp-pdf-container blockquote {
        border-left: 4px solid #0ea5e9;
        padding-left: 16px;
        margin: 16px 0;
        color: #475569;
        font-style: italic;
        background-color: #f8fafc;
        padding: 12px 16px;
      }
      .temp-pdf-container code {
        background-color: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 13px;
        color: #dc2626;
      }
      .temp-pdf-container pre {
        background-color: #1e293b;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 8px;
        margin: 16px 0;
        overflow-x: auto;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 13px;
        line-height: 1.4;
      }
      .temp-pdf-container pre code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
      }
      .temp-pdf-container table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      .temp-pdf-container th, .temp-pdf-container td {
        border: 1px solid #d1d5db;
        padding: 8px 12px;
        text-align: left;
      }
      .temp-pdf-container th {
        background-color: #f9fafb;
        font-weight: bold;
      }
      .temp-pdf-container strong {
        font-weight: bold;
        color: #1e293b;
      }
      .temp-pdf-container em {
        font-style: italic;
      }
      .temp-pdf-container hr {
        border: none;
        border-top: 2px solid #e2e8f0;
        margin: 24px 0;
      }
    `;
    document.head.appendChild(style);
    
    tempContainer.className = 'temp-pdf-container';
    
    // 转换markdown为HTML
    const rawHtml = marked.parse(content) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    
    // 如果内容为空，添加默认提示
    if (!content.trim()) {
      tempContainer.innerHTML = '<p style="color: #6b7280; text-align: center; margin: 40px 0;">记事本内容为空</p>';
    } else {
      tempContainer.innerHTML = sanitizedHtml;
    }
    
    // 添加到DOM
    document.body.appendChild(tempContainer);
    
    // 使用html2canvas截图
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight
    });
    
    // 清理临时元素
    document.body.removeChild(tempContainer);
    document.head.removeChild(style);
    
    // 创建PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 左右各留10mm边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10; // 顶部边距10mm
    
    // 由于jsPDF对中文支持不好，将标题和时间也用canvas渲染
    const titleContainer = document.createElement('div');
    titleContainer.style.position = 'absolute';
    titleContainer.style.left = '-9999px';
    titleContainer.style.top = '-9999px';
    titleContainer.style.width = '800px';
    titleContainer.style.padding = '30px';
    titleContainer.style.backgroundColor = 'white';
    titleContainer.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    titleContainer.style.textAlign = 'center';
    
    const titleHtml = `
      <h1 style="font-size: 24px; margin-bottom: 10px; color: #0f172a;">Notebook 导出</h1>
      <p style="font-size: 14px; color: #64748b;">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    `;
    
    titleContainer.innerHTML = titleHtml;
    document.body.appendChild(titleContainer);
    
    // 渲染标题
    const titleCanvas = await html2canvas(titleContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: titleContainer.offsetHeight
    });
    
    document.body.removeChild(titleContainer);
    
    const titleImgData = titleCanvas.toDataURL('image/png');
    const titleImgWidth = pdfWidth - 20;
    const titleImgHeight = (titleCanvas.height * titleImgWidth) / titleCanvas.width;
    
    // 添加标题图片
    pdf.addImage(titleImgData, 'PNG', 10, 20, titleImgWidth, titleImgHeight);
    
    // 添加内容位置
    position = 20 + titleImgHeight + 10;
    
    // 添加内容
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - position);
    
    // 如果内容超过一页，添加新页
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // 下载PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.pdf`;
    pdf.save(finalFilename);
    
  } catch (error) {
    console.error('PDF导出失败:', error);
    throw new Error('PDF导出失败，请重试');
  }
};

/**
 * 检查浏览器是否支持PDF导出功能
 */
export const isPDFExportSupported = (): boolean => {
  return !!(window.HTMLCanvasElement && document.createElement('canvas').getContext);
}; 