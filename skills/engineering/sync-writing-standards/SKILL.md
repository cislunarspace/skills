---
name: sync-writing-standards
description: 把仓库统一的交流语言、写作要求和编码准则同步到 CLAUDE.md 与 AGENTS.md。用户要求同步、注入或更新写作规范时手动运行。
disable-model-invocation: true
---

用 `references/standards.md` 作为唯一内容来源，把三节规范同步到目标仓库的 `CLAUDE.md` 和 `AGENTS.md`。脚本负责节级替换或追加、保留其他内容、统一 LF 行尾并验证结果。

## 流程

1. 确认目标目录：默认使用当前工作目录；目标不是仓库根目录时，先传入明确路径。
2. 运行一次：

   ```bash
   node "{{SKILL_DIR}}/sync.js"
   ```

   指定其他目录：

   ```bash
   node "{{SKILL_DIR}}/sync.js" "/path/to/repo"
   ```

   `{{SKILL_DIR}}` 是 skill 所在目录的绝对路径，由 harness 替换。
3. 以退出码判断结果：退出码 `0` 表示同步并验证成功；非 `0` 时报告完整错误并停止。
4. 成功后检查 `git diff -- CLAUDE.md AGENTS.md`，向用户说明新增、替换或保留的内容。

脚本已经包揽文件读取、节切分、写入、行尾归一化和一致性验证。不要再手动编辑同一批文件，也不要用其他脚本重复实现这些步骤。

## 完成条件

- 脚本退出码为 `0`。
- `CLAUDE.md` 与 `AGENTS.md` 都存在，首行为对应的 `# CLAUDE.md` 或 `# AGENTS.md`。
- 两个文件都包含 `## 交流语言`、`## 写作要求`、`## 编码准则`。
- 三节内容分别与 `references/standards.md` 逐字一致。
- 目标文件和源文件均使用 LF 行尾。
- 其他已有章节仍保留。

## 维护

- 只编辑 `references/standards.md` 更新规范正文；不要直接修改目标文件中的同步章节。
- `templates/` 中若有指向规范源文件的软链接，不需要手动维护。
- 规范同步成功后，重启 Claude Code 会话，让新规范进入上下文。
