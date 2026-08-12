---
name: setup-ouyangjiahong-skills
description: 初始化仓库的 issue tracker、分诊标签、领域文档。首次配置工程技能时手动运行。
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

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `docs/agents/issue-tracker.md` | `issue-tracker-github.md`、`issue-tracker-gitlab.md`、`issue-tracker-local.md` 或从零写 |
| `docs/agents/triage-labels.md` | `triage-labels.md` |
| `docs/agents/domain.md` | `domain.md` |

得到确认后才写入。

## 4. 写入与结束

- 写入 `docs/agents/` 三个文件（或用户确认的覆盖项）。
- Loop 工具不在本 skill 范围：Claude Code 跑 `/setup-claude-code`（`.claude/agents/` 与 loop-go 命令），pi 跑 `/setup-pi`（piw/piw-clean 命令与 subagent）。
- 完成后说明哪些工程技能会读取 `docs/agents/*.md`，以及下一步按 harness 跑对应的 setup skill。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 无 `docs/` 目录 | 创建 `docs/agents/` |
| `docs/agents/` 已有部分文件 | 保留已有内容，只补缺口；同主题文件询问覆盖 |
| `triage` 不可用 | 跳过 B，说明没有分诊标签的后果 |
| 用户实际只用 pi / 只用 Claude Code | 本 skill 照常跑（A/B/C 与 harness 无关），再按需跑对应 setup |

## Checkpoint

停下来问用户：

1. 每项决策的取舍（tracker 选择、标签覆盖项、monorepo 布局）。
2. 覆盖已有的 `docs/agents/` 文件。
3. 任务范围超出上述各项。

其他情况：做完再汇报。

## 完成条件

- `docs/agents/issue-tracker.md`、`triage-labels.md`、`domain.md` 就位（或用户明确跳过的项）。
- 已向用户说明后续按 harness 跑 `/setup-claude-code` 或 `/setup-pi`。
