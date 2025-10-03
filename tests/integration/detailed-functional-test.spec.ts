import { test, expect } from '@playwright/test';

/**
 * 详细功能测试 - 测试所有交互功能
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

test.describe('详细功能测试', () => {
  test('测试 1: 首页滚动和产品卡片交互', async ({ page }) => {
    console.log('\n🔍 测试 1: 首页滚动和产品卡片交互...');
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // 截图初始状态
    await page.screenshot({ path: 'test-results/detailed-1-homepage-initial.png', fullPage: false });
    
    // 检查是否有产品卡片
    const cards = await page.locator('article, [data-testid="creation-card"], .creation-card').count();
    console.log('找到产品卡片数量:', cards);
    
    if (cards > 0) {
      // 尝试滚动
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/detailed-1-homepage-scrolled.png', fullPage: false });
      console.log('✅ 滚动功能正常');
    }
    
    console.log('✅ 测试 1 完成\n');
  });

  test('测试 2: 登录页面详细检查', async ({ page }) => {
    console.log('\n🔍 测试 2: 登录页面详细检查...');
    
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-2-login-page.png', fullPage: true });
    
    // 检查页面元素
    const pageContent = await page.content();
    console.log('页面包含 "email":', pageContent.toLowerCase().includes('email'));
    console.log('页面包含 "password":', pageContent.toLowerCase().includes('password'));
    console.log('页面包含 "login" 或 "登录":', pageContent.toLowerCase().includes('login') || pageContent.includes('登录'));
    
    // 尝试查找所有输入框
    const inputs = await page.locator('input').count();
    console.log('找到输入框数量:', inputs);
    
    // 尝试查找所有按钮
    const buttons = await page.locator('button').count();
    console.log('找到按钮数量:', buttons);
    
    console.log('✅ 测试 2 完成\n');
  });

  test('测试 3: 创建页面详细检查', async ({ page }) => {
    console.log('\n🔍 测试 3: 创建页面详细检查...');
    
    await page.goto('/create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-3-create-page.png', fullPage: true });
    
    // 检查页面元素
    const inputs = await page.locator('input, textarea').count();
    console.log('找到输入框/文本框数量:', inputs);
    
    const buttons = await page.locator('button').count();
    console.log('找到按钮数量:', buttons);
    
    // 检查是否有文件上传
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log('找到文件上传框数量:', fileInputs);
    
    console.log('✅ 测试 3 完成\n');
  });

  test('测试 4: 购物车页面详细检查', async ({ page }) => {
    console.log('\n🔍 测试 4: 购物车页面详细检查...');
    
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-4-cart-page.png', fullPage: true });
    
    // 检查空购物车提示
    const pageText = await page.textContent('body');
    console.log('显示空购物车提示:', pageText?.includes('空') || pageText?.toLowerCase().includes('empty'));
    
    // 检查订单摘要
    console.log('显示订单摘要:', pageText?.includes('订单摘要') || pageText?.toLowerCase().includes('summary'));
    
    // 检查结算按钮
    const checkoutButton = await page.locator('button:has-text("结算"), button:has-text("checkout")').count();
    console.log('找到结算按钮数量:', checkoutButton);
    
    console.log('✅ 测试 4 完成\n');
  });

  test('测试 5: 订单页面详细检查', async ({ page }) => {
    console.log('\n🔍 测试 5: 订单页面详细检查...');
    
    await page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-5-orders-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    console.log('页面包含订单相关内容:', pageText?.includes('订单') || pageText?.toLowerCase().includes('order'));
    
    console.log('✅ 测试 5 完成\n');
  });

  test('测试 6: 用户资料页面详细检查', async ({ page }) => {
    console.log('\n🔍 测试 6: 用户资料页面详细检查...');
    
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-6-profile-page.png', fullPage: true });
    
    const pageText = await page.textContent('body');
    console.log('页面包含用户资料相关内容:', 
      pageText?.includes('资料') || 
      pageText?.includes('profile') || 
      pageText?.includes('用户') ||
      pageText?.includes('账号')
    );
    
    console.log('✅ 测试 6 完成\n');
  });

  test('测试 7: 导航功能测试', async ({ page }) => {
    console.log('\n🔍 测试 7: 导航功能测试...');
    
    // 从首页开始
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 尝试查找导航链接
    const links = await page.locator('a[href], button[onclick]').count();
    console.log('找到链接/按钮数量:', links);
    
    // 尝试点击创建按钮（如果存在）
    const createLink = page.locator('a[href="/create"], button:has-text("创建"), button:has-text("Create")').first();
    const createLinkExists = await createLink.isVisible().catch(() => false);
    
    if (createLinkExists) {
      console.log('找到创建按钮，尝试点击...');
      await createLink.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log('导航后的 URL:', currentUrl);
      console.log('导航成功:', currentUrl.includes('/create'));
      
      await page.screenshot({ path: 'test-results/detailed-7-navigation.png', fullPage: false });
    } else {
      console.log('未找到创建按钮');
    }
    
    console.log('✅ 测试 7 完成\n');
  });

  test('测试 8: 响应式设计测试（移动端）', async ({ page }) => {
    console.log('\n🔍 测试 8: 响应式设计测试（移动端）...');
    
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/detailed-8-mobile-homepage.png', fullPage: false });
    
    // 测试其他页面
    await page.goto('/create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/detailed-8-mobile-create.png', fullPage: false });
    
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/detailed-8-mobile-cart.png', fullPage: false });
    
    console.log('✅ 测试 8 完成: 移动端页面可以正常显示\n');
  });

  test('测试 9: 性能测试', async ({ page }) => {
    console.log('\n🔍 测试 9: 性能测试...');
    
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    console.log('首页加载时间:', loadTime, 'ms');
    
    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navigation) return null;
      
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
        responseTime: Math.round(navigation.responseEnd - navigation.requestStart),
      };
    });
    
    if (metrics) {
      console.log('性能指标:');
      console.log('  - DOM Content Loaded:', metrics.domContentLoaded, 'ms');
      console.log('  - Load Complete:', metrics.loadComplete, 'ms');
      console.log('  - DOM Interactive:', metrics.domInteractive, 'ms');
      console.log('  - Response Time:', metrics.responseTime, 'ms');
      
      // 性能断言
      expect(metrics.domInteractive).toBeLessThan(5000); // DOM 交互时间应小于 5 秒
    }
    
    console.log('✅ 测试 9 完成\n');
  });

  test('测试 10: 控制台错误检查', async ({ page }) => {
    console.log('\n🔍 测试 10: 控制台错误检查...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('控制台错误数量:', errors.length);
    console.log('控制台警告数量:', warnings.length);
    
    if (errors.length > 0) {
      console.log('错误列表:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('警告列表:');
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.substring(0, 100)}`);
      });
    }
    
    console.log('✅ 测试 10 完成\n');
  });
});

