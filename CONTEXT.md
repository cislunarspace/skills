# Context

## Skill

A self-contained unit of agent behaviour, defined by a `SKILL.md` (YAML frontmatter: `name`, `description` required; `argument-hint`, `disable-model-invocation` optional) and optional `references/`. Each skill lives at `skills/<group>/<name>/`, grouped as `engineering` or `research`.

## Plugin

A manifest at `.claude-plugin/marketplace.json` grouping skill paths under `plugins[]` (Engineering, Research). Lets the repo be loaded as a unit by agent harnesses that read the plugin format.

## Linking

Installing means creating symlinks from `~/.claude/skills` back into `skills/<group>/<name>/` in this repo. Symlinks make the repo the single source of truth: `git pull` updates the installed copies. Run `npm run link` to (re)create them.