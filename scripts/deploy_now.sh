#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

read -r -p "Hugging Face Token (hf_xxx): " HF_TOKEN_INPUT
read -r -p "Space 名称 (例如 my-omni-ai-studio): " SPACE_NAME
read -r -p "SDK [static/gradio/docker] (默认 static): " SPACE_SDK
read -r -p "是否私有 Space? [y/N]: " PRIVATE_ANSWER

SPACE_SDK="${SPACE_SDK:-static}"
PRIVATE_FLAG=""
if [[ "$PRIVATE_ANSWER" =~ ^[Yy]$ ]]; then
  PRIVATE_FLAG="--private"
fi

if [[ -z "$HF_TOKEN_INPUT" || -z "$SPACE_NAME" ]]; then
  echo "❌ Token 和 Space 名称不能为空"
  exit 1
fi

HF_TOKEN="$HF_TOKEN_INPUT" python scripts/deploy_to_hf_space.py --space "$SPACE_NAME" --sdk "$SPACE_SDK" $PRIVATE_FLAG
