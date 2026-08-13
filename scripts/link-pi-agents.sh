#!/usr/bin/env bash
set -euo pipefail

# 把本仓库 pi/agents/ 下的 pi subagent 定义软链到 pi 的用户级 agent 目录。
# 每个 entry 是到仓库内的 symlink，`git pull` 自动同步；
# 新增/删除/改名后重跑一次。
#
# 用法:
#   ./scripts/link-pi-agents.sh

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/pi/agents"
DEST="$HOME/.pi/agent/agents"

if [ ! -d "$SRC" ]; then
  echo "错误: 找不到 $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"

count=0
for f in "$SRC"/*.md; do
  name="$(basename "$f")"
  target="$DEST/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi
  ln -sfn "$f" "$target"
  echo "linked $name -> $f"
  count=$((count + 1))
done

echo ""
echo "安装完成！共链接 ${count} 个 pi agents。"
echo "pi 的 subagent 工具默认只加载用户级 agents；项目级覆盖放 .pi/agents/（需 agentScope: \"both\"）。"
