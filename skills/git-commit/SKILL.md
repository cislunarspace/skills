---
name: git-commit
description: Stage and commit only the files modified in the current Claude Code session. Use when user says "git commit", "commit", "提交", or asks to commit changes.
category: github
---

# Git Commit

Session-scoped: commit only what this session touched. `scripts/get-session-files.js` is the source of truth for that scope.

## Workflow

### 1. Get session files

Run `node <skill-base>/scripts/get-session-files.js "$PWD"` from the repo root. Use the absolute skill path shown by the loaded skill.

- **JSON array** → `SESSION_FILES`.
- **NO_LOG / NO_SESSION_ID** → fall back to 1b.
- **EMPTY** → ask user what to commit; do not guess.

#### 1b. Fallback: infer from conversation

1. Scan conversation for `Write`, `Edit`, `MultiEdit`, `NotebookEdit` tool calls → extract paths.
2. Warn: "Session file tracking is not configured. File list may be incomplete."
3. Use inferred list as `SESSION_FILES`.

### 2. Catch out-of-session changes

```
git diff --name-only
```

Any dirty path not in `SESSION_FILES` → list them, ask "Include any of these?". All-clean → proceed silently.

### 3. Inspect the diff

```
git diff --stat -- <SESSION_FILES>
git diff -- <SESSION_FILES>
```

Read enough to know what changed and whether tests should exist alongside.

### 4. Draft the message

Follow the project's commit format (see `common/git-workflow.md`). Type, scope, why-not-what in the body. Split when the session files hold independent concerns (refactor + feature + fix); keep atomic changes together.

### 5. Confirm before committing

Show files + proposed message. Wait for explicit approval — never commit on the agent's own initiative.

### 6. Stage and commit

```bash
git add <file1> <file2> ...   # explicit paths only — never git add -A / git add .
git commit -m "type: description"
```

### 7. Verify

```bash
git status -- <SESSION_FILES>
git log --oneline -3
```

`SESSION_FILES` clean. Ignore other dirty files — they were already handled (or declined) in step 2.

## Edge cases

| Situation | Action |
|-----------|--------|
| No session files changed | Don't commit. Tell user. |
| Merge conflict in session files | Don't commit. Resolve first. |
| Large diff (>20 files) | Confirm: one commit or split? |
| New untracked file surfaced by the log | Include automatically. |