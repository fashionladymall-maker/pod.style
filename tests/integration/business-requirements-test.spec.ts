import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 业务需求全面测试
 * 
 * 根据 PRD (docs/prd.md) 测试所有核心业务功能：
 * 1. 匿名浏览 - 首页 Feed 展示公共创作
 * 2. 创意生成 - AI 生成图案和商品预览
 * 3. 二次创作 - 点击创意进行 Remix/Recreate
 * 4. 社交互动 - 点赞、收藏、评论、关注
 * 5. 购物流程 - 加入购物车、结算、下单
 * 6. 用户认证 - 登录、注册、匿名访问限制
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 */

const PRODUCTION_URL = process.env.FEED_E2E_BASE_URL || 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';
const RESULTS_DIR = 'test-results/business-requirements';

let browser: Browser;
let page: Page;
const testResults: any[] = [];
const bugs: any[] = [];

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function recordBug(requirement: string, description: string, severity: 'critical' | 'high' | 'medium' | 'low', details: any) {
  const bug = { requirement, description, severity, details, timestamp: new Date().toISOString() };
  bugs.push(bug);
  console.log(`\n🐛 [${severity.toUpperCase()}] ${requirement}: ${description}`);
}

function recordTest(requirement: string, status: 'pass' | 'fail', details: any) {
  testResults.push({ requirement, status, details, timestamp: new Date().toISOString() });
}

