---
name: setup-ouyangjiahong-skills
description: 为仓库配齐工程技能环境：issue tracker、分诊标签、领域文档布局、Loop 三件套。工程技能首次使用前跑。
disable-model-invocation: true
---

# Setup ouyangjiahong's Skills

探索仓库现状，逐项与用户确认，然后写入配置文件。写入前先展示草稿让用户编辑。

## 步骤

### 1. 探索

读取已有配置（别假设）：

- `git remote -v` 和 `.git/config`——remote 指向 GitHub？GitLab？
- 根目录的 `CLAUDE.md`、`AGENTS.md`——存在哪个？有没有 `## Agent skills` 段落？
- `CONTEXT.md`、`CONTEXT-MAP.md`、`docs/adr/`、`*/*/docs/adr/`
- `docs/agents/`——本技能之前写过的文件？
- `.scratch/`——已在用本地 markdown issue tracker？
- `triage` 技能是否可用（旁边有目录，或技能列表里有）
- `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`——Loop 三件套已装？
- `~/.claude/agents/` 下是否已有同名 builder/checker
- Monorepo 信号：`pnpm-workspace.yaml`、`package.json` 的 `workspaces`。只有明确的大型多包仓库才是 monorepo，绝大部份不是。

### 2. 逐项确认

总结哪些已存在、哪些缺失。然后过各节——一节一结论再进下一节。每节先给推荐答案，让用户一个字就能接受。

---

**A——Issue tracker。** 默认选 GitHub（remote 指向 GitHub 时）、GitLab（remote 指向 GitLab 时）、或本地 markdown（`.scratch/` 约定）。提供：

- **GitHub**——`gh` CLI
- **GitLab**——`glab` CLI
- **本地 markdown**——`.scratch/<feature>/` 下存 issue 文件
- **其他**（Jira、Linear）——请用户描述工作流，用自由文本记录

写入 `docs/agents/issue-tracker.md`。

**B——分诊标签。** `triage` 不可用时整节跳过。

装了 `triage` 就只问：保留默认标签？（推荐：是）

默认五个标准角色，标签即为角色名：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。用户说否——通常因为 tracker 已有对应标签名——才逐个收集覆盖项。

写入 `docs/agents/triage-labels.md`。

**C——领域文档。** 默认单一上下文——根目录一份 `CONTEXT.md` + `docs/adr/`。直接写，不用问。

多上下文（根目录 `CONTEXT-MAP.md` 指向各上下文 `CONTEXT.md`）只在探索发现 monorepo 信号时才提。

写入 `docs/agents/domain.md`。

**D——Loop 三件套。** 把 builder agent、checker agent、loop-go 命令装进 `.claude/`。

- 默认：装。用户说否才跳过。
- `.claude/agents/` 下已有同名文件时：问用户是否覆盖。已有用户级 agent（`~/.claude/agents/`）时，说明项目级副本会在本仓库内覆盖它，问是否仍写入。

写入 `.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md`；在根文档加 `### Loop Engineering` 指针和 `## Loop 停止规则` 段。

`.claude/` 不在 git 中——worktree 不会自带 builder/checker。用户在主工作目录跑一次本技能后，worktree 自动共享 `.claude/agents/`。在 worktree 里跑 `/loop-go` 报缺 agent，就是回到主目录重跑本技能的信号。

---

### 3. 展示草稿

向用户展示即将写入的全部内容——各文件的正文。让用户在写入前编辑。

### 4. 写入

选编辑对象：
- `CLAUDE.md` 存在就编辑它；否则 `AGENTS.md` 存在就编辑它。两者都不存在，问用户。不要因为编辑了 `CLAUDE.md` 而额外创建 `AGENTS.md`（反之亦然）。
- 已编辑文件内含 `## Agent skills` 段时原地更新内容，追加该子块而非另起重复段。
- `### Loop Engineering` 子块、`## Loop 停止规则` 段已有则替换。

种子模板（位于本技能 `references/` 下）：

| 目标文件 | 种子模板 |
|---------|---------|
| `docs/agents/issue-tracker.md` | `issue-tracker-github.md` / `issue-tracker-gitlab.md` / `issue-tracker-local.md`（按 A 节选择）或从零写 |
| `docs/agents/triage-labels.md` | `triage-labels.md` |
| `docs/agents/domain.md` | `domain.md` |
| `.claude/agents/builder.md` | `builder.md` |
| `.claude/agents/checker.md` | `checker.md` |
| `.claude/commands/loop-go.md` | `loop-go-command.md` |

### 5. 完成

告知：哪些工程技能会读取这些文件；以后直接编辑 `docs/agents/*.md` 即可，只有换 issue tracker 或从头重来时才需重跑本技能。

装了 Loop 三件套时，告知 `/loop-go <任务>` 已可用；项目级 agent 覆盖同名的用户级 agent（仅在本仓库生效）。
