---
name: git-commit
description: 只提交当前会话改动的文件，避免无关文件被一起提交。当用户说"git commit"、"commit"、"提交"或要求提交改动时使用。
---

# Git Commit

只提交当前会话改动的文件。`scripts/get-session-files.js` 负责判断范围（支持 Claude Code 与 Kimi Code 的会话追踪）。

## 工作流程

### 1. 分析并起草

用 `Agent()` 派子代理分析，主线程等待返回。

子代理要做的事：

1. 获取会话文件
   - 运行 `node <skill-base>/scripts/get-session-files.js "$PWD"`（`<skill-base>` 用已加载 skill 的绝对路径）
   - 若返回 `无日志` / `无会话ID`，回退到从对话推断（扫描 `Write`、`Edit`、`MultiEdit`、`NotebookEdit` 调用提取路径）
   - 若返回 `空`，将 `proposed_message` 设为空

2. 运行 `git diff --name-only`，找出不在 `SESSION_FILES` 中的脏文件。

3. 运行 `git diff --stat` 和 `git diff`，查看 `SESSION_FILES` 的实际改动。

4. 起草 commit message，遵循项目格式（见 `references/git-workflow.md`，若存在）。若改动包含多个独立关注点，为每个关注点起草独立 message。

5. 写出改动摘要。

6. 从对话上下文中识别关联的 issue 编号（用户提到的 `#N`、issue 链接、issue 标题等）。

返回结构：

| 字段 | 含义 |
|------|------|
| `session_files` | 会话文件列表 |
| `summary` | 改动摘要 |
| `proposed_message` | 拟定的 commit message，可为空 |
| `out_of_session_files` | 不在会话范围内的脏文件，可为空 |
| `edge_cases` | 边界情况说明，可为空 |
| `related_issues` | 从对话中识别的 issue 编号列表，可为空 |

完成条件：主线程收到上述结构化结果。

### 2. 确认并提交

1. 展示子代理的分析结果。
2. 若有 `out_of_session_files`，问用户是否包含。
3. 展示 `proposed_message`，等用户明确同意 —— 绝不自行提交。
4. 用明确路径暂存并提交：

```bash
git add <file1> <file2> ...
git commit -m "type: description"
```

**绝不用** `git add -A` 或 `git add .`。

### 3. 验证

```bash
git status -- <SESSION_FILES>
git log --oneline -3
```

确认 `SESSION_FILES` 已干净。其他脏文件已在步骤 2 中处理或排除，这里忽略。

### 4. 关闭相关 issues

使用子代理返回的 `related_issues`。

若列表为空，跳过。

否则，对每个编号运行 `gh issue view <N>` 检查状态，跳过不存在或已关闭的。

仍有打开的 issue 时：

1. 展示 issue 列表（编号、标题、状态）。
2. 问用户确认关闭哪些 —— 不自行关闭。
3. 用户确认后逐个关闭：

```bash
gh issue close <N> --comment "已在 [<commit-sha>](<commit-url>) 中完成"
```

`<commit-url>` 从 `git remote get-url origin` 推导，例如 `https://github.com/owner/repo/commit/<sha>`。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 没有会话文件被改动 | 不提交，告知用户 |
| 会话文件存在合并冲突 | 不提交，先解决冲突 |
| 大 diff（超过 20 个文件） | 确认一次提交还是拆分 |
| 会话日志里出现新的未跟踪文件 | 自动包含进来 |
| issue 编号在 GitHub 上不存在 | 静默跳过 |
| 所有关联 issue 已关闭 | 跳过步骤 4 |

## 下一步

- 提交到分支后：把分支推到远端并合并到默认分支用 `/open-pr`
