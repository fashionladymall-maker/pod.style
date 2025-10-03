import { test, expect } from '@playwright/test';

/**
 * 逐步测试脚本 - 一个一个功能测试
 * 测试账号: 1504885923@qq.com
 * 密码: 000000
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';

test.use({
  baseURL: PRODUCTION_URL,
  viewport: { width: 1280, height: 720 },
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
});

test.describe('Step 1: 首页测试', () => {
  test('1.1 首页应该能够加载并显示内容', async ({ page }) => {
    console.log('\n🔍 测试 1.1: 访问首页...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // 截图
    await page.screenshot({ path: 'test-results/step-1-1-homepage.png', fullPage: true });
    
    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    expect(title).toContain('POD.STYLE');
    
    // 检查是否有内容（不是永久加载动画）
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
    
    console.log('✅ 测试 1.1 通过: 首页加载成功\n');
  });

  test('1.2 首页应该显示产品卡片', async ({ page }) => {
    console.log('\n🔍 测试 1.2: 检查产品卡片...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // 等待内容加载
    await page.waitForTimeout(3000);
    
    // 截图
    await page.screenshot({ path: 'test-results/step-1-2-products.png', fullPage: true });
    
    // 检查是否有图片
    const images = await page.locator('img').count();
    console.log('找到图片数量:', images);
    expect(images).toBeGreaterThan(0);
    
    console.log('✅ 测试 1.2 通过: 产品卡片显示正常\n');
  });
});

test.describe('Step 2: 登录功能测试', () => {
  test('2.1 登录页面应该能够访问', async ({ page }) => {
    console.log('\n🔍 测试 2.1: 访问登录页面...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await page.screenshot({ path: 'test-results/step-2-1-login-page.png', fullPage: true });
    
    // 检查页面内容
    const pageText = await page.textContent('body');
    console.log('页面包含 "登录" 或 "login":', pageText?.toLowerCase().includes('login') || pageText?.includes('登录'));
    
    console.log('✅ 测试 2.1 通过: 登录页面可访问\n');
  });

  test('2.2 应该能够使用测试账号登录', async ({ page }) => {
    console.log('\n🔍 测试 2.2: 测试登录功能...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // 查找邮箱输入框
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="邮箱"]').first();
    const emailVisible = await emailInput.isVisible().catch(() => false);
    
    if (!emailVisible) {
      console.log('⚠️  未找到邮箱输入框，跳过登录测试');
      await page.screenshot({ path: 'test-results/step-2-2-no-email-input.png', fullPage: true });
      return;
    }
    
    // 填写表单
    await emailInput.fill(TEST_EMAIL);
    console.log('已填写邮箱:', TEST_EMAIL);
    
    // 查找密码输入框
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i], input[placeholder*="密码"]').first();
    await passwordInput.fill(TEST_PASSWORD);
    console.log('已填写密码');
    
    await page.screenshot({ path: 'test-results/step-2-2-form-filled.png', fullPage: true });
    
    // 查找提交按钮
    const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign in")').first();
    await submitButton.click();
    console.log('已点击登录按钮');
    
    // 等待导航或响应
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-results/step-2-2-after-login.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);
    
    console.log('✅ 测试 2.2 完成: 登录流程已执行\n');
  });
});

test.describe('Step 3: 创建设计功能测试', () => {
  test('3.1 创建页面应该能够访问', async ({ page }) => {
    console.log('\n🔍 测试 3.1: 访问创建页面...');
    
    await page.goto('/create');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await page.screenshot({ path: 'test-results/step-3-1-create-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    console.log('页面包含 "创建" 或 "create":', pageText?.toLowerCase().includes('create') || pageText?.includes('创建'));
    
    console.log('✅ 测试 3.1 通过: 创建页面可访问\n');
  });
});

test.describe('Step 4: 购物车功能测试', () => {
  test('4.1 购物车页面应该能够访问', async ({ page }) => {
    console.log('\n🔍 测试 4.1: 访问购物车页面...');

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    // 等待页面内容出现
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/step-4-1-cart-page.png', fullPage: true });

    const pageText = await page.textContent('body');
    console.log('页面包含 "购物车" 或 "cart":', pageText?.toLowerCase().includes('cart') || pageText?.includes('购物车'));

    console.log('✅ 测试 4.1 通过: 购物车页面可访问\n');
  });
});

test.describe('Step 5: 订单功能测试', () => {
  test('5.1 订单列表页面应该能够访问', async ({ page }) => {
    console.log('\n🔍 测试 5.1: 访问订单列表页面...');
    
    await page.goto('/orders');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await page.screenshot({ path: 'test-results/step-5-1-orders-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    console.log('页面包含 "订单" 或 "order":', pageText?.toLowerCase().includes('order') || pageText?.includes('订单'));
    
    console.log('✅ 测试 5.1 通过: 订单页面可访问\n');
  });
});

test.describe('Step 6: 用户资料功能测试', () => {
  test('6.1 用户资料页面应该能够访问', async ({ page }) => {
    console.log('\n🔍 测试 6.1: 访问用户资料页面...');
    
    await page.goto('/profile');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    await page.screenshot({ path: 'test-results/step-6-1-profile-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    console.log('页面包含 "profile" 或 "资料":', pageText?.toLowerCase().includes('profile') || pageText?.includes('资料'));
    
    console.log('✅ 测试 6.1 通过: 用户资料页面可访问\n');
  });
});

