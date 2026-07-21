# Kimi Code Harness 适配

dispatch 在 Kimi Code 里跑时的具体落地方式。SKILL.md 描述抽象行为，本文件描述工具调用。

## 普通模式

每条任务用一个 coder 子代理跑，多条任务在同一层并发派出去。

- 工具：`AgentSwarm`
- `subagent_type: "coder"`
- 不要设 `run_in_background`
- prompt 里只给这一条任务的内容：标题、改哪些文件、做什么、验收标准；**不要**塞完整调度计划

## ultracode 模式

Kimi Code 的 ultracode 等价模式（如有）如何映射到 dispatch，**待确认**。如果 Kimi Code 没有 `Workflow` 工具等价物，ultracode 模式下仍退化为 `AgentSwarm` 多层并发——这与 Claude Code 的 ultracode 路径不同，agent 在 Kimi Code 跑 dispatch 时自行判断。

## 失败处理

- `AgentSwarm` 调用抛错或子代理报告失败 → 该条任务失败，按 SKILL.md 边界情况表问用户