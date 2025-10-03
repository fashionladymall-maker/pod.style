import { test, expect, chromium, Page, Browser } from '@playwright/test';

/**
 * Chrome DevTools MCP 测试套件
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';

let browser: Browser;
let page: Page;

test.describe('pod.style 全面测试', () => {
  test.beforeAll(async () => {
    // 启动浏览器并启用 DevTools
    browser = await chromium.launch({
      headless: false, // 显示浏览器以便观察
      devtools: true,  // 自动打开 DevTools
      slowMo: 500,     // 减慢操作以便观察
    });
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    
    // 监听 console 消息
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Console ${type}] ${text}`);
    });

    // 监听页面错误
    page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
    });

    // 监听请求失败
    page.on('requestfailed', request => {
      console.error(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
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
  });

  /**
   * 测试 #1: 首页加载测试
   */
  test('测试 #1: 首页加载', async () => {
    console.log('\n🧪 测试 #1: 首页加载测试');
    console.log('=' .repeat(50));

    // 导航到首页
    console.log('📍 导航到首页...');
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 检查 HTTP 状态
    console.log(`✅ HTTP 状态: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ DOM 内容已加载');

    // 截图
    await page.screenshot({ path: 'test-results/homepage-initial.png', fullPage: true });
    console.log('📸 截图已保存: test-results/homepage-initial.png');

    // 检查是否有永久加载动画
    console.log('🔍 检查加载状态...');
    const loadingSpinner = page.locator('[data-testid="loading-screen"], .loading-spinner, [class*="loading"]');
    
    // 等待 5 秒看加载动画是否消失
    await page.waitForTimeout(5000);
    
    const isStillLoading = await loadingSpinner.isVisible().catch(() => false);
    console.log(`加载动画状态: ${isStillLoading ? '❌ 仍在显示' : '✅ 已消失'}`);

    // 检查是否有实际内容
    const bodyText = await page.textContent('body');
    console.log(`页面内容长度: ${bodyText?.length || 0} 字符`);

    // 检查 Console 错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console 错误:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ 无 Console 错误');
    }

    // 检查 Network 错误
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    if (failedRequests.length > 0) {
      console.log('❌ Network 错误:');
      failedRequests.forEach(req => console.log(`  - ${req}`));
    } else {
      console.log('✅ 无 Network 错误');
    }

    // 检查 Firebase 初始化
    const firebaseInitialized = await page.evaluate(() => {
      return typeof (window as any).firebase !== 'undefined';
    });
    console.log(`Firebase 初始化: ${firebaseInitialized ? '✅ 是' : '❌ 否'}`);

    // 检查环境变量
    const envVars = await page.evaluate(() => {
      return {
        apiKey: (window as any).process?.env?.NEXT_PUBLIC_FIREBASE_API_KEY || 'undefined',
        projectId: (window as any).process?.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
      };
    });
    console.log('环境变量:');
    console.log(`  - API Key: ${envVars.apiKey}`);
    console.log(`  - Project ID: ${envVars.projectId}`);

    console.log('\n' + '='.repeat(50));
    console.log('测试 #1 完成\n');
  });

  /**
   * 测试 #2: 登录功能测试（通过模态框）
   */
  test('测试 #2: 登录功能', async () => {
    console.log('\n🧪 测试 #2: 登录功能测试');
    console.log('='.repeat(50));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 查找触发登录的按钮（可能在底部导航或个人资料）
    console.log('🔍 查找登录触发按钮...');

    // 尝试点击个人资料标签（通常会触发登录）
    const profileTab = page.locator('button:has-text("我的"), button:has-text("Profile"), [data-tab="profile"]');
    const hasProfileTab = await profileTab.count() > 0;

    if (hasProfileTab) {
      console.log('✅ 找到个人资料标签');
      await profileTab.first().click();
      await page.waitForTimeout(1000);

      // 截图
      await page.screenshot({ path: 'test-results/profile-tab-clicked.png', fullPage: true });
    }

    // 查找登录模态框
    console.log('🔍 查找登录模态框...');
    await page.waitForTimeout(2000);

    const loginModal = page.locator('[role="dialog"], .modal, div:has-text("登录")').first();
    const hasLoginModal = await loginModal.isVisible().catch(() => false);

    console.log(`登录模态框: ${hasLoginModal ? '✅ 显示' : '❌ 未显示'}`);

    if (hasLoginModal) {
      // 截图模态框
      await page.screenshot({ path: 'test-results/login-modal.png', fullPage: true });

      // 查找表单元素
      const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"], input[placeholder*="email"]');
      const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[placeholder*="password"]');
      const loginButton = page.locator('button:has-text("登录"), button:has-text("Login")').first();

      const hasEmailInput = await emailInput.count() > 0;
      const hasPasswordInput = await passwordInput.count() > 0;
      const hasLoginButton = await loginButton.count() > 0;

      console.log(`邮箱输入框: ${hasEmailInput ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`密码输入框: ${hasPasswordInput ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`登录按钮: ${hasLoginButton ? '✅ 存在' : '❌ 不存在'}`);

      if (hasEmailInput && hasPasswordInput && hasLoginButton) {
        console.log('\n🔐 尝试登录...');

        // 填写登录表单
        await emailInput.first().fill(TEST_EMAIL);
        console.log(`✅ 填写邮箱: ${TEST_EMAIL}`);

        await passwordInput.first().fill(TEST_PASSWORD);
        console.log('✅ 填写密码: ******');

        // 截图填写后的表单
        await page.screenshot({ path: 'test-results/login-form-filled.png', fullPage: true });

        // 点击登录按钮
        await loginButton.click();
        console.log('✅ 点击登录按钮');

        // 等待登录处理
        await page.waitForTimeout(5000);

        // 截图登录后的状态
        await page.screenshot({ path: 'test-results/login-result.png', fullPage: true });

        // 检查是否有错误消息
        const errorMessage = await page.locator('.text-red-400, [class*="error"]').textContent().catch(() => null);
        if (errorMessage) {
          console.log(`❌ 错误消息: ${errorMessage}`);
        } else {
          console.log('✅ 无错误消息');
        }

        // 检查模态框是否关闭（登录成功的标志）
        const modalStillVisible = await loginModal.isVisible().catch(() => false);
        console.log(`登录模态框状态: ${modalStillVisible ? '❌ 仍显示（可能失败）' : '✅ 已关闭（可能成功）'}`);
      }
    } else {
      console.log('⚠️  未能触发登录模态框，可能需要其他方式触发');
    }

    console.log('\n' + '='.repeat(50));
    console.log('测试 #2 完成\n');
  });

  /**
   * 测试 #3: 创建设计功能测试（通过底部导航）
   */
  test('测试 #3: 创建设计功能', async () => {
    console.log('\n🧪 测试 #3: 创建设计功能测试');
    console.log('='.repeat(50));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 查找创建按钮（通常在底部导航中间）
    console.log('🔍 查找创建按钮...');

    const createButton = page.locator('button:has-text("创作"), button:has-text("Create"), button[data-tab="create"], .create-button, button:has(svg.lucide-plus)');
    const hasCreateButton = await createButton.count() > 0;

    console.log(`创建按钮: ${hasCreateButton ? '✅ 存在' : '❌ 不存在'}`);

    if (hasCreateButton) {
      console.log('✅ 点击创建按钮...');
      await createButton.first().click();
      await page.waitForTimeout(2000);

      // 截图创建屏幕
      await page.screenshot({ path: 'test-results/create-screen.png', fullPage: true });

      // 检查创建屏幕元素
      console.log('🔍 检查创建屏幕元素...');

      const promptInput = page.locator('textarea, input[placeholder*="描述"], input[placeholder*="prompt"]');
      const styleSelector = page.locator('button:has-text("风格"), select, [class*="style"]');
      const uploadButton = page.locator('input[type="file"], button:has-text("上传"), button:has-text("参考图")');
      const generateButton = page.locator('button:has-text("生成"), button:has-text("Generate"), button:has-text("开始创作")');

      const hasPromptInput = await promptInput.count() > 0;
      const hasStyleSelector = await styleSelector.count() > 0;
      const hasUploadButton = await uploadButton.count() > 0;
      const hasGenerateButton = await generateButton.count() > 0;

      console.log(`Prompt 输入框: ${hasPromptInput ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`风格选择器: ${hasStyleSelector ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`上传按钮: ${hasUploadButton ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`生成按钮: ${hasGenerateButton ? '✅ 存在' : '❌ 不存在'}`);

      // 如果有 prompt 输入框，尝试填写
      if (hasPromptInput) {
        console.log('\n📝 测试 Prompt 输入...');
        await promptInput.first().fill('测试图案：可爱的小猫咪');
        console.log('✅ 填写 Prompt: 测试图案：可爱的小猫咪');

        // 截图填写后的状态
        await page.screenshot({ path: 'test-results/create-prompt-filled.png', fullPage: true });
      }
    } else {
      console.log('❌ 未找到创建按钮');
    }

    console.log('\n' + '='.repeat(50));
    console.log('测试 #3 完成\n');
  });

  /**
   * 测试 #4: Feed 滚动和交互测试
   */
  test('测试 #4: Feed 滚动和交互', async () => {
    console.log('\n🧪 测试 #4: Feed 滚动和交互测试');
    console.log('='.repeat(50));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 检查 Feed 卡片
    console.log('🔍 检查 Feed 卡片...');
    const feedCards = page.locator('[class*="feed"], [class*="creation"], [class*="card"]');
    const cardCount = await feedCards.count();
    console.log(`Feed 卡片数量: ${cardCount}`);

    // 检查交互按钮
    console.log('🔍 检查交互按钮...');
    const likeButton = page.locator('button:has(svg.lucide-heart), button[aria-label*="like"], button[aria-label*="喜欢"]');
    const commentButton = page.locator('button:has(svg.lucide-message-circle), button[aria-label*="comment"], button[aria-label*="评论"]');
    const shareButton = page.locator('button:has(svg.lucide-share), button[aria-label*="share"], button[aria-label*="分享"]');

    const hasLikeButton = await likeButton.count() > 0;
    const hasCommentButton = await commentButton.count() > 0;
    const hasShareButton = await shareButton.count() > 0;

    console.log(`点赞按钮: ${hasLikeButton ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`评论按钮: ${hasCommentButton ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`分享按钮: ${hasShareButton ? '✅ 存在' : '❌ 不存在'}`);

    // 截图当前状态
    await page.screenshot({ path: 'test-results/feed-interactions.png', fullPage: true });

    // 测试滚动
    console.log('\n📜 测试滚动功能...');
    const initialY = await page.evaluate(() => window.scrollY);
    console.log(`初始滚动位置: ${initialY}`);

    // 尝试向下滚动
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    const afterScrollY = await page.evaluate(() => window.scrollY);
    console.log(`滚动后位置: ${afterScrollY}`);

    if (afterScrollY > initialY) {
      console.log('✅ 滚动功能正常');
    } else {
      console.log('⚠️  滚动可能使用自定义手势（非标准滚动）');
    }

    console.log('\n' + '='.repeat(50));
    console.log('测试 #4 完成\n');
  });
});

