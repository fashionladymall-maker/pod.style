import { test, expect } from '@playwright/test';

const PROD_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Verification After Fix', () => {
  test('should load homepage with Firebase initialized', async ({ page }) => {
    const errors: string[] = [];
    const firebaseLogs: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(`Error: ${text}`);
      }
      if (text.includes('Firebase') || text.includes('firebase')) {
        firebaseLogs.push(text);
      }
    });

    // Navigate to production
    console.log('Navigating to:', PROD_URL);
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for potential hydration
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/production-after-fix.png', fullPage: true });

    // Check for loading spinner (should disappear)
    const spinnerCount = await page.locator('.lucide-loader-circle').count();
    console.log('Loading spinner count:', spinnerCount);

    // Check for actual content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);

    // Check for Firebase initialization
    console.log('\n=== FIREBASE LOGS ===');
    firebaseLogs.forEach(log => console.log(log));

    // Check for errors
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));

    // Get Firebase config from window
    const firebaseConfig = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        env: {
          apiKey: (window as any).NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId: (window as any).NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
      };
    });
    console.log('\n=== FIREBASE CONFIG ===');
    console.log(JSON.stringify(firebaseConfig, null, 2));

    // Assertions
    expect(errors.length).toBe(0);
    expect(spinnerCount).toBe(0); // Spinner should be gone
    expect(bodyText?.length).toBeGreaterThan(100); // Should have content
  });

  test('should have Firebase environment variables', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    
    // Check if Firebase config is available
    const hasFirebaseConfig = await page.evaluate(() => {
      // Check if Next.js injected the env vars
      const script = document.querySelector('script[id="__NEXT_DATA__"]');
      if (script) {
        try {
          const data = JSON.parse(script.textContent || '{}');
          console.log('Next.js data:', data);
        } catch (e) {
          console.error('Failed to parse Next.js data:', e);
        }
      }
      
      return {
        hasScript: !!script,
        // Try to access Firebase from window
        hasFirebaseGlobal: typeof (window as any).firebase !== 'undefined',
      };
    });

    console.log('Firebase config check:', JSON.stringify(hasFirebaseConfig, null, 2));
  });

  test('should not show only loading spinner', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Check if there's more than just the loading screen
    const loadingScreen = await page.locator('.animate-fade-in').count();
    const otherContent = await page.locator('body > *').count();

    console.log('Loading screens:', loadingScreen);
    console.log('Total body children:', otherContent);

    // Should have more than just loading screen
    expect(otherContent).toBeGreaterThan(1);
  });

  test('should check network requests', async ({ page }) => {
    const requests: string[] = [];
    const failedRequests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n=== NETWORK REQUESTS ===');
    console.log(`Total requests: ${requests.length}`);
    console.log('Sample requests:');
    requests.slice(0, 10).forEach(url => console.log(url));

    console.log('\n=== FAILED REQUESTS ===');
    failedRequests.forEach(req => console.log(req));

    expect(failedRequests.length).toBe(0);
  });
});

