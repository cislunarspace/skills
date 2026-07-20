# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

一套给 Claude Code、Kimi Code 等 Agent 编码工具用的 skills，小、可组合，基于日常工程习惯，不是 vibe coding。

当前包含 32 个 skill，持续迭代中。

## 快速开始

```bash
npx skills@latest add cislunarspace/skills
```

CLI 读取 `.claude-plugin/marketplace.json`，把 skill 软链到 `~/.claude/skills/`。安装时可按分组（Engineering、Research）选择。安装后，在 agent 里直接用 `/dispatch`、`/git-commit`、`/to-prd`、`/handoff`、`/grill-with-docs` 等命令。

### 分组说明

Skills 按目录分组，安装时可以选择：

| 分组 | 说明 | Skills 数量 |
|------|------|-------------|
| **engineering** | 工程相关：任务调度、Git 提交、写作规范、PRD、issue 管理、分诊、代码审查、调试、TDD、设计追问、领域建模、架构审计、原型、PDF 解析等 | 24 |
| **research** | 研究相关：研究规划、问题界定、资料收集、资料分析、论证构建、报告撰写、视觉呈现、研究伦理 | 8 |

## 这些 Skill 解决什么问题

### 1. Agent 用词、风格不一致

每次开新 session，agent 的用词、语气、编码风格都可能不同。上一个 session 写好的 `CLAUDE.md` 规范，下个 session 可能就被忽略。

**解法**：[`/sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md) 把预定义的交流语言、写作要求、编码准则注入当前仓库的 `CLAUDE.md`，一次注入，后续 session 自动遵守。

### 2. Git 提交范围失控

让 agent 跑 `git commit`，它经常把不相关的文件一起提交，或者 message 写得像流水账。

**解法**：[`/git-commit`](./skills/engineering/git-commit/SKILL.md) 派一个 agent 分析会话文件和 diff，返回结构化的提交建议（文件列表、改动摘要、拟定 message）；主线程只负责确认和执行。session 级别精准控制，分析与执行分离。

### 3. 计划写完就丢，执行靠人肉

写完计划或 handoff 文件后，得手动拆任务、逐个分配给 agent、盯进度、收结果。计划和执行之间全是手工活。

**解法**：[`/dispatch`](./skills/engineering/dispatch/SKILL.md) 读取计划或 GitHub issue，按依赖关系分层，逐层扇出给 Agent 子代理并行执行。失败自动汇报，层间自动推进，最终跑测试验证。

### 4. PRD 和 issue 写成一次性文档，后续没人用

PRD 堆在仓库里吃灰，拆任务时还得手动建 issue，agent 也不知道该读哪份文档、该打什么标签。

**解法**：[`/setup-ouyangjiahong-skills`](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md) 先配置好 issue tracker、分诊标签和领域文档约定；[`/to-prd`](./skills/engineering/to-prd/SKILL.md) 把当前对话整理成结构化 PRD 发布到 tracker；[`/to-issues`](./skills/engineering/to-issues/SKILL.md) 再把 PRD 拆成可独立认领的垂直切片 issue。

### 5. Session 中断后，下个 agent 接不住

长对话做到一半中断，新 session 要重复大量上下文。

**解法**：[`/handoff`](./skills/engineering/handoff/SKILL.md) 把当前会话压缩成交接文档（下一步建议、依赖关系、关联 issue），让 dispatch 按 `handoff-*.md` 模式接手继续。

### 6. 设计讨论浮于表面，术语和决策没人记录

讨论计划时术语混用、边界模糊，重要架构决定口头说说就过了。

**解法**：[`/grilling`](./skills/engineering/grilling/SKILL.md) 对计划或设计进行高强度追问；[`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) 在追问过程中同步用 [`/domain-modeling`](./skills/engineering/domain-modeling/SKILL.md) 维护 `CONTEXT.md` 和 ADR，把领域语言落到文档里。

### 7. Issue 和 PR 涌入后没人分诊

issue 和外部 PR 堆在 tracker 里，没人归类、没人验证、也没写成 agent 能直接认领的 brief。

**解法**：[`/triage`](./skills/engineering/triage/SKILL.md) 把 issue/PR 推过分诊状态机（归类 → 验证 → 必要时追问 → 写 brief），区分 bug/enhancement，流转 needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix。

### 8. 活太大，一眼看不到路径

