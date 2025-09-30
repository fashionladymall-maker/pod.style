import { test, expect } from '@playwright/test';

const baseUrl = process.env.FEED_E2E_BASE_URL;
const isBetaForced = process.env.FEED_E2E_EXPECT_BETA === 'true';

test.describe('Feed beta experience', () => {
  test.skip(!baseUrl, 'Set FEED_E2E_BASE_URL to run feed beta integration tests.');

  test('redirects to legacy homepage when beta flag is disabled', async ({ page }) => {
    test.skip(isBetaForced, 'Feed beta is forced on; redirect behaviour is not expected.');

    const response = await page.goto(`${baseUrl}/beta`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveURL(new RegExp(`${baseUrl}/?$`));
    await expect(page.locator('body')).toContainText(/Pod\.Style|灵感|创意/);
  });

  test('renders feed shell and pagination controls when beta flag is enabled', async ({ page }) => {
    test.skip(!isBetaForced, 'Feed beta not forced; skip feed shell assertion.');

    const response = await page.goto(`${baseUrl}/beta`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toContainText(/Beta Feed|热门灵感流|feed 还在建设中/);

    const refreshEnabled = await main.getAttribute('data-refresh-enabled');
    expect(refreshEnabled).not.toBeNull();

    const scores = await main
      .locator('[data-feed-score]')
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const value = element.getAttribute('data-feed-score');
            return value ? Number.parseFloat(value) : Number.NaN;
          })
          .filter((value) => Number.isFinite(value)),
      );

    if (scores.length > 1) {
      for (let index = 1; index < scores.length; index += 1) {
        expect(scores[index]).toBeLessThanOrEqual(scores[index - 1] + 0.0001);
      }
    }

    const loadMoreButton = page.locator('button', { hasText: '加载更多' });
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await expect(loadMoreButton).toBeEnabled();
    }
  });
});
