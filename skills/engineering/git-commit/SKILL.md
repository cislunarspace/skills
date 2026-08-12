---
name: git-commit
description: 只提交本会话改动的文件。
disable-model-invocation: true
---

从本会话的 `Write`、`Edit` 调用识别改动文件；不扫描会话转录或运行脚本。

## 流程

### 1. 检查

1. 从对话上下文列出本会话修改或新建的仓库文件。
2. 运行 `git worktree list` 与 `git rev-parse --abbrev-ref HEAD`，记录当前所在 worktree 与分支。会话文件路径不在当前 cwd 所在 worktree 内（典型：误指向主仓库目录）时，停止并说明——提交将落到错误分支。
3. 运行 `git diff --name-only`，识别不在该列表中的脏文件；它们属于会话外改动。
4. 运行 `git diff --stat` 和 `git diff -- <会话文件>`，确认每项改动都应提交。
5. 读取 `references/git-workflow.md`（存在时），据此起草 commit message；没有该文件则用常规格式。
6. 从对话上下文识别关联 issue（`#N` 或 issue 链接）。

会话文件为空、存在冲突，或 diff 与本会话目标不符时，停止并说明原因。

### 2. 确认并提交

1. 展示会话文件、会话外脏文件、改动摘要、当前分支和拟议 commit message。
2. 会话外脏文件存在时，询问是否纳入；默认不纳入。
3. 等用户明确确认 message 和文件范围后执行提交。
4. 使用明确路径暂存并提交：`git add <file1> <file2> ... && git commit -m "<message>"`。不使用 `git add -A` 或 `git add .`。

超过 20 个文件或改动包含多个独立关注点时，先建议拆分提交并等待决定。

### 3. 验证

运行：

```bash
git status -- <会话文件>
git log --oneline -3
git branch --show-current
```

确认已提交的会话文件不再有未提交改动，且提交落在第 1 步确认的分支上（`git branch --show-current`）。

### 4. 关闭关联 issue

没有关联 issue 时跳过。否则逐个运行 `gh issue view <N>`，跳过不存在或已关闭的 issue；列出仍打开的 issue，待用户确认后再执行：

```bash
gh issue close <N> --comment "已在 <commit-sha> 中完成"
```

`<commit-sha>` 来自 `git rev-parse HEAD`。
