# Kimi Code Harness 适配能力调研

调研日期：2026-07-21
调研对象：Kimi Code CLI 当前版本
当前最新发布：0.27.0（2026-07-17）
来源：Kimi Code 官方文档 `https://www.kimi.com/code/docs/en/`

## 目的与位置说明

本笔记是 dispatch 适配的事实底稿，对应仓库 `skills/engineering/dispatch/SKILL.md` 末尾"多 harness 适配"小节引用的 `references/harness-kimi-code.md`，并记录该适配文件采用的 Kimi Code 工具和编排方式。

仓库内原本没有"研究笔记"类目录。AGENTS.md 的 `docs/adr/` 用于架构决策、`docs/agents/` 用于分诊与领域约定；这两者都不合适放 harness 适配事实。按用户指示放 `docs/research/`，并在这里注明原因。

## Kimi Code 的并发与多阶段能力

Kimi Code 提供会话级 **swarm mode**：可以通过 `/swarm on|off` 切换，也可以用 `/swarm <task>` 开启 swarm mode 后执行任务。swarm mode 让 Agent 在多阶段任务中使用并发子代理；会话保持开启时，后续 turn 仍可调用 `AgentSwarm`。

`AgentSwarm` 负责同一层的 fan-out 并行，跨层推进由父 Agent 分轮次协调。以 dispatch 的 Level 0 → Level 1 → Verify 为例，父 Agent 在每一轮收齐并检查结果后，再发起下一层的 `AgentSwarm` / `Agent` 调用。

`/goal` 支持让 Agent 跨多个 turn 持续推进一个目标，适合需要自主完成的长任务。它可以包住整体 dispatch 目标；具体的层内并发和层间验证仍按上面的父 Agent 编排方式执行。

### Kimi Code 的工具分组

官方工具清单（来自 `reference/tools.html`）分九组：

- File: Read, Write, Edit, Grep, Glob, ReadMediaFile
- Shell: Bash
- Web: WebSearch, FetchURL
- Plan Mode: EnterPlanMode, ExitPlanMode
- State: TodoList
- Collaboration: Agent, AgentSwarm, AskUserQuestion, Skill
- Background: TaskList, TaskOutput, TaskStop
- Scheduled: CronCreate, CronList, CronDelete

`AgentSwarm` 是并发派子代理的工具，处理同一层的 fan-out；多层 dispatch 由父 Agent 以多轮调用实现层间屏障。

### 1. Agent 调度工具名

- **单 subagent**：`Agent`（带 `prompt`、`description`；可选 `subagent_type`、`resume`、`run_in_background`）
- **并发多 subagent**：`AgentSwarm`（带 `prompt_template` + `items[]`；可选 `subagent_type`、`resume_agent_ids`）

工具的运行时位置：subagent 状态写入当前 session 目录的 `agents/` 子目录，每个实例一个目录，含 `wire.jsonl`；后台 subagent 还有 `tasks/` 子目录（来自 `customization/agents.html`）。

AgentSwarm 的强约束（来自 `reference/tools.html`）：

- 一次模型响应里 `AgentSwarm` 必须是**唯一**的 tool call；要多次 swarm 必须分多次响应。
- 不传 `resume_agent_ids` 时，`items` 至少 2 项。
- 上限 128 总 subagent。
- 默认并发斜坡：5 个立即启动，之后每 700ms 多启动 1 个；通过 `KIMI_CODE_AGENT_SWARM_MAX_CONCURRENCY` 设正整数上限，非法值会让调用直接失败。
- 等所有 subagent 收齐后返回聚合报告。

### 2. 默认 subagent 类型

Kimi Code 内置三个 subagent 类型（来自 `customization/agents.html`）：

| `subagent_type` | 工具集 | 用途 |
|---|---|---|
| **`coder`**（默认） | 与主 Agent 大致相同：可读写文件、可执行 shell、可调后台任务、TodoList、Plan mode、Skill、还能再派 nested subagents | 一般软件工程 |
| `explore` | 只读 | 代码库搜索、读取、汇总，不改任何文件 |
| `plan` | 完全没有 shell（连 Bash 都没有） | 实施规划与架构设计 |

`Agent` 工具的 `subagent_type` 默认值是 `coder`（`reference/tools.html`）。`AgentSwarm` 的 `subagent_type` 默认也是 `coder`（`reference/tools.html`：*"Pass subagent_type to choose the profile used by every spawned subagent in the swarm, or omit it to use coder."*）。

注意：`coder` 工具集在 0.26.0（2026-07-16）扩展过一次，纳入了 background tasks、todo lists、plan mode、skill invocation、nested agents（changelog 原文："Expand the coder subagent tool set to include background tasks, todo lists, plan mode, skill invocation, and nested agents, mirroring the main agent's capabilities."）。这意味着 dispatch 在 Kimi Code 里跑时，每个子代理自己也能再派孙代理，但用得不当会爆上下文，需要在 prompt 里明确边界。

### 3. 失败处理 / 重试语义

Kimi Code 在多层语义上各有一套"超时"和"重试"开关：

**Subagent 超时**（针对 `Agent` / `AgentSwarm` 起的子代理）：

