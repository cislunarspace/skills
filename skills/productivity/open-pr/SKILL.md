---
name: open-pr
description: 将完成的分支推送、创建 PR、评审、合并并清理。用户要求开 PR、提 PR 或合并分支时手动运行。
argument-hint: "[分支名]（可选，默认当前分支）"
disable-model-invocation: true
---

将一个已完成的分支推进到默认分支。按顺序执行；在阻塞问题、失败 CI 和合并前停下。

## 1. 确认分支

1. 使用参数中的分支名；没有参数则运行 `git rev-parse --abbrev-ref HEAD`。
2. 用 `git remote show origin` 识别默认分支；查询失败时使用 `master`。
3. 当前分支是默认分支、没有 GitHub remote，或 `git log <base>..<branch> --oneline` 为空时，停止并说明原因。

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

仅在 PR 已合并后执行：

```bash
git checkout <base>
git pull origin <base>
git push origin --delete <branch> 2>/dev/null || true
git branch -d <branch>
```

报告以下可验证结果：远端分支已推送、PR URL、评审结论、CI 状态、合并方式，以及本地分支是否已删除。

## 边界

- 不执行 `git reset --hard`、`git push --force` 或 `gh pr close`。
- GitLab 或本地仓库不走本 skill 的 GitHub 流程。
- 用户要求的不是合并而只是创建 PR 时，在创建并报告 PR URL 后停止。
