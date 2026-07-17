#!/usr/bin/env bash
# 列出仓库内的所有 skill。

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

source "$(dirname "$0")/lib/find-skills.sh"

# list_skill_dirs 输出绝对路径，转成相对仓库根的 SKILL.md 路径并排序。
list_skill_dirs | sed "s|^$REPO/||; s|\$|/SKILL.md|" | sort
