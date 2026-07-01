#!/usr/bin/env bash
set -euo pipefail

# 把本仓库的 skill 软链到本地 Claude Code 安装目录。每个 entry 是到
# 仓库内的 symlink，`git pull` 自动同步；新增/删除/改名后重跑一次。

REPO="$(cd "$(dirname "$0")/.." && pwd)"

names=()
srcs=()
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  names+=("$(basename "$src")")
  srcs+=("$src")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' -print0)

DEST="$HOME/.claude/skills"

if [ -L "$DEST" ]; then
  resolved="$(readlink -f "$DEST")"
  case "$resolved" in
    "$REPO"|"$REPO"/*)
      echo "error: $DEST 指向本仓库 ($resolved)。删除它再重跑。" >&2
      exit 1
      ;;
  esac
fi

mkdir -p "$DEST"

for i in "${!names[@]}"; do
  name="${names[$i]}"
  src="${srcs[$i]}"
  target="$DEST/$name"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$src" "$target"
  echo "linked $name -> $src ($DEST)"
done