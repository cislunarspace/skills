#!/usr/bin/env bash
set -euo pipefail

# 一键完成 pi harness 的机器级一次性配置：
#   1. subagent 扩展：官方示例 symlink 到 ~/.pi/agent/extensions/subagent/
#   2. 用户级 agents：本仓库 pi/agents/ 软链到 ~/.pi/agent/agents/
# 幂等，可重复跑；项目级配置（.pi/agents/）由 /setup-pi 在目标仓库写入。
#
# 用法:
#   npm run setup:pi

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# 1. subagent 扩展
EXT_DEST="$HOME/.pi/agent/extensions/subagent"

example_dir=""
if command -v npm >/dev/null 2>&1; then
  global_root="$(npm root -g 2>/dev/null || true)"
  candidate="$global_root/@earendil-works/pi-coding-agent/examples/extensions/subagent"
  if [ -f "$candidate/index.ts" ]; then
    example_dir="$candidate"
  fi
fi

if [ -n "$example_dir" ]; then
  mkdir -p "$EXT_DEST"
  for f in index.ts agents.ts; do
    ln -sfn "$example_dir/$f" "$EXT_DEST/$f"
    echo "linked $EXT_DEST/$f -> $example_dir/$f"
  done
else
  echo "警告: 找不到 pi 包的 subagent 扩展示例，跳过扩展安装。" >&2
  echo "手动: symlink 官方示例 examples/extensions/subagent/ 的 index.ts、agents.ts 到 $EXT_DEST" >&2
fi

# 2. 用户级 agents
"$REPO/scripts/link-pi-agents.sh"

echo ""
echo "机器级配置完成。重启 pi 后 subagent 扩展生效。"
echo "项目级配置（.pi/agents/）在目标仓库跑 /setup-pi 时写入。"
