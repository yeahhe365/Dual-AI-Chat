
## [Dual AI Chat](https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221wS-wmXT_J4S-sfYxY1wItwh4UuV4STEk%22%5D,%22action%22:%22open%22,%22userId%22:%22102038139080022776927%22,%22resourceKeys%22:%7B%7D%7D)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-blue?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss)](https://tailwindcss.com/)

**重要提示：** 这是一个**演示应用程序 (Demo)**，旨在展示一种独特的对话范式。用户的查询首先由两个不同的人工智能角色进行辩论和提炼，然后才提供最终的综合答案。

该项目利用可插拔的 AI 后端（默认为 Google Gemini API，并支持任何与 OpenAI 兼容的 API），驱动一个逻辑型 AI (Cognito) 和一个怀疑型 AI (Muse)，它们协作生成更健壮、准确和经过严格审查的响应。

### ✨ 应用截图 (Application Screenshot)
![Application Screenshot](https://github.com/user-attachments/assets/a862f8c8-2da4-406c-a0db-269ff52138bc)

## 核心功能 (Core Features)

-   **🤖 双 AI 辩论系统 (Dual AI Debate System):** 用户输入会触发 Cognito (逻辑型) 和 Muse (怀疑型) 之间的内部讨论。这种辩证过程旨在减少 AI 幻觉，探索多个角度，并在给出最终答案前对信息进行压力测试。
-   **🔌 多API后端支持 (Multi-API Backend Support):**
    -   原生支持 **Google Gemini** API。
    -   支持任何 **OpenAI 兼容的 API**，可轻松对接本地模型（如 Ollama, LM Studio）或其它托管服务。
-   **📝 带撤销/重做的共享记事本 (Shared Notepad with Undo/Redo):** 一个供两个 AI 使用的协作空间，用于记录关键点或起草解决方案。记事本内容会包含在后续的 AI 提示中，实现了状态保持。支持完整的 Markdown 预览和多步**撤销/重做**。
-   **🖼️ 多模态输入 (Multimodal Input):** 用户可以上传图片和文本。AI 能够理解并讨论图片内容。
-   **⚙️ 高度可配置 (Highly Configurable):**
    -   **模型选择 (Model Selection):** 在多个 Gemini 模型之间即时切换。
    -   **API配置 (API Configuration):** 在应用内设置中轻松切换和配置 Gemini 或 OpenAI 兼容的 API。
    -   **讨论模式 (Discussion Modes):** 支持“固定轮次”对话，或由 AI 自主决定何时结束讨论的“AI 驱动”模式。
-   **🔁 健壮的错误处理 (Robust Error Handling):** 包含针对 API 调用的自动重试逻辑。更重要的是，如果自动重试失败，应用会提供一个**手动重试**按钮，从失败点恢复整个对话上下文。

## 🚀 入门指南 (Developer Setup)

#### 1. 先决条件
-   [Node.js](https://nodejs.org/) (v18 或更高版本)

#### 2. 安装
克隆仓库并安装依赖项：
```bash
# 克隆仓库 (如果需要)
# git clone <repository-url>
# cd dual-ai-chat

npm install
```

#### 3. API 配置
此应用提供了三种灵活的方式来配置 AI 后端。

##### 配置方式对比
| 方法                             | API 提供商                      | 配置位置         | 推荐用例                                       |
| -------------------------------- | ------------------------------- | ---------------- | ---------------------------------------------- |
| **1. 环境变量 (默认)**           | Google Gemini                   | `.env.local` 文件  | 使用 Gemini API 的最快设置方式。               |
| **2. Gemini (UI)**               | Google Gemini                   | 应用内“设置”     | 需要使用代理或临时密钥时。                     |
| **3. OpenAI 兼容 (UI)**          | Ollama, LM Studio, etc.         | 应用内“设置”     | 运行本地大模型或其它兼容 OpenAI 的服务。       |

---

##### **方法 1: 环境变量 (默认 Gemini 配置)**
1.  在项目根目录下创建一个名为 `.env.local` 的文件。
2.  在文件中添加您的 Google Gemini API 密钥：
    ```
    GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
    ```
3.  直接启动应用。

##### **方法 2: 在应用内配置 Gemini**
1.  直接启动应用。
2.  点击右上角的 **设置 (⚙️) 图标**。
3.  启用 “**使用自定义 Gemini API 配置**” 开关。
4.  填入您的 **Gemini API 密钥**。(如果需要通过代理访问，也可以修改 API 端点)。
5.  关闭设置面板即可生效。

##### **方法 3: 在应用内配置 OpenAI 兼容 API (例如 Ollama)**
1.  确保您的本地 AI 服务（如 Ollama）正在运行。
2.  启动此应用。
3.  点击右上角的 **设置 (⚙️) 图标**。
4.  启用 “**使用 OpenAI 兼容 API 配置**” 开关。
5.  配置以下字段：
    -   **API 基地址 (Base URL):** 指向您服务的地址。对于本地 Ollama，通常是 `http://localhost:11434/v1`。
    -   **API 密钥 (可选):** 大部分本地服务（如Ollama）不需要密钥，留空即可。
    -   **Cognito 模型 ID:** 指定用于逻辑 AI 的模型名称，例如 `llama3`。
    -   **Muse 模型 ID:** 指定用于创意 AI 的模型名称，例如 `llama3`。
6.  关闭设置面板即可生效。

#### 4. 运行应用
```bash
npm run dev
```
在浏览器中打开显示的本地地址 (通常是 `http://localhost:5173`)。

## 🎓 使用教程 (End-User Guide)

#### 1. 发送一个查询
-   **文本输入:** 在底部的输入框中输入您的问题。
-   **图片上传:** 点击 **回形针 (📎) 图标** 上传一张图片。
-   **发送:** 点击 **发送 (➤) 图标** 或按 `Enter` 键提交。

#### 2. 理解 AI 讨论
提交后，您会看到 Cognito (逻辑AI) 和 Muse (创意AI) 的对话气泡。这是它们为了给您最佳答案而进行的内部讨论。
-   🟢 **Cognito (灯泡💡):** 提供逻辑、分析和结构化的观点。
-   🟣 **Muse (闪电⚡):** 提出挑战、质疑和创新的想法。
-   ⚪️ **系统 (对话框💬):** 提供流程状态更新或错误信息。

#### 3. 查看最终答案
讨论结束后，**Cognito 会将最终的、综合性的答案呈现在右侧的记事本 (Notebook) 中**。这是您需要关注的主要成果。

#### 4. 使用记事本
记事本是查看最终结果和 AI 思考过程的核心区域。
-   **预览/源码切换 (👁️/<>):** 在渲染后的 Markdown 视图和纯文本源码视图之间切换。
-   **全屏 (⤢):** 放大记事本以获得更好的阅读体验。
-   **复制 (📋):** 一键复制记事本的全部内容。
-   **撤销/重做 (↩️/↪️):** 撤销或重做 AI 对记事本内容的修改。

#### 5. 自定义您的体验
点击右上角的 **设置 (⚙️) 图标**，您可以：
-   切换 AI 后端 (Gemini / OpenAI 兼容)。
-   更改讨论模式（固定轮次 vs. AI驱动）。
-   调整界面文字大小。
-   自定义 AI 的系统提示词 (角色设定)。

## ⚠️ 已知局限性

-   **无响应流式传输:** 应用会等待 AI 生成完整的回复后才显示，而不是逐字流式输出。
-   **潜在循环:** 在“AI 驱动”模式下，两个 AI 理论上可能陷入无休止的辩论。
-   **单线程执行:** 所有 AI 请求按顺序执行，用户需要等待当前步骤完成后才能进行下一步。

## 🛠️ 技术栈

-   **前端框架:** [React](https://react.dev/) 19
-   **语言:** [TypeScript](https://www.typescriptlang.org/)
-   **构建工具:** [Vite](https://vitejs.dev/)
-   **AI 服务:** [Google Gemini API](https://ai.google.dev/) / **OpenAI 兼容 API**
-   **样式:** [Tailwind CSS](https://tailwindcss.com/) (通过 CDN)
-   **依赖管理:** 通过 `index.html` 中的 Import Map 直接加载 ES 模块，无需本地 `node_modules` 捆绑。
-   **图标:** [Lucide React](https://lucide.dev/)
-   **Markdown 处理:** [Marked](https://marked.js.org/) & [DOMPurify](https://github.com/cure53/DOMPurify)

## 👤 作者与致谢
此项目由 [yeahhe](https://linux.do/u/yeahhe/summary) 在 LINUX DO 论坛构思和创建。

## 📄 许可证
该项目采用 [MIT 许可证](LICENSE)授权。
