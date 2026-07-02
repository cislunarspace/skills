# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

我的日常 Claude Code skills —— 小、可组合、基于实际工程习惯，不是 vibe coding。

> 当前包含 2 个 skill，持续迭代中。

## 快速开始

```bash
npx skills@latest add cislunarspace/skills
```

CLI 会读取 `.claude-plugin/plugin.json`，把所有 skill 软链到 `~/.claude/skills/`。

安装后在 agent 中即可直接使用 `/sync-writing-standards`、`/git-commit` 等命令。

## 为什么做这些 Skill

### #1：Agent 用词随意，风格不一致

**问题**：每次开新 session，agent 的用词、语气、编码风格都不一样。上一个 session 写的 CLAUDE.md 规范，下个 session 就忘了。

**解法**：[`/sync-writing-standards`](./skills/sync-writing-standards/SKILL.md) —— 把预定义的交流语言、写作要求、编码准则注入当前仓库的 `CLAUDE.md`。一次注入，后续 session 自动遵守，不用反复提醒。

### #2：Git 提交范围失控

**问题**：让 agent 跑 `git commit`，它经常把不相关的文件一起提交，或者 commit message 写得像流水账。

**解法**：[`/git-commit`](./skills/git-commit/SKILL.md) —— 派出一个 agent 分析会话文件和 diff，返回结构化的 commit 建议（文件列表、改动摘要、拟定的 message）；主线程只负责确认和执行。session 级别的精准控制，分析与交互分离。

## 参考

- **[git-commit](./skills/git-commit/SKILL.md)** — 派出 agent 分析会话文件和 diff，返回结构化 commit 建议；主线程确认后执行提交。触发词：`git commit`、`commit`、`提交`。
- **[sync-writing-standards](./skills/sync-writing-standards/SKILL.md)** — 将预定义的交流语言、写作要求、编码准则注入当前仓库的 `CLAUDE.md`，确保所有 session 保持一致的风格和规范。触发词：`sync-writing-standards`。

## 推荐

- **[mattpocock/skills](https://github.com/mattpocock/skills)** — 软件工程基本功合集：对齐需求（grilling）、共享语言、TDD、调试、代码架构、PRD、issue 分诊等。强调小、可组合、基于工程经验，不是 vibe coding。

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
3. 重跑 `npx skills@latest add cislunarspace/skills`