一个朦胧的大目标，大到单个 agent session 装不下，从哪儿开始也不清楚。

**解法**：[`/wayfinder`](./skills/engineering/wayfinder/SKILL.md) 把它画成 issue tracker 上的一张"决策 ticket 地图"，逐个解决决策点，直到通往目的地的路径清晰再交接执行。

### 9. 研究过程缺乏系统指导

做研究时不知道如何选题、找资料、构建论证、撰写报告，容易走弯路。

**解法**：基于《研究是一门艺术》这本书，提供8个按研究流程组织的skills：[`/research-planning`](./skills/research/research-planning/SKILL.md) 理解研究意义和规划；[`/problem-identification`](./skills/research/problem-identification/SKILL.md) 从兴趣到题目到问题到难题；[`/source-collection`](./skills/research/source-collection/SKILL.md) 寻找可靠资料；[`/source-analysis`](./skills/research/source-analysis/SKILL.md) 批判性阅读和分析；[`/argument-construction`](./skills/research/argument-construction/SKILL.md) 构建严谨论证；[`/report-writing`](./skills/research/report-writing/SKILL.md) 规划和撰写报告；[`/visual-presentation`](./skills/research/visual-presentation/SKILL.md) 导言结论和视觉呈现；[`/research-ethics`](./skills/research/research-ethics/SKILL.md) 研究伦理和学术诚信。

## 典型工作方式

作为研究者，拿到一个仓库后通常按下面顺序使用这些 skill：

