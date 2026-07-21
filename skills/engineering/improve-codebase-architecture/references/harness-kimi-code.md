# Kimi Code Harness 适配

improve-codebase-architecture 在 Kimi Code 中调用子代理的方式。两维度走查与汇总写报告的边界见 `../SKILL.md`。

## 普通模式

第 1 步需要并行走查两个维度——派一个走查"目录组织"、一个走查"文件内部设计"，结果汇总后写报告。

- 同层有两项任务（两个透镜）：调用 `AgentSwarm`，使用 `subagent_type: "coder"`
- 单任务层（如未来拆细粒度后）：调用 `Agent`，使用 `subagent_type: "coder"`
- Kimi Code 默认的可读写子代理是 `coder`；本 skill 两个透镜都是只读走查，仍统一用 `coder`，Kimi Code 没有只读 Explore 等价类型
- 两个透镜任务放进同一个 `AgentSwarm`；该调用必须是当前响应中唯一的工具调用
- 每个 item 只包含对应透镜的描述：要扫的项目约定（`AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`）、对应的子透镜列表、要返回的发现项字段；不传完整调度计划

## 多阶段编排

Kimi Code 无 ultracode 等价模式；本 skill 第 1 步只有一层（两个透镜并发），无需跨层编排。

如果未来把每个透镜再细拆成多个子透镜、变成多层依赖，按 `dispatch` 的 Kimi Code 适配层推进：用 `AgentSwarm` 跑每层，收齐结果再进下一层。

用户可以用 `/swarm on|off` 切换会话级 swarm mode，也可以用 `/swarm <task>` 针对一个任务启用。无论会话是否处于 swarm mode，本 skill 都按层推进：

1. 用 `AgentSwarm` 并发执行两个透镜
2. 收齐结果，汇总后写 HTML 报告
3. 报告写好后问用户下一步

`/goal <objective>` 负责跨 turn 持续推进目标，不改变上述层内并发和层间验证方式。

## 失败处理

- 收到 `AgentSwarm` 汇总结果后，逐项检查是否成功
- 一个透镜失败、另一个成功 → 仅就成功的透镜写报告，并在报告里标注缺失维度；按 `../SKILL.md` 询问用户
- 整个 `AgentSwarm` 调用失败 → 询问用户重试、跳过还是中止
