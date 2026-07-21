# zcode Harness 适配

dispatch 在 zcode 里跑时的具体落地方式。SKILL.md 描述抽象行为，本文件描述工具调用。

## 调度方式

每条任务用一个 Agent 子代理跑，多条任务在同一层并发派出去。

- 工具：`Agent`
- `subagent_type: "general-purpose"`（默认，可执行读写）
- 同一层内的多个 `Agent` 调用放在**同一个 message** 的多个 tool use 里发出——zcode 会并发执行
- **不要**设 `run_in_background: true`——dispatch 是层间同步等结果，不是后台派出去
- prompt 里只给这一条任务的内容：标题、改哪些文件、做什么、验收标准；**不要**塞完整调度计划

## 多阶段编排

zcode 没有 `Workflow` 工具等价物；不支持 ultracode 等价模式。所有调度都按"调度方式"一节执行——逐层并发派 Agent，无显式屏障与流水线。

## 失败处理

- `Agent` 工具调用抛错或子代理报告失败 → 该条任务失败，按 SKILL.md 边界情况表问用户
