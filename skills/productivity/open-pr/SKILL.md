---
name: open-pr
description: 将完成的分支推送、创建 PR、评审、合并并清理。用户要求开 PR、提 PR 或合并分支时手动运行。
argument-hint: "[分支名]（可选，默认当前分支）"
disable-model-invocation: true
---

默认场景是 piw 创建的 worktree：分支 checkout 在独立 worktree 中，主仓库停留在 base 分支。前半程（推送、创建 PR、评审、CI、合并）在 worktree 内即可完成；清理阶段需要回到主仓库操作。按顺序执行；在阻塞问题、失败 CI 和合并前停下。

## 1. 确认分支与场景

1. 使用参数中的分支名；没有参数则运行 `git rev-parse --abbrev-ref HEAD`。
2. 用 `git remote show origin` 识别默认分支；查询失败时使用 `master`。
3. 用 `git worktree list` 识别场景：
   - 当前目录不是主仓库（属于某个列出的 worktree）→ worktree 场景（默认）；
   - 否则 → 普通场景。
4. 当前分支是默认分支、没有 GitHub remote，或 `git log <base>..<branch> --oneline` 为空时，停止并说明原因。

## 2. 推送并创建 PR

1. 执行 `git push origin <branch>`。
2. 检查已有 PR：

```bash
gh pr list --head <branch> --json url,number --jq '.[0]'
```

3. 已有 PR 时复用其 URL 和编号。否则：
   - 从 `git log <base>..<branch> --pretty=%s` 找关联 `#N`，并取第一条 commit message 作为标题。
   - 起草 body：关联 issue、改动摘要、测试命令及结果；没有关联 issue 时明确写无关联 issue。
   - 用 `gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"` 创建。
4. 报告 PR URL。

`gh` 未登录时提示用户运行 `gh auth login`；不要猜测或替代认证方式。

## 3. 评审

本轮会话已经对同一分支运行过 `/code-review` 时，复用结论；否则以 `git merge-base <base> <branch>` 为固定点运行 `/code-review`。

将安全漏洞、数据丢失或崩溃风险、规格缺失、范围蔓延和错误实现视为阻塞项。风格与可维护性建议不阻塞。

- 存在阻塞项：按来源列出阻塞项和非阻塞建议，停止等待修复。
- 评审执行失败：报告错误，询问用户是否跳过评审；只有明确同意才继续。
- 无阻塞项：报告评审结论，进入 CI。

## 4. CI

运行：

```bash
gh pr checks <PR-number>
```

- 全部通过：继续。
- 有失败：列出失败项，停止等待修复、push 后重跑本 skill。
- 仍在运行：每 30 秒重查一次，最多 5 分钟；超时后报告状态并等待用户决定，不能自行合并。

## 5. 合并

确认 PR、评审和 CI 均已通过后，展示 PR URL 并询问用户选择合并方式：`squash`（默认）、`merge` 或 `rebase`。

得到明确选择后执行：

```bash
gh pr merge <PR-number> --<mode> --delete-branch
```

合并冲突时停止，交由 `/resolving-merge-conflicts` 处理。

## 6. 清理与验证

仅在 PR 已合并后执行。

### worktree 场景（默认）

1. 在 worktree 内检查 `git status --porcelain`：
   - 有未提交/未跟踪改动 → 停止，列出改动并询问用户如何处理；不自动 `git worktree remove --force`。
   - 干净 → 继续。
2. 先切到主仓库并确认，**再**执行任何删除操作：

```bash
cd <主仓库路径>   # 用 git worktree list 确认路径
pwd              # 确认已离开 worktree
```

3. 此后所有命令一律用 `cd <主仓库路径> && ...` 前缀执行（防止 bash 工具 cwd 悬空）：

```bash
cd <主仓库路径> && git worktree remove <worktree路径>
cd <主仓库路径> && git worktree prune
cd <主仓库路径> && git checkout <base>   # 主仓库应已在 base；不在则切过去
cd <主仓库路径> && git pull origin <base>
cd <主仓库路径> && git branch -d <branch>
```

4. `git branch -d` 失败（squash 合并后常见，本地提交哈希不在 base 历史中）时，列出未合并提交并询问用户是否用 `-D` 强制删除，不自动执行。
5. 清理完成后确认 bash 工具 cwd 有效：`pwd` 应显示主仓库路径；若仍指向已删除的 worktree（报 Working directory does not exist），用 `cd <主仓库路径>` 修复，或提示用户新开会话。

### 普通场景

在主仓库依次执行：`git checkout <base>`、`git pull origin <base>`、`git branch -d <branch>`（同样不自动 `-D`）。

### 报告

报告以下可验证结果：远端分支已推送、PR URL、评审结论、CI 状态、合并方式、worktree 是否已移除、本地分支是否已删除。

## 边界

- 不执行 `git reset --hard`、`git push --force` 或 `gh pr close`。
- 不自动强制移除有未提交改动的 worktree；停下询问用户。
- 用户要求的不是合并而只是创建 PR 时，在创建并报告 PR URL 后停止。
