---
name: write-skill
description: 帮用户编写或审查 SKILL.md。当用户想创建新 skill、改进现有 skill 写法，或提到“写 skill”“skill 模板”“skill 规范”时使用。
---

# Write Skill

按本仓库的写作规范编写或审查 SKILL.md。

## 步骤

### 1. 读规范

读 [`docs/skill-writing.md`](../../docs/skill-writing.md)，掌握 frontmatter、核心行为、边界情况、Checkpoint、完成条件各节的写法。读 [`docs/templates/SKILL.md`](../../docs/templates/SKILL.md) 拿到骨架。

### 2. 弄清意图

和用户确认两件事：

- **做什么**：这个 skill 执行什么动作？
- **什么时候触发**：什么场景、什么触发词该调用它？

有歧义当场问清，不要猜。

### 3. 起草

从骨架复制，按需删节：

- frontmatter 的 `description` 要写清“做什么 + 什么时候用”。
- 正文开头写核心行为，几行祈使句。
- 多步流程分步骤；和外部世界打交道的写边界情况表；涉及确认的写 Checkpoint；有明确终点的写完成条件。
- 不写角色设定、不教模型怎么思考、不写死的 Context。

### 4. 审查

用规范的判断标准逐段过一遍：

> 删掉这一段后，agent 会做出不同的事吗？不会，就删掉。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 用户说不清 skill 做什么 | 不动笔，追问到能一句话讲清为止 |
| skill 没有明确终点 | 不硬加完成条件一节 |
| skill 是纯交互式纪律型 | 正文只写核心行为，不编步骤 |

## Checkpoint

草稿写完，展示给用户，等确认后再落盘到 `skills/<name>/SKILL.md` 并提醒在 `.claude-plugin/plugin.json` 里注册。
