#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const cliPath = path.join(workspaceRoot, 'node_modules', 'chrome-devtools-mcp', 'build', 'src', 'index.js');

if (!fs.existsSync(cliPath)) {
  console.error('chrome-devtools-mcp CLI not found. Run `npm install` first.');
  process.exit(1);
}

const {
  CHROME_MCP_BROWSER_URL,
  CHROME_MCP_EXECUTABLE,
  CHROME_MCP_CHANNEL,
  CHROME_MCP_HEADLESS,
  CHROME_MCP_LOG_FILE,
} = process.env;

const args = [];

if (CHROME_MCP_BROWSER_URL) {
  args.push('--browserUrl', CHROME_MCP_BROWSER_URL);
}

if (CHROME_MCP_LOG_FILE) {
  args.push('--logFile', CHROME_MCP_LOG_FILE);
}

if (CHROME_MCP_EXECUTABLE && CHROME_MCP_CHANNEL) {
  console.error('Set either CHROME_MCP_EXECUTABLE or CHROME_MCP_CHANNEL, not both.');
  process.exit(1);
}

if (CHROME_MCP_EXECUTABLE) {
  args.push('--executablePath', CHROME_MCP_EXECUTABLE);
} else if (CHROME_MCP_CHANNEL) {
  args.push('--channel', CHROME_MCP_CHANNEL);
} else {
  const defaultChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(defaultChrome)) {
    args.push('--executablePath', defaultChrome);
  }
}

if (CHROME_MCP_HEADLESS === '1') {
  args.push('--headless');
}

const child = spawn(process.execPath, [cliPath, ...args], {
  cwd: workspaceRoot,
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to launch chrome-devtools-mcp', error);
  process.exit(1);
});
