---
name: sync-writing-standards
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md 和 AGENTS.md。
---

# sync-writing-standards

把 `references/STANDARDS.md` 里的三节注入当前仓库的 `CLAUDE.md` 和 `AGENTS.md`。节的范围：从 `## ` 标题到下一个 `## ` 或文件末尾；h1、HTML 注释、分隔线不是注入单元。

两个目标文件的注入逻辑相同，格式不同：

- `CLAUDE.md`：普通 markdown，直接写入三节。
- `AGENTS.md`：内容必须放在 fenced code block（` ``` `）内，Kimi CLI 按此格式读取。

## 步骤

1. 读 STANDARDS.md，按上述范围切出三节。

2. 对 `CLAUDE.md` 和 `AGENTS.md` **分别**执行注入（顺序无关）：
   - 读目标文件。若不存在，新建并写入三节（`AGENTS.md` 用下方格式），跳到下一个文件。
   - **逐节注入**：目标已有同名 `## ` 节则**整节替换**，没有则**追加**。
   - `AGENTS.md` 的注入在 fenced block 内进行。

## AGENTS.md 格式

````markdown
`````

[已有内容或注入的三节]

``````
````

即：整个文件体是一个顶层 fenced block。注入的三节作为普通 markdown 写在这个 block 内。

## 完成条件

- `CLAUDE.md` 包含三节，每节与 STANDARDS.md 对应原文**逐字一致**。
- `AGENTS.md` 存在且格式正确（内容在 fenced block 内），block 内包含同样的三节。
- 两个文件中三节之外的内容均未被改动。