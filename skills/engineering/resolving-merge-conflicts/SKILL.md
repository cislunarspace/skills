---
name: resolving-merge-conflicts
description: 解决进行中的 git merge/rebase 冲突。当用户遇到 merge 或 rebase 冲突、说"解决冲突"时使用。
---

# 解决 merge/rebase 冲突

1. **看清当前状态**。检查 merge/rebase 进度、git 历史、冲突文件。

2. **找每个冲突的一手资料**。逐处搞清楚改动为什么这么写、原意是什么——读 commit message、查 PR、查原始 issue/ticket。

3. **逐 hunk 解决**。能同时保留两边意图就保留；不可调和时，选符合本次合并既定目标的那一边，并记下取舍。**不要**借机发明新行为。每个冲突都要解决，绝不 `--abort`。

4. **跑项目的自动化检查**。通常是 typecheck，再测试，再格式化。修掉 merge 弄坏的地方。

5. **收尾**。stage 全部改动并提交。如果是 rebase，继续推进，直到所有 commit 都 rebase 完成。

## 下一步

- 冲突解决完：再跑一次 `/code-review` 确认合并后的改动合理
- 合并后改动通过 review：提交用 `/git-commit`
