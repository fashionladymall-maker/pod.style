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
   * 测试 #2: 用户登录功能
   */
  test('测试 #2: 用户登录功能', async () => {
    console.log('\n🧪 测试 #2: 用户登录功能');
    console.log('='.repeat(60));

    // 导航到首页
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 查找登录入口
    console.log('\n🔍 查找登录入口...');
    
    // 尝试多种方式找到登录按钮
    const loginSelectors = [
      'button:has-text("登录")',
      'button:has-text("我的")',
      'button:has-text("Profile")',
      'button:has-text("个人")',
      '[aria-label*="登录"]',
      '[aria-label*="profile"]',
      '[data-testid="login-button"]',
    ];

    let loginButton = null;
    for (const selector of loginSelectors) {
      try {
        loginButton = await page.locator(selector).first();
        if (await loginButton.count() > 0) {
          console.log(`✅ 找到登录按钮: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!loginButton || await loginButton.count() === 0) {
      recordBug('Login Button Not Found', 'Cannot find login button', 'critical', { selectors: loginSelectors });
      console.log('❌ 未找到登录按钮');
      return;
    }

    // 点击登录按钮
    console.log('\n🖱️  点击登录按钮...');
    await loginButton.click();
    await page.waitForTimeout(2000);

    // 截图
    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-2-after-click-login.png'), fullPage: true });

    // 查找登录表单
    console.log('\n🔍 查找登录表单...');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() === 0 || await passwordInput.count() === 0) {
      recordBug('Login Form Not Found', 'Login form not displayed after clicking login button', 'critical', {
        emailInputCount: await emailInput.count(),
        passwordInputCount: await passwordInput.count(),
      });
      console.log('❌ 未找到登录表单');
      return;
    }

    // 填写登录表单
    console.log('\n📝 填写登录表单...');
    await emailInput.fill(TEST_EMAIL);
    console.log(`✅ 填写邮箱: ${TEST_EMAIL}`);
    
    await passwordInput.fill(TEST_PASSWORD);
    console.log('✅ 填写密码: ******');

    // 截图
    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-2-form-filled.png'), fullPage: true });

    // 查找并点击提交按钮
    console.log('\n🖱️  查找提交按钮...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = page.locator(selector).first();
        if (await submitButton.count() > 0) {
          console.log(`✅ 找到提交按钮: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续
      }
    }

    if (!submitButton || await submitButton.count() === 0) {
      recordBug('Submit Button Not Found', 'Cannot find login submit button', 'high', { selectors: submitSelectors });
      console.log('❌ 未找到提交按钮');
      return;
    }

    // 提交登录
    console.log('\n🚀 提交登录...');
    await submitButton.click();
    await page.waitForTimeout(5000);

    // 截图
    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-2-after-login.png'), fullPage: true });

    // 验证登录状态
    console.log('\n🔍 验证登录状态...');
    const loginStatus = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasErrorMessage: bodyText.includes('错误') || bodyText.includes('Error') || bodyText.includes('失败'),
        bodyPreview: bodyText.substring(0, 200),
      };
    });

    if (loginStatus.hasErrorMessage) {
      recordBug('Login Failed', 'Login error detected', 'high', loginStatus);
      console.log('❌ 登录失败');
    } else {
      console.log('✅ 登录可能成功');
    }

    console.log('\n' + '='.repeat(60));
  });
});

