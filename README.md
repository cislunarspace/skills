# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

一套给 Claude Code、Kimi Code 等 Agent 编码工具用的 skills，小、可组合，基于日常工程习惯，不是 vibe coding。

当前包含 11 个 skill，持续迭代中。

## 快速开始

```bash
npx skills add cislunarspace/skills
```

CLI 会读取 `.claude-plugin/plugin.json`，把 skill 软链到 `~/.claude/skills/`。安装后，在 agent 里直接用 `/dispatch`、`/git-commit`、`/to-prd`、`/handoff`、`/grill-with-docs` 等命令。

## 这些 Skill 解决什么问题

### 1. Agent 用词、风格不一致

每次开新 session，agent 的用词、语气、编码风格都可能不同。上一个 session 写好的 `CLAUDE.md` 规范，下个 session 可能就被忽略。

**解法**：[`/sync-writing-standards`](./skills/sync-writing-standards/SKILL.md) 把预定义的交流语言、写作要求、编码准则注入当前仓库的 `CLAUDE.md`，一次注入，后续 session 自动遵守。

### 2. Git 提交范围失控

让 agent 跑 `git commit`，它经常把不相关的文件一起提交，或者 message 写得像流水账。

**解法**：[`/git-commit`](./skills/git-commit/SKILL.md) 派一个 agent 分析会话文件和 diff，返回结构化的提交建议（文件列表、改动摘要、拟定 message）；主线程只负责确认和执行。session 级别精准控制，分析与执行分离。

### 3. 计划写完就丢，执行靠人肉

写完计划或 handoff 文件后，得手动拆任务、逐个分配给 agent、盯进度、收结果。计划和执行之间全是手工活。

**解法**：[`/dispatch`](./skills/dispatch/SKILL.md) 读取计划或 GitHub issue，按依赖关系分层，逐层扇出给 Agent 子代理并行执行。失败自动汇报，层间自动推进，最终跑测试验证。

### 4. PRD 和 issue 写成一次性文档，后续没人用

PRD 堆在仓库里吃灰，拆任务时还得手动建 issue，agent 也不知道该读哪份文档、该打什么标签。

**解法**：[`/setup-ouuyangjiahong-skills`](./skills/setup-ouuyangjiahong-skills/SKILL.md) 先配置好 issue tracker、分诊标签和领域文档约定；[`/to-prd`](./skills/to-prd/SKILL.md) 把当前对话整理成结构化 PRD 发布到 tracker；[`/to-issues`](./skills/to-issues/SKILL.md) 再把 PRD 拆成可独立认领的垂直切片 issue。

### 5. Session 中断后，下个 agent 接不住

长对话做到一半中断，新 session 要重复大量上下文。

**解法**：[`/handoff`](./skills/handoff/SKILL.md) 把当前会话压缩成交接文档（下一步建议、依赖关系、关联 issue），让 dispatch 按 `handoff-*.md` 模式接手继续。

### 6. 设计讨论浮于表面，术语和决策没人记录

讨论计划时术语混用、边界模糊，重要架构决定口头说说就过了。

**解法**：[`/grilling`](./skills/grilling/SKILL.md) 对计划或设计进行高强度追问；[`/grill-with-docs`](./skills/grill-with-docs/SKILL.md) 在追问过程中同步用 [`/domain-modeling`](./skills/domain-modeling/SKILL.md) 维护 `CONTEXT.md` 和 ADR，把领域语言落到文档里。

## 典型工作方式

作为研究者，拿到一个仓库后通常按下面顺序使用这些 skill：

