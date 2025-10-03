#!/usr/bin/env node
/**
 * Thin wrapper for `bmad-method validate` so the workflow can be driven from npm scripts.
 */

const { spawnSync } = require('node:child_process');
const process = require('node:process');

runBmad(['validate', ...process.argv.slice(2)]);

function runBmad(args) {
  const child = spawnSync('npx', ['bmad-method', ...args], {
    stdio: 'inherit',
    env: process.env,
  });

  if (child.error) {
    console.error('Failed to launch bmad-method:', child.error.message);
    process.exit(1);
  }

  if (typeof child.status === 'number') {
    process.exit(child.status);
  }

  if (child.signal) {
    console.error(`bmad-method terminated due to signal ${child.signal}`);
    process.exit(1);
  }

  process.exit(0);
}
