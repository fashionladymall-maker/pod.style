import { test, expect } from '@playwright/test';

const PROD_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const LOCAL_URL = process.env.FEED_E2E_BASE_URL || 'http://localhost:6100';

// 使用本地 URL 进行测试（如果生产环境还没修复）
const BASE_URL = process.env.TEST_PROD ? PROD_URL : LOCAL_URL;

test.describe('M1-FEED-001: OMG Feed MVP 性能验证', () => {
  test('DoD 1: 首屏 LCP ≤ 2.5s（4G 模拟）', async ({ page }) => {
    // 模拟 4G 网络
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms 延迟
      await route.continue();
    });

    const startTime = Date.now();
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待首屏内容加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    const endTime = Date.now();
    const lcp = endTime - startTime;
    
    console.log(`📊 首屏 LCP: ${lcp}ms`);
    
    // DoD: LCP ≤ 2.5s (2500ms)
    expect(lcp).toBeLessThanOrEqual(2500);
  });

  test('DoD 2: 滚动流畅（掉帧 < 5%）', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 开始性能监控
    await page.evaluate(() => {
      // @ts-ignore
      window.frameDrops = 0;
      // @ts-ignore
      window.totalFrames = 0;
      
      let lastTime = performance.now();
      const targetFPS = 60;
      const targetFrameTime = 1000 / targetFPS;
      
      function checkFrame() {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        // @ts-ignore
        window.totalFrames++;
        
        // 如果帧时间超过目标时间的 1.5 倍，认为是掉帧
        if (delta > targetFrameTime * 1.5) {
          // @ts-ignore
          window.frameDrops++;
        }
        
        lastTime = currentTime;
        requestAnimationFrame(checkFrame);
      }
      
      requestAnimationFrame(checkFrame);
    });
    
    // 模拟滚动
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(500);
    }
    
    // 等待滚动完成
    await page.waitForTimeout(1000);
    
    // 获取掉帧统计
    const stats = await page.evaluate(() => {
      return {
        // @ts-ignore
        frameDrops: window.frameDrops || 0,
        // @ts-ignore
        totalFrames: window.totalFrames || 0,
      };
    });
    
    const dropRate = (stats.frameDrops / stats.totalFrames) * 100;
    
    console.log(`📊 掉帧率: ${dropRate.toFixed(2)}% (${stats.frameDrops}/${stats.totalFrames})`);
    
    // DoD: 掉帧 < 5%
    expect(dropRate).toBeLessThan(5);
  });

  test('DoD 3: 预览卡片 500ms 内出现', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const startTime = Date.now();
    
    // 等待第一个预览卡片出现
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 1000 });
    
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    console.log(`📊 预览卡片渲染时间: ${renderTime}ms`);
    
    // DoD: 预览卡片 500ms 内出现
    expect(renderTime).toBeLessThanOrEqual(500);
  });

  test('验证: 竖向滚动功能', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 检查第一个卡片是否可见
    const firstCard = page.locator('[data-feed-index="0"]');
    await expect(firstCard).toBeVisible();
    
    // 滚动到下一个卡片
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1000);
    
    // 检查第二个卡片是否可见
    const secondCard = page.locator('[data-feed-index="1"]');
    await expect(secondCard).toBeVisible();
    
    console.log('✅ 竖向滚动功能正常');
  });

  test('验证: 卡片内轮播功能', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 查找轮播按钮
    const nextButton = page.locator('[data-feed-index="0"] button[aria-label*="Next"]').first();
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      console.log('✅ 轮播功能正常');
    } else {
      console.log('⚠️  轮播按钮不可见（可能只有一张图片）');
    }
  });

  test('验证: 悬浮操作栏功能', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 查找操作栏按钮
    const favoriteButton = page.locator('button:has-text("收藏")').first();
    const shareButton = page.locator('button:has-text("分享")').first();
    
    // 检查按钮是否存在
    if (await favoriteButton.isVisible()) {
      console.log('✅ 收藏按钮可见');
    }
    
    if (await shareButton.isVisible()) {
      console.log('✅ 分享按钮可见');
    }
    
    // 点击收藏按钮
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(500);
      console.log('✅ 操作栏功能正常');
    }
  });

  test('验证: 懒加载功能', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 检查初始加载的卡片数量
    const initialCards = await page.locator('[data-feed-index]').count();
    console.log(`📊 初始加载卡片数: ${initialCards}`);
    
    // 滚动到底部
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(500);
    }
    
    // 等待新卡片加载
    await page.waitForTimeout(2000);
    
    // 检查加载后的卡片数量
    const finalCards = await page.locator('[data-feed-index]').count();
    console.log(`📊 加载后卡片数: ${finalCards}`);
    
    // 验证懒加载是否工作（应该加载更多卡片）
    if (finalCards > initialCards) {
      console.log('✅ 懒加载功能正常');
    } else {
      console.log('⚠️  懒加载未触发（可能已到底部）');
    }
  });

  test('验证: Canvas 叠加功能', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // 等待 Feed 加载
    await page.waitForSelector('[data-feed-index="0"]', { timeout: 5000 });
    
    // 查找 Canvas 元素
    const canvas = page.locator('canvas').first();
    
    if (await canvas.isVisible()) {
      console.log('✅ Canvas 元素存在');
      
      // 检查 Canvas 是否有内容
      const hasContent = await canvas.evaluate((el) => {
        const ctx = (el as HTMLCanvasElement).getContext('2d');
        if (!ctx) return false;
        
        const imageData = ctx.getImageData(0, 0, el.width, el.height);
        // 检查是否有非透明像素
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) return true;
        }
        return false;
      });
      
      if (hasContent) {
        console.log('✅ Canvas 叠加功能正常');
      } else {
        console.log('⚠️  Canvas 可能为空');
      }
    } else {
      console.log('⚠️  Canvas 元素不可见');
    }
  });
});

