#!/usr/bin/env node
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import yaml from "js-yaml";

const QUEUE_FILE = "bmad/queue.yaml";
const LOG_DIR = "logs";

async function main() {
  // 确保日志目录存在
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

  const logFile = `${LOG_DIR}/supervisor-${new Date().toISOString().slice(0, 10)}.log`;
  const log = (msg) => {
    const line = `[${now()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + "\n");
  };

  log("🚀 Augment 监督脚本启动（30小时持续运行）");

  const config = yaml.load(fs.readFileSync(QUEUE_FILE, "utf8"));
  const maxHours = config.max_hours || 30;
  const intervalMs = (config.interval_minutes || 5) * 60 * 1000;
  const endTime = Date.now() + maxHours * 60 * 60 * 1000;

  let currentCodexPid = null;

  while (Date.now() < endTime) {
    log("⏰ 开始新一轮监督检查");

    // 重新读取队列（可能被外部修改）
    const queue = yaml.load(fs.readFileSync(QUEUE_FILE, "utf8"));
    const runningStory = queue.stories.find((s) => s.status === "running");
    const nextStory = queue.stories.find((s) => s.status === "pending");

    if (runningStory) {
      log(`📋 当前任务: ${runningStory.id} (运行中)`);
      
      // 检查分支是否已创建（任务完成标志）
      const branchExists = checkBranch(runningStory.id);
      
      if (branchExists) {
        log(`✅ 分支 feature/${runningStory.id} 已创建，任务完成`);
        updateStoryStatus(runningStory.id, "completed");
        
        // 杀掉当前 Codex 进程（如果还在运行）
        if (currentCodexPid) {
          try {
            process.kill(currentCodexPid, "SIGTERM");
            log(`🛑 已终止 Codex 进程 (PID: ${currentCodexPid})`);
          } catch (e) {
            log(`⚠️  无法终止进程 ${currentCodexPid}: ${e.message}`);
          }
          currentCodexPid = null;
        }
        
        // 立即进入下一轮，派发下一个任务
        continue;
      } else {
        log(`🔄 任务仍在进行中，继续等待`);
        
        // 检查 Codex 进程是否还活着
        if (currentCodexPid && !isProcessAlive(currentCodexPid)) {
          log(`⚠️  Codex 进程 ${currentCodexPid} 已退出，但任务未完成`);
          log(`🔄 重新派发任务: ${runningStory.id}`);
          currentCodexPid = await dispatchStory(runningStory);
        }
      }
    } else if (nextStory) {
      log(`🚀 派发新任务: ${nextStory.id}`);
      currentCodexPid = await dispatchStory(nextStory);
      updateStoryStatus(nextStory.id, "running");
    } else {
      log("🎉 所有任务已完成！");
      break;
    }

    // 等待下一次检查
    log(`⏳ 等待 ${config.interval_minutes} 分钟后下次检查\n`);
    await sleep(intervalMs);
  }

  log("🎉 监督完成");
}

function now() {
  return new Date().toISOString().slice(11, 19);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkBranch(storyId) {
  try {
    const output = execSync(`git branch --list feature/${storyId}`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    return output.trim().length > 0;
  } catch (e) {
    return false;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0); // 信号 0 只检查进程是否存在
    return true;
  } catch (e) {
    return false;
  }
}

function updateStoryStatus(storyId, status) {
  const queue = yaml.load(fs.readFileSync(QUEUE_FILE, "utf8"));
  const story = queue.stories.find((s) => s.id === storyId);
  if (story) {
    story.status = status;
    fs.writeFileSync(QUEUE_FILE, yaml.dump(queue));
  }
}

async function dispatchStory(story) {
  // 读取派单文档
  const dispatchFile = story.path.replace(".md", "-DISPATCH.txt");
  let dispatchContent;

  if (fs.existsSync(dispatchFile)) {
    dispatchContent = fs.readFileSync(dispatchFile, "utf8");
  } else {
    // 生成简单派单内容
    dispatchContent = `# 任务派单

仓库: /Users/mike/pod.style
故事: ${story.path}

请执行此任务，遵循 DoD 标准：
1. 创建分支 feature/${story.id}
2. 实现功能
3. 运行测试（lint/typecheck/test/build）
4. 提交并推送代码
5. 更新 CHANGELOG.md

完成后报告结果。`;
  }

  // 启动 Codex（后台进程）
  const logFile = `${LOG_DIR}/codex-${story.id}.log`;
  const logStream = fs.createWriteStream(logFile, { flags: "a" });

  const proc = spawn("codex", ["-C", process.cwd(), "--full-auto", dispatchContent], {
    detached: true,
    stdio: ["ignore", logStream, logStream],
  });

  proc.unref(); // 让进程在后台独立运行
  
  console.log(`✅ Codex 已启动（PID: ${proc.pid}，日志: ${logFile}）`);
  
  return proc.pid;
}

main().catch((err) => {
  console.error(`❌ 监督脚本错误:`, err);
  process.exit(1);
});

