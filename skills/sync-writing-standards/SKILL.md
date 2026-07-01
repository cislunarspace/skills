---
description: 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md。
---

# sync-writing-standards

把 `references/STANDARDS.md` 里的三节注入当前仓库的 `CLAUDE.md`。节的范围：从 `## ` 标题到下一个 `## ` 或文件末尾；h1、HTML 注释、分隔线不是注入单元。

## 步骤

1. 读 STANDARDS.md，按上述范围切出三节。

2. 读仓库的 `CLAUDE.md`。若不存在，新建它，写入三节，跳到完成条件。

3. **逐节注入**：目标已有同名 `## ` 节则**整节替换**，没有则**追加**。

## 完成条件

仓库的 `CLAUDE.md` 包含三节，每节与 STANDARDS.md 对应原文**逐字一致**；这三节之外的内容未被改动。