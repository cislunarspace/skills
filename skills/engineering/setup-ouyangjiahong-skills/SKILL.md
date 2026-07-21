---
name: setup-ouyangjiahong-skills
description: 为当前仓库设置 issue tracker、分诊标签词汇、领域文档布局。当用户说「初始化工程技能」「配置 issue tracker」或其他工程技能首次使用前要求设置时使用。
disable-model-invocation: true
---

# Setup ouyangjiahong's Skills

这是一个交互式技能，不是确定性脚本。探索仓库、展示发现、与用户确认，然后写入。

## 步骤

### 1. 探索

查看当前仓库，读取已有配置：

- `git remote -v` 和 `.git/config`：是 GitHub 仓库吗？哪个？
- 仓库根目录的 `AGENTS.md` 和 `CLAUDE.md`：存在吗？里面有没有 `## Agent skills` 段落？
- 仓库根目录的 `CONTEXT.md` 和 `CONTEXT-MAP.md`
- `docs/adr/` 和 `src/*/docs/adr/` 目录
- `docs/agents/`：本技能之前的产出已存在吗？
- `.scratch/`，说明已在使用本地 markdown issue tracker 约定

### 2. 展示发现并逐项确认

总结哪些已存在、哪些缺失。然后**一次一个**地引导用户做三个决定，展示一节、拿到答案，再进入下一节。每节开头给一段简短解释（是什么、为什么技能需要它），然后给出选项和默认值。

**A 节（Issue tracker）。**

> 解释：Issue tracker 是本仓库 issue 存放的地方。`to-issues`、`to-prd`、`qa` 等技能要读写它，需要知道该调 `gh issue create` 还是在 `.scratch/` 下写 markdown 文件。

默认策略：这些技能为 GitHub 设计。如果 `git remote` 指向 GitHub，提议 GitHub。如果指向 GitLab（`gitlab.com` 或自托管），提议 GitLab。其他情况（或用户偏好），提供：

- **GitHub**：issue 存放在仓库的 GitHub Issues（使用 `gh` CLI）
- **GitLab**：issue 存放在仓库的 GitLab Issues（使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **本地 markdown**：issue 作为文件存放在 `.scratch/<feature>/` 下（适合个人项目或没有 remote 的仓库）
- **其他**（Jira、Linear 等）：请用户用一段话描述工作流；技能会以自由文本记录

仅当用户选了 GitHub 或 GitLab 时，追问一个问题：

> 解释：开源仓库常以外界 PR 形式收到功能请求。开启后，`/triage` 会把外部 PR 拉入同一队列，用与 issue 相同的标签和状态处理。

- **PR 作为请求渠道**：是 / 否（默认：否）。记录到 `docs/agents/issue-tracker.md`。本地 markdown 和其他 tracker 跳过此问题，没有 PR。

**B 节（分诊标签词汇）。**

> 解释：`triage` 技能处理新 issue 时，会过一个状态机：需要评估、等待报告者补充信息、已就绪可被 agent 认领、需要人工实现、不修。为此，它需要打标签（或你 tracker 里的等价物），标签字符串必须匹配你**实际配置过的**。如果仓库已用不同标签名（比如 `bug:triage` 而非 `needs-triage`），在这里映射，技能才会打对的标签，而不是创建重复的。

五个标准角色：

- `needs-triage`：维护者需要评估
- `needs-info`：等待报告者补充
- `ready-for-agent`：规格完整，agent 可直接认领（无需人工上下文）
- `ready-for-human`：需要人工实现
- `wontfix`：不予处理

默认：每个角色的字符串与名称相同。问用户是否要覆盖。如果 issue tracker 还没有标签，用默认即可。

**C 节（领域文档）。**

> 解释：有些技能（`diagnosing-bugs`、`tdd` 等）会读 `CONTEXT.md` 了解项目的领域语言，读 `docs/adr/` 了解过去的架构决策。它们需要知道仓库是单一上下文还是多上下文（比如 monorepo 有独立的前后端上下文），以便到正确位置找。

确认布局：

- **单一上下文**：仓库根目录一份 `CONTEXT.md` + `docs/adr/`。多数仓库如此。
- **多上下文**：根目录有 `CONTEXT-MAP.md`，指向各上下文的 `CONTEXT.md`（通常是 monorepo）。

### 3. 确认并编辑

向用户展示以下草稿：

- 要加入 `CLAUDE.md` 或 `AGENTS.md` 的 `## Agent skills` 段落（选择规则见步骤 4）
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容

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

[一句话概述 issue 存放在哪里，以及外部 PR 是否作为分诊渠道]。见 `docs/agents/issue-tracker.md`。

### Triage labels

[一句话概述标签词汇]。见 `docs/agents/triage-labels.md`。

### Domain docs

[一句话概述布局："单一上下文"或"多上下文"]。见 `docs/agents/domain.md`。
```

然后用本技能目录下的种子模板写三个文档文件：

- [issue-tracker-github.md](./references/issue-tracker-github.md)：GitHub issue tracker
- [issue-tracker-gitlab.md](./references/issue-tracker-gitlab.md)：GitLab issue tracker
- [issue-tracker-local.md](./references/issue-tracker-local.md)：本地 markdown issue tracker
- [triage-labels.md](./references/triage-labels.md)：标签映射
- [domain.md](./references/domain.md)：领域文档读取规则 + 布局

对于"其他"issue tracker，根据用户描述从零写 `docs/agents/issue-tracker.md`。

### 5. 完成

告诉用户配置完成，哪些工程技能会读取这些文件。告知以后可以直接编辑 `docs/agents/*.md`，只有想更换 issue tracker 或从头重来时，才需要重跑本技能。

## 下一步

- 仓库首次配置完成：开始处理 issue 用 `/triage`
