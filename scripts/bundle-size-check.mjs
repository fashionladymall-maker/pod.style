#!/usr/bin/env node
/**
 * Inspect the Next.js build output (.next) and ensure bundle size stays within budget.
 * Fails the build when the aggregate file size exceeds the configured threshold.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const buildDir = join(root, '.next');
const budgetMb = Number.parseFloat(process.env.BUNDLE_SIZE_BUDGET_MB ?? '5');
const budgetBytes = Math.floor(budgetMb * 1024 * 1024);
const limitTop = Number.parseInt(process.env.BUNDLE_SIZE_TOP ?? '10', 10);

if (!existsSync(buildDir)) {
  console.warn('bundle-size-check: .next directory not found, skipping check.');
  process.exit(0);
}

const files = [];
const ignoredTopLevelDirs = new Set(['cache']);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const relativeFromBuildRoot = relative(buildDir, full);
    const topLevelSegment = relativeFromBuildRoot.split(/\\|\//)[0];
    if (ignoredTopLevelDirs.has(topLevelSegment)) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    const stats = statSync(full);
    files.push({
      path: relative(root, full),
      bytes: stats.size,
    });
  }
}

walk(buildDir);

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const formattedTotal = formatBytes(totalBytes);
const formattedBudget = formatBytes(budgetBytes);

if (files.length === 0) {
  console.warn('bundle-size-check: No files discovered under .next directory.');
}

const topLargest = [...files]
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, Math.min(limitTop, files.length));

console.log(`bundle-size-check: total ${formattedTotal} across ${files.length} files (budget ${formattedBudget}).`);
if (topLargest.length > 0) {
  console.log('Largest assets:');
  for (const file of topLargest) {
    console.log(`  - ${file.path}: ${formatBytes(file.bytes)}`);
  }
}

if (totalBytes > budgetBytes) {
  console.error(
    `bundle-size-check: build output exceeds budget (${formattedTotal} > ${formattedBudget}).`,
  );
  process.exit(1);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return `${bytes} B`;
  }
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const num = bytes / Math.pow(1024, exponent);
  return `${num.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}
