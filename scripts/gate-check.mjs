#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const reportsDir = path.resolve('docs', 'reports');
const gateReport = path.join(reportsDir, 'gate-report.md');
const summaryReport = path.join(reportsDir, 'summary.md');

const tasks = [
  {
    name: 'lint',
    cmd: 'npm',
    args: ['run', 'lint'],
    envFlag: 'SKIP_LINT',
  },
  {
    name: 'typecheck',
    cmd: 'npm',
    args: ['run', 'typecheck'],
    envFlag: 'SKIP_TYPECHECK',
  },
  {
    name: 'unit tests',
    cmd: 'npm',
    args: ['run', 'test'],
    envFlag: 'SKIP_TEST',
  },
  {
    name: 'banned word scan',
    cmd: 'npm',
    args: ['run', 'scan:banned'],
    envFlag: 'SKIP_BANNED_SCAN',
  },
  {
    name: 'bundle size check',
    cmd: 'npm',
    args: ['run', 'bundle:size'],
    envFlag: 'SKIP_BUNDLE_CHECK',
  },
];

function runTask(task) {
  if (process.env[task.envFlag] === '1') {
    console.log(`⚠️  Skipping ${task.name} (env ${task.envFlag}=1)`);
    return;
  }
  console.log(`➡️  Running ${task.name}...`);
  const result = spawnSync(task.cmd, task.args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  });
  if (result.status !== 0) {
    throw new Error(`${task.name} failed (exit code ${result.status ?? 'unknown'})`);
  }
}

function ensureFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} missing at ${filePath}`);
  }
}

async function main() {
  console.log('🏁 Gate check started');

  for (const task of tasks) {
    await Promise.resolve(runTask(task));
  }

  ensureFile(gateReport, 'MCP gate report');

  const ciStatus = process.env.CI_STATUS ?? 'unknown';
  if (ciStatus !== 'success' && ciStatus !== 'unknown') {
    throw new Error(`CI status is ${ciStatus} (expected success)`);
  }

  const outputs = [
    `- CI status: ${ciStatus}`,
    `- MCP gate report: ${path.relative(process.cwd(), gateReport)}`,
  ];

  if (fs.existsSync(summaryReport)) {
    outputs.push(`- Extra summary: ${path.relative(process.cwd(), summaryReport)}`);
  }

  const summary = `# Gate Summary\n\n${outputs.join('\n')}\n`;
  await fs.promises.mkdir(reportsDir, { recursive: true });
  await fs.promises.writeFile(summaryReport, summary, 'utf8');

  console.log('\n✅ All gate checks passed. Summary written to docs/reports/summary.md');
}

main().catch((error) => {
  console.error(`\n❌ Gate check failed: ${error.message}`);
  process.exitCode = 1;
});
