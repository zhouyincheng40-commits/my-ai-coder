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

## 直接一键传到 Hugging Face（Space）

> 你要的“直接一键上传”已支持：执行下面一条命令即可创建/更新你的 Space。

```bash
HF_TOKEN=你的hf_token python scripts/deploy_to_hf_space.py --space 你的space名字
```

发布完成后会输出你的 Space 地址：

```text
https://huggingface.co/spaces/<你的用户名>/<你的space名字>
```

### 可选参数

- `--org <组织名>`：发布到组织下的 Space
- `--token <hf_token>`：不使用环境变量时可直接传入 token

## 说明

- Token 只保存在本地浏览器 `localStorage`。
- 视频与换脸模型通常是异步工作流，示例中会显示原始响应，你可以继续扩展为轮询任务状态 + 结果展示。
- 部署脚本会自动调用 Hugging Face Hub API 创建 Space（`type=space`, `sdk=static`），然后通过 git push 覆盖发布。
