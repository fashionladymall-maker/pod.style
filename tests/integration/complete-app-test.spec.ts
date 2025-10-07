import { test, expect, chromium, Page, Browser, CDPSession } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 完整应用测试 - 使用 Chrome DevTools Protocol
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 * 
 * 这个测试套件将：
 * 1. 测试所有页面
 * 2. 测试所有功能
 * 3. 发现并记录所有 bug
 * 4. 提供修复建议
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';
const RESULTS_DIR = 'test-results/complete-app-test';

let browser: Browser;
let page: Page;
let cdpSession: CDPSession;
const bugs: any[] = [];

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// 辅助函数：记录 bug
function recordBug(category: string, description: string, severity: 'critical' | 'high' | 'medium' | 'low', details: any) {
  const bug = {
    category,
    description,
    severity,
    details,
    timestamp: new Date().toISOString(),
  };
  bugs.push(bug);
  console.log(`\n🐛 [${severity.toUpperCase()}] ${category}: ${description}`);
  console.log(`   详情:`, JSON.stringify(details, null, 2));
}

test.describe('pod.style 完整应用测试', () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 300,
      args: ['--start-maximized'],
    });
  });

  test.beforeEach(async () => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
    
    // 创建 CDP 会话
    cdpSession = await context.newCDPSession(page);
    
    // 启用 CDP 域
    await cdpSession.send('Network.enable');
    await cdpSession.send('Console.enable');
    await cdpSession.send('Performance.enable');
    
    // 监听控制台
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        recordBug('Console Error', text, 'high', { type, text });
      }
    });

    // 监听页面错误
    page.on('pageerror', error => {
      recordBug('Page Error', error.message, 'critical', { message: error.message, stack: error.stack });
    });

    // 监听请求失败
    page.on('requestfailed', request => {
      recordBug('Request Failed', request.url(), 'medium', { url: request.url(), error: request.failure()?.errorText });
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
    
    // 保存 bug 报告
    const bugsPath = path.join(RESULTS_DIR, 'bugs-report.json');
    fs.writeFileSync(bugsPath, JSON.stringify(bugs, null, 2));
    console.log(`\n📊 Bug 报告已保存: ${bugsPath}`);
    console.log(`\n总共发现 ${bugs.length} 个问题`);
    
    // 按严重程度分类
    const critical = bugs.filter(b => b.severity === 'critical').length;
    const high = bugs.filter(b => b.severity === 'high').length;
    const medium = bugs.filter(b => b.severity === 'medium').length;
    const low = bugs.filter(b => b.severity === 'low').length;
    
    console.log(`  - Critical: ${critical}`);
    console.log(`  - High: ${high}`);
    console.log(`  - Medium: ${medium}`);
    console.log(`  - Low: ${low}`);
  });

  /**
   * 测试 #1: 首页加载和 Firebase 初始化
   */
  test('测试 #1: 首页加载和 Firebase 初始化', async () => {
    console.log('\n🧪 测试 #1: 首页加载和 Firebase 初始化');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);
    
    if (response?.status() !== 200) {
      recordBug('HTTP Error', `HTTP status ${response?.status()}`, 'critical', { status: response?.status() });
    }

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 检查 Firebase 初始化
    console.log('\n🔍 检查 Firebase 初始化...');
    const firebaseStatus = await page.evaluate(() => {
      return {
        hasFirebase: typeof (window as any).firebase !== 'undefined',
        hasFirebaseApp: typeof (window as any).firebase?.app !== 'undefined',
      };
    });

    console.log(`Firebase 初始化: ${firebaseStatus.hasFirebase ? '✅' : '❌'}`);
    console.log(`Firebase App: ${firebaseStatus.hasFirebaseApp ? '✅' : '❌'}`);

    if (!firebaseStatus.hasFirebase) {
      recordBug('Firebase Not Initialized', 'Firebase SDK not initialized on client', 'critical', firebaseStatus);
    }

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-1-homepage.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #2: 创建页面 (/create)
   */
  test('测试 #2: 创建页面', async () => {
    console.log('\n🧪 测试 #2: 创建页面');
    console.log('='.repeat(60));

    const createUrl = `${PRODUCTION_URL}/create`;
    console.log(`📍 导航到创建页面: ${createUrl}`);

    const response = await page.goto(createUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    if (response?.status() !== 200) {
      recordBug('Create Page HTTP Error', `HTTP status ${response?.status()}`, 'high', { status: response?.status(), url: createUrl });
    }

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-2-create-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    // 检查页面内容
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasPromptInput: document.querySelector('textarea, input[placeholder*="prompt"], input[placeholder*="描述"]') !== null,
        hasUploadButton: document.querySelector('input[type="file"], button:has-text("上传")') !== null,
        bodyText: document.body.innerText.substring(0, 500),
      };
    });

    console.log(`页面标题: ${pageContent.title}`);
    console.log(`Prompt 输入框: ${pageContent.hasPromptInput ? '✅' : '❌'}`);
    console.log(`上传按钮: ${pageContent.hasUploadButton ? '✅' : '❌'}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #3: 产品详情页 (/product/[sku])
   */
  test('测试 #3: 产品详情页', async () => {
    console.log('\n🧪 测试 #3: 产品详情页');
    console.log('='.repeat(60));

    // 测试一个示例 SKU
    const testSku = 'tshirt-basic';
    const productUrl = `${PRODUCTION_URL}/product/${testSku}`;
    console.log(`📍 导航到产品页面: ${productUrl}`);

    const response = await page.goto(productUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-3-product-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    // 检查页面内容
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasPrice: document.body.innerText.match(/\$|¥|￥/) !== null,
        hasAddToCart: document.querySelector('button:has-text("加入购物车"), button:has-text("Add to Cart")') !== null,
        bodyText: document.body.innerText.substring(0, 500),
      };
    });

    console.log(`页面标题: ${pageContent.title}`);
    console.log(`价格显示: ${pageContent.hasPrice ? '✅' : '❌'}`);
    console.log(`加入购物车按钮: ${pageContent.hasAddToCart ? '✅' : '❌'}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #4: 购物车页面 (/cart)
   */
  test('测试 #4: 购物车页面', async () => {
    console.log('\n🧪 测试 #4: 购物车页面');
    console.log('='.repeat(60));

    const cartUrl = `${PRODUCTION_URL}/cart`;
    console.log(`📍 导航到购物车页面: ${cartUrl}`);

    const response = await page.goto(cartUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-4-cart-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #5: 结算页面 (/checkout)
   */
  test('测试 #5: 结算页面', async () => {
    console.log('\n🧪 测试 #5: 结算页面');
    console.log('='.repeat(60));

    const checkoutUrl = `${PRODUCTION_URL}/checkout`;
    console.log(`📍 导航到结算页面: ${checkoutUrl}`);

    const response = await page.goto(checkoutUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-5-checkout-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #6: 订单列表页面 (/orders)
   */
  test('测试 #6: 订单列表页面', async () => {
    console.log('\n🧪 测试 #6: 订单列表页面');
    console.log('='.repeat(60));

    const ordersUrl = `${PRODUCTION_URL}/orders`;
    console.log(`📍 导航到订单列表页面: ${ordersUrl}`);

    const response = await page.goto(ordersUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-6-orders-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #7: 个人资料页面 (/profile)
   */
  test('测试 #7: 个人资料页面', async () => {
    console.log('\n🧪 测试 #7: 个人资料页面');
    console.log('='.repeat(60));

    const profileUrl = `${PRODUCTION_URL}/profile`;
    console.log(`📍 导航到个人资料页面: ${profileUrl}`);

    const response = await page.goto(profileUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-7-profile-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #8: 发现页面 (/discover)
   */
  test('测试 #8: 发现页面', async () => {
    console.log('\n🧪 测试 #8: 发现页面');
    console.log('='.repeat(60));

    const discoverUrl = `${PRODUCTION_URL}/discover`;
    console.log(`📍 导航到发现页面: ${discoverUrl}`);

    const response = await page.goto(discoverUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-8-discover-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #9: 消息页面 (/messages)
   */
  test('测试 #9: 消息页面', async () => {
    console.log('\n🧪 测试 #9: 消息页面');
    console.log('='.repeat(60));

    const messagesUrl = `${PRODUCTION_URL}/messages`;
    console.log(`📍 导航到消息页面: ${messagesUrl}`);

    const response = await page.goto(messagesUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-9-messages-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });

  /**
   * 测试 #10: 设置页面 (/settings)
   */
  test('测试 #10: 设置页面', async () => {
    console.log('\n🧪 测试 #10: 设置页面');
    console.log('='.repeat(60));

    const settingsUrl = `${PRODUCTION_URL}/settings`;
    console.log(`📍 导航到设置页面: ${settingsUrl}`);

    const response = await page.goto(settingsUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ HTTP 状态: ${response?.status()}`);

    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-10-settings-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
  });
});

