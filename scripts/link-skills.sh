#!/usr/bin/env bash
set -euo pipefail

# 把本仓库的 skill 软链到本地 Claude Code 安装目录。每个 entry 是到
# 仓库内的 symlink，`git pull` 自动同步；新增/删除/改名后重跑一次。
#
# 用法:
#   ./scripts/link-skills.sh           # 安装所有 skills
#   ./scripts/link-skills.sh engineering  # 只安装工程相关 skills
#   ./scripts/link-skills.sh research     # 只安装研究相关 skills
#   ./scripts/link-skills.sh engineering research  # 安装工程和研究相关 skills

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# 解析参数
GROUPS=()
for arg in "$@"; do
  case "$arg" in
    engineering|research)
      GROUPS+=("$arg")
      ;;
    all|"")
      # 安装所有
      ;;
    *)
      echo "未知的分组: $arg" >&2
      echo "可用分组: engineering, research" >&2
      exit 1
      ;;
  esac
done

# 如果没有指定分组，默认安装所有
if [ ${#GROUPS[@]} -eq 0 ]; then
  echo "未指定分组，安装所有 skills..."
  find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' -print0 | while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    echo "found: $name"
  done
else
  echo "指定分组: ${GROUPS[*]}"
fi

# 读取 plugin.json 获取分组信息
PLUGIN_JSON="$REPO/.claude-plugin/plugin.json"
if [ ! -f "$PLUGIN_JSON" ]; then
  echo "错误: 找不到 $PLUGIN_JSON" >&2
  exit 1
fi

# 根据分组筛选 skills
names=()
srcs=()

if [ ${#GROUPS[@]} -eq 0 ]; then
  # 安装所有 skills
  while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    names+=("$(basename "$src")")
    srcs+=("$src")
  done < <(find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' -print0)
else
  # 根据分组筛选
  for group in "${GROUPS[@]}"; do
    # 使用 jq 或 grep 解析 JSON
    if command -v jq &>/dev/null; then
      while IFS= read -r skill_path; do
        # 移除 ./skills/ 前缀，获取目录名
        name="${skill_path#./skills/}"
        src="$REPO/skills/$name"
        if [ -d "$src" ]; then
          names+=("$name")
          srcs+=("$src")
        fi
      done < <(jq -r ".groups.$group.skills[]" "$PLUGIN_JSON" 2>/dev/null || true)
    else
      # 如果没有 jq，使用 grep 解析
      echo "警告: 未安装 jq，使用 grep 解析 JSON（可能不准确）" >&2
      # 简单的 grep 解析
      grep -A 100 "\"$group\"" "$PLUGIN_JSON" | grep '"./skills/' | head -20 | while IFS= read -r line; do
        name=$(echo "$line" | grep -o '"./skills/[^"]*"' | tr -d '"' | sed 's|./skills/||')
        if [ -n "$name" ]; then
          src="$REPO/skills/$name"
          if [ -d "$src" ]; then
            names+=("$name")
            srcs+=("$src")
          fi
        fi
      done
    fi
  done
fi

# 去重
declare -A seen
unique_names=()
unique_srcs=()
for i in "${!names[@]}"; do
  name="${names[$i]}"
  if [ -z "${seen[$name]:-}" ]; then
    seen[$name]=1
    unique_names+=("$name")
    unique_srcs+=("${srcs[$i]}")
  fi
done
names=("${unique_names[@]}")
srcs=("${unique_srcs[@]}")

if [ ${#names[@]} -eq 0 ]; then
  echo "没有找到要安装的 skills" >&2
  exit 1
fi

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

echo ""
echo "安装以下 skills:"
for name in "${names[@]}"; do
  echo "  - $name"
done
echo ""

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

echo ""
echo "安装完成！共安装 ${#names[@]} 个 skills。"
