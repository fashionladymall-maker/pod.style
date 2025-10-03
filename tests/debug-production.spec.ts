import { test, expect } from '@playwright/test';

const PROD_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.describe('Production Debugging', () => {
  test('should load homepage without errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const networkErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        warnings.push(`Console Warning: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Capture network errors
    page.on('requestfailed', (request) => {
      networkErrors.push(`Network Error: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to production
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for potential hydration
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/production-debug.png', fullPage: true });

    // Get page content
    const content = await page.content();
    console.log('Page Title:', await page.title());
    console.log('Page URL:', page.url());

    // Check for loading spinner
    const spinner = await page.locator('.lucide-loader-circle').count();
    console.log('Loading spinner count:', spinner);

    // Check for actual content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);
    console.log('Body text preview:', bodyText?.substring(0, 200));

    // Log all errors
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
    
    console.log('\n=== WARNINGS ===');
    warnings.forEach(warn => console.log(warn));
    
    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach(err => console.log(err));

    // Check for Firebase initialization
    const firebaseScripts = await page.locator('script[src*="firebase"]').count();
    console.log('Firebase scripts count:', firebaseScripts);

    // Check for Next.js hydration
    const nextScripts = await page.locator('script[src*="_next"]').count();
    console.log('Next.js scripts count:', nextScripts);

    // Get all network requests
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        duration: r.duration,
        transferSize: r.transferSize
      }));
    });
    console.log('\n=== NETWORK REQUESTS ===');
    console.log(`Total requests: ${requests.length}`);
    requests.slice(0, 10).forEach(req => {
      console.log(`${req.name} - ${req.duration}ms - ${req.transferSize} bytes`);
    });

    // Assertions
    expect(errors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should check Firebase configuration', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    
    const firebaseConfig = await page.evaluate(() => {
      return {
        hasFirebase: typeof (window as any).firebase !== 'undefined',
        hasFirebaseApp: typeof (window as any).firebase?.app !== 'undefined',
        env: {
          apiKey: (window as any).NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: (window as any).NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: (window as any).NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
      };
    });

    console.log('Firebase Config:', JSON.stringify(firebaseConfig, null, 2));
  });

  test('should check for hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('hydration') || text.includes('Hydration')) {
        hydrationErrors.push(text);
      }
    });

    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('\n=== HYDRATION ERRORS ===');
    hydrationErrors.forEach(err => console.log(err));

    expect(hydrationErrors.length).toBe(0);
  });
});

