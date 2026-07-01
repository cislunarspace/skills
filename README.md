# skills

个人 Claude Code skill 仓库。

## 安装

用 [skills](https://github.com/vercel-labs/skills) CLI 装到 Claude Code：

```bash
npx skills add ouyangjiahong/skills
```

CLI 自动读 `.claude-plugin/plugin.json`，把仓库内所有 skill 软链到 `~/.claude/skills/`。

## 目录

```
skills/<name>/SKILL.md          # skill 源码，单一事实来源
skills/<name>/references/       # 引用材料
.claude-plugin/plugin.json      # 插件清单（CLI 读取入口）
scripts/link-skills.sh          # 本地软链脚本
scripts/list-skills.sh          # 列出 skill
CONTEXT.md                      # 领域术语
CLAUDE.md                       # 给本仓库 agent 读的约定
```

## Skills

### Model-invoked

- **[sync-writing-standards](./skills/sync-writing-standards/SKILL.md)** — 将预定义的交流语言、写作要求、编码准则注入当前仓库的 CLAUDE.md。

## 日常命令

```bash
npm run link    # 本地软链（无需 skills CLI 时使用）
npm run list    # 列出仓库内所有 skill
```

## 加新 skill

1. 在 `skills/<name>/` 下创建 `SKILL.md`（含 frontmatter：`name`、`description`）
2. 在 `.claude-plugin/plugin.json` 的 `skills` 数组里加一行（必须以 `./` 开头）
3. `npx skills add ouyangjiahong/skills`