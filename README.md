# Skills

[![skills.sh](https://skills.sh/b/cislunarspace/skills)](https://skills.sh/cislunarspace/skills)

我的日常 Claude Code skills —— 小、可组合、基于实际工程习惯，不是 vibe coding。

> 当前包含 2 个 skill，持续迭代中。

## Quickstart（30 秒装好）

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

**解法**：[`/git-commit`](./skills/git-commit/SKILL.md) —— 只提交当前 session 修改过的文件，自动检测是否混入了无关变更，生成规范的 commit message，并在提交前确认。session 级别的精准控制。

## Reference

按调用方式分两类：**User-invoked** 只能你手动调用；**Model-invoked** 你和 agent 都能触发。

### User-invoked

- **[git-commit](./skills/git-commit/SKILL.md)** — 只提交当前 session 涉及的文件。自动校验范围、生成规范 commit message、提交前确认。触发词：`git commit`、`commit`、`提交`。

### Model-invoked

- **[sync-writing-standards](./skills/sync-writing-standards/SKILL.md)** — 将预定义的交流语言、写作要求、编码准则注入当前仓库的 `CLAUDE.md`，确保所有 session 保持一致的风格和规范。

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
