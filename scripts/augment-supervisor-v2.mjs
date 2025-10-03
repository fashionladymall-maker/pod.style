#!/usr/bin/env node
import fs from "node:fs";
import { spawn, execSync } from "node:child_process";

const now = () => new Date().toISOString().slice(0,19);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main(){
  console.log(`[${now()}] 测试：直接运行 codex exec\n`);
  
  const prompt = `你是开发执行者。
仓库：${process.cwd()}
故事：bmad/stories/M0-FIX-002-eslint-config.md
任务：创建 eslint.config.js 使 npm run lint 通过
DoD：npm run lint 通过（0 错误）
请开始执行。`;

  console.log(`[${now()}] 派单:\n${prompt}\n`);
  console.log(`[${now()}] 启动 codex exec...\n`);
  
  const p = spawn("codex", ["exec", "-C", process.cwd(), "--full-auto", prompt], {
    stdio: "inherit",
    cwd: process.cwd()
  });
  
  p.on("exit", (code) => {
    console.log(`\n[${now()}] Codex 退出: ${code}`);
    process.exit(code);
  });
}

main();
