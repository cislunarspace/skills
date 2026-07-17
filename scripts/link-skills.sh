#!/usr/bin/env bash
set -euo pipefail

# 注意：bash 的 GROUPS 是记录用户组 id 的特殊只读数组，
# 不能直接当普通数组用，先 unset 掉以免污染下面的分组参数。
unset GROUPS

# 把本仓库的 skill 软链到本地 Claude Code 安装目录。每个 entry 是到
# 仓库内的 symlink，`git pull` 自动同步；新增/删除/改名后重跑一次。
#
# 用法:
#   ./scripts/link-skills.sh           # 安装所有 skills
#   ./scripts/link-skills.sh engineering  # 只安装工程相关 skills
#   ./scripts/link-skills.sh research     # 只安装研究相关 skills
#   ./scripts/link-skills.sh engineering research  # 安装工程和研究相关 skills

REPO="$(cd "$(dirname "$0")/.." && pwd)"

source "$(dirname "$0")/lib/find-skills.sh"

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
else
  echo "指定分组: ${GROUPS[*]}"
fi

# 读取 marketplace.json 获取分组信息（每个 plugin 有 name 和 skills[]）
MARKETPLACE_JSON="$REPO/.claude-plugin/marketplace.json"
if [ ! -f "$MARKETPLACE_JSON" ]; then
  echo "错误: 找不到 $MARKETPLACE_JSON" >&2
  exit 1
fi

# 根据分组筛选 skills
names=()
srcs=()

if [ ${#GROUPS[@]} -eq 0 ]; then
  # 安装所有 skills
  while IFS= read -r src; do
    name="$(basename "$src")"
    names+=("$name")
    srcs+=("$src")
    echo "found: $name"
  done < <(list_skill_dirs)
else
  # 根据分组筛选（marketplace 的 plugins[].name 用首字母大写，
  # 如 "Engineering"/"Research"，这里按小写匹配，兼容目录名）
  for group in "${GROUPS[@]}"; do
    group_lower="$(echo "$group" | tr '[:upper:]' '[:lower:]')"
    # 使用 jq 或 grep 解析 JSON
    if command -v jq &>/dev/null; then
      # 找到 name 小写后等于 $group_lower 的 plugin，列出它的 skills[]
      while IFS= read -r skill_path; do
        # skill_path 形如 ./skills/engineering/dispatch
        # src 指向仓库内该目录，name 用 basename（扁平安装到 $DEST）
        src="$REPO/skills/${skill_path#./skills/}"
        if [ -d "$src" ]; then
          names+=("$(basename "$src")")
          srcs+=("$src")
        fi
      done < <(jq -r --arg g "$group_lower" \
        '.plugins[] | select((.name | ascii_downcase) == $g) | .skills[]' \
        "$MARKETPLACE_JSON" 2>/dev/null || true)
    else
      # 如果没有 jq，使用 grep 解析：抓 "./skills/<group>/..." 路径
      echo "警告: 未安装 jq，使用 grep 解析 JSON（可能不准确）" >&2
      while IFS= read -r skill_path; do
        src="$REPO/skills/${skill_path#./skills/}"
        if [ -d "$src" ]; then
          names+=("$(basename "$src")")
          srcs+=("$src")
        fi
      done < <(command grep -oE '"\./skills/'"$group_lower"'(/[^"]*)?"' "$MARKETPLACE_JSON" \
        | tr -d '"' | sed 's|^\./skills/||')
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
