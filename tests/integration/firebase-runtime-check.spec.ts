import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firebase 运行时检查
 * 
 * 目的：检查 Firebase 在运行时是否真的初始化了
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const RESULTS_DIR = 'test-results/firebase-runtime';

let browser: Browser;
let page: Page;

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

test.describe('Firebase 运行时检查', () => {
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
   * 测试 #1: 检查 Firebase 模块是否被加载
   */
  test('检查 Firebase 模块是否被加载', async () => {
    console.log('\n🔍 检查 Firebase 模块是否被加载');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待足够长的时间让所有模块加载
    await page.waitForTimeout(10000);

    // 检查 Firebase 模块
    console.log('\n🔍 检查 Firebase 模块...');
    const firebaseModules = await page.evaluate(() => {
      // 检查 webpack 模块
      const webpackModules = (window as any).webpackChunk_N_E || [];
      
      // 查找包含 Firebase 的模块
      const firebaseModuleInfo: any[] = [];
      
      if (Array.isArray(webpackModules)) {
        webpackModules.forEach((chunk: any) => {
          if (Array.isArray(chunk) && chunk.length >= 2) {
            const modules = chunk[1];
            if (typeof modules === 'object') {
              Object.keys(modules).forEach(key => {
                const moduleStr = String(modules[key]);
                if (moduleStr.includes('firebase') || moduleStr.includes('Firebase')) {
                  firebaseModuleInfo.push({
                    key,
                    hasApiKey: moduleStr.includes('AIzaSy'),
                    hasInitializeApp: moduleStr.includes('initializeApp'),
                    hasGetAuth: moduleStr.includes('getAuth'),
                    hasGetFirestore: moduleStr.includes('getFirestore'),
                    length: moduleStr.length,
                  });
                }
              });
            }
          }
        });
      }
      
      return {
        foundModules: firebaseModuleInfo.length,
        modules: firebaseModuleInfo,
      };
    });

    console.log(`找到 ${firebaseModules.foundModules} 个 Firebase 相关模块`);
    
    if (firebaseModules.modules.length > 0) {
      firebaseModules.modules.forEach((mod: any, i: number) => {
        console.log(`\n模块 ${i + 1} (key: ${mod.key}):`);
        console.log(`  - 有 API Key: ${mod.hasApiKey ? '✅' : '❌'}`);
        console.log(`  - 有 initializeApp: ${mod.hasInitializeApp ? '✅' : '❌'}`);
        console.log(`  - 有 getAuth: ${mod.hasGetAuth ? '✅' : '❌'}`);
        console.log(`  - 有 getFirestore: ${mod.hasGetFirestore ? '✅' : '❌'}`);
        console.log(`  - 长度: ${mod.length} 字符`);
      });
    }

    // 保存结果
    const resultPath = path.join(RESULTS_DIR, 'firebase-modules.json');
    fs.writeFileSync(resultPath, JSON.stringify(firebaseModules, null, 2));
    console.log(`\n📊 结果已保存: ${resultPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #2: 尝试访问 Firebase 实例
   */
  test('尝试访问 Firebase 实例', async () => {
    console.log('\n🔍 尝试访问 Firebase 实例');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待足够长的时间
    await page.waitForTimeout(10000);

    // 尝试访问 Firebase 实例
    console.log('\n🔍 尝试访问 Firebase 实例...');
    const firebaseInstances = await page.evaluate(() => {
      // 尝试多种方式访问 Firebase
      const checks = {
        // 方法 1: 全局 window 对象
        windowFirebase: typeof (window as any).firebase !== 'undefined',
        
        // 方法 2: 通过 React DevTools
        reactFiber: (() => {
          const root = document.getElementById('__next');
          if (root) {
            const fiberKey = Object.keys(root).find(key => key.startsWith('__reactFiber'));
            if (fiberKey) {
              return 'Found React Fiber';
            }
          }
          return null;
        })(),
        
        // 方法 3: 检查是否有 Firebase 错误
        consoleErrors: (window as any).__CONSOLE_ERRORS__ || [],
        
        // 方法 4: 检查 localStorage 中的 Firebase 数据
        localStorageFirebase: Object.keys(localStorage).filter(k => k.includes('firebase')),
        
        // 方法 5: 检查 IndexedDB
        indexedDBDatabases: (() => {
          try {
            return 'indexedDB' in window;
          } catch {
            return false;
          }
        })(),
      };
      
      return checks;
    });

    console.log('Firebase 实例检查:');
    console.log(`  - window.firebase: ${firebaseInstances.windowFirebase ? '✅' : '❌'}`);
    console.log(`  - React Fiber: ${firebaseInstances.reactFiber || '❌'}`);
    console.log(`  - localStorage Firebase 键: ${firebaseInstances.localStorageFirebase.length} 个`);
    console.log(`  - IndexedDB 可用: ${firebaseInstances.indexedDBDatabases ? '✅' : '❌'}`);

    // 保存结果
    const resultPath = path.join(RESULTS_DIR, 'firebase-instances.json');
    fs.writeFileSync(resultPath, JSON.stringify(firebaseInstances, null, 2));
    console.log(`\n📊 结果已保存: ${resultPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #3: 等待更长时间并检查 Firebase 是否最终初始化
   */
  test('等待更长时间并检查 Firebase 是否最终初始化', async () => {
    console.log('\n⏰ 等待更长时间并检查 Firebase 是否最终初始化');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 每 2 秒检查一次，最多检查 10 次（20 秒）
    console.log('\n⏰ 开始定期检查...');
    
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(2000);
      
      const check = await page.evaluate(() => {
        return {
          hasFirebase: typeof (window as any).firebase !== 'undefined',
          hasFirebaseApp: typeof (window as any).firebase?.app !== 'undefined',
          hasAuth: typeof (window as any).firebase?.auth !== 'undefined',
          hasFirestore: typeof (window as any).firebase?.firestore !== 'undefined',
          // 检查页面内容
          bodyText: document.body.innerText.substring(0, 200),
          // 检查是否有 Feed 内容
          hasFeedContent: document.body.innerText.length > 100,
        };
      });
      
      console.log(`\n检查 ${i}/10 (${i * 2}秒):`);
      console.log(`  - Firebase: ${check.hasFirebase ? '✅' : '❌'}`);
      console.log(`  - Firebase App: ${check.hasFirebaseApp ? '✅' : '❌'}`);
      console.log(`  - Auth: ${check.hasAuth ? '✅' : '❌'}`);
      console.log(`  - Firestore: ${check.hasFirestore ? '✅' : '❌'}`);
      console.log(`  - 有内容: ${check.hasFeedContent ? '✅' : '❌'}`);
      console.log(`  - 内容预览: ${check.bodyText.substring(0, 50)}...`);
      
      if (check.hasFirebase && check.hasFirebaseApp) {
        console.log('\n✅ Firebase 已初始化！');
        
        // 截图
        const screenshotPath = path.join(RESULTS_DIR, `firebase-initialized-${i * 2}s.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 截图已保存: ${screenshotPath}`);
        
        break;
      }
    }

    // 最终截图
    const finalScreenshotPath = path.join(RESULTS_DIR, 'final-state.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log(`\n📸 最终截图已保存: ${finalScreenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });
});

