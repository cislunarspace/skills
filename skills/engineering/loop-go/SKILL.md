---
name: loop-go
description: 循环运行 builder 和 checker 两个 agent，直到所有检查通过。当用户输入 /loop-go 并给出任务，或说"循环构建直到通过"、"loop until green"时使用。
argument-hint: "<任务：目标 + 验收标准>，如 '实现登录页并让所有检查通过'"
disable-model-invocation: true
---

# Loop Go

循环运行 builder（写/修代码）和 checker（跑全部检查）两个 agent，直到所有检查通过或循环按停止规则终止。

## 核心行为

1. 把任务写成一行简报：目标、涉及文件、完成标准。
2. 派 builder 实现或修复。
3. 派 checker 运行所有检查。
4. 全绿就停；有失败就把失败报告原样交给 builder，再来一轮。
5. 最多 5 轮。

任务内容 = `/loop-go` 后传入的参数。参数为空时，从会话上下文取最近的计划、issue 或失败报告，先与用户确认任务目标和验收标准。

## 依赖

本技能不包含 builder 和 checker 的定义。它们由 `/setup-ouyangjiahong-skills`（D 节）安装到 `~/.claude/agents/`（用户级）或当前仓库 `.claude/agents/`（项目级，随仓库提交）。两者都会被加载，同名时项目级优先。

当前环境没有这两个 agent 时，停下，提示先跑 `/setup-ouyangjiahong-skills`，不要凭空构造子代理。

## 步骤

### 0. 对齐目标

把任务写成一行简报：目标、涉及文件、完成标准。没有完成标准就先问用户。简报传给 builder 和 checker，确保三者对齐。

### 1. 派 builder

用 Task 工具，`subagent_type: "builder"`，prompt 只放这一轮简报（实现任务或修复上一轮失败）。等它带回改动。参照 `dispatch/references/harness-claude-code.md` 的普通模式写法（Agent 工具、同步等结果、不用 `run_in_background`），调子代理时 prompt 只放任务内容，不塞完整调度计划。

### 2. 派 checker

用 Task 工具，`subagent_type: "checker"`，prompt 放同一份简报，要求跑全部检查并回报。等它带回报告。

### 3. 判定

- checker 报 ALL GREEN：停止，展示 diff 和检查结果。
- checker 报 FAILED：把完整失败报告原样转发给 builder，回到步骤 1。不要自己解读或过滤——builder 需要原始错误信息定位根因。
- 无有效报告：按边界情况表处理。

## 轮次管理

- 最多 5 轮。每轮开始时公开声明 `Cycle N/5`。
- 同一失败连续出现两次：停止。builder 可能在瞎猜，不是在修复。
- 修复导致之前通过的检查失败：停止。在拆东墙补西墙。

## 停止规则

循环在以下任一情况停止：

1. 所有检查通过（checker 报 ALL GREEN）。
2. 达到 5 轮上限，仍未全绿。
3. 同一失败连续出现两次。
4. 修复引入回归（之前通过的检查失败）。
5. builder 违反红线（弱化测试、删除/注释/跳过失败检查、未跑检查就声称已修复）。
6. checker 无法产出有效报告（找不到检查命令、输出无法解析、连续超时）。

仓库的 `CLAUDE.md` 或 `AGENTS.md` 若有 `/setup-ouyangjiahong-skills` 写入的 `## Loop 停止规则` 段，以仓库版本为准（内容比本技能更完整，含红线和升级协议）。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| builder / checker agent 未定义 | 停下，提示先跑 `/setup-ouyangjiahong-skills` |
| 参数为空或没有完成标准 | 停下，问用户任务目标和验收标准 |
| checker 报 FAILED 但无失败明细 | 让 checker 重跑一次，输出真实错误行的关键行 |
| checker 找不到检查命令 | 停下，问用户项目实际用什么命令检查 |
| 第 5 轮仍 FAILED | 停止，报告最后一轮改动与失败项 |
| 循环中用户插入新指令 | 暂停循环，处理指令后再决定是否继续 |
| 任务范围在循环中扩大 | 停下，问用户是否继续 |

## Checkpoint

- 每次循环终止（成功或失败）都停下汇报，不自行重开。
- 连续 2 轮未变绿时，向用户播报当前轮次和失败项。
- 用户说停就停。

## 完成条件

- checker 报 ALL GREEN，且 diff 与检查结果已展示。
- 或循环按停止规则终止，且轮次、失败项、最后一次改动已如实汇报。
