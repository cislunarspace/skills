---
name: setup-ouyangjiahong-skills
description: 为当前仓库配置 issue tracker、分诊标签词汇、领域文档布局。在其他工程技能首次使用前跑一次。
disable-model-invocation: true
---

# Setup ouyangjiahong's Skills

为工程技能搭好它们假定的每仓库配置：

- **Issue tracker** —— issue 存放在哪里（默认 GitHub；也支持本地 markdown）
- **分诊标签** —— 五个标准分诊角色用的标签字符串
- **领域文档** —— `CONTEXT.md` 和 ADR 放在哪，以及读取它们的规则

这是一个交互式技能，不是确定性脚本。探索仓库、展示发现、与用户确认，然后写入。

## 步骤

### 1. 探索

查看当前仓库，读取已有配置——别假设：

- `git remote -v` 和 `.git/config`：是 GitHub 仓库吗？哪个？
- 仓库根目录的 `AGENTS.md` 和 `CLAUDE.md`：存在吗？里面有没有 `## Agent skills` 段落？
- 仓库根目录的 `CONTEXT.md` 和 `CONTEXT-MAP.md`
- `docs/adr/` 和任何 `src/*/docs/adr/` 目录
- `docs/agents/`：本技能之前的产出已存在吗？
- `.scratch/`：说明已在使用本地 markdown issue tracker 约定
- 装了 `triage` 技能吗？（旁边有个 `triage` 技能目录，或你的可用技能里有 `triage`。）这决定 B 节是否运行。
- Monorepo 信号——`pnpm-workspace.yaml`、`package.json` 里的 `workspaces` 字段，或一个有自己 `src/` 的 `packages/*`。只有真正大型多包仓库才提；没有就是单一上下文，绝大多数仓库都是。

### 2. 展示发现并逐项确认

总结哪些已存在、哪些缺失。然后按顺序过各节——一节一个答案，再进下一节。

每节以推荐答案开头，让用户能一个字就接受。只在选择真正分叉时给一句解释；探索已经定了的节直接跳过（没装 `triage` 时的 B 节，没有 monorepo 时的多上下文分支）。

**A 节——Issue tracker。**

> 解释：Issue tracker 是本仓库 issue 存放的地方。`to-tickets`、`triage`、`to-spec` 等技能要读写它——它们需要知道该调 `gh issue create`、在 `.scratch/` 下写 markdown 文件，还是按你描述的别的流程走。选你实际跟踪这个仓库工作的地方。

默认策略：这些技能为 GitHub 设计。`git remote` 指向 GitHub 就提议 GitHub；指向 GitLab（`gitlab.com` 或自托管）就提议 GitLab。其他情况（或用户偏好），提供：

- **GitHub** —— issue 存放在仓库的 GitHub Issues（用 `gh` CLI）
- **GitLab** —— issue 存放在仓库的 GitLab Issues（用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **本地 markdown** —— issue 作为文件存放在本仓库 `.scratch/<feature>/` 下（适合个人项目或没 remote 的仓库）
- **其他**（Jira、Linear 等）—— 请用户用一段话描述工作流；技能以自由文本记录

把选择记到 `docs/agents/issue-tracker.md`。GitHub 和 GitLab 模板里带一个"PR 作为请求渠道"的开关，默认**关**——留着关、不要主动提；想要外部 PR 进分诊队列的用户，以后自己去文件里翻开。

**B 节——分诊标签词汇。** 没装 `triage` 技能就整节跳过（探索已告诉你）——没装的技能不需要标签。

装了，就只问一个问题：

> 要保留默认的分诊标签吗？（推荐：**是**）

默认是五个标准角色，每个标签字符串与名称相同：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。**是**就原样写。只有用户说否——通常因为他们的 tracker 已经用了别的名字（比如 `bug:triage` 当 `needs-triage`）——才收集覆盖项，让 `triage` 打已有的标签而不是造重复的。

**C 节——领域文档。** 默认**单一上下文**——仓库根一份 `CONTEXT.md` + `docs/adr/`。几乎适合所有仓库；不用问，直接写。

**多上下文**——根目录 `CONTEXT-MAP.md` 指向各上下文的 `CONTEXT.md`——只在探索发现 monorepo 信号时才提。那时确认他们要哪种布局。

**D 节——Loop Engineering。**

> 解释：`loop-go` 循环运行 builder（写/修代码）和 checker（跑全部检查）两个 agent，直到检查通过。它的三个定义文件必须存在才能工作。本节能把三件套装进仓库的 `.claude/` 下，让 `/loop-go` 直接可用，也让仓库对任何打开它的人自包含。

