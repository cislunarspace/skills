#!/usr/bin/env node
/**
 * Return files modified by edit tools in the current Claude Code session.
 *
 * Primary source: Claude Code transcript JSONL for CLAUDE_CODE_SESSION_ID.
 * Fallback source: legacy .claude/session-files.log from cwd or git root.
 *
 * Usage:
 *   node scripts/get-session-files.js [repo-root]
 *
 * Exit codes / stdout:
 *   "NO_LOG"        — no transcript or legacy log exists
 *   "NO_SESSION_ID" — CLAUDE_CODE_SESSION_ID env var not set
 *   "EMPTY"         — sources exist but no files for this session
 *   JSON array      — list of repo-relative file paths tracked this session
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const EDIT_TOOL_NAMES = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const LEGACY_STALE_SECONDS = 86400;
const TRANSCRIPT_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_DISCOVERY_FILE_BYTES = 50 * 1024 * 1024;

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

function repoRoot() {
  const explicitRoot = process.argv[2];
  return gitRoot(explicitRoot || process.cwd());
}

function encodeProjectPath(projectPath) {
  return projectPath.replace(/\//g, '-');
}

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

function entryMatchesSession(entry, sessionId) {
  return (
    entry?.sessionId === sessionId ||
    entry?.message?.sessionId === sessionId ||
    entry?.session_id === sessionId ||
    entry?.message?.session_id === sessionId
  );
}

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

function transcriptCandidates(sessionId, root) {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  const encodedRoots = [...new Set([root, process.cwd()].map(encodeProjectPath))];
  const direct = encodedRoots.map((encodedRoot) =>
    path.join(projectsDir, encodedRoot, `${sessionId}.jsonl`)
  );

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

  return listJsonlFiles(projectsDir)
    .filter(isRecentTranscript)
    .filter((filePath) => transcriptContainsSession(filePath, sessionId));
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function addIfInRepo(files, filePath, root, basePath) {
  if (!filePath || typeof filePath !== 'string') return;

  const absolutePath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(basePath || root, filePath);

  if (!isPathInside(absolutePath, root)) return;

  files.add(path.relative(root, absolutePath));
}

function addToolInputFiles(files, toolName, input, root, basePath) {
  if (input === null || typeof input !== 'object') return;

  const normalizedToolName = toolName.split('.').pop();
  if (EDIT_TOOL_NAMES.has(normalizedToolName)) {
    addIfInRepo(files, input.file_path, root, basePath);
    addIfInRepo(files, input.path, root, basePath);
    addIfInRepo(files, input.notebook_path, root, basePath);

    if (Array.isArray(input.files)) {
      for (const filePath of input.files) addIfInRepo(files, filePath, root, basePath);
    }
  }

  if (Array.isArray(input.tool_uses)) {
    for (const nestedTool of input.tool_uses) {
      const nestedName = nestedTool.name || nestedTool.recipient_name || '';
      const nestedInput = nestedTool.input || nestedTool.parameters || {};
      addToolInputFiles(files, nestedName, nestedInput, root, basePath);
    }
  }
}

function addFileHistorySnapshotFiles(files, entry, root) {
  if (entry?.type !== 'file-history-snapshot') return;

  const backups = entry.snapshot?.trackedFileBackups;
  if (backups === null || typeof backups !== 'object') return;

  for (const filePath of Object.keys(backups)) addIfInRepo(files, filePath, root, root);
}

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

function legacyLogCandidates(root) {
  return [
    path.join(process.cwd(), '.claude', 'session-files.log'),
    path.join(root, '.claude', 'session-files.log'),
  ];
}

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

    if (timestamp >= staleCutoff || entrySessionId === sessionId) keep.push(line);
    if (entrySessionId === sessionId) addIfInRepo(files, filePath, root, root);
  }

  fs.writeFileSync(logPath, keep.join('\n') + (keep.length ? '\n' : ''));
  return files;
}

function main() {
  const sessionId = process.env.CLAUDE_CODE_SESSION_ID || '';
  if (!sessionId) {
    console.log('NO_SESSION_ID');
    return;
  }

  const root = repoRoot();
  const files = new Set();
  let foundSource = false;

  for (const transcriptPath of transcriptCandidates(sessionId, root)) {
    foundSource = true;
    for (const filePath of collectTranscriptFiles(transcriptPath, root, sessionId)) {
      files.add(filePath);
    }
  }

  if (files.size === 0) {
    for (const logPath of [...new Set(legacyLogCandidates(root))]) {
      if (!fs.existsSync(logPath)) continue;
      foundSource = true;
      for (const filePath of collectLegacyLogFiles(logPath, sessionId, root)) files.add(filePath);
    }
  }

  if (!foundSource) {
    console.log('NO_LOG');
    return;
  }

  if (files.size === 0) {
    console.log('EMPTY');
    return;
  }

  console.log(JSON.stringify([...files].sort(), null, 2));
}

main();
