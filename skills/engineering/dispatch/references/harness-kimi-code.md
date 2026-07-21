# Kimi Code Harness 适配

本文规定 dispatch 在 Kimi Code 中调用子代理的方式。任务分层、层间推进和验证收尾见 `../SKILL.md`。

## 逐层执行

每层必须收齐全部任务的结果，再进入下一层。

- 同层有两项或以上任务：调用 `AgentSwarm`，使用 `subagent_type: "coder"`
- 同层只有一项任务：调用 `Agent`，使用 `subagent_type: "coder"`
- `coder` 是 Kimi Code 默认的可读写工程子代理，调用时显式传入
- 同层任务放进同一个 `AgentSwarm`；该调用必须是当前响应中唯一的工具调用
- 每个 item 只包含对应任务的标题、文件、工作内容和验收标准，不传完整调度计划
- 单任务使用前台 `Agent`，不设 `run_in_background`

## 多阶段编排

用户可以用 `/swarm on|off` 切换会话级 swarm mode，也可以用 `/swarm <task>` 针对一个任务启用。无论会话是否处于 swarm mode，dispatch 都按层推进：

1. 用 `AgentSwarm` 并发执行当前层；单任务层使用 `Agent`
2. 收齐结果，检查每项任务的错误和测试状态
3. 当前层通过后，再调用下一层

`/goal <objective>` 负责跨 turn 持续推进目标，不改变上述层内并发和层间验证方式。

## 失败处理

- 收到 `AgentSwarm` 汇总结果后，逐项检查是否成功及测试是否通过
- 工具调用失败或子代理报告失败时，不执行依赖它的下一层；按 `../SKILL.md` 询问用户重试、跳过还是中止
