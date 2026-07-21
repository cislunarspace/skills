---
name: dispatch
description: 把一组任务按依赖关系分层，然后并行调用多个 Agent 子代理逐层执行。当用户说"dispatch"、"并行执行任务"，或传入计划文件、issue 编号要求并行调度时使用。
argument-hint: "计划文件路径、issue 编号（如 #N），或 'latest'"
---

# Dispatch

把计划或 issue 拆成任务，按依赖关系排好执行顺序，再一层层并行执行。

## 步骤

### 1. 识别来源，提取任务

参数决定任务来源：

- 文件路径 → 直接读文件
- `#N` → 用 `gh issue view N` 取 GitHub issue
- `latest` 或空 → 在当前会话里找最近的计划/handoff 文件（`*.plan.md`、`PLAN.md`、`handoff-*.md`）

读来源后，拆成独立任务。每个任务需要：

- 标题
- prompt：要改的文件、做什么、验收标准
- 依赖关系：哪些任务必须先完成

不同来源的拆法：

| 来源 | 拆法 |
|------|------|
| GitHub issue | 每个 issue 一个任务；用 `gh issue view <N> --json body` 取正文；issue 里的 `blocked-by` 转成依赖 |
| 计划文件 | `##` / `###` 标题即任务，标题下方的要点即 prompt |
| Handoff 文件 | 从 issue 引用、依赖图、"下一步建议" 里提取任务 |

### 2. 编排层级

按依赖关系分层：Level 0 的任务没有依赖，可以并行；Level N 的任务依赖 Level N-1 的任务。

先把调度计划展示给用户，等确认后再执行：

```
调度计划：
Level 0（并行）：#N1, #N2
Level 1（等待 #N1）：#N3
Level 2（等待全部）：验证
```

### 3. 扇出执行

逐层并发派子代理。**抽象行为**：

- 每层内部，所有无依赖的任务**同时**派出去；任何 harness 都要并行而非串行
- 每个子代理只拿到自己的任务切片（要改的文件、做什么、验收标准），不要把完整调度计划塞给它
- 子代理的产出是该任务的修改/汇报，dispatch 收齐再进下一层

具体怎么调子代理、怎么并发，每个 harness 不同——见末尾"多 harness 适配"。

每层执行完，逐个检查结果：

- 成功了吗？
- 有没有错误？
- 测试通过了吗？

失败的任务向用户报告，询问：重试、跳过，还是中止？层与层之间汇报一次进度。

### 4. 验证收尾

所有层级完成后，跑项目测试套件和类型检查，然后汇报：

- 完成任务数
- 失败任务数
- 测试状态
- 需要人工处理的问题

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 来源文件为空或没有任务 | 不调度，直接告诉用户 |
| 任务之间循环依赖 | 报错，请用户打破循环 |
| 单个任务失败 | 问用户：重试 / 跳过 / 中止 |
| 所有任务互相独立 | 全部放到同一层并行，跳过层级编排 |
| 不知道测试命令 | 问用户用什么命令跑测试 |

## 多 harness 适配

dispatch 的抽象行为（按依赖分层、并行派子代理、层间推进、验证收尾）在所有 harness 都一样。**具体怎么调子代理**因 harness 而异，按当前运行的 harness 读对应文件：

- [Claude Code（含 ultracode 模式）](./references/harness-claude-code.md)
- [Kimi Code](./references/harness-kimi-code.md)
- [mimo code](./references/harness-mimo-code.md)（预留，待补）
- [zcode](./references/harness-zcode.md)（预留，待补）
