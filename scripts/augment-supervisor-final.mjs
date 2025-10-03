#!/usr/bin/env node
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";

const now = () => new Date().toISOString().slice(0,19);

function checkBranch(name){
  try {
    execSync(`git rev-parse --verify ${name}`, { stdio: "ignore" });
    return true;
  } catch { return false; }
}

async function runStory(storyId, storyPath, branch){
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${now()}] ▶ Story: ${storyId}`);
  console.log(`${"=".repeat(60)}\n`);
  
  const branchName = `${branch}/${storyId}`;
  if(checkBranch(branchName)){
    console.log(`[${now()}] ⏭️  分支 ${branchName} 已存在，跳过\n`);
    return true;
  }
  
  const prompt = `你是开发执行者。
仓库：${process.cwd()}
故事：${storyPath}
遵循：docs/architecture.md、docs/prd.md、bmad/constraints.md
DoD：构建+测试通过；文档更新；PR -> ${branchName}；CI 全绿；性能预算达标。
禁止：并发任务/修改 main/引入敏感词。
输出：PR 链接、测试说明、风险与缓解。

请开始执行。`;

  console.log(`[${now()}] 📝 派单:\n${prompt}\n`);
  console.log(`[${now()}] 🚀 启动 codex exec...\n`);
  
  return new Promise((resolve) => {
    const p = spawn("codex", ["exec", "-C", process.cwd(), "--full-auto", prompt], {
      stdio: "inherit",
      cwd: process.cwd()
    });
    
    p.on("exit", (code) => {
      console.log(`\n[${now()}] 📊 Codex 退出: ${code}`);
      resolve(code === 0);
    });
    
    p.on("error", (e) => {
      console.error(`\n[${now()}] ❌ Codex 错误: ${e.message}`);
      resolve(false);
    });
  });
}

async function main(){
  const stories = [
    { id: "M1-FEED-001", path: "bmad/stories/M1-FEED-001-omg-feed-mvp.md" }
  ];
  
  console.log(`[${now()}] 🚀 监督启动: ${stories.length} Story\n`);
  
  for(const story of stories){
    const success = await runStory(story.id, story.path, "feature");
    if(!success){
      console.log(`[${now()}] ⚠️  ${story.id} 失败，继续下一个\n`);
    }
  }
  
  console.log(`\n[${now()}] 🎉 监督完成\n`);
}

main();
