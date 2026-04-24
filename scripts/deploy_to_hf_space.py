#!/usr/bin/env python3
"""一键将当前前端发布到 Hugging Face Space(static)."""

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

HF_ENDPOINT = "https://huggingface.co"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLISH_FILES = ["index.html", "styles.css", "app.js", "README.md"]


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
        raise RuntimeError(f"{method} {path} 失败: {exc.code} {body}") from exc


def run(cmd: list[str], cwd: str | None = None) -> None:
    subprocess.run(cmd, check=True, cwd=cwd)


def resolve_repo_id(token: str, space_name: str, organization: str | None) -> str:
    namespace = organization
    if not namespace:
        whoami = api_request("/api/whoami-v2", token)
        namespace = whoami["name"]

    payload = {
        "type": "space",
        "name": space_name,
        "organization": organization,
        "private": False,
        "sdk": "static",
    }

    try:
        api_request("/api/repos/create", token, method="POST", payload=payload)
        print(f"✅ 已创建 Space: {namespace}/{space_name}")
    except RuntimeError as exc:
        if "409" in str(exc) or "already exists" in str(exc).lower():
            print(f"ℹ️ Space 已存在，继续发布: {namespace}/{space_name}")
        else:
            raise

    return f"{namespace}/{space_name}"


def publish(repo_id: str, token: str) -> None:
    with tempfile.TemporaryDirectory(prefix="hf-space-") as tmp:
        for rel in PUBLISH_FILES:
            src = PROJECT_ROOT / rel
            if not src.exists():
                raise FileNotFoundError(f"缺少发布文件: {src}")
            shutil.copy2(src, Path(tmp) / rel)

        run(["git", "init"], cwd=tmp)
        run(["git", "checkout", "-b", "main"], cwd=tmp)
        run(["git", "config", "user.name", "my-ai-coder"], cwd=tmp)
        run(["git", "config", "user.email", "bot@local"], cwd=tmp)
        run(["git", "add", "."], cwd=tmp)
        run(["git", "commit", "-m", "Deploy My Omni AI Studio"], cwd=tmp)

        safe_token = urllib.parse.quote(token, safe="")
        remote = f"https://user:{safe_token}@huggingface.co/spaces/{repo_id}"
        run(["git", "remote", "add", "origin", remote], cwd=tmp)
        run(["git", "push", "-u", "origin", "main", "--force"], cwd=tmp)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="一键发布到 Hugging Face Space")
    parser.add_argument("--space", required=True, help="Space 名称，例如 my-omni-ai-studio")
    parser.add_argument("--token", default=os.getenv("HF_TOKEN"), help="HF Token，默认读取 HF_TOKEN")
    parser.add_argument("--org", default=None, help="组织名(可选)，不填则发布到个人账号")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.token:
        print("❌ 缺少 Token，请通过 --token 或 HF_TOKEN 提供。", file=sys.stderr)
        return 1

    repo_id = resolve_repo_id(args.token, args.space, args.org)
    publish(repo_id, args.token)
    print(f"🚀 发布完成: https://huggingface.co/spaces/{repo_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
