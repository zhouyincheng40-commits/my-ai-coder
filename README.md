# my-ai-coder

基于 **Hugging Face + 可扩展模型网关** 的 AI 工作台。

## 功能

- AI 聊天（多轮消息）
- AI 代码
- AI 写作
- AI 视频（通过支持视频生成/脚本的模型）
- AI 换脸（通过支持图像编辑/换脸的模型端点）
- 统一 provider 路由：
  - Hugging Face
  - OpenAI Compatible
  - Custom Endpoint

> 说明：是否真正支持「视频生成」或「换脸」由你配置的具体模型能力决定，页面和网关已预留调用能力。

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

打开：`http://localhost:3000`

## 环境变量

- `HF_API_TOKEN`: Hugging Face Token
- `HF_BASE_URL`: 默认 `https://api-inference.huggingface.co/models`
- `OPENAI_COMPAT_BASE_URL`: OpenAI 兼容接口基地址
- `OPENAI_COMPAT_TOKEN`: OpenAI 兼容接口 token
- `CUSTOM_PROVIDER_BASE_URL`: 自定义模型服务地址
- `CUSTOM_PROVIDER_TOKEN`: 自定义模型服务 token

## API

- `GET /api/providers`：查询可用 provider 与能力标签
- `POST /api/chat`：聊天请求
- `POST /api/task`：任务请求（code / writing / video / face-swap）
