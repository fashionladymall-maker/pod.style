import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 全面功能测试 - 测试所有页面和所有功能
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 */

const PRODUCTION_URL = process.env.FEED_E2E_BASE_URL || 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';
const RESULTS_DIR = 'test-results/comprehensive-functionality';

let browser: Browser;
let page: Page;
const bugs: any[] = [];
const testResults: any[] = [];

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// 记录 bug
function recordBug(testName: string, category: string, description: string, severity: 'critical' | 'high' | 'medium' | 'low', details: any) {
  const bug = {
    testName,
    category,
    description,
    severity,
    details,
    timestamp: new Date().toISOString(),
  };
  bugs.push(bug);
  console.log(`\n🐛 [${severity.toUpperCase()}] ${testName} - ${category}: ${description}`);
}

// 记录测试结果
function recordTestResult(testName: string, status: 'pass' | 'fail', details: any) {
  testResults.push({
    testName,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

test.describe('pod.style 全面功能测试', () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      devtools: false,
      slowMo: 100,
    });
  });

  test.beforeEach(async () => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // 监听页面错误
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
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
    
    // 保存测试报告
    const report = {
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.status === 'pass').length,
        failed: testResults.filter(r => r.status === 'fail').length,
        totalBugs: bugs.length,
        critical: bugs.filter(b => b.severity === 'critical').length,
        high: bugs.filter(b => b.severity === 'high').length,
        medium: bugs.filter(b => b.severity === 'medium').length,
        low: bugs.filter(b => b.severity === 'low').length,
      },
      testResults,
      bugs,
    };
    
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试总结');
    console.log('='.repeat(80));
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`总 Bug 数: ${report.summary.totalBugs}`);
    console.log(`  - Critical: ${report.summary.critical}`);
    console.log(`  - High: ${report.summary.high}`);
    console.log(`  - Medium: ${report.summary.medium}`);
    console.log(`  - Low: ${report.summary.low}`);
    console.log('='.repeat(80));
  });

  /**
   * 页面加载测试
   */
  test('功能组 #1: 所有页面加载测试', async () => {
    console.log('\n🧪 功能组 #1: 所有页面加载测试');
    console.log('='.repeat(80));

    const pages = [
      { name: '首页', url: '/' },
      { name: '创建页面', url: '/create' },
      { name: '购物车', url: '/cart' },
      { name: '结算', url: '/checkout' },
      { name: '订单列表', url: '/orders' },
      { name: '个人资料', url: '/profile' },
      { name: '发现', url: '/discover' },
      { name: '消息', url: '/messages' },
      { name: '设置', url: '/settings' },
    ];

    for (const pageInfo of pages) {
      console.log(`\n📍 测试: ${pageInfo.name} (${pageInfo.url})`);
      
      try {
        const response = await page.goto(`${PRODUCTION_URL}${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        const status = response?.status() || 0;
        console.log(`  HTTP 状态: ${status}`);

        if (status === 200) {
          console.log(`  ✅ ${pageInfo.name} 加载成功`);
          recordTestResult(`页面加载-${pageInfo.name}`, 'pass', { status });
        } else {
          console.log(`  ❌ ${pageInfo.name} 返回 ${status}`);
          recordBug(
            `页面加载-${pageInfo.name}`,
            'HTTP Error',
            `页面返回 ${status}`,
            status === 404 ? 'high' : 'critical',
            { url: pageInfo.url, status }
          );
          recordTestResult(`页面加载-${pageInfo.name}`, 'fail', { status });
        }

        // 截图
        await page.screenshot({
          path: path.join(RESULTS_DIR, `page-${pageInfo.name.replace(/\//g, '-')}.png`),
          fullPage: false,
        });

        await page.waitForTimeout(1000);
      } catch (error: any) {
        console.log(`  ❌ ${pageInfo.name} 加载失败: ${error.message}`);
        recordBug(
          `页面加载-${pageInfo.name}`,
          'Load Error',
          error.message,
          'critical',
          { url: pageInfo.url, error: error.message }
        );
        recordTestResult(`页面加载-${pageInfo.name}`, 'fail', { error: error.message });
      }
    }
  });

  /**
   * Firebase 初始化测试
   */
  test('功能组 #2: Firebase 初始化测试', async () => {
    console.log('\n🧪 功能组 #2: Firebase 初始化测试');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const firebaseStatus = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasFirebase: typeof (window as any).firebase !== 'undefined',
        hasFirebaseApp: typeof (window as any).firebase?.app !== 'undefined',
        hasAuth: typeof (window as any).firebase?.auth !== 'undefined',
        hasFirestore: typeof (window as any).firebase?.firestore !== 'undefined',
      };
    });

    console.log('Firebase 状态:');
    console.log(`  Window: ${firebaseStatus.hasWindow ? '✅' : '❌'}`);
    console.log(`  Firebase: ${firebaseStatus.hasFirebase ? '✅' : '❌'}`);
    console.log(`  Firebase App: ${firebaseStatus.hasFirebaseApp ? '✅' : '❌'}`);
    console.log(`  Auth: ${firebaseStatus.hasAuth ? '✅' : '❌'}`);
    console.log(`  Firestore: ${firebaseStatus.hasFirestore ? '✅' : '❌'}`);

    if (!firebaseStatus.hasFirebase) {
      recordBug(
        'Firebase初始化',
        'Firebase Not Initialized',
        'Firebase SDK 未在客户端初始化',
        'critical',
        firebaseStatus
      );
      recordTestResult('Firebase初始化', 'fail', firebaseStatus);
    } else {
      recordTestResult('Firebase初始化', 'pass', firebaseStatus);
    }
  });

  /**
   * 导航功能测试
   */
  test('功能组 #3: 底部导航测试', async () => {
    console.log('\n🧪 功能组 #3: 底部导航测试');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 查找底部导航
    const navItems = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return null;
      
      const buttons = Array.from(nav.querySelectorAll('button, a'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim() || '',
        tag: btn.tagName,
      }));
    });

    console.log('底部导航项:');
    if (navItems && navItems.length > 0) {
      navItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.text} (${item.tag})`);
      });
      recordTestResult('底部导航', 'pass', { items: navItems });
    } else {
      console.log('  ❌ 未找到导航');
      recordBug('底部导航', 'Navigation Not Found', '未找到底部导航', 'high', {});
      recordTestResult('底部导航', 'fail', {});
    }
  });

  /**
   * Feed 内容测试
   */
  test('功能组 #4: Feed 内容加载测试', async () => {
    console.log('\n🧪 功能组 #4: Feed 内容加载测试');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const feedContent = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasContent: body.length > 1000,
        contentLength: body.length,
        preview: body.substring(0, 200),
      };
    });

    console.log(`Feed 内容长度: ${feedContent.contentLength} 字符`);
    console.log(`内容预览: ${feedContent.preview}...`);

    if (feedContent.hasContent) {
      console.log('✅ Feed 有内容');
      recordTestResult('Feed内容', 'pass', feedContent);
    } else {
      console.log('❌ Feed 内容过少');
      recordBug('Feed内容', 'Empty Feed', 'Feed 内容过少', 'medium', feedContent);
      recordTestResult('Feed内容', 'fail', feedContent);
    }
  });
});

