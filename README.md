# My Omni AI Studio

一个前端单页 AI 工作台，支持：

- AI 聊天
- AI 代码生成
- AI 写作
- AI 视频任务提交
- AI 换脸任务提交（示例）

## 快速开始

1. 打开 `index.html`（可用 VSCode Live Server 或任意静态服务器）。
2. 在页面配置你的 Hugging Face Token。
3. 按需替换模型 ID（支持 Hugging Face 上任意可访问模型）。
4. 在不同标签页输入提示词并调用。

## 说明

- Token 只保存在本地浏览器 `localStorage`。
- 视频与换脸模型通常是异步工作流，示例中会显示原始响应，你可以继续扩展为轮询任务状态 + 结果展示。
- 这是一个可二次开发的 MVP，适合作为“自己的 AI 模型门户”基础版本。