1. **初始化仓库认知**：先跑 [`/setup-ouyangjiahong-skills`](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md)，配置 issue tracker、分诊标签和领域文档布局，让 agent 对仓库有基本约定。
2. **注入写作与编码规范**：再跑 [`/sync-writing-standards`](./skills/engineering/sync-writing-standards/SKILL.md)，把统一的交流语言、写作要求和编码准则写入 `CLAUDE.md` / `AGENTS.md`。
3. **讨论要做的事**：不管仓库里是否已有代码，都可以用 [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) 围绕想实现的任务展开高强度讨论，同时用 [`/domain-modeling`](./skills/engineering/domain-modeling/SKILL.md) 沉淀术语和 ADR。
4. **产出 PRD**：讨论清楚后，用 [`/to-prd`](./skills/engineering/to-prd/SKILL.md) 把结论整理成 PRD 并发布到 issue tracker，评估是否需要用 issue 跟踪后续工作。
5. **拆解任务**：PRD 发布后，用 [`/to-issues`](./skills/engineering/to-issues/SKILL.md) 把需求拆成可独立认领的垂直切片 issue。
6. **实现与审查**：用 [`/implement`](./skills/engineering/implement/SKILL.md) 基于 issue 执行实现（配合 [`/tdd`](./skills/engineering/tdd/SKILL.md) 测试先行），完成后用 [`/code-review`](./skills/engineering/code-review/SKILL.md) 沿"规范"和"规格"两轴审查 diff。
7. **接力或继续执行**：上下文太长就用 [`/handoff`](./skills/engineering/handoff/SKILL.md) 生成交接文档，供新会话的 [`/dispatch`](./skills/engineering/dispatch/SKILL.md) 接手；否则直接继续用 `/dispatch` 推进。
8. **提交并闭环**：任务完成后，用 [`/git-commit`](./skills/engineering/git-commit/SKILL.md) 提交改动，并关闭/评论相关 issue，完成闭环。
9. **PDF 解析**：当需要读取 PDF 内容时，用 [`/pdf-with-mineru`](./skills/engineering/pdf-with-mineru/SKILL.md) 调用本地 MinerU 把 PDF 转成 markdown，避免直接用文本提取漏图、漏表格。
10. **代码架构审计**：当需要审计代码仓库的目录组织与文件内部设计时，用 [`/improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/SKILL.md) 生成 HTML 报告，再把选中项转为 issue。
11. **调试与排障**：遇到难调的 bug 或性能回归，用 [`/diagnosing-bugs`](./skills/engineering/diagnosing-bugs/SKILL.md) 走系统化诊断流程（先复现、一次只改一处、定位根因）。遇到 merge/rebase 冲突，用 [`/resolving-merge-conflicts`](./skills/engineering/resolving-merge-conflicts/SKILL.md)。
12. **系统化研究**：当需要做学术研究或深度调研时，按研究流程使用skills：先 [`/research-planning`](./skills/research/research-planning/SKILL.md) 理解研究意义和规划；再 [`/problem-identification`](./skills/research/problem-identification/SKILL.md) 确定题目、问题和难题；然后 [`/source-collection`](./skills/research/source-collection/SKILL.md) 搜集资料；接着 [`/source-analysis`](./skills/research/source-analysis/SKILL.md) 分析资料；之后 [`/argument-construction`](./skills/research/argument-construction/SKILL.md) 构建论证；再 [`/report-writing`](./skills/research/report-writing/SKILL.md) 撰写报告；同时 [`/visual-presentation`](./skills/research/visual-presentation/SKILL.md) 完善呈现；最后 [`/research-ethics`](./skills/research/research-ethics/SKILL.md) 确保学术诚信。

## Skill 列表

### Engineering

工程相关 skills，解决日常编码中的常见问题。

| Skill | 作用 | 触发词 |
|---|---|---|
| [dispatch](./skills/engineering/dispatch/SKILL.md) | 读取计划或 issue，按依赖分层，逐层并行执行 | `dispatch`、`run agents`、`swarm` |
| [git-commit](./skills/engineering/git-commit/SKILL.md) | 分析会话文件和 diff，给出结构化提交建议 | `git commit`、`commit`、`提交` |
| [sync-writing-standards](./skills/engineering/sync-writing-standards/SKILL.md) | 把交流语言、写作要求、编码准则注入 `CLAUDE.md` | `sync-writing-standards` |
| [handoff](./skills/engineering/handoff/SKILL.md) | 把当前会话压缩成交接文档，供 dispatch 接手 | `handoff` |
| [to-prd](./skills/engineering/to-prd/SKILL.md) | 把当前对话整理成 PRD，发布到 issue tracker | `to-prd` |
| [to-issues](./skills/engineering/to-issues/SKILL.md) | 把计划或 PRD 拆成垂直切片 issue | `to-issues` |
| [setup-ouyangjiahong-skills](./skills/engineering/setup-ouyangjiahong-skills/SKILL.md) | 配置 issue tracker、分诊标签、领域文档约定 | `setup-ouyangjiahong-skills` |
| [grilling](./skills/engineering/grilling/SKILL.md) | 对计划或设计进行高强度追问 | `grill` |
| [grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md) | 追问打磨计划，同时维护领域文档 | `grill-with-docs` |
| [domain-modeling](./skills/engineering/domain-modeling/SKILL.md) | 构建和打磨领域模型，维护 `CONTEXT.md` 与 ADR | `domain-modeling` |
| [pdf-with-mineru](./skills/engineering/pdf-with-mineru/SKILL.md) | 用本地 MinerU 把 PDF 转成 markdown 再读取内容 | `pdf-with-mineru` |
| [improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md) | 审计代码仓库的目录组织与文件内部设计，生成 HTML 报告 | `improve-codebase-architecture` |
| [write-skill](./skills/engineering/write-skill/SKILL.md) | 按仓库规范编写或审查 SKILL.md | `write-skill`、`写 skill`、`skill 模板` |
| [wayfinder](./skills/engineering/wayfinder/SKILL.md) | 把超大块工作规划成 issue tracker 上的决策 ticket 地图，逐个解决直到路径清晰 | `wayfinder`、`寻路` |
| [prototype](./skills/engineering/prototype/SKILL.md) | 造一次性原型回答设计问题（逻辑状态机或 UI 变体） | `prototype`、`原型` |
| [research](./skills/engineering/research/SKILL.md) | 派后台子代理基于一手资料调研问题，产出 markdown（执行型调研） | `research`、`调研` |
| [implement](./skills/engineering/implement/SKILL.md) | 基于 spec 或 ticket 执行实现，配合 TDD 和 code-review | `implement`、`实现` |
| [tdd](./skills/engineering/tdd/SKILL.md) | 测试驱动开发，红-绿-重构 | `tdd`、`TDD`、`红-绿-重构` |
| [code-review](./skills/engineering/code-review/SKILL.md) | 两轴审查 diff：规范（编码准则）与规格（PRD/issue） | `code-review`、`review since` |
| [diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md) | 难调 bug 和性能回归的诊断流程 | `diagnose`、`debug` |
| [triage](./skills/engineering/triage/SKILL.md) | 把 issue/PR 推过分诊状态机，写出 agent 可认领的 brief | `triage`、`分诊` |
| [resolving-merge-conflicts](./skills/engineering/resolving-merge-conflicts/SKILL.md) | 解决进行中的 git merge/rebase 冲突 | `解决冲突`、`merge conflict` |
| [codebase-design](./skills/engineering/codebase-design/SKILL.md) | "深模块"共享词汇：设计接口、找深化机会、定接缝位置 | `codebase-design`、`深模块` |
| [teach](./skills/engineering/teach/SKILL.md) | 在工作区内教用户一项新技能或概念，跨多次会话推进 | `teach`、`教我`、`带我学` |

### Research

研究相关 skills，基于《研究是一门艺术》这本书，帮助系统化研究过程。

| Skill | 作用 | 触发词 |
|---|---|---|
| [research-planning](./skills/research/research-planning/SKILL.md) | 帮助用户理解研究的意义，建立与读者的联系，规划研究过程 | `research-planning`、`研究规划` |
| [problem-identification](./skills/research/problem-identification/SKILL.md) | 帮助用户从兴趣中找到题目，从题目中提出问题，从问题中界定难题 | `problem-identification`、`问题界定` |
| [source-collection](./skills/research/source-collection/SKILL.md) | 帮助用户寻找可靠的原始资料，包括图书馆资源、互联网资源和直接搜集资料 | `source-collection`、`资料收集` |
| [source-analysis](./skills/research/source-analysis/SKILL.md) | 帮助用户批判性地阅读和分析原始资料，包括阅读策略、做注释和记录发现 | `source-analysis`、`资料分析` |
| [argument-construction](./skills/research/argument-construction/SKILL.md) | 帮助用户构建严谨的研究论证，包括提出观点、提供理由、证据、承认与回应、论据 | `argument-construction`、`论证构建` |
| [report-writing](./skills/research/report-writing/SKILL.md) | 帮助用户规划和撰写研究报告，包括规划草稿、撰写初稿、修改组织架构和论证 | `report-writing`、`报告撰写` |
| [visual-presentation](./skills/research/visual-presentation/SKILL.md) | 帮助用户撰写导言与结论，以视觉方式传达证据，修改文体风格 | `visual-presentation`、`视觉呈现` |
| [research-ethics](./skills/research/research-ethics/SKILL.md) | 帮助用户理解研究伦理，确保学术诚信，包括避免抄袭、正确引用和保持诚信 | `research-ethics`、`研究伦理` |

## 推荐

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

## 测试

仓库里目前有两个测试，分属两个 skill、用不同的技术栈（因为被测对象本身一个是 Node 脚本、一个是 bash 脚本），都和被测代码 co-located。一条命令聚合跑：

```bash
npm test
```

等价于：

```bash
node --test 'skills/**/*.test.js' && bash skills/engineering/sync-writing-standards/sync-test.sh
```

| 测试 | 框架 | 被测对象 | 测什么 |
|------|------|----------|--------|
| `skills/engineering/git-commit/scripts/get-session-files.test.js` | Node 内置 `node:test` | [`get-session-files.js`](./skills/engineering/git-commit/scripts/get-session-files.js)（黑盒，通过子进程调用） | 从会话日志里还原本会话改动的文件列表：无会话 ID、无日志、空日志、正常列表、仓库外路径过滤等情况 |
| `skills/engineering/sync-writing-standards/sync-test.sh` | 手写 bash 测试框架 | [`sync.sh`](./skills/engineering/sync-writing-standards/sync.sh)（子进程调用） | 节级替换逻辑：新建 `CLAUDE.md`/`AGENTS.md`、更新已存在文件、保留自定义节、已是最新时跳过、`standards.md` 缺失时报错 |

`node --test 'skills/**/*.test.js'` 用 glob 自动发现测试，后续在 `skills/` 下新增的 `.test.js` 会被自动纳入，无需改 `package.json`。改任何 skill 之前和之后都建议跑一遍 `npm test`。

## 新增 Skill

1. 在 `skills/<group>/<name>/` 下创建 `SKILL.md`（含 frontmatter：`name`、`description`）。写作规范见 [`docs/skill-writing.md`](./docs/skill-writing.md)，可从 [`docs/templates/SKILL.md`](./docs/templates/SKILL.md) 复制骨架起步
2. 在 `.claude-plugin/marketplace.json` 对应分组的 `skills` 数组里加一行（必须以 `./` 开头）
3. 重跑 `npx skills add cislunarspace/skills`
