---
name: git-commit
description: 暂存并提交当前 Claude Code 会话中修改的文件。当用户说"git commit"、"commit"、"提交"或要求提交改动时使用。
category: github
---

# Git Commit

会话范围：只提交本次会话改动的文件。`scripts/get-session-files.js` 是判断范围的依据。

## 工作流程

### 1. 获取会话文件

在仓库根目录运行 `node <skill-base>/scripts/get-session-files.js "$PWD"`，`<skill-base>` 用已加载 skill 显示的绝对路径。

- **JSON 数组** → 作为 `SESSION_FILES`。
- **NO_LOG / NO_SESSION_ID** → 回退到 1b。
- **EMPTY** → 询问用户要提交什么；不要猜测。

#### 1b. 回退：从对话推断

1. 扫描对话中的 `Write`、`Edit`、`MultiEdit`、`NotebookEdit` 工具调用，提取路径。
2. 提示："会话文件追踪未配置，文件列表可能不完整。"
3. 用推断的列表作为 `SESSION_FILES`。

### 2. 检查会话外的改动

```
git diff --name-only
```

若有脏文件不在 `SESSION_FILES` 中 → 列出它们，问"要把这些也包含进来吗？"。全部干净 → 直接继续。

### 3. 查看 diff

```
git diff --stat -- <SESSION_FILES>
git diff -- <SESSION_FILES>
```

读到足以了解改了什么、是否需要配套测试即可。

### 4. 起草 commit message

遵循项目的 commit 格式（见 `common/git-workflow.md`）。正文写类型、范围、为什么改而不是改了什么。若会话文件包含独立的关注点（重构 + 新功能 + 修复），分开提交；原子性的改动放在一起。

### 5. 提交前确认

展示文件列表和拟定的 message，等用户明确同意 —— 绝不自行提交。

### 6. 暂存并提交

```bash
git add <file1> <file2> ...   # 只用明确路径 —— 绝不用 git add -A / git add .
git commit -m "type: description"
```

### 7. 验证

```bash
git status -- <SESSION_FILES>
git log --oneline -3
```

确认 `SESSION_FILES` 已干净。忽略其他脏文件 —— 它们在步骤 2 中已经处理（或被排除）。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 没有会话文件被改动 | 不提交，告知用户 |
| 会话文件存在合并冲突 | 不提交，先解决冲突 |
| 大 diff（超过 20 个文件） | 确认：一次提交还是拆分？ |
| 日志中出现新的未跟踪文件 | 自动包含进来 |