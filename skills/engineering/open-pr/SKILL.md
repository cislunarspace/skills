---
name: open-pr
description: 把本地分支推到远端并完成 PR 合并的完整生命周期——push 分支、开 PR、合并、清理 worktree 与本地分支。当用户说"开 PR"、"提 PR"、"open PR"、"提交分支到 master"，或在一个分支上完成工作后希望端到端落地时使用。
argument-hint: "[分支名]（可选，默认当前分支）"
disable-model-invocation: true
---

# Open PR

把本地分支推到远端、开 PR、合并到默认分支，清理 worktree 与本地分支。

## 工作流程

### 1. 锁定分支

- 若用户传 `<branch-name>` 作为参数，用它
- 否则用 `git rev-parse --abbrev-ref HEAD` 读当前分支
- 若当前在默认分支（`master` / `main`），停下来告诉用户"需要先在分支上工作"，让用户开新分支或传分支名
- 若分支已在远端跟踪（`git rev-parse --abbrev-ref --symbolic-full-name @{u}` 成功），跳过 step 3，直接进 step 4 开 PR

### 2. 提示先 review

**不在 skill 内调 `/code-review`**——把它推荐给用户，打印建议后直接继续进 step 3。

打印：

```
建议先运行 /code-review <branch> 评审，再开 PR。
现在继续 push 分支。
```

### 3. Push 分支

```bash
git push origin <branch>
```

### 4. 开 PR

#### 4a. 识别 base 分支

```bash
git remote show origin | grep "HEAD branch"
```

若查询失败，回退到 master。

#### 4b. 找关联 issue

```bash
git log <base>..<branch> --pretty=%s
```

从 commit message 中抓 `#N` 编号（如 `重构(#335): ...`）。

#### 4c. 起草 PR body

包含三段：关联（Closes #N 或无）、改了什么（要点列表）、测试（命令与结果）。可用 `gh pr create --fill` 自动填充，或手工写。

#### 4d. 开 PR

```bash
gh pr create --base <base> --head <branch> \
  --title "<从 git log <base>..<branch> 提取第一条 commit message 作为标题>" \
  --body "<上面 body>"
```

打印 PR URL。

### 5. 合并

**停下来问用户：**

```
PR 已开：<url>

选择合并模式：
- squash（默认）：多 commit 合成 1 条
- merge：保留 commit 历史
- rebase：rebase 到最新 base 再合并
```

按用户选择执行：

```bash
gh pr merge <PR-number> --squash --delete-branch
# 或
gh pr merge <PR-number> --merge --delete-branch
# 或
gh pr merge <PR-number> --rebase --delete-branch
```

### 6. 清理

仅当 PR 已合并时执行：

```bash
# 切回 base 分支
git checkout <base>
git pull origin <base>

# 删远端分支（若 merge 命令未加 --delete-branch）
git push origin --delete <branch> 2>/dev/null || true

# 删本地分支
git branch -d <branch>

# 删 worktree（如果在 worktree 里工作的）
git worktree remove <worktree-path> 2>/dev/null || true
git worktree prune
```

`worktree-path` 通过 `git worktree list` 查找包含 `<branch>` 的行，提取第一列作为路径。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 当前在默认分支（master/main） | 停下来告诉用户需要分支名 |
| 分支未领先 base（没有新 commit） | 停下来告诉用户，无需开 PR |
| `gh` CLI 未登录 | 提示用户运行 `gh auth login` 后重试 |
| PR 合并时检测到冲突 | 停下来，让用户先在另一个会话跑 `/resolving-merge-conflicts` |
| 仓库无 GitHub remote（gitlab / 本地） | 停下来，告诉用户该 skill 只支持 GitHub flow |
| PR 描述里没有关联 issue（commit message 不含 `#N`） | body 段"关联"写"无关联 issue"，继续 |

## Checkpoint

**必须停下来等用户的两处：**

- step 2：打印建议后直接继续（不等用户响应）
- step 5：merge 模式选择（squash / merge / rebase）

**自己做完再汇报的两处：**

- step 3（push）、step 4（开 PR）

**绝不自行执行的：**

- step 5 的 merge——不可逆操作，等用户明确说哪种模式
- 任何 `git reset --hard`、`git push --force`、`gh pr close` 之类破坏性命令

## 完成条件

- [ ] 远端分支已 push
- [ ] PR 已开（拿到 PR URL）
- [ ] PR 已按用户选择的方式合并（merge / squash / rebase）
- [ ] 本地分支已删
- [ ] worktree 已清理（如适用）
- [ ] `git branch` 不再列出该分支
- [ ] `git worktree list` 不再列出该 worktree

逐条打印验证结果给用户。

## 下一步

- 这一轮工作到此结束：若想给下次会话留上下文，跑 `/handoff`
- worktree 没清干净：手动跑 `git worktree remove <path>`