---
name: git-commit
description: 暂存并提交当前会话中修改的文件。当用户说"git commit"、"commit"、"提交"或要求提交改动时使用。
category: github
---

# Git Commit

会话范围：只提交本次会话改动的文件。`scripts/get-session-files.js` 是判断范围的依据（支持 Claude Code 与 Kimi Code 会话追踪）。

## 工作流程

### 1. 分析并起草

用 `Agent()` 派出子代理做分析。**主线程不做分析，等子代理返回。**

子代理的 prompt：

1. 运行 `node <skill-base>/scripts/get-session-files.js "$PWD"`（`<skill-base>` 用已加载 skill 显示的绝对路径）获取 `SESSION_FILES`。若返回 `NO_LOG` / `NO_SESSION_ID`，回退到从对话推断（扫描 `Write`、`Edit`、`MultiEdit`、`NotebookEdit` 调用提取路径）。若返回 `EMPTY`，将 `proposed_message` 设为空。
2. 运行 `git diff --name-only`，收集不在 `SESSION_FILES` 中的脏文件。
3. 运行 `git diff --stat` 和 `git diff` 查看 `SESSION_FILES` 的改动。
4. 起草 commit message，遵循项目格式（见 `common/git-workflow.md`）。若改动包含独立的关注点，为每个关注点起草独立的 message。
5. 写出改动摘要。
6. 从对话上下文中识别关联的 issue 编号（用户提到的 `#N`、issue 链接、issue 标题等）。

子代理返回结构：

| 字段 | 含义 |
|------|------|
| `session_files` | 会话文件列表 |
| `summary` | 改动摘要 |
| `proposed_message` | 拟定的 commit message，可为空 |
| `out_of_session_files` | 不在会话范围内的脏文件，可为空 |
| `edge_cases` | 边界情况说明，可为空 |
| `related_issues` | 从对话中识别的 issue 编号列表，可为空 |

**完成条件**：主线程收到子代理返回的结构化结果。

### 2. 确认并提交

1. 展示子代理的分析结果。
2. 若有 `out_of_session_files`，问用户是否包含。
3. 展示拟定的 message，等用户明确同意 —— 绝不自行提交。
4. 暂存并提交：

```bash
git add <file1> <file2> ...   # 只用明确路径 —— 绝不用 git add -A / git add .
git commit -m "type: description"
```

### 3. 验证

```bash
git status -- <SESSION_FILES>
git log --oneline -3
```

确认 `SESSION_FILES` 已干净。忽略其他脏文件 —— 它们在步骤 2 中已经处理（或被排除）。

### 4. 关闭相关 issues

使用步骤 1 子代理返回的 `related_issues`。

若列表为空，跳过此步骤。

对每个编号，运行 `gh issue view <N>` 检查状态。跳过不存在或已关闭的。

若仍有打开的 issue：

1. 展示 issue 列表（编号、标题、状态）。
2. 询问用户确认哪些要关闭 —— 不自行关闭。
3. 用户确认后，逐个关闭：

```bash
gh issue close <N> --comment "已在 [<commit-sha>](<commit-url>) 中完成"
```

其中 `<commit-url>` 从 `git remote get-url origin` 推导（如 `https://github.com/owner/repo/commit/<sha>`）。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 没有会话文件被改动 | 不提交，告知用户 |
| 会话文件存在合并冲突 | 不提交，先解决冲突 |
| 大 diff（超过 20 个文件） | 确认：一次提交还是拆分？ |
| 日志中出现新的未跟踪文件 | 自动包含进来 |
| issue 编号在 GitHub 上不存在 | 静默跳过，不报错 |
| 所有关联 issue 已关闭 | 跳过步骤 4 |