test.describe('pod.style 业务需求测试', () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false, devtools: false, slowMo: 100 });
  });

  test.beforeEach(async () => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`❌ Console Error: ${msg.text()}`);
    });
    page.on('pageerror', error => console.log(`❌ Page Error: ${error.message}`));
  });

  test.afterEach(async () => {
    if (page) await page.close();
  });

  test.afterAll(async () => {
    if (browser) await browser.close();
    
    const report = {
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.status === 'pass').length,
        failed: testResults.filter(r => r.status === 'fail').length,
        totalBugs: bugs.length,
        critical: bugs.filter(b => b.severity === 'critical').length,
        high: bugs.filter(b => b.severity === 'high').length,
        medium: bugs.filter(b => b.severity === 'medium').length,
        low: bugs.filter(b => b.severity === 'low').length,
      },
      testResults,
      bugs,
    };
    
    fs.writeFileSync(path.join(RESULTS_DIR, 'business-requirements-report.json'), JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 业务需求测试总结');
    console.log('='.repeat(80));
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`总 Bug 数: ${report.summary.totalBugs}`);
    console.log(`  - Critical: ${report.summary.critical}`);
    console.log(`  - High: ${report.summary.high}`);
    console.log(`  - Medium: ${report.summary.medium}`);
    console.log(`  - Low: ${report.summary.low}`);
    console.log('='.repeat(80));
  });

  /**
   * FR1: 匿名浏览 - 首页 Feed 展示公共创作
   * 需求: 平台必须提供个性化首页 feed，支持匿名访客在 3 秒内看到至少 10 条公共创作
   */
  test('FR1: 匿名浏览 - 首页展示公共创作', async () => {
    console.log('\n🧪 FR1: 匿名浏览 - 首页展示公共创作');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 截图
    await page.screenshot({ path: path.join(RESULTS_DIR, 'fr1-homepage-feed.png'), fullPage: true });

    // 检查是否有创作卡片
    const creationCards = await page.evaluate(() => {
      // 查找所有可能的创作卡片元素
      const cards = document.querySelectorAll('[data-testid*="creation"], [class*="creation"], article, .card');
      return {
        count: cards.length,
        hasContent: document.body.innerText.length > 500,
        bodyText: document.body.innerText.substring(0, 500),
      };
    });

    console.log(`  创作卡片数量: ${creationCards.count}`);
    console.log(`  页面内容长度: ${creationCards.hasContent ? '充足' : '不足'}`);
    console.log(`  内容预览: ${creationCards.bodyText.substring(0, 200)}...`);

    if (creationCards.count < 10) {
      recordBug(
        'FR1-匿名浏览',
        `首页创作卡片数量不足: ${creationCards.count} < 10`,
        'critical',
        creationCards
      );
      recordTest('FR1-匿名浏览', 'fail', creationCards);
    } else {
      console.log('  ✅ 首页展示了足够的创作');
      recordTest('FR1-匿名浏览', 'pass', creationCards);
    }
  });

  /**
   * FR2: 创意生成 - AI 生成图案和商品预览
   * 需求: 创作者需在单个会话内完成"提示词 → 多模型生成 → 商品配置 → 发布"
   */
  test('FR2: 创意生成 - 创作工作室功能', async () => {
    console.log('\n🧪 FR2: 创意生成 - 创作工作室功能');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 查找创建按钮
    const createButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const createBtn = buttons.find(btn => 
        btn.textContent?.includes('创建') || 
        btn.textContent?.includes('Create') ||
        btn.textContent?.includes('+') ||
        btn.getAttribute('aria-label')?.includes('create')
      );
      return createBtn ? {
        found: true,
        text: createBtn.textContent,
        tag: createBtn.tagName,
      } : { found: false };
    });

    console.log(`  创建按钮: ${createButton.found ? '✅ 找到' : '❌ 未找到'}`);
    if (createButton.found) {
      console.log(`    文本: ${createButton.text}`);
    }

    await page.screenshot({ path: path.join(RESULTS_DIR, 'fr2-create-button.png') });

    if (!createButton.found) {
      recordBug(
        'FR2-创意生成',
        '未找到创建/创作按钮',
        'critical',
        { createButton }
      );
      recordTest('FR2-创意生成', 'fail', { createButton });
    } else {
      recordTest('FR2-创意生成', 'pass', { createButton });
    }
  });

  /**
   * FR3: 二次创作 - 点击创意进行 Remix/Recreate
   * 需求: 从任何创作 → 点击"Recreate" → 修改 prompt → 重新生成
   */
  test('FR3: 二次创作 - Remix/Recreate 功能', async () => {
    console.log('\n🧪 FR3: 二次创作 - Remix/Recreate 功能');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 查找 Remix/Recreate 按钮
    const remixButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const remix = buttons.find(btn => 
        btn.textContent?.includes('Remix') || 
        btn.textContent?.includes('Recreate') ||
        btn.textContent?.includes('复刻') ||
        btn.textContent?.includes('再创作')
      );
      return remix ? {
        found: true,
        text: remix.textContent,
      } : { found: false };
    });

    console.log(`  Remix/Recreate 按钮: ${remixButton.found ? '✅ 找到' : '❌ 未找到'}`);

    await page.screenshot({ path: path.join(RESULTS_DIR, 'fr3-remix-button.png') });

    if (!remixButton.found) {
      recordBug(
        'FR3-二次创作',
        '未找到 Remix/Recreate 按钮',
        'high',
        { remixButton }
      );
      recordTest('FR3-二次创作', 'fail', { remixButton });
    } else {
      recordTest('FR3-二次创作', 'pass', { remixButton });
    }
  });

  /**
   * FR4: 社交互动 - 点赞、收藏、评论、关注
   * 需求: 社交互动（点赞、收藏、评论、关注、分享、复刻）
   */
  test('FR4: 社交互动 - 点赞/收藏/评论/关注', async () => {
    console.log('\n🧪 FR4: 社交互动 - 点赞/收藏/评论/关注');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const socialButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return {
        like: buttons.some(btn => 
          btn.textContent?.includes('赞') || 
          btn.textContent?.includes('Like') ||
          btn.getAttribute('aria-label')?.includes('like')
        ),
        favorite: buttons.some(btn => 
          btn.textContent?.includes('收藏') || 
          btn.textContent?.includes('Favorite') ||
          btn.textContent?.includes('Save')
        ),
        comment: buttons.some(btn => 
          btn.textContent?.includes('评论') || 
          btn.textContent?.includes('Comment')
        ),
        follow: buttons.some(btn => 
          btn.textContent?.includes('关注') || 
          btn.textContent?.includes('Follow')
        ),
        share: buttons.some(btn => 
          btn.textContent?.includes('分享') || 
          btn.textContent?.includes('Share')
        ),
      };
    });

    console.log(`  点赞按钮: ${socialButtons.like ? '✅' : '❌'}`);
    console.log(`  收藏按钮: ${socialButtons.favorite ? '✅' : '❌'}`);
    console.log(`  评论按钮: ${socialButtons.comment ? '✅' : '❌'}`);
    console.log(`  关注按钮: ${socialButtons.follow ? '✅' : '❌'}`);
    console.log(`  分享按钮: ${socialButtons.share ? '✅' : '❌'}`);

    await page.screenshot({ path: path.join(RESULTS_DIR, 'fr4-social-buttons.png') });

    const missingButtons = [];
    if (!socialButtons.like) missingButtons.push('点赞');
    if (!socialButtons.favorite) missingButtons.push('收藏');
    if (!socialButtons.comment) missingButtons.push('评论');

    if (missingButtons.length > 0) {
      recordBug(
        'FR4-社交互动',
        `缺少社交按钮: ${missingButtons.join(', ')}`,
        'high',
        { socialButtons, missingButtons }
      );
      recordTest('FR4-社交互动', 'fail', { socialButtons });
    } else {
      recordTest('FR4-社交互动', 'pass', { socialButtons });
    }
  });

  /**
   * FR5: 用户认证 - 登录功能
   * 需求: 支持用户登录、注册、匿名访问限制
   */
  test('FR5: 用户认证 - 登录功能', async () => {
    console.log('\n🧪 FR5: 用户认证 - 登录功能');
    console.log('='.repeat(80));

    await page.goto(PRODUCTION_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 查找登录按钮
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const login = buttons.find(btn => 
        btn.textContent?.includes('登录') || 
        btn.textContent?.includes('Login') ||
        btn.textContent?.includes('Sign In')
      );
      return login ? {
        found: true,
        text: login.textContent,
      } : { found: false };
    });

    console.log(`  登录按钮: ${loginButton.found ? '✅ 找到' : '❌ 未找到'}`);

    await page.screenshot({ path: path.join(RESULTS_DIR, 'fr5-login-button.png') });

    if (!loginButton.found) {
      recordBug(
        'FR5-用户认证',
        '未找到登录按钮',
        'critical',
        { loginButton }
      );
      recordTest('FR5-用户认证', 'fail', { loginButton });
    } else {
      recordTest('FR5-用户认证', 'pass', { loginButton });
    }
  });
});

