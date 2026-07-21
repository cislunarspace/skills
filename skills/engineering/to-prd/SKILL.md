---
name: to-prd
description: 把当前对话综合成一份 PRD，发布到项目 issue tracker。不做访谈，只整理已经讨论过的内容。当用户说"to-prd"、"转 PRD"、"写 PRD"或要求把当前对话整理成 PRD 时使用。
disable-model-invocation: true
---

# To PRD

从当前对话中提取需求信息，按 PRD 模板整理成结构化文档，经用户确认后发布到 issue tracker 并打上 ready-for-agent 标签。不主动访谈，只整理对话中已讨论的内容。

## 步骤

### 1. 探索代码库

读 CONTEXT.md、相关 ADR，了解领域术语和架构约束。如果 PRD 涉及具体模块，浏览相关代码确认当前实现状态。

### 2. 确定测试切面

确认测试切面：优先复用已有切面（HTTP 端点、CLI 命令、导出函数等），能用高层的不开低层的。必须新增时选最高位置并与用户确认。

### 3. 写 PRD 并发布

用下面的模板写 PRD。PRD 全文用项目领域术语（见 CONTEXT.md）、遵守相关 ADR。发布时按 docs/agents/issue-tracker.md 约定，使用 docs/agents/triage-labels.md 中的标签词汇。

### Checkpoint

PRD 草稿写完后必须停下，展示给用户确认。用户确认后再执行 `gh issue create` 发布到 issue tracker，打上 `ready-for-agent` 标签。

<prd-template>

## 问题陈述

用户面临的问题，从用户视角描述。

## 方案

问题的解决方案，从用户视角描述。

## 用户故事

编号列表，格式：作为<角色>，我想要<功能>，以便<收益>。覆盖功能各方面。

## 实现决策

已做出的实现决策列表，可包括：

- 要构建/修改的模块
- 这些模块会被修改的接口
- 来自开发者的技术澄清
- 架构决策
- Schema 变更
- API 契约
- 具体交互

用概念和接口描述决策，不列文件路径。如有原型代码精确编码了决策（状态机、schema、类型），可内联决策密集部分并注明来自原型。

## 测试决策

已做出的测试决策列表，包括：

- 什么样的测试才是好测试（只测外部行为，不测实现细节）
- 哪些模块会被测试
- 测试的先例（代码库里类似的测试）

## 不在范围内

本 PRD 不覆盖的内容。

## 补充说明

关于该功能的任何补充说明。

</prd-template>

## 边界情况

| 情况 | 处理方式 |
|---|---|
| 对话中缺少核心需求信息 | 标出缺失部分，询问用户是继续写不完整的 PRD 还是补充讨论 |
| CONTEXT.md 或相关 ADR 不存在 | 跳过领域术语检查，用对话中的术语 |
| gh 未认证或无权限 | 将 PRD 内容展示给用户，提示手动创建 issue |

## 完成条件

- PRD 已通过 gh issue create 发布
- issue 已打上 ready-for-agent 标签
- issue URL 已展示给用户

## 下一步

- PRD 写完：拆成可执行的 issue 用 `/to-issues`
- PRD 自己还想再压一压：跑 `/grilling`
