import { test, expect, chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Environment - Real Debugging', () => {
  test('should capture all console errors and warnings', async () => {
    const browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture all console messages
    const consoleMessages: any[] = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture all page errors
    const pageErrors: any[] = [];
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      });
      console.error('[PAGE ERROR]', error.message);
    });

    // Capture failed requests
    const failedRequests: any[] = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText,
      });
      console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
    });

    // Navigate to production
    console.log('\n🔍 Navigating to production URL...');
    await page.goto(PRODUCTION_URL, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Wait for potential errors to appear
    console.log('\n⏳ Waiting 10 seconds for page to load and errors to appear...');
    await page.waitForTimeout(10000);

    // Check if loading spinner is still visible
    const loadingSpinner = await page.locator('[data-testid="loading-screen"], .loading-spinner, [class*="loading"]').first();
    const isLoadingVisible = await loadingSpinner.isVisible().catch(() => false);

    // Take screenshot
    await page.screenshot({ path: 'production-debug-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: production-debug-screenshot.png');

    // Get page content
    const pageContent = await page.content();
    
    // Check for Firebase initialization
    const firebaseInitialized = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as any).firebase !== undefined;
    });

    // Check for environment variables in window
    const envVars = await page.evaluate(() => {
      return {
        hasFirebaseConfig: typeof (window as any).NEXT_PUBLIC_FIREBASE_API_KEY !== 'undefined',
        processEnv: typeof process !== 'undefined' ? Object.keys(process.env || {}).filter(k => k.startsWith('NEXT_PUBLIC')) : [],
      };
    });

    // Get all network requests
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        duration: r.duration,
        transferSize: r.transferSize,
      }));
    });

    // Generate detailed report
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION DEBUGGING REPORT');
    console.log('='.repeat(80));
    
    console.log('\n1️⃣  PAGE STATUS:');
    console.log(`   URL: ${PRODUCTION_URL}`);
    console.log(`   Title: ${await page.title()}`);
    console.log(`   Loading Spinner Visible: ${isLoadingVisible ? '❌ YES (BUG!)' : '✅ NO'}`);
    console.log(`   Firebase Initialized: ${firebaseInitialized ? '✅ YES' : '❌ NO (BUG!)'}`);
    
    console.log('\n2️⃣  ENVIRONMENT VARIABLES:');
    console.log(`   Firebase Config in Window: ${envVars.hasFirebaseConfig ? '✅ YES' : '❌ NO (BUG!)'}`);
    console.log(`   NEXT_PUBLIC_* vars: ${envVars.processEnv.length > 0 ? envVars.processEnv.join(', ') : '❌ NONE (BUG!)'}`);
    
    console.log('\n3️⃣  CONSOLE MESSAGES:');
    console.log(`   Total: ${consoleMessages.length}`);
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n   ❌ ERRORS:');
      errors.forEach((err, i) => {
        console.log(`      ${i + 1}. ${err.text}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n   ⚠️  WARNINGS:');
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`      ${i + 1}. ${warn.text}`);
      });
    }
    
    console.log('\n4️⃣  PAGE ERRORS:');
    console.log(`   Total: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      pageErrors.forEach((err, i) => {
        console.log(`   ❌ ${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`      Stack: ${err.stack.split('\n')[0]}`);
        }
      });
    }
    
    console.log('\n5️⃣  FAILED REQUESTS:');
    console.log(`   Total: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      failedRequests.forEach((req, i) => {
        console.log(`   ❌ ${i + 1}. ${req.url}`);
        console.log(`      Reason: ${req.failure}`);
      });
    }
    
    console.log('\n6️⃣  NETWORK REQUESTS:');
    console.log(`   Total: ${requests.length}`);
    const slowRequests = requests.filter((r: any) => r.duration > 1000);
    if (slowRequests.length > 0) {
      console.log(`   ⚠️  Slow requests (>1s): ${slowRequests.length}`);
      slowRequests.slice(0, 5).forEach((req: any, i: number) => {
        console.log(`      ${i + 1}. ${req.name} (${Math.round(req.duration)}ms)`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 SUMMARY:');
    console.log('='.repeat(80));
    
    const bugs: string[] = [];
    if (isLoadingVisible) bugs.push('Loading spinner永久显示');
    if (!firebaseInitialized) bugs.push('Firebase未初始化');
    if (!envVars.hasFirebaseConfig) bugs.push('环境变量未注入');
    if (errors.length > 0) bugs.push(`${errors.length}个控制台错误`);
    if (pageErrors.length > 0) bugs.push(`${pageErrors.length}个页面错误`);
    if (failedRequests.length > 0) bugs.push(`${failedRequests.length}个请求失败`);
    
    if (bugs.length > 0) {
      console.log('\n❌ 发现的问题:');
      bugs.forEach((bug, i) => {
        console.log(`   ${i + 1}. ${bug}`);
      });
    } else {
      console.log('\n✅ 没有发现问题！');
    }
    
    console.log('\n' + '='.repeat(80));

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: PRODUCTION_URL,
      bugs,
      isLoadingVisible,
      firebaseInitialized,
      envVars,
      consoleMessages,
      pageErrors,
      failedRequests,
      requests: requests.slice(0, 20),
    };
    
    await page.evaluate((reportData) => {
      console.log('DETAILED_REPORT:', JSON.stringify(reportData, null, 2));
    }, report);

    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();

    // Fail test if bugs found
    if (bugs.length > 0) {
      throw new Error(`发现 ${bugs.length} 个问题: ${bugs.join(', ')}`);
    }
  });
});

