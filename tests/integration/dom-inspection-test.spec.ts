import { test } from '@playwright/test';

/**
 * DOM 结构检查测试 - 查看页面的实际 DOM 结构
 */

const PRODUCTION_URL = 'https://studio--studio-1269295870-5fde0.us-central1.hosted.app';

test.use({
  baseURL: PRODUCTION_URL,
  viewport: { width: 1280, height: 720 },
});

test.describe('DOM 结构检查', () => {
  test('检查首页 DOM 结构', async ({ page }) => {
    console.log('\n🔍 检查首页 DOM 结构...\n');
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // 等待足够长的时间让 JavaScript 执行
    await page.waitForTimeout(5000);
    
    // 获取页面的完整 HTML
    const html = await page.content();
    console.log('页面 HTML 长度:', html.length);
    
    // 检查所有按钮
    const buttons = await page.locator('button').all();
    console.log('\n找到按钮数量:', buttons.length);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      console.log(`  按钮 ${i + 1}: "${text?.trim()}" (可见: ${visible})`);
    }
    
    // 检查所有输入框
    const inputs = await page.locator('input').all();
    console.log('\n找到输入框数量:', inputs.length);
    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const visible = await inputs[i].isVisible();
      console.log(`  输入框 ${i + 1}: type="${type}", placeholder="${placeholder}" (可见: ${visible})`);
    }
    
    // 检查所有链接
    const links = await page.locator('a').all();
    console.log('\n找到链接数量:', links.length);
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      const visible = await links[i].isVisible();
      console.log(`  链接 ${i + 1}: href="${href}", text="${text?.trim()}" (可见: ${visible})`);
    }
    
    // 检查所有图片
    const images = await page.locator('img').all();
    console.log('\n找到图片数量:', images.length);
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const src = await images[i].getAttribute('src');
      const alt = await images[i].getAttribute('alt');
      const visible = await images[i].isVisible();
      console.log(`  图片 ${i + 1}: src="${src?.substring(0, 50)}...", alt="${alt}" (可见: ${visible})`);
    }
    
    // 检查所有 article 元素（可能是产品卡片）
    const articles = await page.locator('article').all();
    console.log('\n找到 article 元素数量:', articles.length);
    
    // 检查所有 div 元素（可能包含产品卡片）
    const divs = await page.locator('div').all();
    console.log('找到 div 元素数量:', divs.length);
    
    // 截图
    await page.screenshot({ path: 'test-results/dom-inspection-homepage.png', fullPage: true });
    
    console.log('\n✅ DOM 结构检查完成\n');
  });

  test('检查登录页 DOM 结构', async ({ page }) => {
    console.log('\n🔍 检查登录页 DOM 结构...\n');
    
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 检查所有按钮
    const buttons = await page.locator('button').all();
    console.log('找到按钮数量:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      const disabled = await buttons[i].isDisabled();
      console.log(`  按钮 ${i + 1}: "${text?.trim()}" (可见: ${visible}, 禁用: ${disabled})`);
    }
    
    // 检查所有输入框
    const inputs = await page.locator('input').all();
    console.log('\n找到输入框数量:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const visible = await inputs[i].isVisible();
      console.log(`  输入框 ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}" (可见: ${visible})`);
    }
    
    // 检查所有表单
    const forms = await page.locator('form').all();
    console.log('\n找到表单数量:', forms.length);
    
    // 截图
    await page.screenshot({ path: 'test-results/dom-inspection-login.png', fullPage: true });
    
    console.log('\n✅ 登录页 DOM 结构检查完成\n');
  });

  test('检查创建页 DOM 结构', async ({ page }) => {
    console.log('\n🔍 检查创建页 DOM 结构...\n');
    
    await page.goto('/create', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 检查所有输入框和文本框
    const inputs = await page.locator('input, textarea').all();
    console.log('找到输入框/文本框数量:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const tagName = await inputs[i].evaluate(el => el.tagName);
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const visible = await inputs[i].isVisible();
      console.log(`  ${tagName} ${i + 1}: type="${type}", placeholder="${placeholder}" (可见: ${visible})`);
    }
    
    // 检查所有按钮
    const buttons = await page.locator('button').all();
    console.log('\n找到按钮数量:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      console.log(`  按钮 ${i + 1}: "${text?.trim()}" (可见: ${visible})`);
    }
    
    // 检查文件上传
    const fileInputs = await page.locator('input[type="file"]').all();
    console.log('\n找到文件上传框数量:', fileInputs.length);
    
    // 截图
    await page.screenshot({ path: 'test-results/dom-inspection-create.png', fullPage: true });
    
    console.log('\n✅ 创建页 DOM 结构检查完成\n');
  });

  test('等待并检查首页的动态内容', async ({ page }) => {
    console.log('\n🔍 等待并检查首页的动态内容...\n');
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // 逐步等待并检查
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(1000);
      
      const buttons = await page.locator('button').count();
      const inputs = await page.locator('input').count();
      const links = await page.locator('a').count();
      const images = await page.locator('img').count();
      
      console.log(`第 ${i} 秒: 按钮=${buttons}, 输入框=${inputs}, 链接=${links}, 图片=${images}`);
      
      if (buttons > 0 || inputs > 0 || links > 0) {
        console.log(`\n✅ 在第 ${i} 秒时发现了交互元素！\n`);
        break;
      }
    }
    
    console.log('\n✅ 动态内容检查完成\n');
  });
});

