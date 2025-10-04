import { test, expect, chromium, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 完整用户流程测试
 * 
 * 测试账号: 1504885923@qq.com
 * 测试密码: 000000
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';
const TEST_EMAIL = '1504885923@qq.com';
const TEST_PASSWORD = '000000';
const RESULTS_DIR = 'test-results/user-flow';

let browser: Browser;
let page: Page;

// 确保结果目录存在
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

test.describe('pod.style 完整用户流程测试', () => {
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      devtools: false,
      slowMo: 500,
    });
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    
    // 监听控制台
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`[Console Error] ${text}`);
      }
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  /**
   * 测试 #4: 检查页面元素和 UI
   */
  test('测试 #4: 检查页面元素和 UI', async () => {
    console.log('\n🧪 测试 #4: 检查页面元素和 UI');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 检查底部导航
    console.log('\n🔍 检查底部导航...');
    const bottomNav = page.locator('nav, [role="navigation"], .bottom-nav, [class*="nav"]');
    const navCount = await bottomNav.count();
    console.log(`底部导航元素: ${navCount} 个`);

    // 检查按钮
    console.log('\n🔍 检查按钮...');
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`按钮总数: ${buttonCount} 个`);

    // 列出前 10 个按钮的文本
    for (let i = 0; i < Math.min(10, buttonCount); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent().catch(() => '');
      const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
      if (text || ariaLabel) {
        console.log(`  ${i + 1}. "${text || ariaLabel}"`);
      }
    }

    // 检查图片
    console.log('\n🔍 检查图片...');
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`图片总数: ${imageCount} 个`);

    // 检查链接
    console.log('\n🔍 检查链接...');
    const links = page.locator('a');
    const linkCount = await links.count();
    console.log(`链接总数: ${linkCount} 个`);

    // 截图
    const screenshotPath = path.join(RESULTS_DIR, 'test-4-ui-elements.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 截图已保存: ${screenshotPath}`);

    // 检查是否有 Feed 内容
    console.log('\n🔍 检查 Feed 内容...');
    const feedCheck = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasContent: body.length > 1000,
        bodyLength: body.length,
        hasImages: document.querySelectorAll('img').length > 0,
        hasButtons: document.querySelectorAll('button').length > 0,
      };
    });

    console.log(`页面内容长度: ${feedCheck.bodyLength} 字符`);
    console.log(`有图片: ${feedCheck.hasImages ? '✅' : '❌'}`);
    console.log(`有按钮: ${feedCheck.hasButtons ? '✅' : '❌'}`);

    console.log('\n' + '='.repeat(60));
    console.log('测试 #4 完成\n');
  });

  /**
   * 测试 #5: 尝试触发登录
   */
  test('测试 #5: 尝试触发登录', async () => {
    console.log('\n🧪 测试 #5: 尝试触发登录');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 截图初始状态
    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-5-initial.png'), fullPage: true });

    // 尝试多种方式触发登录
    console.log('\n🔍 尝试触发登录...');

    // 方法 1: 查找包含"登录"、"我的"、"Profile"等文本的按钮
    const loginTexts = ['登录', '我的', 'Profile', '个人', 'Account', 'Sign in', 'Login'];
    
    for (const text of loginTexts) {
      const button = page.locator(`button:has-text("${text}")`).first();
      const exists = await button.count() > 0;
      
      if (exists) {
        console.log(`✅ 找到按钮: "${text}"`);
        
        try {
          await button.click({ timeout: 2000 });
          console.log(`✅ 点击了 "${text}" 按钮`);
          await page.waitForTimeout(2000);
          
          // 截图点击后的状态
          await page.screenshot({ path: path.join(RESULTS_DIR, `test-5-after-click-${text}.png`), fullPage: true });
          
          // 检查是否出现登录表单
          const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
          const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
          
          if (hasEmailInput && hasPasswordInput) {
            console.log('✅ 登录表单已出现！');
            
            // 尝试登录
            console.log('\n🔐 尝试登录...');
            await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
            console.log(`✅ 填写邮箱: ${TEST_EMAIL}`);
            
            await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
            console.log('✅ 填写密码: ******');
            
            // 截图填写后的表单
            await page.screenshot({ path: path.join(RESULTS_DIR, 'test-5-form-filled.png'), fullPage: true });
            
            // 查找登录按钮
            const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
            const hasSubmitButton = await submitButton.count() > 0;
            
            if (hasSubmitButton) {
              await submitButton.click();
              console.log('✅ 点击登录按钮');
              
              // 等待登录处理
              await page.waitForTimeout(5000);
              
              // 截图登录后的状态
              await page.screenshot({ path: path.join(RESULTS_DIR, 'test-5-after-login.png'), fullPage: true });
              
              // 检查是否登录成功
              const loginCheck = await page.evaluate(() => {
                const body = document.body.innerText;
                return {
                  hasErrorMessage: body.includes('错误') || body.includes('Error') || body.includes('失败'),
                  bodyText: body.substring(0, 500),
                };
              });
              
              if (loginCheck.hasErrorMessage) {
                console.log('❌ 登录可能失败，检测到错误消息');
              } else {
                console.log('✅ 登录可能成功，未检测到错误消息');
              }
            }
            
            break;
          } else {
            console.log('⚠️  未找到登录表单');
          }
        } catch (error) {
          console.log(`⚠️  点击 "${text}" 按钮失败: ${error}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('测试 #5 完成\n');
  });

  /**
   * 测试 #6: 检查 Firebase 实际状态
   */
  test('测试 #6: 检查 Firebase 实际状态', async () => {
    console.log('\n🧪 测试 #6: 检查 Firebase 实际状态');
    console.log('='.repeat(60));

    // 导航到首页
    console.log('📍 导航到首页...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // 深度检查 Firebase
    console.log('\n🔍 深度检查 Firebase...');
    const firebaseStatus = await page.evaluate(() => {
      const win = window as any;
      
      // 检查所有可能的 Firebase 引用
      const checks = {
        // 全局 firebase 对象
        hasGlobalFirebase: typeof win.firebase !== 'undefined',
        hasFirebaseApp: typeof win.firebase?.app !== 'undefined',
        hasFirebaseAuth: typeof win.firebase?.auth !== 'undefined',
        hasFirebaseFirestore: typeof win.firebase?.firestore !== 'undefined',
        
        // 检查页面源代码中的 Firebase 配置
        pageHasFirebaseConfig: document.documentElement.innerHTML.includes('firebase'),
        pageHasApiKey: document.documentElement.innerHTML.includes('AIzaSy'),
        
        // 检查所有脚本标签
        scriptTags: Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src,
          hasFirebase: s.src.includes('firebase') || (s.textContent || '').includes('firebase'),
        })).filter(s => s.hasFirebase),
        
        // 检查 localStorage
        localStorage: Object.keys(localStorage).filter(k => k.includes('firebase')),
        
        // 检查 sessionStorage
        sessionStorage: Object.keys(sessionStorage).filter(k => k.includes('firebase')),
      };
      
      return checks;
    });

    console.log('Firebase 状态:');
    console.log(`  - 全局 firebase 对象: ${firebaseStatus.hasGlobalFirebase ? '✅' : '❌'}`);
    console.log(`  - Firebase App: ${firebaseStatus.hasFirebaseApp ? '✅' : '❌'}`);
    console.log(`  - Firebase Auth: ${firebaseStatus.hasFirebaseAuth ? '✅' : '❌'}`);
    console.log(`  - Firebase Firestore: ${firebaseStatus.hasFirebaseFirestore ? '✅' : '❌'}`);
    console.log(`  - 页面有 Firebase 配置: ${firebaseStatus.pageHasFirebaseConfig ? '✅' : '❌'}`);
    console.log(`  - 页面有 API Key: ${firebaseStatus.pageHasApiKey ? '✅' : '❌'}`);
    console.log(`  - Firebase 脚本标签: ${firebaseStatus.scriptTags.length} 个`);
    console.log(`  - localStorage 键: ${firebaseStatus.localStorage.length} 个`);
    console.log(`  - sessionStorage 键: ${firebaseStatus.sessionStorage.length} 个`);

    // 保存详细状态到文件
    const statusPath = path.join(RESULTS_DIR, 'firebase-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(firebaseStatus, null, 2));
    console.log(`\n📊 Firebase 状态已保存: ${statusPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('测试 #6 完成\n');
  });
});

