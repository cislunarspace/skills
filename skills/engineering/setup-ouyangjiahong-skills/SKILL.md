---
name: setup-ouyangjiahong-skills
description: 初始化仓库的 issue tracker、分诊标签、领域文档和 Loop 停止规则。首次配置工程技能时手动运行。
disable-model-invocation: true
---

为当前仓库建立工程技能的 harness 无关配置（issue tracker、分诊标签、领域文档）。Loop 工具按 harness 拆分：Claude Code 用 `/setup-claude-code`，pi 用 `/setup-pi`。先读取现状，再逐项取得用户结论；只在用户确认后写入。

## 1. 探索

读取，不要假设：

- `git remote -v` 和 `.git/config`，判断 GitHub、GitLab 或其他托管方式。
- 根目录 `CLAUDE.md`、`AGENTS.md`，以及其中的 `## Agent skills`。
- `CONTEXT.md`、`CONTEXT-MAP.md`、`docs/adr/`、`*/*/docs/adr/`、`docs/agents/`、`.scratch/`。
- `triage` skill 是否可用。
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

### D. Loop 停止规则

向根文档写入 `### Loop Engineering` 指针和 `## Loop 停止规则`（两 harness 共享同一段，模板见 `references/loop-stop-rules.md`）。已有同名节时替换对应内容，避免重复。

Loop 工具文件（builder、checker、loop-go 命令）按 harness 各自安装：pi 用 `/setup-pi`，Claude Code 用 `/setup-claude-code`。本 skill 不写这些文件。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `docs/agents/issue-tracker.md` | `issue-tracker-github.md`、`issue-tracker-gitlab.md`、`issue-tracker-local.md` 或从零写 |
| `docs/agents/triage-labels.md` | `triage-labels.md` |
| `docs/agents/domain.md` | `domain.md` |
| 根文档 `## Loop 停止规则` | `loop-stop-rules.md` |

得到确认后才写入。

## 4. 写入与结束

- 优先编辑 `CLAUDE.md`，否则编辑 `AGENTS.md`；两者都不存在时询问用户。不要额外创建另一份。
- 已有 `## Agent skills` 时在其中更新；已有 `### Loop Engineering` 或 `## Loop 停止规则` 时替换对应内容，避免重复。
- 完成后说明哪些工程技能会读取 `docs/agents/*.md`；Loop 工具文件（builder/checker/loop-go）用 `/setup-pi`（pi）或 `/setup-claude-code`（Claude Code）安装。
