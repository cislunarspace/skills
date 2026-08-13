'use strict';

// loop.test.js — loop-go 相关文件的回归测试，仅用 Node 内置模块。
// 守护两个常被破坏的点：
// 1. loop-go/SKILL.md 的 frontmatter（name/description）——check-skills.sh 也查，这里直接断言。
// 2. 三个 setup 技能的种子文件必须保持干净（无 U+00A0、无 CR），
//    否则复制进目标仓库会带进畸形空白。NBSP/CRLF 是最常见的破坏点。

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const LOOP_GO_SKILL = path.resolve(__dirname, 'SKILL.md');
const SETUP_REFERENCES = path.resolve(__dirname, '..', 'setup-ouyangjiahong-skills', 'references');
const SETUP_PI_REFERENCES = path.resolve(__dirname, '..', 'setup-pi', 'references');
const SETUP_CC_REFERENCES = path.resolve(__dirname, '..', 'setup-claude-code', 'references');

const SEED_FILES = [
  { dir: SETUP_REFERENCES, name: 'loop-stop-rules.md' },
  { dir: SETUP_PI_REFERENCES, name: 'builder-pi.md' },
  { dir: SETUP_PI_REFERENCES, name: 'checker-pi.md' },
  { dir: SETUP_CC_REFERENCES, name: 'builder.md' },
  { dir: SETUP_CC_REFERENCES, name: 'checker.md' },
  { dir: SETUP_CC_REFERENCES, name: 'loop-go-command.md' },
];

test('loop-go/SKILL.md 含 name 和 description frontmatter', () => {
  const content = fs.readFileSync(LOOP_GO_SKILL, 'utf8');
  assert.match(content, /^name:\s*loop-go$/m, '应含 name: loop-go');
  assert.match(content, /^description:\s*.+/m, '应含 description');
});

test('loop-go/SKILL.md 无 U+00A0 与 CR', () => {
  const buf = fs.readFileSync(LOOP_GO_SKILL);
  assert.ok(!buf.includes(0x0d), 'SKILL.md 不应含 CR (0x0d)');
  assert.ok(!buf.toString('utf8').includes(' '), 'SKILL.md 不应含 U+00A0');
});

test('setup references 的种子文件都存在', () => {
  for (const { dir, name } of SEED_FILES) {
    const filePath = path.join(dir, name);
    assert.ok(fs.existsSync(filePath), `${name} 应存在`);
  }
});

test('setup references 种子文件无 U+00A0 与 CR', () => {
  for (const { dir, name } of SEED_FILES) {
    const buf = fs.readFileSync(path.join(dir, name));
    assert.ok(!buf.includes(0x0d), `${name} 不应含 CR (0x0d)`);
    assert.ok(!buf.toString('utf8').includes(' '), `${name} 不应含 U+00A0`);
  }
});

test('builder/checker 种子保留 agent 定义关键字段', () => {
  const builder = fs.readFileSync(path.join(SETUP_CC_REFERENCES, 'builder.md'), 'utf8');
  assert.match(builder, /^name:\s*builder$/m, 'builder.md 应含 name: builder');
  assert.match(builder, /^tools:\s*Read, Write, Edit, Glob, Grep, Bash$/m, 'builder.md 应含写工具');

  const checker = fs.readFileSync(path.join(SETUP_CC_REFERENCES, 'checker.md'), 'utf8');
  assert.match(checker, /^name:\s*checker$/m, 'checker.md 应含 name: checker');
  assert.match(checker, /^tools:\s*Read, Grep, Glob, Bash$/m, 'checker.md tools 应无写工具');
  assert.ok(!checker.includes('Write') && !checker.includes('Edit'), 'checker 不应有写工具');
});

test('builder-pi/checker-pi 种子用 pi 小写工具名', () => {
  const builder = fs.readFileSync(path.join(SETUP_PI_REFERENCES, 'builder-pi.md'), 'utf8');
  assert.match(builder, /^name:\s*builder$/m, 'builder-pi.md 应含 name: builder');
  assert.match(builder, /^tools:\s*read, write, edit, grep, find, ls, bash$/m, 'builder-pi.md 应含小写工具');

  const checker = fs.readFileSync(path.join(SETUP_PI_REFERENCES, 'checker-pi.md'), 'utf8');
  assert.match(checker, /^name:\s*checker$/m, 'checker-pi.md 应含 name: checker');
  assert.match(checker, /^tools:\s*read, grep, find, ls, bash$/m, 'checker-pi.md tools 应无写工具');
  assert.ok(!checker.includes('write') && !checker.includes('edit'), 'checker-pi 不应有写工具');
});

test('loop-go-command.md 保留命令关键字段', () => {
  const content = fs.readFileSync(path.join(SETUP_CC_REFERENCES, 'loop-go-command.md'), 'utf8');
  assert.match(content, /以循环方式执行此任务：\$ARGUMENTS/, '命令应引用 $ARGUMENTS');
  assert.match(content, /^allowed-tools:/m, '命令应含 allowed-tools');
  assert.match(content, /ALL GREEN/, '命令应含 ALL GREEN 判定');
});

test('loop-stop-rules.md 含停止条件与红线', () => {
  const content = fs.readFileSync(path.join(SETUP_REFERENCES, 'loop-stop-rules.md'), 'utf8');
  assert.match(content, /^## 停止条件$/m, '应含 ## 停止条件');
  assert.match(content, /^## 红线$/m, '应含 ## 红线');
  assert.match(content, /^## 升级协议$/m, '应含 ## 升级协议');
});
