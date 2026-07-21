---
name: open-pr
description: 把本地分支推到远端并完成 PR 合并的完整生命周期——push 分支、开 PR、自动 code review、合并、清理 worktree 与本地分支。当用户说"开 PR"、"提 PR"、"open PR"、"提交分支到 master"，或在一个分支上完成工作后希望端到端落地时使用。
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

### 2. Push 分支

始终 push（`git push` 没有新 commit 时天然 no-op，无需自己做判断）：

```bash
git push origin <branch>
```

### 3. 开 PR

#### 3a. 识别 base 分支

```bash
git remote show origin | grep "HEAD branch"
```

若查询失败，回退到 master。

#### 3b. 找关联 issue

```bash
git log <base>..<branch> --pretty=%s
```

从 commit message 中抓 `#N` 编号（如 `重构(#335): ...`）。

#### 3c. 起草 PR body

包含三段：关联（Closes #N 或无）、改了什么（要点列表）、测试（命令与结果）。可用 `gh pr create --fill` 自动填充，或手工写。

#### 3d. 开 PR

先检查是否已有 PR：

```bash
gh pr list --head <branch> --json url,number --jq '.[0].url'
```

若已有 PR URL，直接用，跳过创建。

否则创建：

```bash
gh pr create --base <base> --head <branch> \
  --title "<从 git log <base>..<branch> 提取第一条 commit message 作为标题>" \
  --body "<上面 body>"
```

打印 PR URL。

### 4. 自动 Code Review

**PR 开后自动执行评审**——不再只是打印建议。

调用 `/code-review` skill，以 `git merge-base <base> <branch>` 作为固定点，评审规范（编码准则）与规格（需求实现）两轴。

> 实现方式：按 `skills/engineering/code-review/SKILL.md` 的流程执行——钉住固定点、找规格来源、找规范来源、并行起两个子代理（规范 + 规格）、汇总报告。

### 5. 根据评审结果决定下一步

汇总报告出来后，按严重程度分类：

| 严重程度 | 含义 | 动作 |
|---------|------|------|
| 🔴 阻塞 | 安全漏洞、数据丢失风险、功能实现错误 | **停！** 打印发现，让用户修完再跑 |
| 🟡 建议 | 代码坏味、风格问题、可维护性 | 提一嘴，不阻塞，继续推进 |

**判定规则：**
- 规范轴：遍历每条发现，问自己"**这会导致生产事故吗？**"——是则阻塞（如安全漏洞、数据丢失、崩溃风险），否则建议。code-smells-baseline 里的坏味（"神秘命名""重复代码"等）默认不阻塞，除非子代理论证了它会产生生产事故。
- 规格轴：缺失需求、范围蔓延、实现不对 → 阻塞。
- 两轴均无阻塞发现 → 继续推进到 step 6。

**阻塞时打印：**

```
🔴 Code review 发现以下阻塞问题，请先修复再合并：

## 阻塞项
- [ ] <问题 1>（来源：规范/规格）
- [ ] <问题 2>

## 非阻塞建议
- <建议 1>
- <建议 2>

修复后重新跑 /open-pr 继续。
```

**无阻塞时打印：**

```
✅ Code review 通过，无阻塞问题。
  - 规范轴：<N> 条建议
  - 规格轴：<N> 条建议
现在推进合并。
```

然后继续 step 6。

### 6. 等待 CI 通过

合并前检查 CI 状态：

```bash
gh pr checks <PR-number>
```

| CI 结果 | 处理方式 |
|---------|----------|
| 全部通过 | 继续 step 7 |
| 有失败 | **停！** 打印失败项，让用户修复后重新 push，再跑 `/open-pr` |
| 仍在运行 | 打印"等待 CI..."并轮询（最多 5 分钟，每 30 秒查一次）。超时后提示用户手动检查 |

CI 全部通过后打印 `✅ CI 通过`，继续 step 7。

### 7. 合并

**停下来问用户：**

```
PR 已开：<url>
Code review 已通过。
CI 已通过。

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

### 8. 清理

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
| PR 已存在 | 用 `gh pr list --head <branch>` 取已有 PR URL，跳过 step 3d，直接进 step 4 |
| PR 描述里没有关联 issue（commit message 不含 `#N`） | body 段"关联"写"无关联 issue"，继续 |
| code-review 发现阻塞问题 | 停下来，列出阻塞项让用户修复 |
| code-review 子代理执行失败 | 打印错误信息，问用户"跳过评审直接合并？(y/n)"——用户确认后才继续 |
| CI 失败 | 停下来，打印失败项让用户修复 |
| CI 超时 | 提示用户手动检查 `gh pr checks`，继续 merge 流程 |

## Checkpoint

**必须停下来等用户的三处：**

- step 5：code-review 发现阻塞问题时停下，让用户修复
- step 5：code-review 子代理执行失败时，问用户是否跳过评审
- step 7：merge 模式选择（squash / merge / rebase）

**自己做完再汇报的三处：**

- step 2（push）、step 3（开 PR）、step 4（code-review）、step 6（等待 CI）

**绝不自行执行的：**

- step 7 的 merge——不可逆操作，等用户明确说哪种模式
- 任何 `git reset --hard`、`git push --force`、`gh pr close` 之类破坏性命令

## 完成条件

- [ ] 远端分支已 push
- [ ] PR 已开（拿到 PR URL）
- [ ] Code review 已完成，无阻塞问题（有阻塞则停在 step 5）
- [ ] CI 已通过（有失败则停在 step 6）
- [ ] PR 已按用户选择的方式合并（merge / squash / rebase）
- [ ] 本地分支已删
- [ ] worktree 已清理（如适用）
- [ ] `git branch` 不再列出该分支
- [ ] `git worktree list` 不再列出该 worktree

逐条打印验证结果给用户。

## 下一步

- 这一轮工作到此结束：若想给下次会话留上下文，跑 `/handoff`
- worktree 没清干净：手动跑 `git worktree remove <path>`