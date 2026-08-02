---
description: 循环运行 builder 和 checker，直到所有检查通过
argument-hint: <task>
allowed-tools: Read, Grep, Glob, Bash, Task
model: sonnet
---

以循环方式执行此任务：$ARGUMENTS

## 第 0 步：对齐目标

写一行任务简报：目标、涉及文件、完成标准。
这一行会传给 builder 和 checker，确保三者对齐。

## 循环

1. 派 builder 实现任务（或修复上一轮的失败）。
2. 派 checker 运行所有检查。
3. 如果 checker 说 ALL GREEN：停止，向我展示 diff 和检查结果。
4. 如果 checker 说 FAILED：把 checker 的完整失败报告原样转发给 builder，
   不要自己解读或过滤。builder 需要原始错误信息来定位根因。
5. 回到第 1 步。

## 轮次管理

- 最多 5 轮。每轮开始时公开声明 "Cycle N/5"。
- 如果同一失败连续出现两次，停止循环。builder 可能在瞎猜，
  不是在修复。把情况报告给我。
- 如果修复导致之前通过的检查失败，停止循环。在拆东墙补西墙。

停止条件在仓库根文档（`CLAUDE.md` 或 `AGENTS.md`）的 `## Loop 停止规则` 段中。严格遵循。