---
name: implement
description: 基于 spec 或一组 ticket 执行一段实现工作。当用户说"implement"、传入 spec/ticket 要求实现，或要把规划落地为代码时使用。
disable-model-invocation: true
---

# Implement

按用户在 spec 或 ticket 中描述的内容实现这段工作。

- 尽量用 `/tdd` 推进，在事先约定好的测试切面下钩子。
- 定期跑类型检查和单个测试文件；全部写完后跑一遍完整测试套件。
- 完成后用 `/code-review` 审查本次改动。
- 把工作提交到当前分支。

## 下一步

- 写代码的过程里：按测试先行的方式推进用 `/tdd`
- 写完一段改动：审一遍用 `/code-review`
- 改动通过 review：提交用 `/git-commit`
