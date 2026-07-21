# zcode Harness 适配

improve-codebase-architecture 在 zcode 里跑时的具体落地方式。SKILL.md 描述抽象行为，本文件描述工具调用。

第 2 步写 HTML 报告、第 3 步调 `/to-issues` 的工具用法不依赖特定子代理类型，按 SKILL.md 走即可。

## 普通模式

第 1 步需要并行走查两个维度——派一个走查"目录组织"、一个走查"文件内部设计"，结果汇总后写报告。

- 工具：`Agent`
- `subagent_type: "Explore"`（只读搜索代理，对两个维度都够用）
- 两个 `Agent` 调用放在**同一个 message** 的多个 tool use 里发出——zcode 会并发执行
- **不要**设 `run_in_background: true`——improve-codebase-architecture 是同步等两份结果再写报告，不是后台派出去
- prompt 里只给这一条任务的透镜描述：要扫的项目约定（`AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`）、对应的子透镜列表、要返回的发现项字段；不塞完整调度计划

## 多阶段编排

zcode 没有 `Workflow` 工具等价物；不支持 ultracode 等价模式。本 skill 第 1 步只有一层（两个透镜并发），无需跨层编排。如果未来把每个透镜再细拆成多个子透镜、变成多层依赖，仍按"普通模式"逐层并发派 Agent，无显式屏障与流水线。

## 失败处理

- `Agent` 工具调用抛错或 Explore 子代理报告失败 → 该维度缺失，按 SKILL.md 边界情况表问用户：仅就已有维度写报告 / 重跑 / 中止
