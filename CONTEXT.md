# Context

## Skill

A self-contained unit of agent behaviour, defined by a `SKILL.md` (with YAML frontmatter: `name`, `description`) and optional `references/`. Each skill lives at `skills/<name>/`.

## Plugin

A manifest at `.claude-plugin/plugin.json` listing skill paths. Lets the repo be loaded as a unit by agent harnesses that read the plugin format.

## Linking

Installing means creating symlinks from local skill directories (`~/.claude/skills`, `~/.cc-switch/skills`) back into `skills/<name>/` in this repo. Symlinks make the repo the single source of truth: `git pull` updates the installed copies. Run `npm run link` to (re)create them.