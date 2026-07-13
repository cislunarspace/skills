#!/usr/bin/env bash
# sync.sh — 把 references/standards.md 三节注入目标仓库 CLAUDE.md / AGENTS.md。
# 单一入口：agent 只跑本脚本，不自己解析 markdown、不手动 Edit、不自己跑 od/sed。
#
# 用法: bash sync.sh [目标仓库根目录]
#   不传参默认当前目录。

set -euo pipefail

SKILL_DIR="${SKILL_DIR:-$(cd "$(dirname "$0")" && pwd -P)}"
TARGET_DIR="${1:-$PWD}"
STANDARDS="$SKILL_DIR/references/standards.md"
SECTIONS=("交流语言" "写作要求" "编码准则")

# ---- 前置检查 ----
for f in "$STANDARDS"; do
    [ -f "$f" ] || { echo "错误：缺少 $f" >&2; exit 1; }
done
[ -d "$TARGET_DIR" ] || { echo "错误：目标目录不存在: $TARGET_DIR" >&2; exit 1; }

# ---- 工具函数 ----

# LF 归一化：去所有 \r
lf() { sed -i 's/\r$//' "$@"; }

# 统计 CR 字节数
count_cr() { tr -cd '\r' < "$1" | wc -c | tr -d ' '; }

# 确保第一行 H1 标题匹配预期值。已有 # 标题则替换，否则在开头插入标题 + 空行。
ensure_title() {
    local target="$1" expected="$2"
    [ "$(head -1 "$target")" = "$expected" ] && return
    local tmp; tmp=$(mktemp)
    if head -1 "$target" | grep -q '^# '; then
        awk -v h1="$expected" 'NR==1{print h1;next}{print}' "$target" > "$tmp"
    else
        { printf '%s\n\n' "$expected"; cat "$target"; } > "$tmp"
    fi
    mv "$tmp" "$target"
    echo "    H1 标题 → $expected"
}

# 抽 ## TITLE 节：从标题行到下一个 ## 或独立 --- 为止，去尾部空行。
# 输出含标题行本身，结尾无多余空行。
extract() {
    awk -v h="## $2" '
        /^## / { if (in_) exit; in_ = ($0 == h) }
        in_ && /^---[[:space:]]*$/ { exit }
        in_ { print }
    ' "$1" | sed -e :a -e '/^[[:space:]]*$/{$d;N;ba}'
}

# 把 TARGET 中 ## TITLE 节整段换为 NEW（NEW 以 "## TITLE" 开头）；无则追加到末尾。
# 三节之外的内容字节不动。
inject() {
    local target="$1" title="$2" new="$3" tmp
    tmp=$(mktemp)
    if grep -qx "## $title" "$target" 2>/dev/null; then
        TM="## $title" NEW="$new" awk '
            $0 == ENVIRON["TM"] { old = 1; printf "%s\n", ENVIRON["NEW"]; next }
            old && /^## / { old = 0; printf "\n"; print; next }
            old && /^---[[:space:]]*$/ { old = 0; printf "\n"; print; next }
            old { next }
            { print }
        ' "$target" > "$tmp"
    else
        if [ -s "$target" ]; then
            # 去掉目标尾部空行，再追加（保证恰好一个空行分隔）
            sed -e :a -e '/^[[:space:]]*$/{$d;N;ba}' "$target" > "$tmp"
            printf '\n%s\n' "$new" >> "$tmp"
        else
            printf '%s\n' "$new" > "$tmp"
        fi
    fi
    mv "$tmp" "$target"
}

# 同步单个目标文件
sync_target() {
    local name="$1" target="$2"
    if [ ! -f "$target" ]; then
        echo "==> $name: 不存在，创建并注入三节"
        : > "$target"
    else
        echo "==> $name: 已存在，替换/追加三节"
        lf "$target"
    fi
    for title in "${SECTIONS[@]}"; do
        inject "$target" "$title" "${SEC_CONTENT[$title]}"
    done
    ensure_title "$target" "# $name"
}

# ---- 主流程 ----

echo "==> 归一化源文件行尾 (LF)"
lf "$STANDARDS"

echo "==> 抽取三节原文"
declare -A SEC_CONTENT
for title in "${SECTIONS[@]}"; do
    SEC_CONTENT[$title]=$(extract "$STANDARDS" "$title")
    [ -n "${SEC_CONTENT[$title]}" ] || { echo "错误：standards.md 缺 ## $title" >&2; exit 1; }
done

CLAUDE="$TARGET_DIR/CLAUDE.md"
AGENTS="$TARGET_DIR/AGENTS.md"

sync_target "CLAUDE.md" "$CLAUDE"
sync_target "AGENTS.md" "$AGENTS"

echo "==> 归一化目标文件行尾 (LF)"
lf "$CLAUDE" "$AGENTS"

echo "==> 验证"
for f in "$STANDARDS" "$CLAUDE" "$AGENTS"; do
    if [ "$(count_cr "$f")" -gt 0 ]; then
        echo "  失败：$f 含 CR" >&2; exit 1
    fi
done
for target in "$CLAUDE" "$AGENTS"; do
    expected="# $(basename "$target")"
    [ "$(head -1 "$target")" = "$expected" ] || { echo "  失败：$target 第一行应为 $expected" >&2; exit 1; }
    for title in "${SECTIONS[@]}"; do
        got=$(extract "$target" "$title")
        if [ "$got" != "${SEC_CONTENT[$title]}" ]; then
            echo "  失败：$target 的 ## $title 与 standards.md 不一致" >&2
            diff <(printf '%s\n' "${SEC_CONTENT[$title]}") <(printf '%s\n' "$got") >&2 || true
            exit 1
        fi
    done
done

echo "完成。"
echo "  $CLAUDE"
echo "  $AGENTS"
