# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

一套给 Claude Code、Kimi Code 等 Agent 编码工具用的 skills，小、可组合，基于日常工程习惯。

当前包含 33 个 skill，持续迭代中。

## 写作要求的来历

[`sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md) 注入的"写作要求"一节，提炼自《毛泽东年谱》中毛泽东关于写作的论述。比如 1955 年他提醒："写文章不要用过于夸大的修饰词，反而减损了力量……废话应当尽量除去。"又如他评价文件的标准：逻辑性、准确性、鲜明性，要使人读得下去、读后脑中有印象。

这个仓库的文档，包括这份 README，也按这些要求写。

## 快速开始

```bash
npx skills@latest add cislunarspace/skills
```

CLI 读取 `.claude-plugin/marketplace.json`，把 skill 软链到 `~/.claude/skills/`。安装时会提示选择要安装的分组（Engineering / Research / 全部）。安装后，在 agent 里直接用 `/grill-with-docs`、`/sync-writing-standards`、`/setup-ouyangjiahong-skills` 等命令。

### 分组说明

Skills 按目录分组，安装时可以选择：

| 分组 | 说明 | Skills 数量 |
|------|------|-------------|
| **engineering** | 工程相关：计划讨论、规范注入、仓库配置、任务调度、Git 提交、代码审查、调试、TDD 等 | 25 |
| **research** | 研究相关：研究规划、问题界定、资料收集、资料分析、论证构建、报告撰写、视觉呈现、研究伦理 | 8 |

## 日常使用

列表虽长，日常在用的只有三个，外加 agent 工具自带的 plan 模式：

1. 拿到新仓库，先跑 [`/setup-ouyangjiahong-skills`](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md)，配置 issue tracker、分诊标签和领域文档约定。
2. 再跑 [`/sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md)，把写作要求和编码准则注入 `CLAUDE.md` / `AGENTS.md`，后续会话自动遵守。
3. 做事之前用 plan 模式讨论计划，配 [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) 追问打磨，把术语和架构决定写进 `CONTEXT.md` 和 ADR。

其余 skill 留在仓库里按需自取，不属于日常流程。

## Skill 列表

### Engineering

工程相关 skills，解决日常编码中的常见问题。

