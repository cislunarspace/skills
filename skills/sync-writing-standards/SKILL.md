---
name: sync-writing-standards
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md 和 AGENTS.md。

---

# sync-writing-standards

把 `{{SKILL_DIR}}/references/STANDARDS.md` 中的三个 `## ` 节（`## 交流语言`、`## 写作要求`、`## 编码准则`）注入到当前仓库的 `CLAUDE.md` 和 `AGENTS.md`。

**注入单元**：从目标 `## ` 标题行开始，到下一个 `## ` 标题行之前结束。最后一节若文件末尾存在不属于任何 `## ` 节的内容（如 `---` 分隔线及其后的尾段），也应排除。h1、HTML 注释、分隔线本身不是注入单元。

## 步骤

1. 读 `{{SKILL_DIR}}/references/STANDARDS.md`，切出三节原文。

2. 对 `CLAUDE.md` 和 `AGENTS.md` **分别**执行注入（顺序无关）：
   - **若目标文件不存在，用 `cp {{SKILL_DIR}}/templates/<文件名> .` 复制模板，复制后跳到下一个文件。** 模板已含三节完整内容，无需再注入。
   - **若目标文件已存在**：
     - 已有同名 `## ` 节则**整节替换**（从该 `## ` 标题到下一 `## ` 标题或文件末尾，并按上面的边界规则排除尾部非节内容）。
     - 若缺少其中一节或几节，按 `交流语言 → 写作要求 → 编码准则` 的顺序追加到文件末尾。
     - 三节之外的内容一律不动。

**禁忌**：目标文件不存在时，禁止先 `Read` 模板再 `Write` 创建，`cp` 是模板存在的意义。

## 行尾

注入的目标文件必须保持 **LF** 行尾（`\n`），禁用 CRLF。Windows 默认把仓库根的 `CLAUDE.md` / `AGENTS.md` 写成 CRLF，与 `references/STANDARDS.md` 和 `templates/` 的 LF 冲突，会触发 Git 大量无意义 diff。

注入前若目标文件含 `\r`，先转 LF 再写：

```
dos2unix <file>
# 或
sed -i 's/\r$//' <file>
```

`cp` 模板时 Git Bash 的 `cp` 原样保留模板的 LF，无需额外处理。

## 完成条件

- `CLAUDE.md` 包含三节，每节与 STANDARDS.md 对应原文**逐字一致**。
- `AGENTS.md` 存在且包含同样的三节。
- 两个文件中三节之外的内容均未被改动。
- 写入后的目标文件行尾为 LF（`od -c <file> | head` 不出现 `\r\n`）。

## 模板维护

`templates/` 下的文件是 STANDARDS.md 三节的预构建副本，供 `cp` 使用。当 STANDARDS.md 的三节内容变更时，需同步更新模板：
- `templates/CLAUDE.md`：三节原文，带 `# CLAUDE.md` 标题。
- `templates/AGENTS.md`：同样内容，带 `# AGENTS.md` 标题。
