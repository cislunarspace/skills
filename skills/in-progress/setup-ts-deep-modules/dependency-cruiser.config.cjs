// @ts-check
// dependency-cruiser 的深模块强制。
//
// 包根下的每个包是一个深模块：大量行为藏在小组接口后面。
// 一个包的公开面是它的入口——包根目录下的文件。实现藏在子目录里，
// 是私有的——按约定 `lib/` 放实现，`tests/` 放测试，
// 但任何子目录都是私有的。一个包可以暴露几个小入口
// （index.ts、client.ts、server.ts、……）——优先于此，
// 而非一个巨大的桶 index。
//
// 你在这里唯一需要编辑的是 PACKAGES_ROOT。

/** 包所在位置。每个包一个直接子目录（扁，不嵌套）。 */
const PACKAGES_ROOT = "src/packages";

// --- 派生模式（无需编辑）-------------------------------------
const R = PACKAGES_ROOT;
/**
 * 一个包的私有内部：包子目录里嵌套的任何东西。
 * 包的根文件是它的入口，不在这里匹配——
 * 它们从外部保持可 import。
 */
const PACKAGE_INTERNALS = `^${R}/[^/]+/[^/]+/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "entrypoint-boundary-from-app",
      comment:
        "App/根代码可以 import 包的入口（根文件），但不能 import 子目录里的任何东西。",
      severity: "error",
      from: { pathNot: `^${R}/` }, // import 方不在任何包内
      to: { path: PACKAGE_INTERNALS },
    },
    {
      name: "entrypoint-boundary-across-packages",
      comment:
        "一个包自己的文件互相自由 import，但只能通过入口触达其他包——绝不触达内部。",
      severity: "error",
      // import 方在某个包内（$1），但不是测试文件
      from: { path: `^${R}/([^/]+)/`, pathNot: `^${R}/[^/]+/tests/` },
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/`, // 同一包 → 包内自由
      },
    },
    {
      name: "tests-through-entrypoints",
      comment:
        "一个包的测试和其他人一样通过入口来演习它：可以 import 任何包的入口和自己的 tests/ fixture，但绝不能 import 任何包的内部——包括自己的。",
      severity: "error",
      from: { path: `^${R}/([^/]+)/tests/` }, // 测试文件，在包 $1 内
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/tests/`, // 自己的 tests/ fixture → 允许
      },
    },
    {
      name: "tests-folder-is-private",
      comment:
        "一个包的 tests/ 目录只能从测试触达——其他东西都不能 import fixture。",
      severity: "error",
      from: { pathNot: `^${R}/[^/]+/tests/` }, // import 方自己不是测试
      to: { path: `^${R}/[^/]+/tests/` },
    },
    {
      name: "no-circular",
      comment: "不允许依赖环。若想允许包外有环，把范围限定到 `^${R}/`。",
      severity: "error",
      from: {},
      to: { circular: true },
    },

    // --- 分层（可选，默认关闭）----------------------------------
    // 接口隐藏控制你_怎么_import（通过入口）。
    // 分层控制_哪些_包可以依赖哪些。在这里加你自己的规则，例如：
    //
    // {
    //   name: "ui-may-not-depend-on-billing",
    //   severity: "error",
    //   from: { path: `^${R}/ui/` },
    //   to:   { path: `^${R}/billing/` },
    // },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
