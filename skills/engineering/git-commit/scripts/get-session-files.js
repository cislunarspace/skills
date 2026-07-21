#!/usr/bin/env node
/**
 * 返回当前 agent 会话中被编辑工具修改过的文件。
 *
 * 主源：CLSAUDE_CODE_SESSION_ID 对应的 Claude Code 转录 JSONL。
 * 次源：~/.kimi-code/sessions 下的 Kimi Code wire JSONL（主线程 + 子代理 agent-N）。
 * 回退源：当前工作目录或 git 根目录下的旧版 .claude/session-files.log。
 *
 * 用法：
 *   node scripts/get-session-files.js [repo-root]
 *
 * 退出码 / 标准输出：
 *   "无日志"        — 不存在转录或旧版日志
 *   "无会话ID"      — 未设置 CLAUDE_CODE_SESSION_ID 环境变量
 *   "空"            — 源存在，但本会话没有文件
 *   JSON array      — 本会话跟踪的仓库相对路径列表
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

// 会修改文件的工具名；扫描转录时只关心这些工具的输入。
const EDIT_TOOL_NAMES = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

// 旧版日志里超过这个时间戳的记录会被清理（24 小时）。
const LEGACY_STALE_SECONDS = 86400;

// 兜底扫描转录文件时，只考虑最近 14 天内修改过的文件。
const TRANSCRIPT_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

// 扫描时跳过过大的 jsonl 文件，避免意外读取超大日志。
const MAX_DISCOVERY_FILE_BYTES = 50 * 1024 * 1024;

// Kimi Code wire 文件只看最近 24 小时，减少误匹配其他会话。
const KIMI_WIRE_LOOKBACK_MS = 24 * 60 * 60 * 1000;

// 探测 wire 文件时只读前 200 行来找归属信号，避免读取整个文件。
const KIMI_WIRE_CWD_PROBE_LINES = 200;

// 用 git 找仓库根目录；不在 git 仓库里时退回到传入路径本身。
function gitRoot(startPath) {
  try {
    return childProcess
      .execFileSync('git', ['-C', startPath, 'rev-parse', '--show-toplevel'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      .trim();
  } catch {
    return path.resolve(startPath);
  }
}

// 命令行可传 repo-root，否则用当前目录。
function repoRoot() {
  const explicitRoot = process.argv[2];
  return gitRoot(explicitRoot || process.cwd());
}

// Claude Code 用项目路径的编码形式作为目录名（把 / 替换成 -）。
function encodeProjectPath(projectPath) {
  return projectPath.replace(/\//g, '-');
}

// 递归列出目录下所有 .jsonl 文件。
function listJsonlFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonlFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(entryPath);
  }

  return files;
}

// 转录文件候选：不能太大、不能太旧。
function isRecentTranscript(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return (
      stat.size <= MAX_DISCOVERY_FILE_BYTES &&
      Date.now() - stat.mtimeMs <= TRANSCRIPT_LOOKBACK_MS
    );
  } catch {
    return false;
  }
}

// 转录条目可能在不同字段存 sessionId，兼容几种写法。
function entryMatchesSession(entry, sessionId) {
  return (
    entry?.sessionId === sessionId ||
    entry?.message?.sessionId === sessionId ||
    entry?.session_id === sessionId ||
    entry?.message?.session_id === sessionId
  );
}

// 检查某个转录文件里是否至少有一行属于目标 session。
function transcriptContainsSession(filePath, sessionId) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    return lines.some((line) => {
      try {
        return entryMatchesSession(JSON.parse(line), sessionId);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// 先按已知规则找转录文件；找不到再兜底扫描最近文件。
function transcriptCandidates(sessionId, root) {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');

  // 直接路径：按项目编码后的目录 + sessionId.jsonl。
  const encodedRoots = [...new Set([root, process.cwd()].map(encodeProjectPath))];
  const direct = encodedRoots.map((encodedRoot) =>
    path.join(projectsDir, encodedRoot, `${sessionId}.jsonl`)
  );

  // 浅层扫描：项目目录下所有子目录里的 sessionId.jsonl。
  let shallow = [];
  if (fs.existsSync(projectsDir)) {
    shallow = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(projectsDir, entry.name, `${sessionId}.jsonl`));
  }

  const exactMatches = [...new Set([...direct, ...shallow])].filter((filePath) =>
    fs.existsSync(filePath)
  );
  if (exactMatches.length > 0) return exactMatches;

  // 兜底：扫描所有近期 jsonl，逐行确认是否包含目标 session。
  return listJsonlFiles(projectsDir)
    .filter(isRecentTranscript)
    .filter((filePath) => transcriptContainsSession(filePath, sessionId));
}

// 判断 childPath 是否在 parentPath 内部（或就是 parentPath 本身）。
function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// 把路径转成仓库相对路径后加入集合；不在仓库内的路径会被忽略。
function addIfInRepo(files, filePath, root, basePath) {
  if (!filePath || typeof filePath !== 'string') return;

  const absolutePath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(basePath || root, filePath);

  if (!isPathInside(absolutePath, root)) return;

  files.add(path.relative(root, absolutePath));
}

// 从工具调用的输入里提取被修改的文件路径；支持嵌套工具调用。
function addToolInputFiles(files, toolName, input, root, basePath) {
  if (input === null || typeof input !== 'object') return;

  const normalizedToolName = toolName.split('.').pop();
  if (EDIT_TOOL_NAMES.has(normalizedToolName)) {
    // 不同编辑工具用的路径字段名不一样，分别尝试。
    addIfInRepo(files, input.file_path, root, basePath);
    addIfInRepo(files, input.path, root, basePath);
    addIfInRepo(files, input.notebook_path, root, basePath);

    if (Array.isArray(input.files)) {
      for (const filePath of input.files) addIfInRepo(files, filePath, root, basePath);
    }
  }

  // 递归处理嵌套工具调用。
  if (Array.isArray(input.tool_uses)) {
    for (const nestedTool of input.tool_uses) {
      const nestedName = nestedTool.name || nestedTool.recipient_name || '';
      const nestedInput = nestedTool.input || nestedTool.parameters || {};
      addToolInputFiles(files, nestedName, nestedInput, root, basePath);
    }
  }
}

// 从 file-history-snapshot 条目里提取被跟踪的文件备份路径。
function addFileHistorySnapshotFiles(files, entry, root) {
  if (entry?.type !== 'file-history-snapshot') return;

  const backups = entry.snapshot?.trackedFileBackups;
  if (backups === null || typeof backups !== 'object') return;

  for (const filePath of Object.keys(backups)) addIfInRepo(files, filePath, root, root);
}

// 遍历转录文件的每一行，收集当前 session 里被编辑工具修改过的文件。
function collectTranscriptFiles(transcriptPath, root, sessionId) {
  const files = new Set();
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    // 如果条目带 sessionId 但不匹配，跳过。
    if (entry.sessionId && entry.sessionId !== sessionId) continue;

    addFileHistorySnapshotFiles(files, entry, root);

    const basePath = entry.cwd || root;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;

    for (const item of content) {
      if (item?.type === 'tool_use') {
        addToolInputFiles(files, item.name, item.input, root, basePath);
      }
    }
  }

  return files;
}

// 旧版日志可能存放在 cwd 或 git 根目录的 .claude 下。
function legacyLogCandidates(root) {
  return [
    path.join(process.cwd(), '.claude', 'session-files.log'),
    path.join(root, '.claude', 'session-files.log'),
  ];
}

// 读取旧版日志，清理过期记录，返回当前 session 的文件集合。
function collectLegacyLogFiles(logPath, sessionId, root) {
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  const now = Math.floor(Date.now() / 1000);
  const staleCutoff = now - LEGACY_STALE_SECONDS;
  const keep = [];
  const files = new Set();

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const [entrySessionId, ts, ...rest] = parts;
    const filePath = rest.join('\t');
    const timestamp = Number.parseInt(ts, 10);

    // 保留未过期的记录，以及当前 session 的所有记录。
    if (timestamp >= staleCutoff || entrySessionId === sessionId) keep.push(line);
    if (entrySessionId === sessionId) addIfInRepo(files, filePath, root, root);
  }

  // 写回清理后的日志。
  fs.writeFileSync(logPath, keep.join('\n') + (keep.length ? '\n' : ''));
  return files;
}

// --- Kimi Code 支持 -------------------------------------------------------

function kimiCodeRoot() {
  return path.join(os.homedir(), '.kimi-code');
}

// 扫描 ~/.kimi-code/sessions 下所有 session 的所有 agent wire。
// 主线程（agents/main）与子代理（agents/agent-N）都纳入候选。
function listKimiWireFiles() {
  const sessionsDir = path.join(kimiCodeRoot(), 'sessions');
  if (!fs.existsSync(sessionsDir)) return [];

  const wires = [];
  for (const projectEntry of fs.readdirSync(sessionsDir, { withFileTypes: true })) {
    if (!projectEntry.isDirectory()) continue;
    const projectDir = path.join(sessionsDir, projectEntry.name);

    for (const sessionEntry of fs.readdirSync(projectDir, { withFileTypes: true })) {
      if (!sessionEntry.isDirectory()) continue;
      const agentsDir = path.join(projectDir, sessionEntry.name, 'agents');
      if (!fs.existsSync(agentsDir)) continue;

      for (const agentEntry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
        if (!agentEntry.isDirectory()) continue;
        const wirePath = path.join(agentsDir, agentEntry.name, 'wire.jsonl');
        if (fs.existsSync(wirePath)) wires.push(wirePath);
      }
    }
  }
  return wires;
}

// 读 wire 文件开头，看 tool.call 的 cwd 或 args.path 是否指向当前仓库。
// Bash 事件带 display.cwd，主信号；
// Edit/Write 等子代理事件常给绝对 args.path，作为次级信号。
function wireReferencesRepo(wirePath, root) {
  try {
    const fd = fs.openSync(wirePath, 'r');
    try {
      const bufferSize = 256 * 1024;
      const buffer = Buffer.alloc(bufferSize);
      const bytesRead = fs.readSync(fd, buffer, 0, bufferSize, 0);
      const head = buffer.toString('utf8', 0, bytesRead);
      const lines = head.split('\n').slice(0, KIMI_WIRE_CWD_PROBE_LINES);

      for (const line of lines) {
        if (!line.includes('"tool.call"')) continue;
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        const event = entry?.event;
        if (!event) continue;

        const cwd = event.display?.cwd || event.cwd || '';
        if (cwd) {
          const normalizedCwd = path.normalize(cwd);
          if (isPathInside(normalizedCwd, root) || isPathInside(root, normalizedCwd)) {
            return true;
          }
          continue;
        }

        // 没有 cwd 时，回退到 args.path（绝对路径）做归属判断。
        const args = event.args;
        const candidate = args && typeof args.path === 'string' ? args.path : '';
        if (
          candidate &&
          path.isAbsolute(candidate) &&
          isPathInside(path.normalize(candidate), root)
        ) {
          return true;
        }
      }
      return false;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

// 找最近修改过、归属到当前仓库的 Kimi wire，并返回同 session 的所有 agent wire。
// 主线程和子代理的 wire 视为同一工作单元——它们一定在同一仓库下运作。
function findKimiWires(root) {
  const cutoff = Date.now() - KIMI_WIRE_LOOKBACK_MS;
  const candidates = listKimiWireFiles()
    .map((wirePath) => ({ wirePath, stat: fs.statSync(wirePath) }))
    .filter(({ stat }) => stat.mtimeMs >= cutoff)
    .filter(({ wirePath }) => wireReferencesRepo(wirePath, root))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  if (candidates.length === 0) return [];

  // 从最新一条往上溯到 agents/ 目录，把同 session 的 wire 全部收进来。
  const agentsDir = path.dirname(path.dirname(candidates[0].wirePath));
  if (!fs.existsSync(agentsDir)) return [candidates[0].wirePath];

  const sameSession = [];
  for (const agentEntry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!agentEntry.isDirectory()) continue;
    const wirePath = path.join(agentsDir, agentEntry.name, 'wire.jsonl');
    if (fs.existsSync(wirePath)) sameSession.push(wirePath);
  }
  return sameSession.length > 0 ? sameSession : [candidates[0].wirePath];
}

// 从一个或多个 Kimi wire 里收集 tool.call 中编辑工具修改过的文件。
function collectKimiFiles(wirePaths, root) {
  const files = new Set();

  for (const wirePath of wirePaths) {
    const lines = fs.readFileSync(wirePath, 'utf8').split('\n').filter(Boolean);

    for (const line of lines) {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (entry?.type !== 'context.append_loop_event') continue;
      const event = entry?.event;
      if (event?.type !== 'tool.call') continue;

      const basePath = event?.display?.cwd || event?.cwd || root;
      addToolInputFiles(files, event.name || '', event.args || {}, root, basePath);
    }
  }

  return files;
}

// --- 主流程 ----------------------------------------------------------------

function main() {
  const root = repoRoot();
  const files = new Set();
  let foundSource = false;

  // Claude Code 路径
  const claudeSessionId = process.env.CLAUDE_CODE_SESSION_ID || '';
  if (claudeSessionId) {
    for (const transcriptPath of transcriptCandidates(claudeSessionId, root)) {
      foundSource = true;
      for (const filePath of collectTranscriptFiles(transcriptPath, root, claudeSessionId)) {
        files.add(filePath);
      }
    }

    // 转录里没有文件时，再试试旧版日志。
    if (files.size === 0) {
      for (const logPath of [...new Set(legacyLogCandidates(root))]) {
        if (!fs.existsSync(logPath)) continue;
        foundSource = true;
        for (const filePath of collectLegacyLogFiles(logPath, claudeSessionId, root)) {
          files.add(filePath);
        }
      }
    }

    // Kimi Code 路径：只有 Claude Code 没找到文件时才走这里。
    if (files.size === 0) {
      const kimiWires = findKimiWires(root);
      if (kimiWires.length > 0) {
        foundSource = true;
        for (const filePath of collectKimiFiles(kimiWires, root)) {
          files.add(filePath);
        }
      }
    }

    if (!foundSource) {
      console.log('无日志');
      return;
    }
  } else {
    // 没有 CLAUDE_CODE_SESSION_ID，直接返回"无会话ID"
    console.log('无会话ID');
    return;
  }

  if (files.size === 0) {
    console.log('空');
    return;
  }

  // 输出排序后的仓库相对路径数组。
  console.log(JSON.stringify([...files].sort(), null, 2));
}

main();
