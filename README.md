# Dual AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-blue?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss)](https://tailwindcss.com/)

一个先进的聊天应用，演示了一种独特的对话范式：用户的查询首先由两个不同的人工智能角色进行辩论和提炼，然后才提供最终的综合答案。该项目利用 Google Gemini API 驱动一个逻辑型 AI (Cognito) 和一个怀疑型 AI (Muse)，它们协作生成更健壮、准确和经过严格审查的响应。

### ✨ 见证我们的成长 | Witness Our Growth

**每一个 Star 都是我们前进的燃料！如果您觉得这个项目有帮助，请点亮一颗星支持我们。**

[![Star History Chart](https://api.star-history.com/svg?repos=yeahhe365/Dual-AI-Chat&type=Date)](https://star-history.com/#yeahhe365/Dual-AI-Chat&Date)

### ✨ 应用截图 (Application Screenshot)

![PixPin_2025-06-21_11-16-54](https://github.com/user-attachments/assets/da49af58-274d-47b9-8ac0-7d8ea03cf642)

## 核心功能 (Core Features)

-   **🤖 双 AI 辩论系统 (Dual AI Debate System):** 用户输入会触发 Cognito (逻辑型 AI) 和 Muse (怀疑型 AI) 之间的内部讨论。这种辩证过程旨在减少 AI 幻觉，探索多个角度，并在给出最终答案前对信息进行压力测试。
-   **📝 共享记事本 (Shared Notepad):** 一个供两个 AI 使用的协作空间，用于在讨论过程中记录关键点、起草解决方案或存储上下文。记事本的内容会包含在后续的 AI 提示中，实现了跨轮次的状态保持。支持完整的 Markdown 预览。
-   **🖼️ 多模态输入 (Multimodal Input):** 用户可以上传图片和文本。AI 能够理解并讨论图片内容，将其与文本查询结合起来进行分析。
-   **🚫 停止生成 (Stop Generation):** 用户可以在任何时候中断并取消 AI 的生成过程。
-   **⚙️ 高度可配置 (Highly Configurable):**
    -   **模型选择 (Model Selection):** 可在多个 Gemini 模型之间即时切换。
    -   **讨论模式 (Discussion Modes):** 支持“固定轮次”对话，或由 AI 自主决定何时结束讨论的“AI 驱动”模式。
    -   **预算控制 (Budget Control):** 可在“优质”（为支持的模型启用更高的 `thinkingBudget` 以获得更精细的结果）和“标准”（使用 API 默认值以获得更快的响应）之间切换，以平衡响应质量与速度/成本。
-   **🔁 健壮的错误处理 (Robust Error Handling):** 包含针对 API 调用失败的自动重试逻辑。更重要的是，如果自动重试失败，应用会提供一个**手动重试**按钮。此功能会从失败点继续，恢复整个对话的上下文（包括讨论历史、记事本内容和原始查询），无需用户重新开始整个流程。

## 🤖 工作原理 (How It Works)

该应用的核心是一个结构化的、多步骤的提示链，旨在模拟一个严谨的审查过程：
```

1. 👤 用户输入 (文本 + 可选图片)
    │
    └──> 🤖 Cognito: 进行初步分析，并向 Muse 提出观点。
    │
    └──> 💬 内部讨论循环 (Internal Discussion Loop):
    │
    ├──> 🤖 Muse: 挑战假设、质疑逻辑并探索替代方案。
    │
    └──> 🤖 Cognito: 以逻辑论证和支持数据回应挑战。
    │
    * (此循环根据配置的“讨论模式”重复进行)
    │
    └──> 🤖 Cognito: 综合整个讨论和记事本内容，形成最终的、全面的答案。
    │
    └──> 👤 用户接收最终答案

```
## 🛠️ 技术栈 (Tech Stack)

-   **前端框架 (Frontend Framework):** [React](https://react.dev/) 19
-   **语言 (Language):** [TypeScript](https://www.typescriptlang.org/)
-   **构建工具 (Build Tool):** [Vite](https://vitejs.dev/)
-   **AI 服务 (AI Service):** [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
-   **样式 (Styling):** [Tailwind CSS](https://tailwindcss.com/) (通过 `index.html` 中的 CDN 引入)
-   **依赖管理 (Dependency Management):** 通过 `index.html` 中的 [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) 直接加载 ES 模块，无需捆绑依赖。
-   **图标 (Icons):** [Lucide React](https://lucide.dev/)
-   **Markdown 处理 (Markdown Processing):** [Marked](https://marked.js.org/) & [DOMPurify](https://github.com/cure53/DOMPurify)

## 🚀 本地运行 (Running Locally)

请按照以下步骤在您的本地机器上设置和运行此项目。

### 1. 先决条件 (Prerequisites)

-   [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
-   [npm](https://www.npmjs.com/) (或 yarn/pnpm)

### 2. 安装 (Installation)

1.  **克隆仓库 (Clone the repository):**
    ```bash
    git clone https://github.com/your-username/dual-ai-chat.git
    cd dual-ai-chat
    ```

2.  **安装开发依赖 (Install dev dependencies):**
    ```bash
    npm install
    ```
    > **注意:** 项目的主要依赖项（如React）是通过 Import Map 在浏览器中加载的，`npm install` 主要用于安装开发工具（如 Vite 和 TypeScript）。

3.  **设置环境变量 (Set up environment variables):**
    -   从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取您的 Gemini API 密钥。
    -   在项目根目录下创建一个名为 `.env.local` 的新文件。
    -   将您的 API 密钥添加到该文件中，如下所示：

    **.env.local**
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    > **注意:** 项目的 Vite 配置会读取此 `GEMINI_API_KEY` 变量。它已被 `.gitignore` 忽略，以防您意外地提交您的密钥。

### 3. 运行应用 (Run the App)

-   启动本地开发服务器：
    ```bash
    npm run dev
    ```
-   在浏览器中打开 Vite 提示的 URL (通常是 `http://localhost:5173`)。

## ⚙️ 配置与使用 (Configuration & Usage)

应用顶部的工具栏提供了多个控件，以定制 AI 的行为：

-   **模型 (Model):** 从下拉列表中选择用于整个对话的 Gemini 模型。
-   **轮数 (Turns):**
    -   **固定 (Fixed):** AI 将进行固定轮次的内部讨论（可在旁边的输入框中设置）。
    -   **不固定 (AI-Driven):** AI 将持续辩论，直到双方都认为主题已充分探讨并发出结束信号。
-   **预算 (Budget):**
    -   **优质 (Quality):** 为支持此功能的模型启用 `thinkingBudget`，分配更多资源进行深度思考，这通常会以延迟为代价产生更高质量的响应。
    -   **标准 (Standard):** 使用 API 的默认设置，以获得更快、更经济的响应。

## 📁 项目结构 (Project Structure)

项目遵循一个清晰的、面向功能的结构，旨在分离关注点。
```

/
├── src/
│   ├── components/          # 共享的 React 组件 (UI 构建块)
│   │   ├── ChatInput.tsx    # 处理用户输入、图片上传和提交逻辑
│   │   ├── LoadingSpinner.tsx # 加载动画组件
│   │   ├── MessageBubble.tsx  # 显示单条聊天消息（用户或AI）
│   │   └── Notepad.tsx      # 共享记事本 UI 组件
│   │
│   ├── services/            # 外部服务集成
│   │   └── geminiService.ts # 封装与 Google Gemini API 的所有通信
│   │
│   ├── App.tsx              # 主应用组件，管理状态、UI和核心对话流程
│   ├── constants.ts         # 存放系统提示、模型ID和其它配置常量
│   ├── index.tsx            # React 应用的入口点
│   └── types.ts             # 全局 TypeScript 类型定义
│
├── .env.local               # 本地环境变量 (用于 API 密钥)
├── index.html               # 应用的 HTML 入口，包含 importmap 和 CDN 链接
├── package.json             # 项目依赖和脚本
└── ...                      # 其他配置文件 (vite, tsconfig, etc.)

```
## 📄 许可证 (License)

该项目采用 [MIT 许可证](LICENSE)授权。
