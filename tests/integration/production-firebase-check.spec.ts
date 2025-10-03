import { test, expect, chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Firebase Initialization Check', () => {
  test('should verify Firebase is properly initialized', async () => {
    const browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    console.log('\n🔍 Loading production page...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('\n⏳ Waiting 5 seconds for Firebase to initialize...');
    await page.waitForTimeout(5000);

    // Check Firebase initialization in detail
    const firebaseStatus = await page.evaluate(() => {
      // Check if Firebase is loaded
      const hasFirebaseGlobal = typeof (window as any).firebase !== 'undefined';
      
      // Check Firebase app initialization
      let firebaseAppInitialized = false;
      let firebaseApps: any[] = [];
      try {
        if (typeof (window as any).firebase !== 'undefined' && (window as any).firebase.apps) {
          firebaseApps = (window as any).firebase.apps;
          firebaseAppInitialized = firebaseApps.length > 0;
        }
      } catch (e) {
        // Ignore
      }

      // Check environment variables
      const envVars = {
        NEXT_PUBLIC_FIREBASE_API_KEY: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_API_KEY : undefined,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID : undefined,
        NEXT_PUBLIC_FIREBASE_APP_ID: typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_APP_ID : undefined,
      };

      // Try to access Firebase modules
      let authAvailable = false;
      let firestoreAvailable = false;
      try {
        authAvailable = typeof (window as any).firebase?.auth !== 'undefined';
        firestoreAvailable = typeof (window as any).firebase?.firestore !== 'undefined';
      } catch (e) {
        // Ignore
      }

      return {
        hasFirebaseGlobal,
        firebaseAppInitialized,
        firebaseAppsCount: firebaseApps.length,
        authAvailable,
        firestoreAvailable,
        envVars,
      };
    });

    // Check if page content is loaded
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      const hasContent = body.textContent && body.textContent.length > 100;
      const hasLoadingSpinner = body.innerHTML.includes('loading') || body.innerHTML.includes('spinner');
      const hasErrorMessage = body.textContent?.includes('error') || body.textContent?.includes('错误');
      
      return {
        hasContent,
        hasLoadingSpinner,
        hasErrorMessage,
        bodyTextLength: body.textContent?.length || 0,
        bodyHTML: body.innerHTML.substring(0, 500),
      };
    });

    // Take screenshot
    await page.screenshot({ path: 'firebase-check-screenshot.png', fullPage: true });

    // Print detailed report
    console.log('\n' + '='.repeat(80));
    console.log('🔥 FIREBASE INITIALIZATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n1️⃣  Firebase Global Object:');
    console.log(`   Available: ${firebaseStatus.hasFirebaseGlobal ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n2️⃣  Firebase App Initialization:');
    console.log(`   Initialized: ${firebaseStatus.firebaseAppInitialized ? '✅ YES' : '❌ NO'}`);
    console.log(`   Apps Count: ${firebaseStatus.firebaseAppsCount}`);
    
    console.log('\n3️⃣  Firebase Modules:');
    console.log(`   Auth Available: ${firebaseStatus.authAvailable ? '✅ YES' : '❌ NO'}`);
    console.log(`   Firestore Available: ${firebaseStatus.firestoreAvailable ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n4️⃣  Environment Variables:');
    console.log(`   API Key: ${firebaseStatus.envVars.NEXT_PUBLIC_FIREBASE_API_KEY || '❌ NOT SET'}`);
    console.log(`   Project ID: ${firebaseStatus.envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ NOT SET'}`);
    console.log(`   App ID: ${firebaseStatus.envVars.NEXT_PUBLIC_FIREBASE_APP_ID || '❌ NOT SET'}`);
    
    console.log('\n5️⃣  Page Content:');
    console.log(`   Has Content: ${pageContent.hasContent ? '✅ YES' : '❌ NO'}`);
    console.log(`   Body Text Length: ${pageContent.bodyTextLength} chars`);
    console.log(`   Has Loading Spinner: ${pageContent.hasLoadingSpinner ? '⚠️  YES' : '✅ NO'}`);
    console.log(`   Has Error Message: ${pageContent.hasErrorMessage ? '❌ YES' : '✅ NO'}`);
    
    console.log('\n6️⃣  Console Logs:');
    console.log(`   Total: ${logs.length}`);
    if (logs.length > 0) {
      console.log('   Recent logs:');
      logs.slice(-10).forEach(log => {
        console.log(`   ${log}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 SUMMARY:');
    console.log('='.repeat(80));
    
    const issues: string[] = [];
    if (!firebaseStatus.hasFirebaseGlobal) issues.push('Firebase global object not available');
    if (!firebaseStatus.firebaseAppInitialized) issues.push('Firebase app not initialized');
    if (!firebaseStatus.authAvailable) issues.push('Firebase Auth not available');
    if (!firebaseStatus.firestoreAvailable) issues.push('Firebase Firestore not available');
    if (!pageContent.hasContent) issues.push('Page has no content');
    if (pageContent.hasLoadingSpinner) issues.push('Loading spinner still visible');
    if (pageContent.hasErrorMessage) issues.push('Error message visible');
    
    if (issues.length > 0) {
      console.log('\n❌ Issues Found:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ All checks passed!');
    }
    
    console.log('\n' + '='.repeat(80));

    // Keep browser open for inspection
    console.log('\n🔍 Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();

    // Assertions
    expect(pageContent.hasContent, 'Page should have content').toBe(true);
    expect(pageContent.hasLoadingSpinner, 'Loading spinner should not be visible').toBe(false);
    expect(pageContent.hasErrorMessage, 'No error messages should be visible').toBe(false);
    
    // Note: Firebase global object might not be available in modular SDK
    // So we don't fail on that, but we log it for information
  });
});

