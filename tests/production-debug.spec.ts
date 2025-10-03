import { test, expect } from '@playwright/test';

const PROD_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Environment Debugging', () => {
  test('should load the page and check for Firebase initialization', async ({ page }) => {
    // 监听控制台消息
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    // 监听页面错误
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // 访问页面
    console.log(`\n🌐 访问生产环境: ${PROD_URL}\n`);
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待一段时间让 JavaScript 执行
    await page.waitForTimeout(5000);
    
    // 截图
    await page.screenshot({ path: 'tests/screenshots/production-debug.png', fullPage: true });
    console.log('📸 截图已保存: tests/screenshots/production-debug.png\n');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}\n`);
    
    // 检查页面内容
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 页面文本内容: ${bodyText?.substring(0, 200)}...\n`);
    
    // 检查是否有加载动画
    const hasLoadingSpinner = await page.locator('.animate-spin').count();
    console.log(`🔄 加载动画数量: ${hasLoadingSpinner}\n`);
    
    // 检查 Firebase 配置
    const firebaseConfig = await page.evaluate(() => {
      // @ts-expect-error accessing injected firebase config from runtime
      return window.__FIREBASE_CONFIG__ || null;
    });
    console.log(`🔥 Firebase 配置 (window.__FIREBASE_CONFIG__): ${JSON.stringify(firebaseConfig, null, 2)}\n`);
    
    // 检查环境变量
    const envVars = await page.evaluate(() => {
      return {
        // @ts-expect-error process is not defined in the browser typing but exposed in this env
        NEXT_PUBLIC_FIREBASE_API_KEY: typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : 'undefined',
        // 检查是否有 Firebase 相关的全局变量
        // @ts-expect-error window.firebase is injected by Firebase SDK in runtime
        hasFirebaseApp: typeof window.firebase !== 'undefined',
      };
    });
    console.log(`🔧 环境变量检查: ${JSON.stringify(envVars, null, 2)}\n`);
    
    // 打印所有控制台消息
    console.log(`📋 控制台消息 (${consoleMessages.length} 条):`);
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
    console.log('');
    
    // 打印所有错误
    if (consoleErrors.length > 0) {
      console.log(`❌ 控制台错误 (${consoleErrors.length} 条):`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    }
    
    if (pageErrors.length > 0) {
      console.log(`❌ 页面错误 (${pageErrors.length} 条):`);
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    }
    
    // 检查网络请求
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(`${request.method()} ${request.url()}`);
    });
    
    // 等待一段时间收集网络请求
    await page.waitForTimeout(2000);
    
    console.log(`🌐 网络请求 (前 20 条):`);
    requests.slice(0, 20).forEach((req, i) => {
      console.log(`  ${i + 1}. ${req}`);
    });
    console.log('');
    
    // 检查是否有 OMG 内容
    const hasOMGContent = await page.locator('[data-testid="omg-feed"]').count();
    console.log(`📱 OMG Feed 内容: ${hasOMGContent > 0 ? '✅ 存在' : '❌ 不存在'}\n`);
    
    // 检查是否有创作卡片
    const creationCards = await page.locator('[data-testid="creation-card"]').count();
    console.log(`🎨 创作卡片数量: ${creationCards}\n`);
    
    // 总结
    console.log('📊 调试总结:');
    console.log('==================');
    console.log(`✅ 页面加载: ${title ? '成功' : '失败'}`);
    console.log(`${hasLoadingSpinner > 0 ? '⏳' : '✅'} 加载状态: ${hasLoadingSpinner > 0 ? '仍在加载' : '已完成'}`);
    console.log(`${consoleErrors.length > 0 ? '❌' : '✅'} 控制台错误: ${consoleErrors.length} 条`);
    console.log(`${pageErrors.length > 0 ? '❌' : '✅'} 页面错误: ${pageErrors.length} 条`);
    console.log(`${hasOMGContent > 0 ? '✅' : '❌'} OMG 内容: ${hasOMGContent > 0 ? '已显示' : '未显示'}`);
    console.log(`${creationCards > 0 ? '✅' : '❌'} 创作卡片: ${creationCards} 个`);
    console.log('');
    
    // 如果有错误，测试失败
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('❌ 测试失败：发现错误');
      expect(consoleErrors.length).toBe(0);
      expect(pageErrors.length).toBe(0);
    }
    
    // 如果没有内容，测试失败
    if (hasLoadingSpinner > 0 && hasOMGContent === 0) {
      console.log('❌ 测试失败：页面永久显示加载动画');
      expect(hasLoadingSpinner).toBe(0);
    }
  });
  
  test('should check Firebase SDK initialization', async ({ page }) => {
    console.log(`\n🔥 检查 Firebase SDK 初始化\n`);
    
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 检查 Firebase SDK 是否加载
    const firebaseSDK = await page.evaluate(() => {
      return {
        // @ts-expect-error firebase typings not available in this test context
        hasFirebaseApp: typeof window.firebase !== 'undefined',
        // @ts-expect-error firebase typings not available in this test context
        hasFirebaseAuth: typeof window.firebase?.auth !== 'undefined',
        // @ts-expect-error firebase typings not available in this test context
        hasFirebaseFirestore: typeof window.firebase?.firestore !== 'undefined',
      };
    });
    
    console.log(`Firebase SDK 状态: ${JSON.stringify(firebaseSDK, null, 2)}\n`);
    
    // 检查 localStorage 中的 Firebase 数据
    const localStorageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys.filter(k => k.includes('firebase'));
    });
    
    console.log(`Firebase localStorage 键: ${JSON.stringify(localStorageKeys, null, 2)}\n`);
  });
});
