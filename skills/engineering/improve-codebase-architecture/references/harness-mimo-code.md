# mimo code Harness 适配

improve-codebase-architecture 在 mimo code 里的工具映射。两维度走查与汇总写报告的边界见 `../SKILL.md`。

## 普通模式

第 1 步需要并行走查两个维度——派一个走查"目录组织"、一个走查"文件内部设计"，结果汇总后写报告。

- 工具：`actor`
- 操作：`run`（阻塞等结果）
- **优先用 `run`**；本 skill 是同步等两份结果再写报告，不是后台派出去
- `subagent_type: "general"`（默认，可读写；mimo code 无只读 Explore 等价类型，统一用 `general` 覆盖只读走查）
- 两个 `actor` 调用放在**同一个 message** 里并发发出——mimo code 会并发执行
- prompt 里只给这一条任务的透镜描述：要扫的项目约定（`AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`）、对应的子透镜列表、要返回的发现项字段；不塞完整调度计划

```
actor({ operation: { action: "run", subagent_type: "general", description: "目录组织走查", prompt: "..." } })
actor({ operation: { action: "run", subagent_type: "general", description: "文件内部设计走查", prompt: "..." } })
```

## 多阶段编排

本 skill 第 1 步只有一层（两个透镜并发），无需跨层编排。如果未来把每个透镜再细拆成多个子透镜、变成多层依赖，按 `dispatch` 的 mimo code 适配层推进：

- 工具：`workflow`
- 操作：`run`，传入 `script`（内联 JS）
- 原语：`agent()`、`parallel()`、`phase()`、`log()`
- 同一层任务用 `parallel()` 包；跨层用 `pipeline()` 或显式 `await` + `phase()`

```js
export const meta = { name: '<repo-architecture-review>', description: '<一句话>' }

phase('Walk')
const [dirFindings, fileFindings] = await parallel([
  () => agent('走查透镜一：目录组织 ...', { subagent_type: 'general' }),
  () => agent('走查透镜二：文件内部设计 ...', { subagent_type: 'general' }),
])

phase('Report')
log('汇总并写报告')
```

## 失败处理

| 情况 | 处理方式 |
|------|----------|
| `actor` 调用抛错或子代理报告失败 | 按 SKILL.md 边界情况表问用户 |
| 一个透镜失败、另一个成功 | 仅就成功的透镜写报告，并在报告里标注缺失维度 |
| `workflow` 中 `agent()` 返回 null | 该维度缺失，处理同上 |
| `workflow` 脚本抛异常 | 整个 run 失败，问用户是否重试 |
