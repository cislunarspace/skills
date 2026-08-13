# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

一套给 Claude Code、Kimi Code 等 Agent 编码工具用的 skills，小、可组合，基于日常工程习惯。软件工程部分对齐 [mattpocock/skills](https://github.com/mattpocock/skills) 并翻译成中文。

当前包含 30 个 skill，持续迭代中。

## 写作要求的来历

[`sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md) 注入的"写作要求"一节，提炼自《毛泽东年谱》中毛泽东关于写作的论述。比如 1955 年他提醒："关于写文章，请注意不要用过于夸大的修饰词，反而减损了力量……废话应当尽量除去。"又如他评价文件的标准：逻辑性、准确性、鲜明性，要使人读得下去、读后脑中有印象。

这个仓库的文档，包括这份 README，也按这些要求写。

## 快速开始

```bash
npx skills@latest add cislunarspace/skills
```

CLI 读取 `.claude-plugin/marketplace.json`，把 skill 软链到 `~/.claude/skills/`。安装时会提示选择要安装的分组（Engineering / Productivity / In-progress / 全部）。安装后，在 agent 里直接用 `/ask-matt`、`/grill-with-docs`、`/sync-writing-standards`、`/setup-ouyangjiahong-skills`、`/setup-pi`、`/setup-claude-code` 等命令。

### pi（pi coding agent）

pi 没有内置 subagent，用官方 subagent 扩展 + 本仓库 `pi/agents/` 的用户级 agent 定义。机器级一次性配置（幂等，可重跑）：

```bash
npm run setup:pi
```

装 subagent 扩展（官方示例 symlink 到 `~/.pi/agent/extensions/subagent/`）并链接 `pi/agents/` 下 8 个 agent（standards-reviewer、spec-reviewer、builder、checker、scout、planner、reviewer、worker）到 `~/.pi/agent/agents/`。不锁模型，用 pi 默认模型。也可以直接在 pi 会话里跑 `/setup-pi` 让 agent 帮你装，并可选地写项目级 `.pi/agents/`（需 subagent 工具调用时带 `agentScope: "both"` 并确认）。只重链 agents 可用 `npm run link:pi`。`/setup-pi` 还可按需配置 `piw`/`piw-clean` worktree 命令。

### 分组说明

Skills 按目录分组，安装时可以选择：

| 分组 | 说明 | 数量 |
|------|------|------|
| **engineering** | 工程相关：路由、计划打磨、规范注入、仓库配置、代码审查、调试、TDD、架构等 | 23 |
| **productivity** | 通用生产力：访谈质询、会话交接、PR 流程、教学、问卷 | 5 |
| **in-progress** | 实验性 skill，可能变动 | 2 |

## 日常使用

列表虽长，日常在用的只有三个，外加 agent 工具自带的 plan 模式：

1. 拿到新仓库，先跑 [`/setup-ouyangjiahong-skills`](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md)，配置 issue tracker、分诊标签、领域文档和 Loop 停止规则；再按 harness 跑 [`/setup-pi`](./skills/engineering/setup-pi/SKILL.md)（pi）或 [`/setup-claude-code`](./skills/engineering/setup-claude-code/SKILL.md)（Claude Code）装 Loop 工具。
2. 再跑 [`/sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md)，把交流语言、写作要求和编码准则同步到 `CLAUDE.md` 与 `AGENTS.md`，后续会话自动遵守。
3. 做事之前用 plan 模式讨论计划，配 [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) 追问打磨，把术语和架构决定写进 `CONTEXT.md` 和 ADR。

其余 skill 留在仓库里按需自取，不属于日常流程。不确定用哪个时，问 [`/ask-matt`](./skills/engineering/ask-matt/SKILL.md)——它是这套 skill 的路由器。

## Skill 列表

### Engineering

工程相关 skills，解决日常编码中的常见问题。

| Skill | 作用 | 触发词 |
|---|---|---|
| [ask-matt](./skills/engineering/ask-matt/SKILL.md) | 问该用哪个 skill 或流程，整套 skill 的路由器 | `ask-matt` |
| [setup-claude-code](./skills/engineering/setup-claude-code/SKILL.md) | 配置 Claude Code harness：写 `.claude/agents/` 的 builder/checker 与 `/loop-go` 命令 | `setup-claude-code` |
| [setup-ouyangjiahong-skills](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md) | 配置 issue tracker、分诊标签、领域文档与 Loop 停止规则 | `setup-ouyangjiahong-skills` |
| [setup-pi](./skills/engineering/setup-pi/SKILL.md) | 配置 pi harness：装 subagent 扩展与用户级 agents，按需配置 piw/piw-clean，并写项目级 `.pi/agents/` | `setup-pi` |
| [sync-writing-standards](./skills/engineering/sync-writing-standards/SKILL.md) | 把交流语言、写作要求、编码准则注入 `CLAUDE.md` | `sync-writing-standards` |
| [grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md) | 追问打磨计划，同时维护领域文档 | `grill-with-docs` |
| [domain-modeling](./skills/engineering/domain-modeling/SKILL.md) | 构建和打磨领域模型，维护 `CONTEXT.md` 与 ADR | `domain-modeling` |
| [codebase-design](./skills/engineering/codebase-design/SKILL.md) | "深模块"共享词汇：设计接口、找深化机会、定接缝位置 | `codebase-design`、`深模块` |
| [to-spec](./skills/engineering/to-spec/SKILL.md) | 把当前对话变成规格，发布到 issue tracker | `to-spec` |
| [to-tickets](./skills/engineering/to-tickets/SKILL.md) | 把计划、规格或对话拆成曳光弹工单，声明阻塞边 | `to-tickets` |
| [implement](./skills/engineering/implement/SKILL.md) | 基于 spec 或 ticket 执行实现，配合 TDD 和 code-review | `implement`、`实现` |
| [tdd](./skills/engineering/tdd/SKILL.md) | 测试驱动开发，红-绿循环 | `tdd`、`TDD`、`red-green` |
| [code-review](./skills/engineering/code-review/SKILL.md) | 两轴审查 diff：规范（编码准则）与规格（issue/spec） | `code-review`、`review since` |
| [diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md) | 难调 bug 和性能回归的诊断流程 | `diagnose`、`debug` |
| [triage](./skills/engineering/triage/SKILL.md) | 把 issue/PR 推过分诊状态机，写出 agent 可认领的 brief | `triage`、`分诊` |
| [git-commit](./skills/engineering/git-commit/SKILL.md) | 只提交本会话改动的文件，检查分支归属，确认后提交 | `git-commit`、`提交` |
| [resolving-merge-conflicts](./skills/engineering/resolving-merge-conflicts/SKILL.md) | 解决进行中的 git merge/rebase 冲突 | `解决冲突`、`merge conflict` |
| [wayfinder](./skills/engineering/wayfinder/SKILL.md) | 把超大块工作规划成决策工单地图，逐个解决直到路径清晰 | `wayfinder`、`寻路` |
| [prototype](./skills/engineering/prototype/SKILL.md) | 造一次性原型回答设计问题 | `prototype`、`原型` |
| [research](./skills/engineering/research/SKILL.md) | 派后台子代理基于一手资料调研问题，产出 markdown | `research`、`调研` |
| [improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md) | 扫描深化机会，生成 HTML 报告，就选中项做质询 | `improve-codebase-architecture` |
| [lightwan-cli](./skills/engineering/lightwan-cli/SKILL.md) | 用 CLI + HTTP 手动连接/断开 LightWAN SD-WAN 客户端 | `lightwan-cli`、`LightWAN`、`SD-WAN` |
| [loop-go](./skills/engineering/loop-go/SKILL.md) | 循环运行 builder 和 checker 直到所有检查通过 | `loop-go`、`循环构建`、`loop until green` |

### Productivity

通用生产力 skills。

| Skill | 作用 | 触发词 |
|---|---|---|
| [grilling](./skills/productivity/grilling/SKILL.md) | 对计划或设计进行不懈质询（逐轮问完整条前沿） | `grill` |
| [handoff](./skills/productivity/handoff/SKILL.md) | 把当前会话压缩成交接文档，供另一个 agent 接手 | `handoff` |
| [open-pr](./skills/productivity/open-pr/SKILL.md) | 推送分支、创建 PR、评审、合并并清理，含 worktree 场景 | `open-pr`、`提 PR`、`合并分支` |
| [to-questionnaire](./skills/productivity/to-questionnaire/SKILL.md) | 把答不了的决策变成问卷发给别人，异步收集信息 | `to-questionnaire`、`问卷` |
| [teach](./skills/productivity/teach/SKILL.md) | 在工作区内教用户一项新技能或概念，跨多次会话推进 | `teach`、`教我` |

### In-progress

实验性 skill，可能变动。

| Skill | 作用 | 触发词 |
|---|---|---|
| [loop-me](./skills/in-progress/loop-me/SKILL.md) | 把生活中重复出现的工作流讨论成 workflow 规格 | `loop-me` |
| [setup-ts-deep-modules](./skills/in-progress/setup-ts-deep-modules/SKILL.md) | 在 TS 仓库用 dependency-cruiser 强制深模块边界 | `setup-ts-deep-modules` |

## 相关项目

- **[mattpocock/skills](https://github.com/mattpocock/skills)**：本仓库软件工程 skill 的上游。软件工程部分的 skill 对齐该项目当前版本、翻译成中文；自创 skill（`sync-writing-standards`、`loop-go`、`setup-ouyangjiahong-skills`、`setup-pi`、`setup-claude-code`、`git-commit`、`open-pr`、`lightwan-cli`）为本仓库独有。

## 目录结构

```
skills/
├── engineering/                 # 工程相关 skills
│   ├── <name>/SKILL.md
│   └── ...
├── productivity/                # 通用生产力 skills
├── in-progress/                 # 实验性 skills
.claude-plugin/
└── marketplace.json             # 分组清单（CLI 读取入口）
scripts/                         # 辅助脚本
```

## 新增 Skill

1. 在 `skills/<group>/<name>/` 下创建 `SKILL.md`（含 frontmatter：`name`、`description`）。写作规范见 [`docs/skill-writing.md`](./docs/skill-writing.md)，可从 [`docs/templates/SKILL.md`](./docs/templates/SKILL.md) 复制骨架起步
2. 在 `.claude-plugin/marketplace.json` 对应分组的 `skills` 数组里加一行（必须以 `./` 开头）
3. 重跑 `npx skills add cislunarspace/skills`

## 测试

```bash
npm test
```

用 Node 内置的 `node:test` 跑 `skills/` 下所有 `.test.js`。改任何 skill 之前和之后都跑一遍。
