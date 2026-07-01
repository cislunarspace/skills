#!/usr/bin/env bash
# 列出仓库内的所有 skill。

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' | sed "s|^$REPO/||" | sort