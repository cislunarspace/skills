Skills 集中在 `skills/` 目录。每个 skill 一个目录，目录名即 skill 名；内部固定有 `SKILL.md`，可选 `references/` 放引用材料。

安装：跑 `npx skills add cislunarspace/skills`，把 skill 软链到 `~/.claude/skills/`。链接是软链，`git pull` 自动同步。

新增 skill：在 `skills/<name>/` 下放 `SKILL.md`，在 `.claude-plugin/plugin.json` 的 `skills` 数组里加一行，重跑 `npx skills add cislunarspace/skills`。

## Agent skills

### Issue tracker

GitHub Issues, with external PRs also treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: read `CONTEXT.md` at the repo root and `docs/adr/` for architectural decisions. See `docs/agents/domain.md`。