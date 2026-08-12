---
name: setup-ouyangjiahong-skills
description: 初始化仓库的 issue tracker、分诊标签、领域文档和 Loop 工具。首次配置工程技能时手动运行。
disable-model-invocation: true
---

为当前仓库建立工程技能所需配置。先读取现状，再逐项取得用户结论；只在用户确认后写入。

## 1. 探索

读取，不要假设：

- `git remote -v` 和 `.git/config`，判断 GitHub、GitLab 或其他托管方式。
- 根目录 `CLAUDE.md`、`AGENTS.md`，以及其中的 `## Agent skills`。
- `CONTEXT.md`、`CONTEXT-MAP.md`、`docs/adr/`、`*/*/docs/adr/`、`docs/agents/`、`.scratch/`。
- `triage` skill 是否可用。
- `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`，以及 `~/.claude/agents/` 中的同名 agent。
- pi 可用性（`which pi`）：`~/.pi/agent/extensions/subagent/` 是否已装、`~/.pi/agent/agents/` 中的 builder/checker，以及项目 `.pi/agents/builder.md`、`.pi/agents/checker.md`。
- `pnpm-workspace.yaml` 与 `package.json` 的 `workspaces`，判断是否为明确的大型 monorepo。

## 2. 决策

先总结现状和缺口。按以下顺序逐项给出推荐，让用户接受、修改或跳过；每项结论确认后再进入下一项。

### A. Issue tracker

GitHub remote 默认 GitHub（`gh`），GitLab remote 默认 GitLab（`glab`），已采用 `.scratch/` 时默认本地 Markdown。其他 tracker 让用户说明工作流。

写入 `docs/agents/issue-tracker.md`。

### B. 分诊标签

只有 `triage` 可用时配置。默认保留：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`；用户拒绝默认值时，再收集覆盖项。

写入 `docs/agents/triage-labels.md`。

### C. 领域文档

默认单一上下文：根目录 `CONTEXT.md` 与 `docs/adr/`。只有发现明确 monorepo 信号时才讨论 `CONTEXT-MAP.md` 和多上下文布局。

写入 `docs/agents/domain.md`。

### D. Loop 工具

默认安装 builder、checker 和 `loop-go`。项目目录已有同名文件时询问是否覆盖；用户级 agent 已存在时，说明项目级副本只在当前仓库覆盖它。

- **Claude Code**：写入 `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`。
- **pi**（检测到 `pi` 且已装 subagent 扩展时）：写入 `.pi/agents/builder.md`、`.pi/agents/checker.md`（不锁模型，用 pi 默认模型）。pi 的 subagent 工具默认只加载用户级 agents（`~/.pi/agent/agents/`），项目级覆盖需 `agentScope: "both"`；未装扩展时提示先装（symlink 官方示例 `examples/extensions/subagent/` 或仓库内 `npm run link:pi`），或跳过 pi 部分。

并向根文档写入 `### Loop Engineering` 指针和 `## Loop 停止规则`（两 harness 共享同一段）。

`.claude/` 通常不随 worktree 出现；worktree 缺少 Loop agent 时，回主工作目录重跑本 skill。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `docs/agents/issue-tracker.md` | `issue-tracker-github.md`、`issue-tracker-gitlab.md`、`issue-tracker-local.md` 或从零写 |
| `docs/agents/triage-labels.md` | `triage-labels.md` |
| `docs/agents/domain.md` | `domain.md` |
| `.claude/agents/builder.md` | `builder.md` |
| `.claude/agents/checker.md` | `checker.md` |
| `.claude/commands/loop-go.md` | `loop-go-command.md` |
| `.pi/agents/builder.md`（pi 可用时） | `builder-pi.md` |
| `.pi/agents/checker.md`（pi 可用时） | `checker-pi.md` |

得到确认后才写入。

## 4. 写入与结束

- 优先编辑 `CLAUDE.md`，否则编辑 `AGENTS.md`；两者都不存在时询问用户。不要额外创建另一份。
- 已有 `## Agent skills` 时在其中更新；已有 `### Loop Engineering` 或 `## Loop 停止规则` 时替换对应内容，避免重复。
- pi 可用时写 `.pi/agents/builder.md`、`.pi/agents/checker.md`（已存在时先询问是否覆盖）。
- 完成后说明哪些工程技能会读取 `docs/agents/*.md`，以及已安装时 `/loop-go <任务>` 可用。
