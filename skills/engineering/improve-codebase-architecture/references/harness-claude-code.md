# Claude Code Harness 适配

improve-codebase-architecture 在 Claude Code 里跑时的具体落地方式。SKILL.md 描述抽象行为，本文件描述工具调用。

第 2 步写 HTML 报告、第 3 步调 `/to-issues` 的工具用法不依赖特定子代理类型，按 SKILL.md 走即可。

## 普通模式

第 1 步需要两个 Explore 子代理并行走查两个维度——派一个走查"目录组织"、一个走查"文件内部设计"，结果汇总后写报告。

- 工具：`Agent`
- `subagent_type: "Explore"`（只读搜索代理，对两个维度都够用）
- 两个 `Agent` 调用放在**同一个 message** 的多个 tool use 里发出——Claude Code 会并发执行
- **不要**设 `run_in_background: true`——improve-codebase-architecture 是同步等两份结果再写报告，不是后台派出去
- prompt 里只给这一条任务的透镜描述：要扫的项目约定（`AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`）、对应的子透镜列表、要返回的发现项字段；**不要**塞完整调度计划

两个子代理的 prompt 模板：

- 透镜一（目录组织）：传"分层与边界、依赖方向、co-location、命名一致、碎片与膨胀、孤儿与死目录"六个子透镜，要求返回带 `位置 / 问题 / 建议 / 严重程度 / 依据` 的发现项清单
- 透镜二（文件内部设计）：传"模块深度、过度工程、职责聚焦、风格一致、可测试性、依赖、概念与命名、死代码与陈旧注释"八个子透镜，要求同样格式的清单

## ultracode 模式

当 Claude Code 处于 ultracode 模式（用户在提示里包含 "ultracode" 关键字，或 session 默认开启），调度模式升级：

- 工具：`Workflow`
- 传入 `script`，内联 JS，调用 `agent()` / `parallel()` / `phase()` 等原语
- `meta` 块：`{ name, description, phases: [...] }`，纯字面量
- 两个 Explore 透镜对应两个 `agent()` 调用，用 `parallel()` 包起来
- 汇总后写报告这一步不一定要进 Workflow——可以把两份结果带回主循环，再走 SKILL.md 第 2 步的 HTML 落地

模板：

```js
export const meta = {
  name: '<repo-architecture-review>',
  description: '<一句话>',
  phases: [
    { title: '目录组织走查' },
    { title: '文件内部设计走查' },
  ],
}

// 两个 Explore 并发
const [dirFindings, fileFindings] = await parallel([
  () => agent('走查透镜一：目录组织 ...', { subagent_type: 'Explore' }),
  () => agent('走查透镜二：文件内部设计 ...', { subagent_type: 'Explore' }),
])
```

详细原语见 Claude Code harness 文档。

## 失败处理

- `Agent` 工具调用抛错或 Explore 子代理报告失败 → 该维度缺失，按 SKILL.md 边界情况表问用户：仅就已有维度写报告 / 重跑 / 中止
- `Workflow` 脚本里某个 `agent()` 返回 null → 该维度缺失，处理同上
