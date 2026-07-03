---
name: sync-writing-standards
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md 和 AGENTS.md。当用户提到“注入标准”“同步标准”“sync standards”“inject standards”“写入编码准则”时使用。

---

# sync-writing-standards

把 **skill 目录**下 `references/STANDARDS.md` 中的三节（`## 交流语言`、`## 写作要求`、`## 编码准则`）**注入**到当前仓库的 `CLAUDE.md` 和 `AGENTS.md`。

**注入单元**：从 `## ` 标题到下一个 `## ` 或文件末尾。h1、HTML 注释、分隔线不是注入单元。

## 步骤

1. 读 `{{SKILL_DIR}}/references/STANDARDS.md`，切出三节原文。

2. 对 `CLAUDE.md` 和 `AGENTS.md` **分别**执行注入（顺序无关）：
   - **若目标文件不存在，用 `cp {{SKILL_DIR}}/templates/<文件名> .` 复制模板，复制后跳到下一个文件。** 模板已含三节内容，无需再注入。
   - 目标已存在时：已有同名 `## ` 节则**整节替换**，没有则**追加**。

**禁忌**：目标文件不存在时，禁止 `Read` 模板再 `Write` 创建，`cp` 是模板存在的意义。

## 完成条件

- `CLAUDE.md` 包含三节，每节与 STANDARDS.md 对应原文**逐字一致**。
- `AGENTS.md` 存在且包含同样的三节。
- 两个文件中三节之外的内容均未被改动。

## 模板维护

`templates/` 下的文件是 STANDARDS.md 三节的预构建副本。当 STANDARDS.md 的三节内容变更时，需同步更新模板：
- `templates/CLAUDE.md`：三节原文，无包裹。
- `templates/AGENTS.md`：同样内容。
