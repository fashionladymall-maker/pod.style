#!/usr/bin/env node

/**
 * 浏览器健康检查脚本
 * 自动检测常见的前端问题
 */

const http = require('http');
const https = require('https');

const LOCAL_URL = 'http://localhost:6100';
const PROD_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求封装
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: endTime - startTime,
        });
      });
    }).on('error', reject);
  });
}

// 检查 HTTP 状态
async function checkHttpStatus(url) {
  try {
    const result = await makeRequest(url);
    if (result.statusCode === 200) {
      log(`✅ HTTP ${result.statusCode} OK`, 'green');
      return true;
    } else {
      log(`❌ HTTP ${result.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 请求失败: ${error.message}`, 'red');
    return false;
  }
}

// 检查响应时间
async function checkResponseTime(url) {
  try {
    const result = await makeRequest(url);
    log(`⏱️  响应时间: ${result.responseTime}ms`, 'blue');
    
    if (result.responseTime < 1000) {
      log('✅ 响应时间良好', 'green');
      return true;
    } else if (result.responseTime < 3000) {
      log('⚠️  响应时间较慢', 'yellow');
      return true;
    } else {
      log('❌ 响应时间过慢', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 检查页面内容
async function checkPageContent(url) {
  try {
    const result = await makeRequest(url);
    const body = result.body;
    
    // 检查是否包含关键元素
    const checks = [
      { name: 'HTML 文档', pattern: /<html/i },
      { name: 'Next.js', pattern: /_next/i },
      { name: 'React', pattern: /react/i },
      { name: 'POD.STYLE', pattern: /POD\.STYLE/i },
    ];
    
    let allPassed = true;
    for (const check of checks) {
      if (check.pattern.test(body)) {
        log(`✅ ${check.name} 存在`, 'green');
      } else {
        log(`⚠️  ${check.name} 未找到`, 'yellow');
        allPassed = false;
      }
    }
    
    // 检查错误
    const errorPatterns = [
      /error/gi,
      /exception/gi,
      /failed/gi,
    ];
    
    let errorCount = 0;
    for (const pattern of errorPatterns) {
      const matches = body.match(pattern);
      if (matches) {
        errorCount += matches.length;
      }
    }
    
    if (errorCount === 0) {
      log('✅ 无明显错误', 'green');
    } else {
      log(`⚠️  发现 ${errorCount} 个可能的错误关键词`, 'yellow');
    }
    
    return allPassed;
  } catch (error) {
    log(`❌ 检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 检查安全头部
async function checkSecurityHeaders(url) {
  try {
    const result = await makeRequest(url);
    const headers = result.headers;
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
    ];
    
    let allPresent = true;
    for (const header of securityHeaders) {
      if (headers[header]) {
        log(`✅ ${header}: ${headers[header]}`, 'green');
      } else {
        log(`⚠️  ${header} 未设置`, 'yellow');
        allPresent = false;
      }
    }
    
    return allPresent;
  } catch (error) {
    log(`❌ 检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'local';
  const url = env === 'prod' ? PROD_URL : LOCAL_URL;
  
  log('\n🔧 POD.STYLE 浏览器健康检查', 'blue');
  log('================================\n', 'blue');
  log(`环境: ${env === 'prod' ? '生产' : '本地'}`, 'blue');
  log(`URL: ${url}\n`, 'blue');
  
  const results = {
    httpStatus: false,
    responseTime: false,
    pageContent: false,
    securityHeaders: false,
  };
  
  // 1. HTTP 状态检查
  log('1. HTTP 状态检查', 'blue');
  results.httpStatus = await checkHttpStatus(url);
  log('');
  
  // 2. 响应时间检查
  log('2. 响应时间检查', 'blue');
  results.responseTime = await checkResponseTime(url);
  log('');
  
  // 3. 页面内容检查
  log('3. 页面内容检查', 'blue');
  results.pageContent = await checkPageContent(url);
  log('');
  
  // 4. 安全头部检查
  log('4. 安全头部检查', 'blue');
  results.securityHeaders = await checkSecurityHeaders(url);
  log('');
  
  // 总结
  log('================================', 'blue');
  log('📊 检查总结\n', 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  log(`通过: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n✅ 所有检查通过！', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  部分检查未通过，请查看详情', 'yellow');
    process.exit(0); // 不失败，仅警告
  }
}

// 运行
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ 检查失败: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkHttpStatus, checkResponseTime, checkPageContent, checkSecurityHeaders };

