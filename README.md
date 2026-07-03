# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

一套给 Claude Code 用的 Agent skills，小、可组合，基于日常工程习惯，不是 vibe coding。

当前包含 3 个 skill，持续迭代中。

## 快速开始

```bash
npx skills add cislunarspace/skills
```

CLI 会读取 `.claude-plugin/plugin.json`，把 skill 软链到 `~/.claude/skills/`。安装后，在 agent 里直接用 `/dispatch`、`/sync-writing-standards`、`/git-commit` 等命令。

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

## Skill 列表

| Skill | 作用 | 触发词 |
|---|---|---|
| [dispatch](./skills/dispatch/SKILL.md) | 读取计划或 issue，按依赖分层，逐层并行执行 | `dispatch`、`run agents`、`swarm` |
| [git-commit](./skills/git-commit/SKILL.md) | 分析会话文件和 diff，给出结构化提交建议 | `git commit`、`commit`、`提交` |
| [sync-writing-standards](./skills/sync-writing-standards/SKILL.md) | 把交流语言、写作要求、编码准则注入 `CLAUDE.md` | `sync-writing-standards` |

## 推荐

- **[mattpocock/skills](https://github.com/mattpocock/skills)** — 软件工程基本功合集：对齐需求、共享语言、TDD、调试、代码架构、PRD、issue 分诊等。同样强调小、可组合、基于工程经验。

## 目录结构

```
skills/<name>/SKILL.md          # skill 源码，单一事实来源
skills/<name>/references/       # 引用材料（可选）
.claude-plugin/plugin.json      # 插件清单（CLI 读取入口）
scripts/                        # 辅助脚本
```

## 新增 Skill

1. 在 `skills/<name>/` 下创建 `SKILL.md`（含 frontmatter：`name`、`description`）
2. 在 `.claude-plugin/plugin.json` 的 `skills` 数组里加一行（必须以 `./` 开头）
3. 重跑 `npx skills add cislunarspace/skills`
