---
name: setup-pi
description: 配置 pi coding agent：安装 piw/piw-clean 命令、subagent 扩展与 agents。首次在机器或仓库使用 pi 时手动运行。
disable-model-invocation: true
---

为 pi harness 建立命令行工具和 subagent 配置。先读取现状，再逐项取得用户结论；只在用户确认后写入。

## 1. 探索

读取，不要假设：

- `which pi`；交互 shell 里 `type piw piw-clean` 是否已定义；`~/.bashrc`（或等效 rc 文件）中是否已有同名函数。
- `~/.pi/agent/extensions/subagent/` 是否已装（应有 `index.ts`、`agents.ts`）。
- `~/.pi/agent/agents/` 中现有的用户级 agents。
- 当前仓库的 `pi/agents/` 与 `scripts/link-pi-agents.sh`（本 skills 仓库里有；别的机器可能没有）。
- 项目 `.pi/agents/` 与 `.claude/agents/`，根文档是否已有 `### Loop Engineering` / `## Loop 停止规则`。

## 2. 决策

先总结现状和缺口。按以下顺序逐项给出推荐，让用户接受、修改或跳过；每项结论确认后再进入下一项。

### A. piw / piw-clean 命令

`piw <分支名>` 新建分支 + worktree（`../pi-<分支名>`）并直接进入 pi；`piw-clean` 在 worktree 内清理当前 worktree、prune、删分支并回到主仓库。

默认写入 `~/.bashrc` 的**非交互 guard 之前**（与服务器 `.bashrc` 中 Rust/Cargo PATH 同位置，SSH 非交互命令也能用）。用户实际用的是 zsh 时写 `~/.zshrc`。已有同名函数时询问是否覆盖。

写入 rc 文件（种子 `piw-commands.md`）。

### B. subagent 扩展

pi 没有内置 subagent，官方 `subagent` 扩展提供（每个子代理是独立 `pi` 进程，上下文隔离）。symlink 官方示例：

```bash
PI_PKG="$(dirname "$(readlink -f "$(which pi)")")/../lib/node_modules/@earendil-works/pi-coding-agent"
mkdir -p ~/.pi/agent/extensions/subagent
ln -sf "$PI_PKG/examples/extensions/subagent/index.ts" ~/.pi/agent/extensions/subagent/index.ts
ln -sf "$PI_PKG/examples/extensions/subagent/agents.ts" ~/.pi/agent/extensions/subagent/agents.ts
```

已装（两个文件都在）时跳过。

### C. 用户级 agents

本仓库有 `pi/agents/` 时跑 `npm run link:pi`，软链 8 个 agent（standards-reviewer、spec-reviewer、builder、checker、scout、planner、reviewer、worker）到 `~/.pi/agent/agents/`。不锁模型，用 pi 默认模型。仓库不在手边时从 `pi/agents/` 复制或跳过并告知。

### D. 项目级 agents（项目用 loop-go 时）

写入 `.pi/agents/builder.md`、`.pi/agents/checker.md`（种子 `builder-pi.md`、`checker-pi.md`；tools 用 pi 小写工具名，不锁模型）。pi 的 subagent 工具默认只加载用户级 agents，项目级覆盖需 `agentScope: "both"`——只对可信仓库开，并在写入时说明。

### E. 根文档 Loop 指针

与 setup-claude-code 共享同一段：根文档（优先 `CLAUDE.md`，否则 `AGENTS.md`）写 `### Loop Engineering` 指针和 `## Loop 停止规则`。已有时跳过，避免重复。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板及对已有内容的保留、替换或追加方式。不要输出模板全文。

| 目标文件 | 种子模板 |
| --- | --- |
| rc 文件（`~/.bashrc` 等，guard 之前） | `piw-commands.md` |
| `~/.pi/agent/extensions/subagent/index.ts`、`agents.ts` | 官方示例（symlink） |
| `~/.pi/agent/agents/`（8 个 agent） | `pi/agents/*.md`（`npm run link:pi`） |
| `.pi/agents/builder.md`（loop-go 时） | `builder-pi.md` |
| `.pi/agents/checker.md`（loop-go 时） | `checker-pi.md` |
| 根文档 `### Loop Engineering` / `## Loop 停止规则` | `loop-stop-rules.md` |

得到确认后才写入。

## 4. 写入与结束

- rc 文件：函数块插到非交互 guard 之前；已有同名函数时先把旧定义注释备份再替换。
- 写完验证：新开交互 shell `type piw piw-clean`；`ls ~/.pi/agent/extensions/subagent/` 与 `ls ~/.pi/agent/agents/` 内容就位；项目内 `git worktree list` 第一条是主仓库。
- 完成后说明：`piw <分支名>` 直接可用；loop-go 在 pi 下用 subagent 派发，依赖 C（用户级 builder/checker）和 D（项目级覆盖，可选）。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| `pi` 未安装 | 先装 pi（`npm i -g` 或用户惯用方式），再继续 |
| 仓库不在手边（无 `pi/agents/` 和 `link:pi`） | 手动复制种子到 `~/.pi/agent/agents/`，或跳过 C 并告知缺哪些 agent |
| `~/.bashrc` 不存在 | 创建它；实际用的是 zsh/fish 时写对应 rc 文件并告知 |
| rc 文件已有 piw/piw-clean | 询问覆盖；拒绝则跳过 A |
| 项目 `.pi/agents/` 已有同名文件 | 询问覆盖；拒绝则跳过 |
| 项目不可信（项目级 agents 需 `agentScope: "both"` 才加载） | 跳过 D，说明可用用户级 agents 兜底 |
| worktree 中运行（`.pi/` 不随 worktree 出现） | 回主工作目录重跑本 skill |

## Checkpoint

停下来问用户：

1. 覆盖已有 piw/piw-clean 或 rc 文件内容。
2. 写 `.pi/agents/` 项目级文件（涉及 `agentScope: "both"` 信任决策）。
3. 任务范围超出上述各项。

其他情况：做完再汇报。

## 完成条件

- rc 文件含新版 `piw` 与 `piw-clean` 函数，交互 shell 加载后 `type piw-clean` 可见"自动定位主仓库"逻辑。
- subagent 扩展与用户级 agents 就位（B、C）。
- 项目需要 loop-go 时，`.pi/agents/` 项目级 agents 与根文档 Loop 指针就位（D、E）。
