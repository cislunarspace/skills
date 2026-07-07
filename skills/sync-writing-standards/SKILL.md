---
name: sync-writing-standards
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md 和 AGENTS.md。当用户说"同步写作规范"、"注入规范"、"sync-writing-standards"或要求把统一准则写进 CLAUDE.md/AGENTS.md 时使用。
---

# sync-writing-standards

把 `references/standards.md` 的三节（`## 交流语言`、`## 写作要求`、`## 编码准则`）注入目标仓库的 `CLAUDE.md` 和 `AGENTS.md`，逐字一致，LF 行尾。

## 步骤

1. 确认当前工作目录是目标仓库根目录。
2. 跑一个命令：

   ```bash
   bash {{SKILL_DIR}}/sync.sh
   ```

   指定其他目标目录：`bash {{SKILL_DIR}}/sync.sh /path/to/repo`。

脚本包揽全部：归一化源文件行尾、对每个目标文件做节级替换或追加、确保 H1 标题匹配文件名（`# CLAUDE.md` / `# AGENTS.md`）、LF 归一化、验证三节与源逐字一致。退出码 0 即成功，非 0 会打印原因。

**不要替脚本干活**：不手动 Read + Edit 目标文件、不自己跑 od / sed / python、不自己切 markdown 节。这些正是脚本要消灭的步骤，也是之前执行慢、易出错的根源。

## 完成条件

- 脚本退出码 0。
- 两个目标文件含三节，内容与 `references/standards.md` 对应节逐字一致。
- 目标文件 LF 行尾。

## 维护

- `references/standards.md` 是唯一内容来源。
- `templates/` 是 symlink，指向 `references/standards.md`，无需手动维护。
- 所有文件 LF 行尾——脚本每次运行自动归一化。
