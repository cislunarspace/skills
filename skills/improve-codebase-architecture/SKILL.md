---
name: improve-codebase-architecture
description: 扫描代码库找出可加深的机会，以可视化 HTML 报告呈现，再就你选中的候选展开追问打磨。
disable-model-invocation: true
---

# Improve Codebase Architecture

揭示架构上的摩擦点，提出**加深机会**（deepening opportunities），即把浅模块变深的重构。目标是可测试性与 AI 可导航性。

本命令以项目领域模型为参照，建立在一套共享的设计词汇之上：

- 运行 `/codebase-design` 技能获取架构词汇（**module**、**interface**、**depth**、**seam**、**adapter**、**leverage**、**locality**）及其原则（删除测试、"接口即测试面"、"一个 adapter = 假想的 seam，两个 = 真正的 seam"）。每条建议都精确使用这些术语，不要滑向 "component""service""API""boundary"。
- `CONTEXT.md` 里的领域语言为好的 seam 命名；`docs/adr/` 里的 ADR 记录了本命令不应重新争议的决策。

## 流程

### 1. 探索

先读项目领域词汇表（`CONTEXT.md`），以及你将要触碰区域内的所有 ADR。

然后用 Agent 工具（`subagent_type=Explore`）走查代码库。不要套用刻板的启发式规则，而是自然地探索，记下你感到摩擦的地方：

- 哪里理解一个概念需要在多个小模块之间来回跳？
- 哪里是浅模块，接口几乎和实现一样复杂？
- 哪里为了可测试性把纯函数抽了出来，但真正的 bug 藏在调用方式里（没有 locality）？
- 哪里紧耦合的模块顺着 seam 泄露？
- 代码库哪些部分没有测试，或通过当前接口难以测试？

对任何你怀疑是浅模块的东西做**删除测试**：删掉它会把复杂度集中起来，还是只是搬走？"会集中"才是你要的信号。

### 2. 以 HTML 报告呈现候选

把一份自包含的 HTML 文件写到系统临时目录，不要落进仓库。临时目录从 `$TMPDIR` 解析，回退到 `/tmp`（Windows 用 `%TEMP%`），写入 `<tmpdir>/architecture-review-<timestamp>.html`，每次运行一个新文件。为用户打开它（Linux 用 `xdg-open <path>`，macOS 用 `open <path>`，Windows 用 `start <path>`），并告知绝对路径。

报告用 **Tailwind（CDN）** 做布局与样式，用 **Mermaid（CDN）** 画图，当图、流程或时序能可靠传达结构时。把 Mermaid 与手写 CSS/SVG 可视化混用：关系是图状的（调用图、依赖、时序）用 Mermaid；要更编辑化的呈现（mass diagram、剖面图、折叠动画）用手写 div/SVG。每个候选都配一张**前后对比可视化**。要直观。

每个候选渲染一张卡片，包含：

- **文件**：涉及哪些文件/模块
- **问题**：当前架构为何产生摩擦
- **方案**：将要改什么，用大白话写
- **收益**：用 locality 和 leverage 解释，以及测试会怎样改善
- **前后对比图**：并排、手绘，展示浅与深
- **推荐强度**：`Strong`、`Worth exploring`、`Speculative` 三选一，渲染成徽章

报告末尾放一个**首推方案**（Top recommendation）章节：你会先动哪个候选，为什么。

**领域用 `CONTEXT.md` 的词汇，架构用 `/codebase-design` 的词汇。** 若 `CONTEXT.md` 定义了 "Order"，就讲"Order 接单模块"，不要说 "FooBarHandler"，也不要说 "Order service"。

**与 ADR 冲突时**：只有当摩擦真实到值得重开该 ADR 时，才把与现有 ADR 冲突的候选摆出来。在卡片上清楚标注（如警告提示：_"与 ADR-0007 冲突，但值得重开，因为……"_）。不要把 ADR 禁止的每一个理论上的重构都列出来。

完整的 HTML 脚手架、图表模式与样式指引见 [HTML-REPORT.md](HTML-REPORT.md)。

此时**不要**提出接口。文件写好后，问用户："想展开看哪一个？"

### 3. 发布为 issue

用户选定候选后，运行 `/to-issues` 技能，把每个选中的候选作为一条垂直切片（tracer bullet）issue 发布到项目 issue tracker。每条 issue 写清涉及的文件、当前问题、加深方案。

### 4. 深入讨论

后续就某条 issue 展开时，运行 `/grill-with-docs` 技能做深入追问：约束、依赖、加深后模块的形状、seam 背后藏着什么、哪些测试留得下来。`grill-with-docs` 会同时调用 `/domain-modeling` 维护领域模型，把讨论中磨利的新术语、新决策就地落到 `CONTEXT.md` 和 ADR。
