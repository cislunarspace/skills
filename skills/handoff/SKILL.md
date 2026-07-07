---
name: handoff
description: 把当前对话压缩成交接文档，供 dispatch 接手继续。当用户说"交接"、"handoff"，或准备让 dispatch 接手当前会话时使用。
argument-hint: "下一次会话要做什么？"
disable-model-invocation: true
---

# Handoff

把当前对话总结成交接文档，让接手的 agent（通常通过 dispatch）能直接继续。

存到系统临时目录，文件名 `handoff-<简要主题>.md`（dispatch 按 `handoff-*.md` 模式搜索）。

## 文档结构

dispatch 从文档里提取三样东西来生成任务，必须写清：

- **下一步建议**：待办任务列表，每个任务写明要改的文件、做什么、验收标准。
- **依赖关系**：任务之间的先后依赖，哪些可以并行。
- **关联 issue**：涉及的 issue 编号（`#N`）或 URL，供 dispatch 用 `gh issue view` 拉取。

## 其余要求

- **已有工件**：PRD、计划、ADR、commit、diff 里已记录的内容，用路径或 URL 引用，不要复制。
- **建议技能**：列出接手 agent 应当调用的技能。
- **脱敏**：API key、密码、个人身份信息一律抹掉。
- **参数**：用户传入的参数视为对下次会话重点的说明，据此裁剪文档内容。
