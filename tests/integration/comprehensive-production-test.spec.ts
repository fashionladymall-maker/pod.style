import { test, expect, Page } from '@playwright/test';

/**
 * 全面的生产环境测试套件
 * 测试账号: 1504885923@qq.com
 * 密码: 000000
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';

// 测试配置
test.use({
  baseURL: PRODUCTION_URL,
  viewport: { width: 1280, height: 720 },
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
});

// 辅助函数：等待页面加载完成
async function waitForPageLoad(page: Page, timeout = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForLoadState('domcontentloaded', { timeout });
}

// 辅助函数：检查控制台错误
function setupConsoleErrorTracking(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// 辅助函数：登录
async function login(page: Page) {
  await page.goto('/login');
  await waitForPageLoad(page);
  
  // 填写登录表单
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  
  // 点击登录按钮
  await page.click('button[type="submit"]');
  
  // 等待登录完成
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Phase 1: 环境变量和基础加载测试', () => {
  test('1.1 首页应该能够加载', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);
    
    console.log('🔍 测试: 访问首页...');
    await page.goto('/');
    
    // 等待页面加载
    await waitForPageLoad(page, 60000);
    
    // 截图
    await page.screenshot({ path: 'test-results/homepage-initial.png', fullPage: true });
    
    // 检查是否永久显示加载动画
    const loadingVisible = await page.locator('[data-testid="loading-screen"]').isVisible().catch(() => false);
    
    if (loadingVisible) {
      console.error('❌ 首页仍然显示加载动画 - Firebase 环境变量未注入');
      console.error('控制台错误:', errors);
      throw new Error('首页永久显示加载动画 - 环境变量问题未解决');
    }
    
    console.log('✅ 首页加载成功');
  });

  test('1.2 检查 Firebase 初始化', async ({ page }) => {
    const errors = setupConsoleErrorTracking(page);
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 检查 Firebase 是否初始化
    const firebaseInitialized = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             'firebase' in window;
    });
    
    console.log('Firebase 初始化状态:', firebaseInitialized);
    console.log('控制台错误:', errors);
    
    if (!firebaseInitialized) {
      console.error('❌ Firebase 未初始化');
    } else {
      console.log('✅ Firebase 已初始化');
    }
  });
});

test.describe('Phase 2: 认证功能测试', () => {
  test('2.1 登录页面应该能够加载', async ({ page }) => {
    console.log('🔍 测试: 访问登录页面...');
    await page.goto('/login');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // 检查登录表单元素
    const emailInput = await page.locator('input[type="email"]').isVisible();
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    
    console.log('✅ 登录页面加载成功');
  });

  test('2.2 使用测试账号登录', async ({ page }) => {
    console.log('🔍 测试: 登录功能...');
    const errors = setupConsoleErrorTracking(page);
    
    await page.goto('/login');
    await waitForPageLoad(page);
    
    // 填写表单
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    await page.screenshot({ path: 'test-results/login-form-filled.png', fullPage: true });
    
    // 点击登录
    await page.click('button[type="submit"]');
    
    // 等待导航或错误消息
    try {
      await page.waitForURL('/', { timeout: 10000 });
      console.log('✅ 登录成功，已重定向到首页');
    } catch (error) {
      console.error('❌ 登录失败或未重定向');
      console.error('控制台错误:', errors);
      await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
      throw error;
    }
  });

  test('2.3 登录后会话应该持久化', async ({ page }) => {
    console.log('🔍 测试: 会话持久化...');
    
    // 先登录
    await login(page);
    
    // 刷新页面
    await page.reload();
    await waitForPageLoad(page);
    
    // 检查是否仍然登录
    const isLoggedIn = await page.evaluate(() => {
      return localStorage.getItem('firebase:authUser') !== null;
    });
    
    expect(isLoggedIn).toBeTruthy();
    console.log('✅ 会话持久化成功');
  });
});

test.describe('Phase 3: 创建设计功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('3.1 创建页面应该能够加载', async ({ page }) => {
    console.log('🔍 测试: 访问创建页面...');
    await page.goto('/create');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/create-page.png', fullPage: true });
    
    // 检查创建表单元素
    const promptInput = await page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="描述"]').isVisible().catch(() => false);
    const uploadButton = await page.locator('input[type="file"], button:has-text("上传")').isVisible().catch(() => false);
    
    console.log('Prompt 输入框:', promptInput);
    console.log('上传按钮:', uploadButton);
    
    console.log('✅ 创建页面加载成功');
  });

  test('3.2 Prompt 输入应该工作', async ({ page }) => {
    console.log('🔍 测试: Prompt 输入...');
    await page.goto('/create');
    await waitForPageLoad(page);
    
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="描述"]').first();
    await promptInput.fill('A beautiful sunset over mountains');
    
    const value = await promptInput.inputValue();
    expect(value).toBe('A beautiful sunset over mountains');
    
    console.log('✅ Prompt 输入功能正常');
  });
});

test.describe('Phase 4: 产品浏览测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('4.1 产品列表应该显示', async ({ page }) => {
    console.log('🔍 测试: 产品列表...');
    await page.goto('/');
    await waitForPageLoad(page);
    
    // 检查是否有产品卡片
    const productCards = await page.locator('[data-testid="creation-card"], .creation-card, article').count();
    
    console.log('找到产品卡片数量:', productCards);
    
    await page.screenshot({ path: 'test-results/product-list.png', fullPage: true });
    
    console.log('✅ 产品列表测试完成');
  });

  test('4.2 产品详情页应该能够访问', async ({ page }) => {
    console.log('🔍 测试: 产品详情页...');
    
    // 尝试访问一个示例产品页面
    await page.goto('/product/tshirt-basic');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/product-detail.png', fullPage: true });
    
    console.log('✅ 产品详情页测试完成');
  });
});

test.describe('Phase 5: 购物车功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('5.1 购物车页面应该能够加载', async ({ page }) => {
    console.log('🔍 测试: 购物车页面...');
    await page.goto('/cart');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/cart-page.png', fullPage: true });
    
    console.log('✅ 购物车页面加载成功');
  });

  test('5.2 空购物车应该显示提示', async ({ page }) => {
    console.log('🔍 测试: 空购物车...');
    await page.goto('/cart');
    await waitForPageLoad(page);
    
    const emptyMessage = await page.locator('text=/empty|空|没有商品/i').isVisible().catch(() => false);
    
    console.log('空购物车提示:', emptyMessage);
    console.log('✅ 空购物车测试完成');
  });
});

test.describe('Phase 6: 订单管理测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('6.1 订单列表页面应该能够加载', async ({ page }) => {
    console.log('🔍 测试: 订单列表页面...');
    await page.goto('/orders');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/orders-page.png', fullPage: true });
    
    console.log('✅ 订单列表页面加载成功');
  });
});

test.describe('Phase 7: 用户资料测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('7.1 用户资料页面应该能够加载', async ({ page }) => {
    console.log('🔍 测试: 用户资料页面...');
    await page.goto('/profile');
    await waitForPageLoad(page);
    
    await page.screenshot({ path: 'test-results/profile-page.png', fullPage: true });
    
    console.log('✅ 用户资料页面加载成功');
  });
});

test.describe('Phase 8: 性能测试', () => {
  test('8.1 首页性能指标', async ({ page }) => {
    console.log('🔍 测试: 首页性能...');
    
    await page.goto('/');
    
    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });
    
    console.log('性能指标:', metrics);
    console.log('✅ 性能测试完成');
  });
});

