# My Omni AI Studio

一个前端单页 AI 工作台（界面风格参考 Hugging Face Spaces），支持：

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
HF_TOKEN=你的hf_token python scripts/deploy_to_hf_space.py --space 你的space名字 --sdk static
```

如果你希望“直接替换后就能跑”，可以在网页里先填好 Token + Space 名，点击“复制已替换的一键命令”，拿到的是可直接粘贴执行的命令。

也可以用交互式一键脚本（不用手动拼参数）：

```bash
bash scripts/deploy_now.sh
```

发布完成后会输出你的 Space 地址：

```text
https://huggingface.co/spaces/<你的用户名>/<你的space名字>
```

### 脚本能力（升级版）

- 支持 `HF_TOKEN` 或 `HUGGING_FACE_HUB_TOKEN`
- 支持 `--private` 创建私有 Space
- 支持 `--sdk static|gradio|docker`
- 支持 `--branch` 指定推送分支
- 支持 `--message` 自定义部署提交信息
- 支持多次 `--include` 附带额外文件
- 默认 `--force` 覆盖发布，可用 `--no-force` 关闭

示例：

```bash
HF_TOKEN=你的hf_token python scripts/deploy_to_hf_space.py \
  --space my-omni-ai-studio \
  --sdk static \
  --private \
  --include assets/logo.png
```

## 说明

- Token 只保存在本地浏览器 `localStorage`。
- 视频与换脸模型通常是异步工作流，示例中会显示原始响应，你可以继续扩展为轮询任务状态 + 结果展示。
- 部署脚本会自动调用 Hugging Face Hub API 创建 Space（`type=space`），然后通过 git push 发布文件。

## 测试

```bash
node --check app.js
python -m py_compile scripts/deploy_to_hf_space.py
python -m unittest tests/test_deploy_to_hf_space.py
```
