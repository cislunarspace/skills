---
name: setup-claude-code
description: 初始化 Claude Code 的 Loop 工具（builder/checker agents 与 loop-go 命令）。配合 setup-ouyangjiahong-skills 使用。
disable-model-invocation: true
---

为当前仓库配置 Claude Code 的 Loop 工具。先读取现状，再逐项取得用户结论；只在用户确认后写入。

## 1. 探索

读取，不要假设：

- `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`，以及 `~/.claude/agents/` 中的同名 agent。
- 根文档 `CLAUDE.md`、`AGENTS.md` 是否已有 `### Loop Engineering` / `## Loop 停止规则`。

## 2. 决策

先总结现状和缺口，给出推荐让用户接受、修改或跳过；结论确认后再写入。

### A. Loop 工具

默认安装 builder、checker 和 loop-go。项目目录已有同名文件时询问是否覆盖；用户级 agent 已存在时，说明项目级副本只在当前仓库覆盖它。

写入 `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`，并向根文档写入 `### Loop Engineering` 指针和 `## Loop 停止规则`。

`.claude/` 通常不随 worktree 出现；worktree 缺少 Loop agent 时，回主工作目录重跑本 skill。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `.claude/agents/builder.md` | `builder.md` |
| `.claude/agents/checker.md` | `checker.md` |
| `.claude/commands/loop-go.md` | `loop-go-command.md` |
| 根文档 `### Loop Engineering` / `## Loop 停止规则` | `loop-stop-rules.md` |

得到确认后才写入。

## 4. 写入与结束

- 优先编辑 `CLAUDE.md`，否则编辑 `AGENTS.md`；两者都不存在时询问用户。不要额外创建另一份。
- 已有 `## Agent skills` 时在其中更新；已有 `### Loop Engineering` 或 `## Loop 停止规则` 时替换对应内容，避免重复。
- 完成后说明：已安装时 `/loop-go <任务>` 可用；pi harness 的 Loop 工具由 `/setup-pi` 配置。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 项目无 `.claude/` 目录 | 创建；`.claude/` 不随 worktree 出现，worktree 中缺 agent 时回主工作目录重跑 |
| `.claude/agents/` 已有同名文件 | 询问覆盖；拒绝则跳过对应文件 |
| 根文档两者都不存在 | 询问用户写哪份，不自行创建第二份 |
| 用户用 pi 而非 Claude Code | 改用 `/setup-pi`，本 skill 可跳过 |

## Checkpoint

停下来问用户：

1. 覆盖已有 `.claude/agents/` 或 `.claude/commands/` 文件。
2. 根文档选择（`CLAUDE.md` / `AGENTS.md`）不明确时。
3. 任务范围超出上述各项。

其他情况：做完再汇报。

## 完成条件

- `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md` 就位。
- 根文档有 `### Loop Engineering` 指针与 `## Loop 停止规则`，且不重复。
