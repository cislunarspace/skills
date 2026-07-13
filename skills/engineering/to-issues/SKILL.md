---
name: to-issues
description: 把计划、规格或 PRD 拆成可独立认领的 issue，发布到项目 issue tracker，按垂直切片（tracer bullet）划分。当用户要求把计划拆成 issue、创建 issue 或发布到 issue tracker 时使用。
disable-model-invocation: true
---

# To Issues

把计划拆成可独立认领的 issue，用垂直切片（tracer bullet）划分。

issue tracker 约定见 `docs/agents/issue-tracker.md`，triage label 词汇见 `docs/agents/triage-labels.md`。

## 步骤

### 1. 收集上下文

从对话已有的上下文出发。如果用户传入了 issue 引用（编号、URL 或路径），从 issue tracker 拉取，读完整正文和评论。

### 2. 探索代码库（可选）

如果还没探索过代码库，先探索一遍，理解当前代码状态。issue 标题和描述使用项目的领域术语（见 `CONTEXT.md`），遵守相关区域的 ADR。

寻找预重构的机会，让后续实现更容易，"先把改动变容易，再做容易的改动"。

### 3. 起草垂直切片

把计划拆成 tracer bullet issue。每个 issue 是一条贯穿所有集成层的薄垂直切片，不是某一层的水平切片。

- 每条切片交付一条窄但完整的路径，穿过每一层（schema、API、UI、测试）
- 完成的切片可以独立演示或验证
- 预重构应最先完成

### 4. 与用户确认

把拟定的拆法作为编号列表展示。每条切片给出：

- **标题**：简短描述性名称
- **阻塞于**：哪些切片必须先完成（若有）
- **覆盖的用户故事**：这条切片覆盖哪些用户故事（如果来源材料有的话）

问用户：

- 粒度是否合适？（太粗 / 太细）
- 依赖关系是否正确？
- 有没有切片该合并或进一步拆分？

反复迭代，直到用户批准。

### 5. 发布 issue

对每条批准的切片，在 issue tracker 创建一个新 issue，用下面的模板。这些 issue 视为已就绪，打上 `ready-for-agent` 标签。

按依赖顺序发布（阻塞方先发），这样能在"阻塞于"字段里引用真实的 issue 编号。

<issue-template>

## 父 issue

指向 issue tracker 上父 issue 的引用（如果来源是一个已有 issue，否则省略本节）。

## 要构建什么

这条垂直切片的简要描述。描述端到端行为，不是逐层实现。

避免具体文件路径或代码片段，它们很快会过时。例外：如果原型产生了一段比文字更精确地编码了某个决策的代码（状态机、reducer、schema、类型形状），把它内联在这里，注明来自原型。只保留决策密集的部分，不是一整个可运行的 demo。

## 验收标准

- [ ] 标准 1
- [ ] 标准 2
- [ ] 标准 3

## 阻塞于

- 指向阻塞 issue 的引用（若有）

若无阻塞，写"无，可以立即开始"。

</issue-template>

不要关闭或修改任何父 issue。
