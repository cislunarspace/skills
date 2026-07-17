#!/usr/bin/env bash
# 枚举仓库内所有 skill 的共享 helper。
#
# 抽象层选择：输出 skill 的"目录绝对路径"（每行一个），而不是 SKILL.md
# 文件路径。理由：三个调用方各自需要的东西都能从目录路径轻松派生——
# list-skills.sh 要名字（basename）、check-skills.sh 要 SKILL.md 路径
# （目录 + /SKILL.md）、link-skills.sh 要目录路径本身。SKILL.md 只是
# skill 目录的一个隐含约定，把目录作为最小公共单元最自然，调用方需要
# 文件时自己拼 /SKILL.md。
#
# 过滤规则集中在这里一处：找名为 SKILL.md 的文件，且排除 deprecated/。

set -euo pipefail

# 输出所有 skill 目录的绝对路径，每行一个。
# 调用方约定：本函数依赖环境变量 $REPO 已被设置为仓库根目录。
# 不做排序——find 的遍历顺序不确定，需要稳定顺序的调用方自行 sort。
list_skill_dirs() {
  find "$REPO/skills" -name SKILL.md -not -path '*/deprecated/*' \
    -exec dirname {} \;
}
