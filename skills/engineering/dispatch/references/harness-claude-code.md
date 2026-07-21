# Claude Code Harness 适配

dispatch 在 Claude Code 里跑时的具体落地方式。SKILL.md 描述抽象行为，本文件描述工具调用。

## 普通模式

每条任务用一个 Agent 子代理跑，多条任务在同一层并发派出去。

- 工具：`Agent`
- `subagent_type: "general-purpose"`（默认，可执行读写）
- 同一层内的多个 `Agent` 调用放在**同一个 message** 的多个 tool use 里发出——Claude Code 会并发执行
- **不要**设 `run_in_background: true`——dispatch 是层间同步等结果，不是后台派出去
- prompt 里只给这一条任务的内容：标题、改哪些文件、做什么、验收标准；**不要**塞完整调度计划

## ultracode 模式

当 Claude Code 处于 ultracode 模式（用户在提示里包含 "ultracode" 关键字，或 session 默认开启），调度模式升级：

- 工具：`Workflow`
- 传入 `script`，内联 JS，调用 `agent()` / `parallel()` / `pipeline()` / `phase()` 等原语
- `meta` 块：`{ name, description, phases: [...] }`，纯字面量
- 每条 dispatch 任务对应一个 `agent()` 调用；同一层的多个 `agent()` 用 `parallel()` 包起来
- 跨层依赖用 `pipeline()` 串接（无 barrier）或显式 `await agent()` 后再 `phase()` 下一组

模板：

```js
export const meta = {
  name: '<dispatch-主题>',
  description: '<一句话>',
  phases: [
    { title: 'Level 0' },
    { title: 'Level 1' },
    { title: 'Verify' },
  ],
}

// 在这里写编排：phase、agent、parallel、pipeline
```

### prompt 构造规则

`agent()` 的第一个参数**必须是字符串**。任务从来源拆出后通常表示为对象（含 title、files、work、criteria 等字段），构造 prompt 时要把字段**逐个提取**拼成字符串，**不要**把对象整体传入或在模板字面量中引用对象变量——JS 隐式 toString 会产生 `[object Object]`，子代理收到的就不是任务内容了。

```js
// ✅ 正确：逐字段提取拼成字符串
const prompt = [
  `标题: ${task.title}`,
  `文件: ${task.files.join(', ')}`,
  `工作内容: ${task.work}`,
  `验收标准: ${task.criteria}`,
].join('\n')
await agent(prompt, opts)

// ❌ 错误：对象整体传入 → 子代理收到 "[object Object]"
await agent(task, opts)

// ❌ 错误：模板字面量引用对象 → 子代理收到 "执行: [object Object]"
await agent(`执行: ${task}`, opts)
```

详细原语见 Claude Code harness 文档。

## 失败处理

- `Agent` 工具调用抛错或子代理报告失败 → 该条任务失败，按 SKILL.md 边界情况表问用户
- `Workflow` 脚本里某个 `agent()` 返回 null → 该条任务失败；如果整个流水线中断，问用户是继续还是中止