# HTML 报告格式

架构评审渲染成一份自包含的 HTML 文件，放在系统临时目录。Tailwind 和 Mermaid 都走 CDN。图状结构交给 Mermaid，它可靠；更编辑化的可视化（mass diagram、剖面图）用手写 div 和内联 SVG。两者混用，别什么都靠 Mermaid，会显得千篇一律。

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
      /* Tailwind 覆盖不到的少量自定义层：
         虚线 seam、手绘感箭头头等 */
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

仓库名、日期，加一个紧凑的图例：实线框 = module，虚线 = seam，红色箭头 = 泄露，粗深色框 = 深模块。不要引言段，直接进候选。

## 候选卡片

图表承担分量。文字稀疏、平实，自然地使用词汇表术语（来自 `/codebase-design` 技能）。

每个候选是一个 `<article>`：

- **标题**：短，点明加深动作（如 "Collapse the Order intake pipeline"）。
- **徽章行**：推荐强度（`Strong` = 翠绿，`Worth exploring` = 琥珀，`Speculative` = 石板灰），加一个依赖类别标签（`in-process`、`local-substitutable`、`ports & adapters`、`mock`）。
- **文件**：等宽列表，`font-mono text-sm`。
- **前后对比图**：核心。两列并排。见下方模式。
- **问题**：一句话。哪里痛。
- **方案**：一句话。改什么。
- **收益**：项目符号，每条 ≤6 个词。如 "Tests hit one interface"、"Pricing logic stops leaking"、"Delete 4 shallow wrappers"。
- **ADR 提示**（如有）：琥珀色框里一行。

不要整段解释。如果一张图需要一段话才看得懂，重画这张图。

## 图表模式

按候选选合适的模式。混着用。别让每张图都长一样，多样性本身就是目的的一部分。

### Mermaid 图（依赖 / 调用流的当家花旦）

当重点是"X 调 Y 调 Z，看这一团乱"时，用 Mermaid `flowchart` 或 `graph`。套一层 Tailwind 样式的卡片，别让它像空降的。用 classDef 把泄露边涂红、深模块涂暗。时序图适合"前：6 次往返；后：1 次"。

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

### 手写框与箭头（当 Mermaid 的布局跟你作对时）

模块画成带边框和标签的 `<div>`。箭头用内联 SVG `<line>` 或 `<path>`，在一个相对定位容器上绝对定位。当你想让"后"图呈现成一个粗边深模块、内部灰掉时用它，Mermaid 渲染不出那种分量。

### 剖面图（适合层叠的浅）

堆叠水平条带（`h-12 border-l-4`）展示一次调用穿过的层。前：6 个薄层各干一点没用的事。后：1 个厚条带，标上合并后的职责。

### Mass diagram（适合"接口和实现一样宽"）

每个模块两个矩形，一个代表接口面积，一个代表实现。前：接口矩形几乎和实现矩形一样高（浅）。后：接口矩形矮，实现矩形高（深）。

### 调用图坍缩

前：嵌套盒子画出的函数调用树。后：整棵树坍缩成一个盒子，如今是内部的调用以淡色显示在盒内。

## 样式指引

- 偏编辑风，不要企业仪表盘风。留白要足。标题可用衬线体（`font-serif` 配 stone/slate 不错）。
- 克制用色：一个强调色（翠绿或靛蓝），红色表泄露，琥珀色表警告。
- 图保持 ~320px 高，让前后并排时不需滚动。
- 图内模块标签用 `text-xs uppercase tracking-wider`，读起来像示意图，不像 UI。
- 脚本只有 Tailwind CDN 和 Mermaid ESM import。其余全是静态，没有应用代码，除 Mermaid 自身渲染外没有交互。

## 首推方案章节

一张更大的卡片。候选名，一句话说为什么，锚链接到它的卡片。就这样。

## 语气

平实、简洁，但架构名词和动词一律来自 `/codebase-design` 技能。简洁不是滑向别的词的借口。

**精确使用：** module、interface、implementation、depth、deep、shallow、seam、adapter、leverage、locality。

**绝不替换为：** component、service、unit（指 module 时）· API、signature（指 interface 时）· boundary（指 seam 时）· layer、wrapper（指 module 时，当你本意就是 module）。

**符合风格的措辞：**

- "Order intake module 是浅的，接口几乎和实现一样宽。"
- "Pricing 顺着 seam 泄露。"
- "加深：一个 interface，一处测试。"
- "两个 adapter 才让 seam 成立：生产用 HTTP，测试用内存。"

**收益项目符号**用词汇表命名收益：*"locality：bug 集中到一个模块"*、*"leverage：一个 interface，N 处调用"*、*"接口收窄；实现吞掉 wrapper"*。不要写 *"更易维护"* 或 *"代码更干净"*，这些词不在词汇表里，站不住脚。

不要含糊、不要开场客套、不要 "值得一提的是……"。一句话能写成项目符号就写成项目符号。一条项目符号能删就删。某个词不在 `/codebase-design` 词汇表里，先找表里有的词，再造新词。
