#!/usr/bin/env node
/**
 * Scan for banned words (OMG compliance)
 * 根据蓝皮书 §0 和 §8，禁止在代码/配置/文档中出现真实平台名
 */
import fs from 'node:fs';
import path from 'node:path';

// 禁用词列表（真实平台名）
// 注意：OMG 是我们的代号，不应被禁止
const banned = [
  // 英文变体
  /\btiktok\b/i,
  /\btik\s*tok\b/i,
  /\bti\s*kt\s*ok\b/i,
  // 中文
  /\b抖音\b/,
  /\b抖\s*音\b/,
  // 其他可能的变体
  /\bdouyin\b/i,
];

// 需要扫描的文件扩展名
const exts = [
  ".ts", ".tsx", ".js", ".jsx",
  ".md", ".mdx",
  ".json", ".yml", ".yaml",
  ".html", ".css", ".scss",
  ".env.example", // 扫描示例环境变量文件
];

// 排除的目录
const excludeDirs = [
  "node_modules",
  ".git",
  ".bmad-core",
  ".bmad-*",
  "dist",
  "build",
  ".next",
  "coverage",
  "playwright-report",
];

// 排除的文件（本身就是文档说明的除外）
const excludeFiles = [
  "scan-banned.js", // 本文件
  "codex-command-map.md", // 命令映射文档
  "augment-bmad-codex-mcp.md", // 蓝皮书
  "OMG_COMPLIANCE_PLAN.md", // 合规计划文档
];

let failed = false;
let violations = [];
let filesScanned = 0;

function walk(dir) {
  try {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const s = fs.statSync(p);

      if (s.isDirectory()) {
        // 检查是否在排除列表中
        const shouldExclude = excludeDirs.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
            return regex.test(f);
          }
          return f === pattern;
        });

        if (!shouldExclude) {
          walk(p);
        }
      } else if (shouldScan(p)) {
        check(p);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Cannot read directory ${dir}: ${error.message}`);
  }
}

function shouldScan(filePath) {
  const fileName = path.basename(filePath);

  // 排除 DEPRECATED 文件
  if (fileName.startsWith('DEPRECATED_')) {
    return false;
  }

  // 检查是否在排除文件列表中
  if (excludeFiles.includes(fileName)) {
    return false;
  }

  // 检查扩展名
  const ext = path.extname(filePath);
  return exts.includes(ext);
}

function check(file) {
  try {
    const content = fs.readFileSync(file, "utf8");
    filesScanned++;

    for (const pattern of banned) {
      const matches = content.match(new RegExp(pattern, 'gi'));
      if (matches) {
        const lines = content.split('\n');
        const violations_in_file = [];

        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            violations_in_file.push({
              file,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString(),
            });
          }
        });

        violations.push(...violations_in_file);
        failed = true;
      }
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Cannot read file ${file}: ${error.message}`);
  }
}

// 主执行
console.log('🔍 Scanning for banned words (OMG compliance)...\n');

const startTime = Date.now();
walk(process.cwd());
const duration = Date.now() - startTime;

// 报告结果
console.log(`\n📊 Scan Summary:`);
console.log(`   Files scanned: ${filesScanned}`);
console.log(`   Duration: ${duration}ms`);

if (failed) {
  console.log(`   Violations: ${violations.length}\n`);
  console.error('❌ BANNED WORDS FOUND:\n');

  // 按文件分组显示
  const byFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {});

  Object.entries(byFile).forEach(([file, fileViolations]) => {
    console.error(`\n📄 ${file}`);
    fileViolations.forEach(v => {
      console.error(`   Line ${v.line}: ${v.content}`);
    });
  });

  console.error('\n💡 Tip: Use "OMG" as the code name for the short-video platform paradigm.');
  console.error('   See docs/playbooks/augment-bmad-codex-mcp.md §0 for details.\n');

  process.exit(1);
} else {
  console.log(`   Violations: 0`);
  console.log('\n✅ No banned words found. OMG compliance verified!\n');
  process.exit(0);
}
