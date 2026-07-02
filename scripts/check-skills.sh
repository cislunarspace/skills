#!/usr/bin/env bash
set -euo pipefail

# 回归检查：
# 1. README / CLAUDE.md 里的安装命令必须指向当前仓库的 origin。
# 2. 每个 SKILL.md 必须有 name 和 description 的 YAML frontmatter。

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

origin_url="$(git remote get-url origin 2>/dev/null || true)"
origin_path="${origin_url%.git}"
origin_name="${origin_path##*/:}"
origin_name="${origin_name##*/}"

if [ -z "$origin_name" ]; then
  echo "error: cannot determine origin repo name" >&2
  exit 1
fi

bad_refs=0
while IFS= read -r file; do
  if grep -qE "npx skills add [^[:space:]]+/$origin_name" "$file"; then
    :
  else
    echo "error: $file does not reference the current origin ($origin_name)" >&2
    bad_refs=$((bad_refs + 1))
  fi
done < <(printf '%s\n' README.md CLAUDE.md)

bad_skills=0
while IFS= read -r skill_md; do
  if ! grep -qE '^name:' "$skill_md" || ! grep -qE '^description:' "$skill_md"; then
    echo "error: $skill_md missing name/description frontmatter" >&2
    bad_skills=$((bad_skills + 1))
  fi
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*')

if [ "$bad_refs" -gt 0 ] || [ "$bad_skills" -gt 0 ]; then
  exit 1
fi

echo "ok: repo references and skill frontmatter are consistent"
