import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firebase 配置调试测试
 * 
 * 目的：深入检查 Firebase 配置的实际值
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const RESULTS_DIR = 'test-results/firebase-debug';

let browser: Browser;
let page: Page;

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

test.describe('Firebase 配置深度调试', () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 500,
    });
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  /**
   * 测试 #1: 检查 Firebase 配置的实际值
   */
  test('检查 Firebase 配置的实际值', async () => {
    console.log('\n🔍 Firebase 配置深度调试');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // 注入调试脚本
    console.log('\n🔍 注入调试脚本...');
    const firebaseDebugInfo = await page.evaluate(() => {
      // 尝试访问 Firebase 模块
      const modules = (window as any).__webpack_modules__ || (window as any).webpackChunk || {};
      
      // 检查所有可能的 Firebase 引用
      const checks = {
        // 环境变量（在浏览器中不可用，但我们可以检查）
        processEnv: typeof (window as any).process !== 'undefined' ? (window as any).process.env : null,
        
        // 检查页面源代码中的配置
        pageSource: {
          hasApiKey: document.documentElement.innerHTML.includes('AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0'),
          hasProjectId: document.documentElement.innerHTML.includes('studio-1269295870-5fde0'),
          hasAppId: document.documentElement.innerHTML.includes('1:204491544475:web:dadc0d6d650572156db33e'),
        },
        
        // 检查所有脚本内容
        scripts: Array.from(document.querySelectorAll('script')).map(s => {
          const content = s.textContent || '';
          return {
            src: s.src,
            hasFirebaseConfig: content.includes('firebaseConfig') || content.includes('FIREBASE'),
            hasApiKey: content.includes('AIzaSy'),
            hasProductionConfig: content.includes('PRODUCTION_FIREBASE_CONFIG'),
            contentLength: content.length,
            snippet: content.substring(0, 200),
          };
        }).filter(s => s.hasFirebaseConfig || s.hasApiKey || s.hasProductionConfig),
        
        // 尝试查找 Firebase 配置对象
        globalSearch: {
          hasFirebaseInWindow: Object.keys(window).filter(k => k.toLowerCase().includes('firebase')),
          hasConfigInWindow: Object.keys(window).filter(k => k.toLowerCase().includes('config')),
        },
      };
      
      return checks;
    });

    console.log('\n📊 调试信息:');
    console.log('页面源代码中:');
    console.log(`  - 有 API Key: ${firebaseDebugInfo.pageSource.hasApiKey ? '✅' : '❌'}`);
    console.log(`  - 有 Project ID: ${firebaseDebugInfo.pageSource.hasProjectId ? '✅' : '❌'}`);
    console.log(`  - 有 App ID: ${firebaseDebugInfo.pageSource.hasAppId ? '✅' : '❌'}`);
    
    console.log('\n脚本中的 Firebase 配置:');
    console.log(`  - 找到 ${firebaseDebugInfo.scripts.length} 个相关脚本`);
    
    if (firebaseDebugInfo.scripts.length > 0) {
      firebaseDebugInfo.scripts.forEach((script, i) => {
        console.log(`\n  脚本 ${i + 1}:`);
        console.log(`    - src: ${script.src || '(inline)'}`);
        console.log(`    - 有 firebaseConfig: ${script.hasFirebaseConfig ? '✅' : '❌'}`);
        console.log(`    - 有 API Key: ${script.hasApiKey ? '✅' : '❌'}`);
        console.log(`    - 有 PRODUCTION_FIREBASE_CONFIG: ${script.hasProductionConfig ? '✅' : '❌'}`);
        console.log(`    - 内容长度: ${script.contentLength} 字符`);
        if (script.snippet) {
          console.log(`    - 片段: ${script.snippet.substring(0, 100)}...`);
        }
      });
    }

    console.log('\n全局对象:');
    console.log(`  - Firebase 相关键: ${firebaseDebugInfo.globalSearch.hasFirebaseInWindow.join(', ') || '无'}`);
    console.log(`  - Config 相关键: ${firebaseDebugInfo.globalSearch.hasConfigInWindow.slice(0, 5).join(', ') || '无'}`);

    // 保存详细信息到文件
    const debugPath = path.join(RESULTS_DIR, 'firebase-debug-info.json');
    fs.writeFileSync(debugPath, JSON.stringify(firebaseDebugInfo, null, 2));
    console.log(`\n📊 调试信息已保存: ${debugPath}`);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'firebase-debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #2: 尝试手动初始化 Firebase
   */
  test('尝试手动初始化 Firebase', async () => {
    console.log('\n🔧 尝试手动初始化 Firebase');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // 尝试手动初始化 Firebase
    console.log('\n🔧 注入 Firebase 配置并尝试初始化...');
    const initResult = await page.evaluate(() => {
      try {
        // 检查是否已经有 Firebase
        if (typeof (window as any).firebase !== 'undefined') {
          return {
            success: true,
            message: 'Firebase 已经初始化',
            alreadyInitialized: true,
          };
        }

        // 尝试从页面中提取 Firebase 配置
        const pageHtml = document.documentElement.innerHTML;
        
        // 查找 PRODUCTION_FIREBASE_CONFIG
        const configMatch = pageHtml.match(/PRODUCTION_FIREBASE_CONFIG\s*=\s*\{([^}]+)\}/);
        
        if (configMatch) {
          return {
            success: false,
            message: '找到 PRODUCTION_FIREBASE_CONFIG，但无法在浏览器中初始化',
            foundConfig: true,
            configSnippet: configMatch[0].substring(0, 200),
          };
        }

        return {
          success: false,
          message: '未找到 Firebase 配置',
          foundConfig: false,
        };
      } catch (error) {
        return {
          success: false,
          message: `错误: ${error}`,
          error: String(error),
        };
      }
    });

    console.log('\n📊 初始化结果:');
    console.log(`  - 成功: ${initResult.success ? '✅' : '❌'}`);
    console.log(`  - 消息: ${initResult.message}`);
    if (initResult.foundConfig) {
      console.log(`  - 找到配置: ✅`);
      if (initResult.configSnippet) {
        console.log(`  - 配置片段: ${initResult.configSnippet}`);
      }
    }

    // 保存结果
    const resultPath = path.join(RESULTS_DIR, 'manual-init-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(initResult, null, 2));
    console.log(`\n📊 初始化结果已保存: ${resultPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #3: 检查构建产物中的配置
   */
  test('检查构建产物中的配置', async () => {
    console.log('\n🔍 检查构建产物中的配置');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 获取所有加载的 JS 文件
    console.log('\n🔍 检查所有 JS 文件...');
    const jsFiles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src);
    });

    console.log(`找到 ${jsFiles.length} 个 JS 文件`);

    // 检查每个文件是否包含 Firebase 配置
    const results: any[] = [];
    
    for (const url of jsFiles) {
      if (url.includes('/_next/static/')) {
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
          const content = await response?.text() || '';
          
          const hasApiKey = content.includes('AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0');
          const hasProductionConfig = content.includes('PRODUCTION_FIREBASE_CONFIG');
          const hasFirebaseConfig = content.includes('firebaseConfig');
          
          if (hasApiKey || hasProductionConfig || hasFirebaseConfig) {
            results.push({
              url,
              hasApiKey,
              hasProductionConfig,
              hasFirebaseConfig,
              size: content.length,
            });
            
            console.log(`\n✅ 找到配置: ${url.split('/').pop()}`);
            console.log(`  - 有 API Key: ${hasApiKey ? '✅' : '❌'}`);
            console.log(`  - 有 PRODUCTION_FIREBASE_CONFIG: ${hasProductionConfig ? '✅' : '❌'}`);
            console.log(`  - 有 firebaseConfig: ${hasFirebaseConfig ? '✅' : '❌'}`);
          }
        } catch (error) {
          console.log(`⚠️  无法加载: ${url.split('/').pop()}`);
        }
      }
    }

    console.log(`\n📊 总结: 在 ${results.length} 个文件中找到 Firebase 配置`);

    // 保存结果
    const resultPath = path.join(RESULTS_DIR, 'build-artifacts-check.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`📊 结果已保存: ${resultPath}`);

    console.log('\n' + '='.repeat(60));
  });
});

