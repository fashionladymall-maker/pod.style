import { test, chromium } from '@playwright/test';
import * as fs from 'fs';

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Content Analysis', () => {
  test('should analyze actual page content and identify issues', async () => {
    const browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n🔍 Loading production page...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('\n⏳ Waiting 5 seconds...');
    await page.waitForTimeout(5000);

    // Get full page HTML
    const fullHTML = await page.content();
    fs.writeFileSync('production-page.html', fullHTML);
    console.log('📄 Saved full HTML to production-page.html');

    // Get visible text
    const visibleText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('production-page-text.txt', visibleText);
    console.log('📄 Saved visible text to production-page-text.txt');

    // Check for specific elements
    const elements = await page.evaluate(() => {
      const results: any = {};
      
      // Check for loading indicators
      results.loadingElements = Array.from(document.querySelectorAll('[class*="loading"], [class*="spinner"], [data-testid*="loading"]'))
        .map(el => ({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.substring(0, 100),
          visible: (el as HTMLElement).offsetParent !== null,
        }));
      
      // Check for error messages
      results.errorElements = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'))
        .map(el => ({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.substring(0, 200),
          visible: (el as HTMLElement).offsetParent !== null,
        }));
      
      // Check for main content
      results.hasMainContent = document.querySelector('main') !== null;
      results.hasFeedContent = document.querySelector('[class*="feed"], [data-testid*="feed"]') !== null;
      results.hasCards = document.querySelectorAll('[class*="card"]').length;
      
      // Check for auth state
      results.hasLoginButton = document.querySelector('[data-testid="login-button"], button:has-text("登录"), button:has-text("Login")') !== null;
      results.hasUserMenu = document.querySelector('[data-testid="user-menu"], [class*="user-menu"]') !== null;
      
      return results;
    });

    // Print analysis
    console.log('\n' + '='.repeat(80));
    console.log('📊 CONTENT ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\n1️⃣  Loading Elements:');
    console.log(`   Count: ${elements.loadingElements.length}`);
    const visibleLoading = elements.loadingElements.filter((el: any) => el.visible);
    if (visibleLoading.length > 0) {
      console.log(`   ⚠️  Visible loading elements: ${visibleLoading.length}`);
      visibleLoading.forEach((el: any, i: number) => {
        console.log(`      ${i + 1}. <${el.tag}> class="${el.class}"`);
        console.log(`         Text: "${el.text}"`);
      });
    } else {
      console.log(`   ✅ No visible loading elements`);
    }
    
    console.log('\n2️⃣  Error Elements:');
    console.log(`   Count: ${elements.errorElements.length}`);
    const visibleErrors = elements.errorElements.filter((el: any) => el.visible);
    if (visibleErrors.length > 0) {
      console.log(`   ❌ Visible error elements: ${visibleErrors.length}`);
      visibleErrors.forEach((el: any, i: number) => {
        console.log(`      ${i + 1}. <${el.tag}> class="${el.class}"`);
        console.log(`         Text: "${el.text}"`);
      });
    } else {
      console.log(`   ✅ No visible error elements`);
    }
    
    console.log('\n3️⃣  Main Content:');
    console.log(`   Has <main>: ${elements.hasMainContent ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has Feed: ${elements.hasFeedContent ? '✅ YES' : '❌ NO'}`);
    console.log(`   Card Count: ${elements.hasCards}`);
    
    console.log('\n4️⃣  Auth State:');
    console.log(`   Has Login Button: ${elements.hasLoginButton ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has User Menu: ${elements.hasUserMenu ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n5️⃣  Visible Text Preview:');
    console.log(visibleText.substring(0, 500));
    console.log('...');
    
    console.log('\n' + '='.repeat(80));

    // Take screenshot
    await page.screenshot({ path: 'production-content-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: production-content-screenshot.png');

    // Keep browser open
    console.log('\n🔍 Browser will stay open for 60 seconds for manual inspection...');
    console.log('   Please check the browser window to see the actual page state.');
    await page.waitForTimeout(60000);

    await browser.close();
  });
});