| Skill | 作用 | 触发词 |
|---|---|---|
| [setup-ouyangjiahong-skills](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md) | 配置 issue tracker、分诊标签、领域文档约定 | `setup-ouyangjiahong-skills` |
| [sync-writing-standards](./skills/engineering/sync-writing-standards/SKILL.md) | 把交流语言、写作要求、编码准则注入 `CLAUDE.md` | `sync-writing-standards` |
| [grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md) | 追问打磨计划，同时维护领域文档 | `grill-with-docs` |
| [grilling](./skills/engineering/grilling/SKILL.md) | 对计划或设计进行高强度追问 | `grill` |
| [domain-modeling](./skills/engineering/domain-modeling/SKILL.md) | 构建和打磨领域模型，维护 `CONTEXT.md` 与 ADR | `domain-modeling` |
| [dispatch](./skills/engineering/dispatch/SKILL.md) | 读取计划或 issue，按依赖分层，逐层并行执行 | `dispatch`、`run agents`、`swarm` |
| [git-commit](./skills/engineering/git-commit/SKILL.md) | 分析会话文件和 diff，给出结构化提交建议 | `git commit`、`commit`、`提交` |
| [open-pr](./skills/engineering/open-pr/SKILL.md) | push 分支、开 PR、review、合并、清理分支，端到端落地 | `开 PR`、`提 PR`、`open PR` |
| [handoff](./skills/engineering/handoff/SKILL.md) | 把当前会话压缩成交接文档，供 dispatch 接手 | `handoff` |
| [to-prd](./skills/engineering/to-prd/SKILL.md) | 把当前对话整理成 PRD，发布到 issue tracker | `to-prd` |
| [to-issues](./skills/engineering/to-issues/SKILL.md) | 把计划或 PRD 拆成垂直切片 issue | `to-issues` |
| [implement](./skills/engineering/implement/SKILL.md) | 基于 spec 或 ticket 执行实现，配合 TDD 和 code-review | `implement`、`实现` |
| [tdd](./skills/engineering/tdd/SKILL.md) | 测试驱动开发，红-绿-重构 | `tdd`、`TDD`、`红-绿-重构` |
| [code-review](./skills/engineering/code-review/SKILL.md) | 两轴审查 diff：规范（编码准则）与规格（PRD/issue） | `code-review`、`review since` |
| [diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md) | 难调 bug 和性能回归的诊断流程 | `diagnose`、`debug` |
| [triage](./skills/engineering/triage/SKILL.md) | 把 issue/PR 推过分诊状态机，写出 agent 可认领的 brief | `triage`、`分诊` |
| [resolving-merge-conflicts](./skills/engineering/resolving-merge-conflicts/SKILL.md) | 解决进行中的 git merge/rebase 冲突 | `解决冲突`、`merge conflict` |
| [wayfinder](./skills/engineering/wayfinder/SKILL.md) | 把超大块工作规划成决策 ticket 地图，逐个解决直到路径清晰 | `wayfinder`、`寻路` |
| [prototype](./skills/engineering/prototype/SKILL.md) | 造一次性原型回答设计问题 | `prototype`、`原型` |
| [research](./skills/engineering/research/SKILL.md) | 派后台子代理基于一手资料调研问题，产出 markdown | `research`、`调研` |
| [pdf-with-mineru](./skills/engineering/pdf-with-mineru/SKILL.md) | 用本地 MinerU 把 PDF 转成 markdown 再读取内容 | `pdf-with-mineru` |
| [improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md) | 审计目录组织与文件内部设计，生成 HTML 报告 | `improve-codebase-architecture` |
| [codebase-design](./skills/engineering/codebase-design/SKILL.md) | "深模块"共享词汇：设计接口、找深化机会、定接缝位置 | `codebase-design`、`深模块` |
| [write-skill](./skills/engineering/write-skill/SKILL.md) | 按仓库规范编写或审查 SKILL.md | `write-skill`、`写 skill` |
| [teach](./skills/engineering/teach/SKILL.md) | 在工作区内教用户一项新技能或概念，跨多次会话推进 | `teach`、`教我`、`带我学` |

### Research

研究相关 skills，基于《研究是一门艺术》这本书，按研究流程组织。

| Skill | 作用 | 触发词 |
|---|---|---|
| [research-planning](./skills/research/research-planning/SKILL.md) | 理解研究的意义，建立与读者的联系，规划研究过程 | `research-planning`、`研究规划` |
| [problem-identification](./skills/research/problem-identification/SKILL.md) | 从兴趣中找到题目，从题目中提出问题，从问题中界定难题 | `problem-identification`、`问题界定` |
| [source-collection](./skills/research/source-collection/SKILL.md) | 寻找可靠的原始资料 | `source-collection`、`资料收集` |
| [source-analysis](./skills/research/source-analysis/SKILL.md) | 批判性地阅读和分析原始资料 | `source-analysis`、`资料分析` |
| [argument-construction](./skills/research/argument-construction/SKILL.md) | 构建严谨的研究论证 | `argument-construction`、`论证构建` |
| [report-writing](./skills/research/report-writing/SKILL.md) | 规划和撰写研究报告 | `report-writing`、`报告撰写` |
| [visual-presentation](./skills/research/visual-presentation/SKILL.md) | 撰写导言与结论，以视觉方式传达证据，修改文体风格 | `visual-presentation`、`视觉呈现` |
| [research-ethics](./skills/research/research-ethics/SKILL.md) | 理解研究伦理，避免抄袭、正确引用 | `research-ethics`、`研究伦理` |

## 相关项目

- **[mattpocock/skills](https://github.com/mattpocock/skills)**：软件工程基本功合集，对齐需求、共享语言、TDD、调试、代码架构、PRD、issue 分诊等。同样强调小、可组合、基于工程经验。

## 目录结构

```
skills/
├── engineering/                 # 工程相关 skills
│   ├── <name>/SKILL.md
│   └── ...
├── research/                    # 研究相关 skills
│   ├── <name>/SKILL.md
│   └── ...
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

一条命令聚合跑仓库里所有测试（Node 的 `node:test` 和 bash 测试都有）。改任何 skill 之前和之后都跑一遍。
