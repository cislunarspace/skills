# HTML 报告格式

架构审计渲染成一份自包含的 HTML 文件，放在系统临时目录。Tailwind 和 Mermaid 都走 CDN。图状结构（依赖、调用流、时序）交给 Mermaid，它可靠；更编辑化的可视化（目录树对比、层叠剖面）用手写 div 和内联 SVG。两者混用，别什么都靠 Mermaid，会显得千篇一律。

## 脚手架

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* Tailwind 覆盖不到的少量自定义层 */
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="directory" class="space-y-10">...</section>
      <section id="file-design" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## 页头

仓库名、日期，加一个紧凑的图例：实线框 = 目录/模块，红色箭头 = 依赖泄漏或循环，粗深色框 = 组织良好 / 设计聚焦。再放一行两类的计数：目录组织 N 项、文件内部设计 M 项。不要引言段，直接进发现项。

## 发现项卡片

图表承担分量。文字稀疏、平实。每个发现项是一个 `<article>`：

- **标题**：短，点明问题或动作（如 “Pricing 调用跨过领域层直达数据库”）。
- **徽章行**：严重程度（`High` = 玫红，`Medium` = 琥珀，`Low` = 石板灰），加一个依据来源标签（`AGENTS.md` = 靛蓝，`通用最佳实践` = 石板灰）。
- **位置**：等宽列表，`font-mono text-sm`，列出涉及的文件 / 目录。
- **前后对比图**：核心。两列并排。见下方模式。
- **问题**：一句话。哪里痛。
- **建议**：一句话。怎么改。
- **依据**：一行。触了哪个透镜（目录组织类）或 `AGENTS.md` 编码准则的哪条（文件内部设计类）。

不要整段解释。如果一张图需要一段话才看得懂，重画这张图。

## 图表模式

按发现项选合适的模式。混着用。别让每张图都长一样，多样性本身就是目的的一部分。

### Mermaid 依赖图（目录组织：依赖方向 / 循环的当家花旦）

当重点是“X 依赖 Y 依赖 Z，看这一团乱”或“这里转了一圈”时，用 Mermaid `flowchart` 或 `graph`。套一层 Tailwind 样式的卡片，别让它像空降的。用 classDef 把泄漏边涂红。

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderRepo]
      B -.leak.-> C[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class B,C leak
  </pre>
</div>
```

### 目录树对比（目录组织：co-location / 分层 / 上帝目录）

用手写 `<pre>` 或嵌套 `<div>` 画目录树。前：相关文件散落在按技术类型分的目录，或一个目录塞满不相关的东西。后：按模块 co-location 重新归拢。用颜色或缩进标出“这一族本该在一起”。

```
前                          后
src/                        src/
├── controllers/            ├── orders/
│   ├── order_ctl.rs        │   ├── mod.rs
│   └── user_ctl.rs         │   ├── repo.rs
├── models/                 │   └── api.rs
│   ├── order.rs            └── users/
│   └── user.rs                 ├── mod.rs
└── repos/                       └── repo.rs
    ├── order_repo.rs
    └── user_repo.rs
```

### 层叠剖面图（文件内部设计：浅层堆叠 / 上帝文件）

堆叠水平条带（`h-12 border-l-4`）展示一次调用穿过的层，或一个文件里堆的职责。前：6 个薄层各干一点没用的事，或一个文件塞了 7 个不相关的职责。后：1 个厚条带，标上合并后的单一职责。

### Mass diagram（文件内部设计：接口和实现一样宽）

每个模块两个矩形，一个代表接口面积，一个代表实现。前：接口矩形几乎和实现矩形一样高（浅）。后：接口矩形矮，实现矩形高（深）。适合“删掉它会把复杂度集中起来”这类发现项。

### 调用图坍缩（文件内部设计：浅包装链）

前：嵌套盒子画出的函数调用树，每层都是只转发一次的薄包装。后：整棵树坍缩成一个盒子，如今是内部的调用以淡色显示在盒内。

## 样式指引

- 偏编辑风，不要企业仪表盘风。留白要足。标题可用衬线体（`font-serif` 配 stone/slate 不错）。
- 克制用色：一个强调色（靛蓝），玫红表泄漏，琥珀表警告，翠绿表改后状态。
- 图保持 ~320px 高，让前后并排时不需滚动。
- 图内标签用 `text-xs uppercase tracking-wider`，读起来像示意图，不像 UI。
- 脚本只有 Tailwind CDN 和 Mermaid ESM import。其余全是静态，没有应用代码，除 Mermaid 自身渲染外没有交互。

## 首推方案章节

一张更大的卡片。发现项名，一句话说为什么先动它，锚链接到它的卡片。就这样。

## 语气

平实、简洁。衡量一个发现项值不值得报，看它说的是不是具体、可观察的变化——“理解一个概念不用再跨 3 个目录”“删掉 4 个只有一个实现的接口”“去掉 1 个 fetch 已能替代的依赖”。说得出这种话的发现项才报。

**不要写：** “更易维护”“代码更干净”“提升可读性”“更加优雅”——这些词站不住脚，是空话。

**领域名词**用 `CONTEXT.md` 的词汇；**准则引用**精确到 `AGENTS.md` 编码准则的哪一条（如 “AGENTS.md §3 简洁”“AGENTS.md §4 精准改动”），不要泛泛说“不符合规范”。

不要含糊、不要开场客套、不要 “值得一提的是……”。一句话能写成项目符号就写成项目符号。一条项目符号能删就删。
