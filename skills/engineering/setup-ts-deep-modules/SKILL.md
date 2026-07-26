---
name: setup-ts-deep-modules
description: 在 TypeScript 仓库里用 dependency-cruiser 强制执行深模块边界——每个包是深模块，实现藏在子目录中，只能通过入口文件访问。当用户想设置 TS 模块边界、强制包的封装时使用。
disable-model-invocation: true
---

# Setup TS Deep Modules

让仓库里的每个包都成为**深模块**：大量行为藏在一个小接口背后。一个包的公开面是它的**入口文件**——包根目录下的文件——子目录里的一切都是隐藏的。这个 skill 安装 dependency-cruiser、写入规则、然后证明规则真的在咬人。

用 `/codebase-design` skill 的词汇（深模块、接口、接缝、深度）——全程用这些术语。

## 它强制的形状

```
src/packages/
  <name>/
    index.ts        <- 入口文件（公开）。从外部导入这个。
    client.ts       <- 另一个入口。一个包可以有多个入口。
    lib/            <- 实现：对外部隐藏，内部可以互相导入。
    tests/          <- 共置的测试和 fixture（子目录，所以是私有的）。
```

公开面是包的**根文件**——不是一个指定的 `index.ts`。按惯例实现放 `lib/`、测试放 `tests/`，每个包都是同样的两目录结构。规则本身是通用的：*任何子目录*都是私有的，所以永远不需要为新目录改配置。

四条规则，全部 `error`：

1. **入口边界**——包外部（app 代码或另一个包）只能导入该包的入口文件（根文件），不能导入子目录里的任何东西。
2. **包内自由**——一个包内部的文件互相导入不受限。
3. **测试通过入口**——`<pkg>/tests/` 下的文件可以导入任何包的入口文件和自己的 `tests/` fixture，但不能导入任何包的子目录内部（包括自己的）。跨包集成测试可以，深导入不行。
4. **无循环**——没有依赖循环。

**入口文件，不是 barrel。** 因为公开面是*每个*根文件，一个包可以暴露多个小入口（`index.ts`、`client.ts`、`server.ts`），而不是把所有东西从一个巨大的 `index.ts` 里 re-export。不鼓励 barrel 文件——保持入口小而精，实现藏在子目录。

分层（哪些包可以依赖哪些包）是*另一个*关注点，作为注释桩留在配置里，等仓库自己填。

## 流程

### 1. 探测环境

- **包管理器**——`pnpm-lock.yaml` → pnpm，`yarn.lock` → yarn，`bun.lockb` → bun，否则 npm。
- **包的根目录**——有 `src/` 用 `src/packages`，否则 `packages`。如果仓库已有不同惯例，跟用户确认。
- **已有配置**——检查有没有 `.dependency-cruiser.*` 文件。有就**不要**覆盖：把四条规则和选项合并进去，告诉用户你加了什么。

### 2. 安装 dependency-cruiser

用检测到的包管理器把 `dependency-cruiser` 装为 devDependency。

### 3. 写配置

把 `dependency-cruiser.config.cjs` 复制到仓库根目录作为 `.dependency-cruiser.cjs`。把 `PACKAGES_ROOT` 设为步骤 1 检测到的根目录。规则基于路径深度、与扩展名无关，所以不需要改别的。

### 4. 接入检查

- 加一个 `lint:boundaries` 脚本：`depcruise <packages-root>`（或 `depcruise src`）。
- 把它折进仓库已有的总检查命令——已经在跑 typecheck 的那个。
- 如果没有总脚本，加 `lint:boundaries`，告诉用户把它加进 CI。

### 5. 脚手架示例包

在 `<packages-root>/example/` 创建一个已提交的模板包：
- `index.ts`——一个入口文件，导出一个函数，委托给内部文件。
- `lib/impl.ts`——子目录下的内部文件，被 `index.ts` 导入，外部不可达。
- `tests/example.test.ts`——只导入 `../index`（入口），断言公开函数。

### 6. 证明规则在咬人

1. 跑 `lint:boundaries`。干净的示例必须**通过**。
2. 临时在 `tests/example.test.ts` 加一行深导入。再跑——必须**失败**，报 `tests-through-entrypoints`。
3. 撤回深导入。再跑一次——必须**通过**。

### 7. 记录约定

在包目录下写 `README.md`，覆盖布局、"只通过入口文件导入"、以及怎么跑 `lint:boundaries`。显式不鼓励 barrel 文件。在仓库的 `CLAUDE.md` 或 `AGENTS.md` 加一个 context pointer。

## 参考配置

完整的 dependency-cruiser 配置见 [`references/dependency-cruiser.config.cjs`](references/dependency-cruiser.config.cjs)。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| 已有 .dependency-cruiser 配置 | 合并规则，不覆盖 |
| 包管理器不在 pnpm/yarn/bun/npm 中 | 告知用户不支持，建议手动安装 |
| 仓库没有 packages 目录 | 跟用户确认约定后创建 |

## Checkpoint

- 探测环境后，跟用户确认包的根目录位置
- 写配置前，展示配置要点让用户确认
- 验证完成后，展示验证结果

## 完成条件

- dependency-cruiser 已安装并配置
- `lint:boundaries` 脚本可运行
- 示例包的三步验证全部通过
- README 已写好，context pointer 已加

## 下一步

- 深模块边界设好后：把现有代码重构成深模块用 `/implement`
- 想为包设计更好的接口：用 `/codebase-design`