- 默认 2 小时（自 0.24.2，2026-07-15；之前是 30 分钟，0.23.6 起）。changelog 原文："Subagent timeout now defaults to 2 hours everywhere; override with `[subagent] timeout_ms` or `KIMI_SUBAGENT_TIMEOUT_MS`."
- 配置项 `[subagent] timeout_ms`（`config.toml`），env `KIMI_SUBAGENT_TIMEOUT_MS`；0 表示无超时
- 打印模式 `kimi -p`：默认无超时

**Per-step LLM 重试**（针对模型单步调用）：

- 默认 10 次尝试（自 0.24.2，原文："The per-step LLM retry limit is raised from 3 to 10 attempts, so transient provider failures (429 / overload) are retried before a turn fails"）。
- 配置项 `loop_control.max_retries_per_step`（`config.toml`）

**Bash / 后台任务超时**：

- Bash 前台默认 60s、最长 5min；命中超时不会被杀，而是被移为后台任务继续跑（自 0.24.0，可通过 `bash_auto_background_on_timeout = false` 改回 kill-on-timeout）
- 后台 Bash 任务默认 600s 超时，配置 `[background] bash_task_timeout_s`，env 同样支持

**AgentSwarm 行为**：

- 工具"等所有 subagent 收齐"——同步等结果，不在工具内部做单条子任务重试
- 子代理的 TUI 状态：`running, waiting, completed, or failed`（`reference/tools.html`）
- 单个 subagent 失败由父 Agent 决定下一步（dispatch 这边要回到 SKILL.md 的"问用户：重试 / 跳过 / 中止"语义）

**Goal 模式退出码**（`kimi -p` 非交互）：

- `complete` → 0
- `blocked`（Kimi 自己判定不可达或缺信息）→ 3
- `paused`（被用户暂停或被错误中断）→ 6

**显式停止**：`TaskStop` 接受 `task_id` 与可选 `reason`；对已经终态的任务安全（"Safe to call on tasks that are already in a terminal state."）。`TaskOutput` 提供 `block` + `timeout` 让父端等完成。

**Provider 层面的错误**：

- 429 / overload 用 `Retry-After` 头驱动重试（0.25.0 改进，0.23.5 也提过）
- 413 context overflow 会先 compact 再重试（0.23.4）

## 对照现有 harness 适配文件

`skills/engineering/dispatch/references/harness-kimi-code.md`（写于 2026-07-21）现已覆盖：

1. 普通 dispatch：多任务使用 `AgentSwarm`，单任务使用 `Agent`，两者默认子代理类型均为 `coder`
2. 多阶段 dispatch：用 `/swarm` 开启会话级并发能力，由父 Agent 按层收齐结果、验证后推进
3. 长任务：用 `/goal <objective>` 跨 turn 持续推进整体目标

本笔记与适配文件分别承担事实记录和运行指引；官方来源与版本信息保持一致。

## 不确定项

- **`AgentSwarm` 的失败聚合报告细节**：官方文档说"returns an aggregated report"但没给 schema 字段；实际行为是父 Agent 看到的工具返回里包含每个 subagent 的最终结果。如果 dispatch 要用结构化失败计数，需要做一次实战记录。
- **Goal 模式 vs dispatch 的关系**：goal mode 是会话级持续推进，不是脚本式多阶段；dispatch 的"先派发再验证"心智模型在 goal mode 里不完全吻合。是否用 `/goal next` 把 dispatch 各个 phase 排进队列，是个值得做但还没实测的设想。
- **第三方 `linxule/kimi-plugin-cc` 的描述**（GitHub 上 AGENTS.md）显示早期版本（kimi 0.12.0+）里 `AgentSwarm` 默认偏 read-only、用 `explore`；当前 0.27.0 官方文档已明确默认 `coder`（write-capable）。二者并不矛盾——属不同版本快照。本笔记以**官方当前文档**为准。
- **Kimi Code 在国内版（kimi.moonshot.cn）与海外版（kimi.com/code）之间的差异**：本笔记只看了海外版 `kimi.com/code/docs/en/`。同一功能在两者之间是否有能力差，未交叉验证。

## 关键来源

- 工具与默认 subagent_type
  - https://www.kimi.com/code/docs/en/kimi-code-cli/reference/tools.html
- Subagent 类型、上下文隔离、权限继承
  - https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html
- Skill frontmatter、Skill 类型（与本任务相关性较低，作为佐证）
  - https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html
- 启动与版本总览
  - https://www.kimi.com/code/docs/en/
- Goal 模式（多轮持续推进的近邻机制）
  - https://www.kimi.com/code/docs/en/kimi-code-cli/guides/goals.html
- `/swarm` 切换命令
  - https://www.kimi.com/code/docs/en/kimi-code-cli/reference/slash-commands.html
- 版本行为变更（subagent timeout、AgentSwarm 限流、per-step retry）
  - https://www.kimi.com/code/docs/en/kimi-code-cli/release-notes/changelog.html

辅助（非官方一手，作交叉佐证）：

- Kimi Code CLI 官方仓库：`https://github.com/MoonshotAI/kimi-cli`（AgentSwarm 实现位于 `subagent-host.ts:362`，由第三方插件项目引用）
- 第三方插件项目对 AgentSwarm 行为的描述：`https://github.com/linxule/kimi-plugin-cc`（仅作版本快照对比，行为判定以官方文档为准）
