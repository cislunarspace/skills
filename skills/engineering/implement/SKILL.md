---
name: implement
description: 基于 spec 或一组 ticket 执行一段实现工作。
disable-model-invocation: true
---

实现用户在 spec 或 ticket 中描述的工作。

在事先约定好的接缝处尽量用 /tdd。

定期跑类型检查，定期跑单个测试文件，最后跑一遍完整测试套件。

完成后，用 /code-review 审查工作。

把工作提交到当前分支。
