#!/usr/bin/env node
/**
 * get-session-files.js 单元测试
 * 使用 Node.js 内置测试模块 node:test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

// 导入被测试的模块（通过 require 获取内部函数会很复杂，这里通过 execFileSync 测试 main）
const SCRIPT_PATH = path.join(__dirname, 'get-session-files.js');

// 辅助函数：创建临时目录
function createTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'get-session-files-test-'));
}

// 辅助函数：运行脚本并捕获输出
function runScript(args = [], env = {}) {
  try {
    // 合并环境变量时，env 参数中的 undefined 值会删除对应的环境变量
    const mergedEnv = { ...process.env };
    for (const key in env) {
      if (env[key] === undefined) {
        delete mergedEnv[key];
      } else {
        mergedEnv[key] = env[key];
      }
    }
    const result = childProcess.execFileSync(process.execPath, [SCRIPT_PATH, ...args], {
      encoding: 'utf8',
      env: mergedEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout: result.trim(), stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || '').trim(),
      stderr: (err.stderr || '').trim(),
      exitCode: err.status || 1,
    };
  }
}

describe('get-session-files', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(() => {
    tmpDir = createTmpDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    // 初始化 git 仓库
    childProcess.execFileSync('git', ['init', '-q'], { cwd: tmpDir, stdio: 'ignore' });
    childProcess.execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, stdio: 'ignore' });
    childProcess.execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, stdio: 'ignore' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('无日志文件时返回"无会话ID"', () => {
    // 传入 undefined 删除环境变量
    const result = runScript([tmpDir], { CLAUDE_CODE_SESSION_ID: undefined });
    assert.equal(result.stdout, '无会话ID');
  });

  it('有 CLAUDE_CODE_SESSION_ID 但无日志文件时返回"无日志"', () => {
    const result = runScript([tmpDir], { CLAUDE_CODE_SESSION_ID: 'test-session-123' });
    assert.equal(result.stdout, '无日志');
  });

  it('有旧版日志文件但无内容时返回空列表', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'session-files.log'), '');

    const result = runScript([tmpDir], { CLAUDE_CODE_SESSION_ID: 'test-session-123' });
    assert.equal(result.stdout, '空');
  });

  it('有旧版日志文件且有内容时返回正确的文件列表', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // 创建被记录的文件
    fs.writeFileSync(path.join(tmpDir, 'foo.txt'), 'hello');
    fs.writeFileSync(path.join(tmpDir, 'bar.txt'), 'world');

    // 写入日志条目：sessionId\ttimestamp\tfilepath
    const now = Math.floor(Date.now() / 1000);
    const logContent = [
      `test-session-123\t${now}\tfoo.txt`,
      `test-session-123\t${now}\tbar.txt`,
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(claudeDir, 'session-files.log'), logContent);

    const result = runScript([tmpDir], { CLAUDE_CODE_SESSION_ID: 'test-session-123' });
    const files = JSON.parse(result.stdout);
    assert.ok(Array.isArray(files));
    assert.ok(files.includes('foo.txt'));
    assert.ok(files.includes('bar.txt'));
  });

  it('文件路径在 git 仓库外时被过滤', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    const now = Math.floor(Date.now() / 1000);
    const logContent = [
      `test-session-123\t${now}\t../../../etc/passwd`,
      `test-session-123\t${now}\tvalid-file.txt`,
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(claudeDir, 'session-files.log'), logContent);
    fs.writeFileSync(path.join(tmpDir, 'valid-file.txt'), 'ok');

    const result = runScript([tmpDir], { CLAUDE_CODE_SESSION_ID: 'test-session-123' });
    const files = JSON.parse(result.stdout);
    assert.ok(Array.isArray(files));
    assert.ok(files.includes('valid-file.txt'));
    assert.ok(!files.includes('../../../etc/passwd'));
    assert.ok(!files.some(f => f.includes('etc/passwd')));
  });
});
