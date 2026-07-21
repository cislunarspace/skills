# mimo code Harness 适配

dispatch 在 mimo code 里的工具映射。

## 普通模式

每条任务一个 `actor` 子代理，同一层的多个调用放在同一个 message 里并发发出。

- 工具：`actor`
- 操作：`run`（阻塞等结果）或 `spawn`（立即返回，后台执行）
- **dispatch 优先用 `run`**；若用 `spawn`，必须在同层显式调用 `wait` 收齐结果后再进下一层——否则层间屏障失效
- `subagent_type: "general"`（默认，可读写）
- prompt 只给这一条任务的内容，不塞完整调度计划

```
actor({ operation: { action: "run", subagent_type: "general", description: "任务A", prompt: "..." } })
actor({ operation: { action: "run", subagent_type: "general", description: "任务B", prompt: "..." } })
```

## 多阶段编排

用 `workflow` 脚本把多层 dispatch 写成一个执行流，显式控制阶段和屏障。

- 工具：`workflow`
- 操作：`run`，传入 `script`（内联 JS）或 `name`（已保存的 workflow）
- 原语：`agent()`、`parallel()`、`pipeline()`、`phase()`、`log()`
- 同一层的任务用 `parallel()` 包；跨层用 `pipeline()` 或显式 `await` + `phase()`

```js
export const meta = { name: '<dispatch-主题>', description: '<一句话>' }

phase('Level 0')
const [a, b] = await parallel([
  () => agent('任务A prompt', { subagent_type: 'general' }),
  () => agent('任务B prompt', { subagent_type: 'general' }),
])

phase('Level 1')
await agent(`基于 A 的结果: ${a}，执行任务C`, { subagent_type: 'general' })

phase('Verify')
log('全部完成')
```

## 失败处理

| 情况 | 处理方式 |
|------|----------|
| `actor` 调用抛错或子代理报告失败 | 按 SKILL.md 边界情况表问用户 |
| `workflow` 中 `agent()` 返回 null | 该条任务失败，按 SKILL.md 边界情况表问用户重试、跳过还是中止 |
| `workflow` 脚本抛异常 | 整个 run 失败，问用户是否重试 |
