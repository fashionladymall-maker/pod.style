import { test, expect, chromium, Page, Browser, CDPSession } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 全面的 Chrome DevTools Protocol 测试套件
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';
const RESULTS_DIR = 'test-results/cdp';

let browser: Browser;
let page: Page;
let cdpSession: CDPSession;
const testResults: any[] = [];

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

test.describe('pod.style 全面 CDP 测试', () => {
  test.beforeAll(async () => {
    // 启动浏览器并启用 CDP
    browser = await chromium.launch({
      headless: false,
      devtools: false,
      slowMo: 300,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    
    // 创建 CDP 会话
    cdpSession = await page.context().newCDPSession(page);
    
    // 启用各种 CDP 域
    await cdpSession.send('Network.enable');
    await cdpSession.send('Console.enable');
    await cdpSession.send('Performance.enable');
    await cdpSession.send('Log.enable');
    
    // 监听控制台消息
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Console ${type}] ${text}`);
      
      if (type === 'error') {
        testResults.push({
          type: 'console_error',
          message: text,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 监听页面错误
    page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
      testResults.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // 监听请求失败
    page.on('requestfailed', request => {
      console.error(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
      testResults.push({
        type: 'request_failed',
        url: request.url(),
        error: request.failure()?.errorText,
        timestamp: new Date().toISOString(),
      });
    });
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
    
    // 保存测试结果
    const resultsPath = path.join(RESULTS_DIR, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 测试结果已保存到: ${resultsPath}`);
  });

  /**
   * 测试 #1: 首页加载和性能分析
   */
  test('测试 #1: 首页加载和性能', async () => {
    console.log('\n🧪 测试 #1: 首页加载和性能分析');
    console.log('='.repeat(60));

    // 开始性能追踪
    await cdpSession.send('Performance.enable');
    const performanceMetrics = await cdpSession.send('Performance.getMetrics');
    console.log('📊 初始性能指标:', performanceMetrics.metrics.length, '个指标');

    // 导航到首页
    console.log('📍 导航到首页...');
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 获取性能指标
    const metrics = await cdpSession.send('Performance.getMetrics');
    console.log('\n📊 性能指标:');
    for (const metric of metrics.metrics) {
      console.log(`  - ${metric.name}: ${metric.value}`);
    }

    // 执行脚本检查 Firebase 配置
    console.log('\n🔍 检查 Firebase 配置...');
    const firebaseCheck = await page.evaluate(() => {
      return {
        firebaseInitialized: typeof (window as any).firebase !== 'undefined',
        hasFirebaseApp: typeof (window as any).firebase?.apps !== 'undefined',
        // 检查 window 对象中的 Firebase 配置
        windowFirebase: (window as any).__FIREBASE_CONFIG__ || null,
        // 检查页面中是否有 Firebase API Key
        hasApiKeyInPage: document.documentElement.innerHTML.includes('AIzaSy'),
      };
    });

    console.log('Firebase 初始化:', firebaseCheck.firebaseInitialized ? '✅' : '❌');
    console.log('Firebase App:', firebaseCheck.hasFirebaseApp ? '✅' : '❌');
    console.log('页面中有 API Key:', firebaseCheck.hasApiKeyInPage ? '✅' : '❌');

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-1-homepage.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    // 检查页面内容
    const bodyText = await page.textContent('body');
    console.log(`\n📄 页面内容长度: ${bodyText?.length || 0} 字符`);

    // 检查是否有加载动画
    const loadingVisible = await page.locator('[data-testid="loading-screen"], .loading-spinner').isVisible().catch(() => false);
    console.log(`加载动画: ${loadingVisible ? '❌ 仍在显示' : '✅ 已消失'}`);

    console.log('\n' + '='.repeat(60));
    console.log('测试 #1 完成\n');
  });

  /**
   * 测试 #2: 网络请求分析
   */
  test('测试 #2: 网络请求分析', async () => {
    console.log('\n🧪 测试 #2: 网络请求分析');
    console.log('='.repeat(60));

    const networkRequests: any[] = [];

    // 监听网络请求
    cdpSession.on('Network.requestWillBeSent', (params) => {
      networkRequests.push({
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        timestamp: params.timestamp,
      });
    });

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 分析网络请求
    console.log(`\n📊 总共 ${networkRequests.length} 个网络请求`);

    // 分类请求
    const firebaseRequests = networkRequests.filter(r => r.url.includes('firebase') || r.url.includes('firestore'));
    const apiRequests = networkRequests.filter(r => r.url.includes('/api/'));
    const staticRequests = networkRequests.filter(r => r.url.includes('/_next/static/'));

    console.log(`  - Firebase 请求: ${firebaseRequests.length}`);
    console.log(`  - API 请求: ${apiRequests.length}`);
    console.log(`  - 静态资源: ${staticRequests.length}`);

    if (firebaseRequests.length > 0) {
      console.log('\n🔥 Firebase 请求:');
      firebaseRequests.slice(0, 5).forEach(r => {
        console.log(`  - ${r.method} ${r.url}`);
      });
    }

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-2-network.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 截图已保存: ${screenshotPath}`);

    // 保存网络请求到文件
    const networkPath = path.join(RESULTS_DIR, 'network-requests.json');
    fs.writeFileSync(networkPath, JSON.stringify(networkRequests, null, 2));
    console.log(`📊 网络请求已保存: ${networkPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('测试 #2 完成\n');
  });

  /**
   * 测试 #3: 控制台消息分析
   */
  test('测试 #3: 控制台消息分析', async () => {
    console.log('\n🧪 测试 #3: 控制台消息分析');
    console.log('='.repeat(60));

    const consoleMessages: any[] = [];

    // 监听控制台消息
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    });

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // 分析控制台消息
    console.log(`\n📊 总共 ${consoleMessages.length} 条控制台消息`);

    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    const logs = consoleMessages.filter(m => m.type === 'log');

    console.log(`  - 错误: ${errors.length}`);
    console.log(`  - 警告: ${warnings.length}`);
    console.log(`  - 日志: ${logs.length}`);

    if (errors.length > 0) {
      console.log('\n❌ 错误消息:');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.text}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  警告消息:');
      warnings.slice(0, 5).forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.text}`);
      });
    }

    // 保存控制台消息到文件
    const consolePath = path.join(RESULTS_DIR, 'console-messages.json');
    fs.writeFileSync(consolePath, JSON.stringify(consoleMessages, null, 2));
    console.log(`\n📊 控制台消息已保存: ${consolePath}`);

    console.log('\n' + '='.repeat(60));
    console.log('测试 #3 完成\n');
  });
});