现状检查：

- `.claude/agents/builder.md`、`.claude/agents/checker.md` 是否已存在
- `.claude/commands/loop-go.md` 是否已存在
- `~/.claude/agents/` 是否已有同名 builder / checker 文件

一次一个决定：

- **安装 Loop 三件套**：是 / 否（默认：是）。是则把 builder、checker 写进 `.claude/agents/`，命令写进 `.claude/commands/loop-go.md`，停止规则追加到根文档。否则跳过本节。
- **已有同名文件时**：覆盖 / 保留（默认询问用户，绝不静默覆盖）。若 `~/.claude/agents/` 已有同名 agent，说明项目级副本会覆盖它（项目内生效），问用户是否仍要写入。

### 3. 确认并编辑

向用户展示以下草稿：

- 要加进 `CLAUDE.md` 或 `AGENTS.md` 的 `## Agent skills` 段落（选择规则见步骤 4）
- `docs/agents/issue-tracker.md`、`docs/agents/domain.md`、`docs/agents/triage-labels.md`（最后一个只在装了 `triage` 时）的内容
- 若选了安装 Loop 三件套：`.claude/agents/builder.md`、`.claude/agents/checker.md`、`.claude/commands/loop-go.md` 三个文件的内容，以及要追加到根文档的 `### Loop Engineering` 指针和 `## Loop 停止规则` 段

让用户在写入前编辑。

### 4. 写入

**选择要编辑的文件：**

- 若 `CLAUDE.md` 存在，编辑它。
- 否则若 `AGENTS.md` 存在，编辑它。
- 都不存在，问用户创建哪个（不要替用户选）。

`CLAUDE.md` 已存在时不要创建 `AGENTS.md`（反之亦然），始终编辑已有的那个。

若所选文件已有 `## Agent skills` 段落，原地更新内容，不要追加重复段落。不要覆盖周围段落中用户的编辑。

段落模板：

```markdown
## Agent skills

### Issue tracker

[一句话概述 issue 存放在哪里]。见 `docs/agents/issue-tracker.md`。

### Triage labels

[一句话概述标签词汇]。见 `docs/agents/triage-labels.md`。

### Domain docs

[一句话概述布局——"单一上下文"或"多上下文"]。见 `docs/agents/domain.md`。
```

装了 `triage` 且 B 节跑了时，才包含 `### Triage labels` 子块、才写 `docs/agents/triage-labels.md`。没装就都省掉。

然后用本技能目录下的种子模板写文档文件：

- [issue-tracker-github.md](./references/issue-tracker-github.md) —— GitHub issue tracker
- [issue-tracker-gitlab.md](./references/issue-tracker-gitlab.md) —— GitLab issue tracker
- [issue-tracker-local.md](./references/issue-tracker-local.md) —— 本地 markdown issue tracker
- [triage-labels.md](./references/triage-labels.md) —— 标签映射（只在装了 `triage` 时）
- [domain.md](./references/domain.md) —— 领域文档读取规则 + 布局

对于"其他"issue tracker，根据用户描述从零写 `docs/agents/issue-tracker.md`。

**若选了安装 Loop 三件套：**

1. 若 `.claude/agents/`、`.claude/commands/` 不存在，先创建目录。
2. 用本技能目录下的种子模板写三个文件：
   - `.claude/agents/builder.md` ← [`builder.md`](./references/builder.md)
   - `.claude/agents/checker.md` ← [`checker.md`](./references/checker.md)
   - `.claude/commands/loop-go.md` ← [`loop-go-command.md`](./references/loop-go-command.md)
3. 在步骤 4 开头选出的根文档（`CLAUDE.md` 或 `AGENTS.md`）里：
   - 若已有 `## Agent skills` 段落，在段内加 `### Loop Engineering`（一句话概述 + 指向三个 `.claude/` 文件），不要追加重复段落。
   - 追加或替换顶层 `## Loop 停止规则` 段，内容来自 [`loop-stop-rules.md`](./references/loop-stop-rules.md)。已有同段时替换，不重复追加。

### 5. 完成

告诉用户配置完成，哪些工程技能会读取这些文件。告知以后可以直接编辑 `docs/agents/*.md`，只有想更换 issue tracker 或从头重来时，才需要重跑本技能。

若安装了 Loop 三件套，告知三件套已就位，直接 `/loop-go <任务>` 可用；解释项目级 `.claude/agents/` 会覆盖用户级同名 agent（若全局已有）。
