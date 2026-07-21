---
name: sync-writing-standards
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md 和 AGENTS.md。当用户说"同步写作规范"、"注入规范"、"sync-writing-standards"或要求把统一准则写进 CLAUDE.md/AGENTS.md 时使用。
---

# Sync Writing Standards

把 `references/standards.md` 的三节（`## 交流语言`、`## 写作要求`、`## 编码准则`）注入目标仓库的 `CLAUDE.md` 和 `AGENTS.md`，确保内容逐字一致、行尾为 LF。

## 步骤

1. 确认当前工作目录是目标仓库根目录。
2. 跑一个命令：

   ```text
   node "{{SKILL_DIR}}/sync.js"
   ```

   `{{SKILL_DIR}}` 是 skill 所在目录的绝对路径，由 harness 自动替换。

   指定其他目标目录：`node "{{SKILL_DIR}}/sync.js" "/path/to/repo"`。

脚本处理源文件归一化、对目标文件做节级替换或追加、验证三节内容一致。退出码 0 即成功，非 0 会打印原因。

脚本已包揽所有操作。无需手动 Read + Edit 目标文件、跑 od/sed/python、或自己切 markdown 节——这些正是脚本要消灭的步骤。

## 完成条件

- 脚本退出码 0。
- 两个目标文件含三节，内容与 `references/standards.md` 对应节逐字一致。
- 目标文件 LF 行尾。

## 维护

- `references/standards.md` 是唯一内容来源。
- `templates/` 目录中的文件是指向 `references/standards.md` 的 symlink，无需手动维护。
- 所有文件 LF 行尾——脚本每次运行自动归一化。

## 后续操作

- 注入完成后：重启 Claude Code 会话让新规范生效
