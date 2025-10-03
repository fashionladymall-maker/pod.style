#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

const reportsDir = path.resolve('docs', 'reports');
const outputPath = path.join(reportsDir, 'gate-report.md');

const previewUrl = process.env.PREVIEW_URL ?? 'http://localhost:6100';
const screenshotPath = process.env.MCP_SCREENSHOT_PATH ?? path.join(reportsDir, 'latest-screenshot.png');
const tracePath = process.env.MCP_TRACE_PATH ?? path.join(reportsDir, 'latest-trace.json');
const notesPath = process.env.MCP_NOTES_PATH ?? path.join(reportsDir, 'mcp-notes.md');
const now = new Date();

async function ensureReportsDir() {
  await fs.mkdir(reportsDir, { recursive: true });
}

async function measureHttp() {
  try {
    const start = performance.now();
    const res = await fetch(previewUrl, { redirect: 'manual' });
    const end = performance.now();
    const body = await res.text();
    const sizeKb = Buffer.byteLength(body) / 1024;
    return {
      ok: true,
      status: res.status,
      timingMs: Number((end - start).toFixed(2)),
      contentLengthKb: Number(sizeKb.toFixed(2)),
      url: res.url || previewUrl,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      url: previewUrl,
    };
  }
}

async function readIfExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return {
      path: filePath,
      sizeKb: Number((stat.size / 1024).toFixed(2)),
      updatedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

async function main() {
  await ensureReportsDir();
  const httpSummary = await measureHttp();
  const screenshotMeta = await readIfExists(screenshotPath);
  const traceMeta = await readIfExists(tracePath);
  const notesMeta = await readIfExists(notesPath);

  const lines = [];
  lines.push('# MCP Gate Report');
  lines.push('');
  lines.push(`- Generated: ${now.toISOString()}`);
  lines.push(`- Preview URL: ${httpSummary.url}`);
  lines.push('');
  lines.push('## Live Check');
  if (httpSummary.ok) {
    lines.push(`- HTTP Status: ${httpSummary.status}`);
    lines.push(`- Response Time: ${httpSummary.timingMs} ms`);
    lines.push(`- HTML Size: ${httpSummary.contentLengthKb} KB`);
  } else {
    lines.push('- HTTP Status: failed to fetch preview');
    lines.push(`- Error: ${httpSummary.error}`);
  }
  lines.push('');
  lines.push('## MCP Artifacts');
  if (screenshotMeta) {
    lines.push(`- Screenshot: ${screenshotMeta.path} (${screenshotMeta.sizeKb} KB, updated ${screenshotMeta.updatedAt})`);
  } else {
    lines.push(`- Screenshot: _not found_ (set MCP_SCREENSHOT_PATH after running chrome-devtools-mcp)`);
  }
  if (traceMeta) {
    lines.push(`- Trace JSON: ${traceMeta.path} (${traceMeta.sizeKb} KB, updated ${traceMeta.updatedAt})`);
  } else {
    lines.push(`- Trace JSON: _not found_ (set MCP_TRACE_PATH to the trace exported by chrome-devtools-mcp)`);
  }
  if (notesMeta) {
    lines.push(`- Analyst Notes: ${notesMeta.path} (${notesMeta.sizeKb} KB, updated ${notesMeta.updatedAt})`);
  } else {
    lines.push(`- Analyst Notes: _not found_ (optional narrative summary from DevTools session)`);
  }
  lines.push('');
  lines.push('## Next Steps');
  lines.push('- Run `chrome-devtools-mcp` to capture screenshot + trace, then set environment variables so this script can reference them.');
  lines.push('- Commit this report and referenced artifacts for CI gate review.');

  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`✅ MCP report written to ${outputPath}`);
}

main().catch((error) => {
  console.error('❌ Failed to generate MCP gate report:', error);
  process.exitCode = 1;
});
