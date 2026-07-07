#!/usr/bin/env bash
# sync-test.sh — sync.sh 单元测试
# 用法: bash sync-test.sh

set -euo pipefail

# ---- 测试框架 ----
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

pass() {
  ((TESTS_PASSED++)) || true
  echo "  ✓ $1"
}

fail() {
  ((TESTS_FAILED++)) || true
  echo "  ✗ $1"
  [ -n "${2:-}" ] && echo "    $2"
}

run_test() {
  ((TESTS_RUN++)) || true
  echo ""
  echo "测试 $TESTS_RUN: $1"
}

# ---- 设置 ----

SKILL_DIR="$(cd "$(dirname "$0")" && pwd -P)"
SYNC_SH="$SKILL_DIR/sync.sh"
TMPDIR_BASE=""

# 一次扫描本测试本轮创建的所有 sync-test-* 目录。
# 不依赖 TMPDIR_BASE 是因为每个 test_xxx 函数都会调 create_tmp 覆盖它，
# 之前测试创建的 tmpdir 就丢了；走 glob 更稳。
cleanup() {
  rm -rf /tmp/sync-test-*.* /tmp/sync-test-* 2>/dev/null || true
}
trap cleanup EXIT

# 返回新临时目录路径；TMPDIR_BASE 由调用方赋值（命令替换是子 shell，
# 在函数内给 TMPDIR_BASE 赋值不会传到父 shell，会让 cleanup 失效）。
create_tmp() {
  mktemp -d -t sync-test-XXXXXX
}

# 创建一个包含有效 standards.md 的临时 SKILL_DIR
create_mock_skill_dir() {
  local base="$1"
  local skill_dir="$base/mock-skill"
  mkdir -p "$skill_dir/references"
  cat > "$skill_dir/references/standards.md" << 'STANDARDS_EOF'
# 注入规范原文

## 交流语言

始终使用中文与用户交流。

## 写作要求

遵守写作原则。

## 编码准则

遵守编码准则。
STANDARDS_EOF
  echo "$skill_dir"
}

# ---- 测试用例 ----

test_create_new_claude_md() {
  run_test "无目标文件时创建新文件"

  local tmp
  tmp=$(create_tmp)
  TMPDIR_BASE=$tmp
  local target_dir="$tmp/target"
  mkdir -p "$target_dir"
  local mock_skill
  mock_skill=$(create_mock_skill_dir "$tmp")

  SKILL_DIR="$mock_skill" bash "$SYNC_SH" "$target_dir" > /dev/null 2>&1

  local claude="$target_dir/CLAUDE.md"
  if [ ! -f "$claude" ]; then
    fail "CLAUDE.md 未创建"
    return
  fi

  local first_line
  first_line=$(head -1 "$claude")
  if [ "$first_line" != "# CLAUDE.md" ]; then
    fail "首行应为 '# CLAUDE.md'，实际: $first_line"
    return
  fi

  if ! grep -q '## 交流语言' "$claude"; then
    fail "缺少 '## 交流语言' 节"
    return
  fi

  if ! grep -q '## 写作要求' "$claude"; then
    fail "缺少 '## 写作要求' 节"
    return
  fi

  if ! grep -q '## 编码准则' "$claude"; then
    fail "缺少 '## 编码准则' 节"
    return
  fi

  pass "CLAUDE.md 创建成功，包含三节"
}

test_create_new_agents_md() {
  run_test "无目标文件时创建 AGENTS.md"

  local tmp
  tmp=$(create_tmp)
  TMPDIR_BASE=$tmp
  local target_dir="$tmp/target"
  mkdir -p "$target_dir"
  local mock_skill
  mock_skill=$(create_mock_skill_dir "$tmp")

  SKILL_DIR="$mock_skill" bash "$SYNC_SH" "$target_dir" > /dev/null 2>&1

  local agents="$target_dir/AGENTS.md"
  if [ ! -f "$agents" ]; then
    fail "AGENTS.md 未创建"
    return
  fi

  local first_line
  first_line=$(head -1 "$agents")
  if [ "$first_line" != "# AGENTS.md" ]; then
    fail "首行应为 '# AGENTS.md'，实际: $first_line"
    return
  fi

  if ! grep -q '## 交流语言' "$agents"; then
    fail "缺少 '## 交流语言' 节"
    return
  fi

  pass "AGENTS.md 创建成功"
}

