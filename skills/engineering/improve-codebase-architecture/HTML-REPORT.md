# HTML 报告格式

架构审计渲染为系统临时目录里的一个自包含 HTML 文件。Tailwind 和 Mermaid 都来自 CDN。Mermaid 可靠地处理图状图表；手工搭建的 div 和内联 SVG 处理更有编辑感的可视化（质量图、剖面图）。两者混用——不要什么都靠 Mermaid，那样会显得套路化。

## 脚手架

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## 页头

仓库名、日期，加一个紧凑的图例：实线框 = 模块，虚线 = 接缝，红箭头 = 泄漏，粗深色框 = 深模块。不要介绍段落——直接进候选。

## 候选卡片

图承担主要表达。文字稀疏、平实，用词汇表术语（来自 `/codebase-design` skill），不加修饰。

每个候选是一个 `<article>`：

- **标题**——简短，命名这次深化（例如"折叠 Order 接单流水线"）。
- **徽章行**——推荐程度（`Strong` = 翡翠绿，`Worth exploring` = 琥珀色，`Speculative` = 石板灰），加一个依赖类别的标签（`in-process`、`local-substitutable`、`ports & adapters`、`mock`）。
- **文件**——等宽字体列表，`font-mono text-sm`。
- **前后对比图**——核心。两列，并排。见下面的模式。
- **问题**——一句话。哪里痛。
- **方案**——一句话。改什么。
- **收益**——条目，每条 ≤6 个词。例如"测试只打一个接口"、"定价逻辑不再泄漏"、"删掉 4 个浅包装"。
- **ADR 标注**（如适用）——琥珀色底框里一行。

不要整段的解释。如果一张图需要一段话才能看懂，重画这张图。

## 图表模式

选适合候选的模式。混着用。别让每张图看起来都一样——多样性本身就是要追求的。

### Mermaid 图（依赖 / 调用流的主力）

当重点是"X 调 Y 调 Z，看这一团乱"时，用 Mermaid 的 `flowchart` 或 `graph`。包在一张 Tailwind 样式的卡片里，免得显得突兀。用 classDef 把泄漏边染红、深模块染深色。时序图适合"之前：6 次往返；之后：1 次"。

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### 手工搭建的方框和箭头（当 Mermaid 的布局跟你较劲时）

模块用带边框和标签的 `<div>`。箭头用绝对定位在内联 SVG 里的 `<line>` 或 `<path>` 元素，搭在一个 relative 容器上。当你想让"之后"图看起来像一个粗边框的深模块、内部灰掉时用这个——Mermaid 渲染不出该有的分量感。

### 剖面图（适合分层浅化）

堆叠水平条带（`h-12 border-l-4`）展示一次调用穿过的层。之前：6 层薄薄的，每层什么也没做。之后：1 条厚条带，标上合并后的职责。

### 质量图（适合"接口和实现一样宽"）

每个模块两个矩形——一个代表接口面，一个代表实现面。之前：接口矩形几乎和实现矩形一样高（浅）。之后：接口矩形矮，实现矩形高（深）。

### 调用图折叠

之前：一棵函数调用树，渲染为嵌套方框。之后：同一棵树折叠成一个方框，原本内部的调用在里面以淡化的样式显示。

## 样式指引

- 偏编辑感，不是企业仪表板那种。慷慨的留白。标题可用衬线体（`font-serif` 搭 stone/slate 效果好）。
- 节制用色：一个强调色（翡翠绿或靛蓝），加红色表泄漏、琥珀色表警告。
- 图保持 ~320px 高，让前后对比并排放着不用滚动就看舒服。
- 图里的模块标签用 `text-xs uppercase tracking-wider`——应该读起来像示意图，不像 UI。
- 仅有的脚本就是 Tailwind CDN 和 Mermaid 的 ESM import。报告其余部分是静态的——没有应用代码，除了 Mermaid 自身的渲染外没有交互。

## 首推方案章节

一张更大的卡片。候选名，一句话讲为什么，锚链接到它的卡片。就这样。

## 语气

平实、简洁——但架构名词和动词直接来自 `/codebase-design` skill。简洁不是漂移的借口。

**精确使用：** 模块（module）、接口（interface）、实现（implementation）、深度（depth）、深（deep）、浅（shallow）、接缝（seam）、适配器（adapter）、杠杆（leverage）、局部性（locality）。

**不可替换为：** 组件（component）、服务（service）、单元（unit）替代模块 · API、签名（signature）替代接口 · 边界（boundary）替代接缝 · 层（layer）、包装层（wrapper）替代模块（当你指模块时）。

**符合风格的措辞：**

- "Order 接单模块是浅的——接口几乎和实现一样。"
- "定价跨过接缝泄漏。"
- "深化：一个接口，一个测试点。"
- "两个适配器证明接缝成立：生产用 HTTP，测试用内存。"

**收益条目**用词汇表术语命名收获：*"局部性：bug 集中到一个模块"*、*"杠杆：一个接口，N 个调用点"*、*"接口缩小；实现吸收掉包装层"*。不要写"更容易维护"或"代码更干净"——这些词不在词汇表里，站不住脚。

不要兜圈子，不要铺垫式开场，不要"值得一提的是……"。一句话能变成条目，就变成条目。一条能砍就砍。某个词不在 `/codebase-design` 词汇表里，先找一个在的，再考虑造新词。
