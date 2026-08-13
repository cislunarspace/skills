---
name: loop-go
description: /loop-go：循环派 builder 写代码、checker 跑检查直到全绿。说 "/loop-go <任务>" 或 "loop until green" 时使用。
argument-hint: "<任务：目标 + 验收标准>，如 '实现登录页并让所有检查通过'"
disable-model-invocation: true
---

# Loop Go

循环派 builder 写/修代码，checker 跑检查，直到全绿或停止规则命中。

## 前置条件

builder 和 checker 由 `/setup-claude-code`（Claude Code）或 `/setup-pi`（pi）定义。未加载时停步，提示切回主分支重跑对应 setup。

`.claude/` 不在 git 中——worktree 不会带 builder/checker。回到主工作目录跑 `/setup-claude-code`，worktree 共享主仓库的 `.claude/agents/`。

## 步骤

### 0. 对齐目标

把任务写成简报：目标、涉及文件、完成标准。没写完成标准就先问。同一份简报贯穿所有轮次。

### 1. 派 builder

用 Task 工具，`subagent_type: "builder"`，prompt 只放简报和本轮任务。等 builder 完成、拿到改动文件清单再往下。

### 2. 派 checker

用 Task 工具，`subagent_type: "checker"`，prompt 放同一份简报。等 checker 完成、拿到检查结果报告再往下。

报失败但无明细时让 checker 重跑，输出真实错误行。

### 3. 判定

- 全绿：展示 diff 和检查结果。
- 失败：把 checker 完整报告交给 builder，回到步骤 1。原始错误是 builder 定位根因的唯一线索。
- checker 找不到检查命令：停步，问用户项目实际用的检查命令。
- checker 超时或输出无法解析：按停止规则 6 终止。

## 轮次

每轮开始声明 `Cycle N/5`。最多 5 轮。

以下任一情况立即停止：

1. 全绿
2. 同一失败连续两轮出现（builder 在瞎猜，不是在修）
3. 修复引入回归——之前通过的检查失败（在拆东墙补西墙）
4. 第 5 轮仍未全绿——展示末轮改动和失败项
5. builder 违反红线：弱化测试、删除/注释/跳过失败检查、不跑检查就声称已修复
6. checker 无法产出有效报告：找不到检查命令、输出无法解析、连续超时

仓库 `CLAUDE.md` 或 `AGENTS.md` 内若有 setup 写入的 `## Loop 停止规则` 段，以仓库版本为准。

循环中用户插入新指令时暂停，处理后再决定继续。任务范围在循环中扩大时停步，问用户。

## pi 适配（pi harness 无内置 Task 工具）

pi 没有 Claude Code 的 Task/subagent 工具，用官方 `subagent` 扩展替代（每个子代理是一个独立 `pi` 进程，上下文隔离）。

前置（一次性）：

1. 安装 subagent 扩展：symlink 官方示例 `examples/extensions/subagent/` 的 `index.ts`、`agents.ts` 到 `~/.pi/agent/extensions/subagent/`。
2. 确认 `~/.pi/agent/agents/` 下有用户级 `builder.md`、`checker.md`（pi 版 agent，tools 用 pi 小写工具名；不锁模型，用 pi 默认模型）。

以上由 `/setup-pi` 统一安装；缺任何一项时提示先跑 `/setup-pi`。
pi 下的派发：

- 步骤 1（派 builder）：subagent 工具 single 模式，`agent: "builder"`，task 放简报和本轮任务。
- 步骤 2（派 checker）：subagent 工具 single 模式，`agent: "checker"`，task 放同一份简报。
- 步骤 3（判定）不变——checker 的最终输出即报告；失败时把完整报告塞进下一轮 builder 的 task。

项目级覆盖：`.pi/agents/builder.md`、`.pi/agents/checker.md` 覆盖用户级，需 `agentScope: "both"` 并确认。`.pi/agents/` 与 `.claude/agents/` 各自独立维护。
