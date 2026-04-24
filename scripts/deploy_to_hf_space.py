#!/usr/bin/env python3
"""一键将当前前端发布到 Hugging Face Space(static/gradio/docker)."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable

HF_ENDPOINT = "https://huggingface.co"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PUBLISH_FILES = ["index.html", "styles.css", "app.js", "README.md"]


class DeployError(RuntimeError):
    """部署失败错误。"""


def api_request(path: str, token: str, method: str = "GET", payload: dict | None = None) -> dict:
    url = f"{HF_ENDPOINT}{path}"
    data = None
    headers = {"Authorization": f"Bearer {token}"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise DeployError(f"{method} {path} 失败: {exc.code} {body}") from exc


def run(cmd: list[str], cwd: str | None = None) -> None:
    subprocess.run(cmd, check=True, cwd=cwd)


def get_namespace(token: str) -> str:
    whoami = api_request("/api/whoami-v2", token)
    name = whoami.get("name")
    if not name:
        raise DeployError("无法从 /api/whoami-v2 获取用户名")
    return name


def build_create_repo_payload(space_name: str, organization: str | None, private: bool, sdk: str) -> dict:
    return {
        "type": "space",
        "name": space_name,
        "organization": organization,
        "private": private,
        "sdk": sdk,
    }


def resolve_repo_id(token: str, space_name: str, organization: str | None, private: bool, sdk: str) -> str:
    namespace = organization or get_namespace(token)

    payload = build_create_repo_payload(
        space_name=space_name,
        organization=organization,
        private=private,
        sdk=sdk,
    )

    try:
        api_request("/api/repos/create", token, method="POST", payload=payload)
        print(f"✅ 已创建 Space: {namespace}/{space_name}")
    except DeployError as exc:
        msg = str(exc).lower()
        if "409" in msg or "already exists" in msg:
            print(f"ℹ️ Space 已存在，继续发布: {namespace}/{space_name}")
        else:
            raise

    return f"{namespace}/{space_name}"


def resolve_publish_files(extra_files: Iterable[str] | None = None) -> list[str]:
    files = list(DEFAULT_PUBLISH_FILES)
    if extra_files:
        for item in extra_files:
            if item and item not in files:
                files.append(item)
    return files


def publish(
    repo_id: str,
    token: str,
    publish_files: list[str],
    message: str,
    force_push: bool,
    branch: str,
) -> None:
    with tempfile.TemporaryDirectory(prefix="hf-space-") as tmp:
        for rel in publish_files:
            src = PROJECT_ROOT / rel
            if not src.exists():
                raise FileNotFoundError(f"缺少发布文件: {src}")
            dst = Path(tmp) / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)

        run(["git", "init"], cwd=tmp)
        run(["git", "checkout", "-b", branch], cwd=tmp)
        run(["git", "config", "user.name", "my-ai-coder"], cwd=tmp)
        run(["git", "config", "user.email", "bot@local"], cwd=tmp)
        run(["git", "add", "."], cwd=tmp)
        run(["git", "commit", "-m", message], cwd=tmp)

        safe_token = urllib.parse.quote(token, safe="")
        remote = f"https://user:{safe_token}@huggingface.co/spaces/{repo_id}"
        run(["git", "remote", "add", "origin", remote], cwd=tmp)

        push_cmd = ["git", "push", "-u", "origin", branch]
        if force_push:
            push_cmd.append("--force")
        run(push_cmd, cwd=tmp)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="一键发布到 Hugging Face Space")
    parser.add_argument("--space", required=True, help="Space 名称，例如 my-omni-ai-studio")
    parser.add_argument("--token", default=None, help="HF Token，默认读取 HF_TOKEN 或 HUGGING_FACE_HUB_TOKEN")
    parser.add_argument("--org", default=None, help="组织名(可选)，不填则发布到个人账号")
    parser.add_argument("--private", action="store_true", help="创建私有 Space")
    parser.add_argument("--sdk", default="static", choices=["static", "gradio", "docker"], help="Space SDK 类型")
    parser.add_argument("--branch", default="main", help="目标分支名，默认 main")
    parser.add_argument("--message", default="Deploy My Omni AI Studio", help="部署提交信息")
    parser.add_argument("--include", action="append", default=[], help="额外发布文件（可多次传入）")
    parser.add_argument("--no-force", action="store_true", help="关闭默认 --force 推送")
    return parser.parse_args()


def resolve_token(token_arg: str | None) -> str | None:
    if token_arg:
        return token_arg
    return os.getenv("HF_TOKEN") or os.getenv("HUGGING_FACE_HUB_TOKEN")


def main() -> int:
    args = parse_args()
    token = resolve_token(args.token)
    if not token:
        print("❌ 缺少 Token，请通过 --token 或 HF_TOKEN/HUGGING_FACE_HUB_TOKEN 提供。", file=sys.stderr)
        return 1

    publish_files = resolve_publish_files(args.include)
    repo_id = resolve_repo_id(token, args.space, args.org, args.private, args.sdk)
    publish(
        repo_id=repo_id,
        token=token,
        publish_files=publish_files,
        message=args.message,
        force_push=not args.no_force,
        branch=args.branch,
    )
    print(f"🚀 发布完成: https://huggingface.co/spaces/{repo_id}")
    print(f"📦 发布文件: {', '.join(publish_files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
