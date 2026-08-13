---
name: setup-pi
description: 配置 pi harness：装 subagent 扩展与用户级 agents，写项目级 .pi/agents/ 的 builder/checker。在 pi 下使用 Loop 工程技能时手动运行。
disable-model-invocation: true
---

为当前仓库配置 pi harness 下工程技能（loop-go、code-review 等）所需的两层文件：机器级（subagent 扩展 + 用户级 agents，每台机器一次）和项目级（`.pi/agents/builder.md`、`checker.md`）。只写取得用户确认的文件。

## 1. 探索

读取，不要假设：

- `which pi`：pi 不可用时提示先装 pi 或跳过本 skill。
- `~/.pi/agent/extensions/subagent/` 是否已有 `index.ts`、`agents.ts`（官方 subagent 扩展）。
- `~/.pi/agent/agents/` 是否已有用户级 `builder.md`、`checker.md`，以及 `standards-reviewer.md`、`spec-reviewer.md`（code-review 两轴需要）。
- 项目 `.pi/agents/builder.md`、`.pi/agents/checker.md` 是否存在。
- 根目录 `CLAUDE.md`、`AGENTS.md` 是否已有 `### Loop Engineering` 或 `## Loop 停止规则`。
- skills 仓库路径：`~/.claude/skills/` 或 `~/.agents/skills/` 下本仓库 skill 的软链可解析出仓库根；解析不到就问用户。

## 2. 决策

总结现状和缺口，逐项给出推荐，让用户接受、修改或跳过；每项结论确认后再进入下一项。

### A. 机器级（每台机器一次，缺才装）

- subagent 扩展缺：定位 pi 包的官方示例（`npm root -g` 下 `@earendil-works/pi-coding-agent/examples/extensions/subagent/`），symlink `index.ts`、`agents.ts` 到 `~/.pi/agent/extensions/subagent/`。
- 用户级 agents 缺：从 skills 仓库 `pi/agents/` symlink 全部 `.md` 到 `~/.pi/agent/agents/`。

在 skills 仓库跑 `bash scripts/setup-pi.sh` 一次完成（幂等，可重跑）；或逐条执行等价命令。装完提示用户**重启 pi** 后扩展生效。

### B. 项目级

写入 `.pi/agents/builder.md`、`.pi/agents/checker.md`（模板见 `references/builder-pi.md`、`checker-pi.md`；不锁模型，用 pi 默认模型）。已存在时询问是否覆盖。

pi 的 subagent 工具默认只加载用户级 agents；项目级文件只有调用时带 `agentScope: "both"` 才加载，且会先向用户确认。`.pi/agents/` 与 `.claude/agents/` 各自独立维护。

### C. 共享段

根文档缺 `### Loop Engineering` 或 `## Loop 停止规则` 时，提示跑 `/setup-ouyangjiahong-skills` 补（它管两 harness 共享的配置）；用户不想跑时说明 `/loop-go` 有内置停止规则兜底。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

种子模板在 `references/`：

| 目标文件 | 种子模板 |
| --- | --- |
| `.pi/agents/builder.md` | `builder-pi.md` |
| `.pi/agents/checker.md` | `checker-pi.md` |

得到确认后才写入。

## 4. 写入与结束

- 写入 `.pi/agents/builder.md`、`.pi/agents/checker.md`（已存在时先询问是否覆盖）。
- 完成后说明：重启 pi 后 subagent 扩展生效；`/loop-go <任务>` 自动用 subagent 派 builder/checker，`/code-review` 用 standards-reviewer/spec-reviewer 并行两轴。