test_update_existing_file() {
  run_test "目标文件存在时正确更新"

  local tmp
  tmp=$(create_tmp)
  TMPDIR_BASE=$tmp
  local target_dir="$tmp/target"
  mkdir -p "$target_dir"
  local mock_skill
  mock_skill=$(create_mock_skill_dir "$tmp")

  # 创建一个已有的 CLAUDE.md，包含旧内容和一个自定义节
  cat > "$target_dir/CLAUDE.md" << 'EOF'
# CLAUDE.md

## 交流语言

旧的交流语言内容。

## 自定义节

这是自定义内容，不应被删除。
EOF

  SKILL_DIR="$mock_skill" bash "$SYNC_SH" "$target_dir" > /dev/null 2>&1

  local claude="$target_dir/CLAUDE.md"

  # 检查旧的交流语言被替换
  if grep -q '旧的交流语言内容' "$claude"; then
    fail "旧的交流语言内容应被替换"
    return
  fi

  # 检查新的交流语言存在
  if ! grep -q '始终使用中文与用户交流' "$claude"; then
    fail "新的交流语言内容应存在"
    return
  fi

  # 检查自定义节被保留
  if ! grep -q '## 自定义节' "$claude"; then
    fail "自定义节应被保留"
    return
  fi

  if ! grep -q '这是自定义内容' "$claude"; then
    fail "自定义节内容应被保留"
    return
  fi

  pass "已存在文件更新正确，自定义节保留"
}

test_skip_when_sections_match() {
  run_test "目标文件已有标准节时跳过替换"

  local tmp
  tmp=$(create_tmp)
  TMPDIR_BASE=$tmp
  local target_dir="$tmp/target"
  mkdir -p "$target_dir"
  local mock_skill
  mock_skill=$(create_mock_skill_dir "$tmp")

  # 先运行一次让文件包含标准内容
  SKILL_DIR="$mock_skill" bash "$SYNC_SH" "$target_dir" > /dev/null 2>&1

  # 记录文件内容的 md5
  local md5_before
  md5_before=$(md5sum "$target_dir/CLAUDE.md" | cut -d' ' -f1)

  # 再次运行
  SKILL_DIR="$mock_skill" bash "$SYNC_SH" "$target_dir" > /dev/null 2>&1

  local md5_after
  md5_after=$(md5sum "$target_dir/CLAUDE.md" | cut -d' ' -f1)

  if [ "$md5_before" != "$md5_after" ]; then
    fail "文件内容不应改变（已是最新）"
    return
  fi

  pass "文件内容已最新，无多余修改"
}

test_standards_file_missing() {
  run_test "standards.md 不存在时报错"

  local tmp
  tmp=$(create_tmp)
  TMPDIR_BASE=$tmp
  local target_dir="$tmp/target"
  mkdir -p "$target_dir"

  # 创建一个没有 standards.md 的 SKILL_DIR
  local empty_skill="$tmp/empty-skill"
  mkdir -p "$empty_skill/references"

  local output
  output=$(SKILL_DIR="$empty_skill" bash "$SYNC_SH" "$target_dir" 2>&1) && {
    fail "应以非零退出码失败"
    return
  }

  if ! echo "$output" | grep -q '错误'; then
    fail "应输出错误信息，实际: $output"
    return
  fi

  pass "正确报错"
}

# ---- 运行所有测试 ----

echo "=== sync.sh 单元测试 ==="

test_create_new_claude_md
test_create_new_agents_md
test_update_existing_file
test_skip_when_sections_match
test_standards_file_missing

# ---- 汇总 ----

echo ""
echo "=== 结果 ==="
echo "运行: $TESTS_RUN  通过: $TESTS_PASSED  失败: $TESTS_FAILED"

if [ "$TESTS_FAILED" -gt 0 ]; then
  exit 1
fi

exit 0
