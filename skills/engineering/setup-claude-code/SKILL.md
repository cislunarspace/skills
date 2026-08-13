---
name: setup-claude-code
description: 配置 Claude Code harness：写 .claude/agents/ 的 builder/checker 与 /loop-go 命令。在 Claude Code 下使用 Loop 工程技能时手动运行。
disable-model-invocation: true
---

为当前仓库配置 Claude Code harness 下工程技能（loop-go 等）所需的文件：`.claude/agents/builder.md`、`.claude/agents/checker.md` 和 `.claude/commands/loop-go.md`。只写取得用户确认的文件。

## 1. 探索

读取，不要假设：

- `which claude`：Claude Code 不可用时提示先装或跳过本 skill。
- 项目 `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md` 是否存在。
- `~/.claude/agents/` 中是否已有同名用户级 agent，项目级副本只在当前仓库覆盖它，要向用户说明。
- 根目录 `CLAUDE.md`、`AGENTS.md` 是否已有 `### Loop Engineering` 或 `## Loop 停止规则`。

## 2. 决策

总结现状和缺口，逐项给出推荐，让用户接受、修改或跳过；每项结论确认后再进入下一项。

### A. 项目级

写入 `.claude/agents/builder.md`、`.claude/agents/checker.md`（模板见 `references/builder.md`、`checker.md`）和 `.claude/commands/loop-go.md`（模板见 `references/loop-go-command.md`）。已存在时询问是否覆盖。

`.claude/` 通常不随 worktree 出现；worktree 缺少 Loop agent 时，回主工作目录重跑本 skill。

### B. 共享段

根文档缺 `### Loop Engineering` 或 `## Loop 停止规则` 时，提示跑 `/setup-ouyangjiahong-skills` 补（它管两 harness 共享的配置）；用户不想跑时说明 `/loop-go` 有内置停止规则兜底。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `.claude/agents/builder.md` | `builder.md` |
| `.claude/agents/checker.md` | `checker.md` |
| `.claude/commands/loop-go.md` | `loop-go-command.md` |

得到确认后才写入。

## 4. 写入与结束

- 写入上述文件（已存在时先询问是否覆盖）。
- 完成后说明：`/loop-go <任务>` 可用，builder/checker 通过 Task 工具派发。