1. **初始化仓库认知**：先跑 [`/setup-ouuyangjiahong-skills`](./skills/setup-ouuyangjiahong-skills/SKILL.md)，配置 issue tracker、分诊标签和领域文档布局，让 agent 对仓库有基本约定。
2. **注入写作与编码规范**：再跑 [`/sync-writing-standards`](./skills/sync-writing-standards/SKILL.md)，把统一的交流语言、写作要求和编码准则写入 `CLAUDE.md` / `AGENTS.md`。
3. **讨论要做的事**：不管仓库里是否已有代码，都可以用 [`/grill-with-docs`](./skills/grill-with-docs/SKILL.md) 围绕想实现的任务展开高强度讨论，同时用 [`/domain-modeling`](./skills/domain-modeling/SKILL.md) 沉淀术语和 ADR。
4. **产出 PRD**：讨论清楚后，用 [`/to-prd`](./skills/to-prd/SKILL.md) 把结论整理成 PRD 并发布到 issue tracker，评估是否需要用 issue 跟踪后续工作。
5. **拆解任务**：PRD 发布后，用 [`/to-issues`](./skills/to-issues/SKILL.md) 把需求拆成可独立认领的垂直切片 issue。
6. **接力或继续执行**：上下文太长就用 [`/handoff`](./skills/handoff/SKILL.md) 生成交接文档，供新会话的 [`/dispatch`](./skills/dispatch/SKILL.md) 接手；否则直接继续用 `/dispatch` 推进。
7. **提交并闭环**：任务完成后，用 [`/git-commit`](./skills/git-commit/SKILL.md) 提交改动，并关闭/评论相关 issue，完成闭环。

## Skill 列表

| Skill | 作用 | 触发词 |
|---|---|---|
| [dispatch](./skills/dispatch/SKILL.md) | 读取计划或 issue，按依赖分层，逐层并行执行 | `dispatch`、`run agents`、`swarm` |
| [git-commit](./skills/git-commit/SKILL.md) | 分析会话文件和 diff，给出结构化提交建议 | `git commit`、`commit`、`提交` |
| [sync-writing-standards](./skills/sync-writing-standards/SKILL.md) | 把交流语言、写作要求、编码准则注入 `CLAUDE.md` | `sync-writing-standards` |
| [handoff](./skills/handoff/SKILL.md) | 把当前会话压缩成交接文档，供 dispatch 接手 | `handoff` |
| [to-prd](./skills/to-prd/SKILL.md) | 把当前对话整理成 PRD，发布到 issue tracker | `to-prd` |
| [to-issues](./skills/to-issues/SKILL.md) | 把计划或 PRD 拆成垂直切片 issue | `to-issues` |
| [setup-ouuyangjiahong-skills](./skills/setup-ouuyangjiahong-skills/SKILL.md) | 配置 issue tracker、分诊标签、领域文档约定 | `setup-ouuyangjiahong-skills` |
| [grilling](./skills/grilling/SKILL.md) | 对计划或设计进行高强度追问 | `grill` |
| [grill-with-docs](./skills/grill-with-docs/SKILL.md) | 追问打磨计划，同时维护领域文档 | `grill-with-docs` |
| [domain-modeling](./skills/domain-modeling/SKILL.md) | 构建和打磨领域模型，维护 `CONTEXT.md` 与 ADR | `domain-modeling` |
| [write-skill](./skills/write-skill/SKILL.md) | 按仓库规范编写或审查 SKILL.md | `write-skill`、`写 skill`、`skill 模板` |

## 推荐

- **[mattpocock/skills](https://github.com/mattpocock/skills)**：软件工程基本功合集，对齐需求、共享语言、TDD、调试、代码架构、PRD、issue 分诊等。同样强调小、可组合、基于工程经验。

## 目录结构

```
skills/<name>/SKILL.md          # skill 源码，单一事实来源
skills/<name>/references/       # 引用材料（可选）
.claude-plugin/plugin.json      # 插件清单（CLI 读取入口）
scripts/                        # 辅助脚本
```

## 新增 Skill

1. 在 `skills/<name>/` 下创建 `SKILL.md`（含 frontmatter：`name`、`description`）。写作规范见 [`docs/skill-writing.md`](./docs/skill-writing.md)，可从 [`docs/templates/SKILL.md`](./docs/templates/SKILL.md) 复制骨架起步
2. 在 `.claude-plugin/plugin.json` 的 `skills` 数组里加一行（必须以 `./` 开头）
3. 重跑 `npx skills add cislunarspace/skills`
