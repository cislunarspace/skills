---
name: grill-with-docs
description: 编排 /grilling 和 /domain-modeling，在追问打磨计划或设计的同时维护 ADR 和术语表。当用户想在建码前压测计划并同步产出文档时使用。
disable-model-invocation: true
---

# Grill with Docs

编排两个 skill：用 `/grilling` 高强度追问打磨计划或设计，同时用 `/domain-modeling` 维护 ADR 和术语表。

执行逻辑：

1. 启动 `/grilling`，由其控制追问节奏和深度
2. 在追问过程中，当出现架构决策或新术语时，触发 `/domain-modeling` 记录到相应文档
3. `/grilling` 的追问输出和 `/domain-modeling` 的文档产出并行推进，文档反映当前讨论的最新共识
4. 遇到矛盾（追问推翻了已记录的决策）时，更新对应 ADR 或术语表条目

## Checkpoint

- `/grilling` 的追问由其自身控制，该等用户时会停下
- `/domain-modeling` 产出文档后立即写入，无需额外确认
- 整个流程在用户明确表示追问结束且文档已同步更新时算完成

## Handoff

- 用户确认追问完成且 ADR、术语表已生成：落代码用 `/implement`
- 产出要变成 PRD：写 PRD 用 `/to-prd`
