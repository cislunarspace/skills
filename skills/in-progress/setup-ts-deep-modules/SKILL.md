---
name: setup-ts-deep-modules
description: 把 dependency-cruiser 接入 TypeScript 仓库，让每个包成为深模块——实现藏在子目录里，只能通过入口文件触达。用户手动调用。
disable-model-invocation: true
---

# Setup TS Deep Modules

让本仓库的每个包成为**深模块（deep module）**：大量行为藏在小组接口后面。一个包的公开面是它的**入口**——包根目录下的文件——子目录里的一切都是隐藏的。本 skill 安装 [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) 和让入口成为唯一进入方式的规则，然后证明规则能咬人。

术语词汇（深模块、接口、接缝、深度）跑 `/codebase-design` skill——全程用它的语言。

## 强制的形状

```
src/packages/
  <name>/
    index.ts        ← 一个入口（公开）。从外部 import 它。
    client.ts       ← 另一个入口。一个包可以暴露多个。
    lib/            ← 实现：对外部隐藏，互相自由 import。
    tests/          ← 同位测试 + fixture（子目录，所以私有）。
```

公开面是包的**根文件**——不是某个指定的 `index.ts`。按约定，实现放在 `lib/`，测试放在 `tests/`，让每个包有相同的两目录形状。但规则本身是通用的：*任何*子目录里的*任何*东西都是私有的，所以你永远不需要改配置来加目录。

四条规则，全是 `error`：

1. **入口边界** — 包外代码（app 代码或另一个包）只能 import 那个包的入口（根文件），绝不能 import 子目录里的任何东西。
2. **包内自由** — 一个包自己的文件互相自由 import。
3. **测试走入口** — `<pkg>/tests/` 下的文件可以 import 任何包的入口和自己的 `tests/` fixture，但绝不能 import 任何包的子目录内部（包括自己的）。跨包集成测试没问题；深 import 不行。
4. **无环** — 不允许依赖环。

**入口，不是桶。** 因为公开面是*每个*根文件，一个包可以暴露几个小入口（`index.ts`、`client.ts`、`server.ts`），而不是把一切都漏斗式地穿过一个巨大的 `index.ts`。不鼓励重新导出整个子树的桶文件——保持入口小，把实现藏在子目录里。

分层（哪些包可以依赖哪些）是*另一个*关注点，在配置里作为注释桩留给本仓库填写。

## 步骤

### 1. 探测环境

- **包管理器** — `pnpm-lock.yaml` → pnpm，`yarn.lock` → yarn，`bun.lockb` → bun，否则 npm。下面每条命令都用它（`pnpm`/`yarn`/`npm run`/`bunx`）。
- **包根目录** — 若 `src/` 存在用 `src/packages`，否则 `packages`。若仓库已有不同的明显约定，与用户确认选择。
- **已有配置** — 检查 `.dependency-cruiser.*` 文件。若存在，**不要**覆盖：把四条规则和 options 合并进去，告诉用户你加了什么。

**完成当：** 包管理器、包根目录、已有配置状态都已知。

### 2. 安装 dependency-cruiser

用探测到的包管理器把 `dependency-cruiser` 装为 devDependency。

**完成当：** `dependency-cruiser` 在 `devDependencies` 中。

### 3. 写配置

把 [`dependency-cruiser.config.cjs`](./dependency-cruiser.config.cjs) 复制到仓库根目录，命名为 `.dependency-cruiser.cjs`。把 `PACKAGES_ROOT` 设为第 1 步探测到的根。规则基于路径深度、与扩展名无关，所以其他不需要适配。

**完成当：** `.dependency-cruiser.cjs` 存在且 `PACKAGES_ROOT` 正确，四条禁止规则都在。

### 4. 接入检查

- 加一个 `lint:boundaries` 脚本：`depcruise <packages-root>`（或 `depcruise src`）。
- 折进仓库的伞检查命令——那个已经跑 typecheck 的命令（如 `check` / `ci` / `validate` 脚本）。**不要**碰 `tsconfig` 或加路径别名。
- 若没有伞脚本，加上 `lint:boundaries` 并告诉用户把它纳入 CI。

**完成当：** `lint:boundaries` 存在，且与 typecheck 在同一命令中运行。

### 5. 搭示例包

创建一个提交的 `<packages-root>/example/` 作为复制模板：

- `index.ts` — 一个入口。导出一个委托给内部文件的函数（让包看起来是*深*的，不是直通）。
- `lib/impl.ts` — **子目录**中的内部文件，被 `index.ts` import，从外部不可达。
- `tests/example.test.ts` — **只** import `../index`（一个入口），对公开函数做断言。

告诉用户这是可复制或删除的起始模板。

**完成当：** 示例包存在，通过根入口暴露其行为，`impl` 藏在子目录里。

### 6. 证明规则能咬人

这是整个 skill 的完成条件——不咬人的配置一文不值。

1. 跑 `lint:boundaries`。干净的示例必须**通过**。
2. 临时往 `tests/example.test.ts` 加一个深 import（如 `import { thing } from "../lib/impl"`）。再跑 `lint:boundaries`——必须**失败**，报 `tests-through-entrypoints`。
3. 撤掉深 import。再跑一次——必须**通过**。

**完成当：** 你观察到了通过、然后深 import 失败、然后再次通过。如果第 2 步没失败，规则没有正确接线——修好再收尾。

### 7. 记录约定

在包文件夹里写一个 `README.md`（`<packages-root>/README.md`）——紧挨它管理的包——覆盖：`src/packages/<name>/` 布局（入口在根、`lib/` 放实现、`tests/` 放测试）、"只通过包的入口（根文件）import"、以及如何跑 `lint:boundaries`。**明确不鼓励桶文件**——暴露几个小入口，而不是通过一个 index 重新导出整个子树。保持为复制片段加四条规则各一段。

然后在仓库的 agent 指令文件里加一个**上下文指针**——有 `CLAUDE.md` 用它，否则用 `AGENTS.md`（都不存在就创建 `AGENTS.md`）。一行就够，例如 `Packages are deep modules — see [src/packages/README.md](./src/packages/README.md) before adding or importing one.`。这就是让 agent 发现边界规则而非绊在上面的东西。

**完成当：** `<packages-root>/README.md` 存在且不鼓励桶文件，仓库的 `CLAUDE.md`/`AGENTS.md` 链接到它。

## 备注

- 配置的 `$1` 反向引用（dependency-cruiser 的分组匹配）让一个包能触达自己的内部而外人不能——不要把它们展平成分包规则。
- 公开还是私有由**深度**决定：包的根文件是入口；子目录里的任何东西是私有的。约定子目录是 `lib/`（实现）和 `tests/`，但规则不硬编码它们——任何子目录都是私有的，新文件夹永远不需要改配置。加入口就是加一个根文件——不需要桶。
- 包是**扁的**：根下面一层直接子目录。包内部可以任意嵌套深度；包不能包含另一个包。
- 用 `.cjs`（不是 `.js`），这样配置的 `module.exports` 在 `"type": "module"` 仓库里也能工作。
