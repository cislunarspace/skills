---
name: git-commit
description: 只提交当前会话改动的文件。说 "git commit"、"commit"、"提交" 时使用。
---

只提交当前会话改动的文件。`scripts/get-session-files.js` 判断范围。

## 工作流程

### 1. 分析并起草

派子代理分析改动并起草 commit message。子代理做的事：

1. 运行 `node <skill-base>/scripts/get-session-files.js "$PWD"` 取会话文件列表。
2. `git diff --name-only` 找出不在会话文件中的脏文件。
3. `git diff --stat` 和 `git diff` 查看实际改动。
4. 起草 commit message。若 `references/git-workflow.md` 存在，遵循其格式；否则用常规格式。多个独立关注点则起草多条 message。
5. 写改动摘要。
6. 从对话上下文识别关联 issue（`#N` 或 issue 链接）。

`<skill-base>` 用已加载 skill 的绝对路径。无会话日志时回退到从对话推断（扫描 Write、Edit 调用提取路径）；会话文件为空时 `proposed_message` 留空。

等待子代理返回 session_files、summary、proposed_message、out_of_session_files、edge_cases、related_issues。

### 2. 确认并提交

1. 展示分析结果。
2. 有 `out_of_session_files` 时问用户是否包含。拒绝则只提交会话文件。
3. 展示 `proposed_message`，等用户明确同意再提交。
4. 始终用明确路径暂存并提交：`git add <file1> <file2> ... && git commit -m "..."`。不用 `git add -A` 或 `git add .`。

### 3. 验证

```bash
git status -- <SESSION_FILES>
git log --oneline -3
```

确认会话文件已干净。

### 4. 关闭相关 issues

`related_issues` 为空时跳过。

否则对每个编号跑 `gh issue view <N>` 检查——跳过不存在或已关闭的。仍有打开的 issue：

1. 列出编号、标题、状态。
2. 问用户确认关闭哪些。
3. 逐个关闭：`gh issue close <N> --comment "已在 <commit-sha> 中完成"`。

`<commit-sha>` 来自 `git rev-parse HEAD`，`<commit-url>` 格式为 `https://github.com/<owner>/<repo>/commit/<sha>`。

## 边界情况

| 情况 | 处理 |
|------|------|
| 没有会话文件被改动 | 不提交，告知用户 |
| 会话文件存在合并冲突 | 不提交，先解决冲突 |
| 超过 20 个文件 | 确认一次提交还是拆分 |
| 会话日志出现新未跟踪文件 | 自动包含 |
| issue 编号在 GitHub 不存在 | 静默跳过 |
| 所有关联 issue 已关闭 | 跳过步骤 4 |

## 下一步

提交到分支后，推到远端并合并到默认分支用 `/open-pr`。
