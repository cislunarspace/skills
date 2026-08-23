---
name: setup-pi
description: 配置 pi 的 piw / piw-clean shell 命令：新建分支和 worktree 直接进入 pi，及 worktree 的清理回收。手动运行。
disable-model-invocation: true
---

为当前机器配置 `piw`（新建分支和 worktree 后直接进入 pi）与 `piw-clean`（清理 piw 创建的 worktree、prune、删除分支并回到主仓库）两个 shell 函数。只写取得用户确认的文件。

## 1. 探索

读取，不要假设：

- 交互 shell 中 `type piw piw-clean` 是否已定义，以及对应 rc 文件中是否已有同名函数。
- 用户实际使用的 shell 及 rc 文件（bash 默认 `~/.bashrc`，zsh 用 `~/.zshrc`）。

## 2. 决策

说明两个命令的行为，向用户确认写入 rc 文件：

- `piw <分支名>`：新建分支和 worktree（`../pi-<分支名>`）后直接进入 pi。
- `piw-clean`：在 piw 创建的 worktree 内清理 worktree、prune、删除分支并回到主仓库。**有未提交改动时会强制删除 worktree，必须先向用户说明。**

函数块必须插入 rc 文件的非交互 guard 之前；已有同名函数时询问是否覆盖。

## 3. 确认写入

只展示将写入或更新的文件、使用的种子模板（`references/piw-commands.md`）及对已有内容的保留、替换或追加方式。不要输出模板全文。

得到确认后才写入。

## 4. 写入与结束

- 写入 rc 文件后，在新开交互 shell 验证 `type piw piw-clean`。
