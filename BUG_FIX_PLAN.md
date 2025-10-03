# 🐛 Bug 修复计划

**日期**: 2025-10-03
**时间**: 17:50
**状态**: 🔄 执行中

---

## 🔍 已识别的 Bug

### Bug #1: Firebase 环境变量未注入 🔴 CRITICAL
- **严重程度**: P0 - 阻塞所有功能
- **影响范围**: 整个应用
- **症状**:
  - Firebase SDK 无法初始化
  - 无法加载用户数据
  - 无法显示 Feed 内容
  - 登录/注册功能无法使用
  - UI 元素缺失（创建按钮、登录模态框等）

### Bug #2: NEXT_PUBLIC_RECAPTCHA_SITE_KEY 未配置 ⚠️  WARNING
- **严重程度**: P1 - 影响安全性
- **影响范围**: App Check
- **症状**: Console 警告

### Bug #3: UI 元素缺失 🔴 CRITICAL
- **严重程度**: P0 - 阻塞用户交互
- **影响范围**: 核心功能
- **症状**:
  - 创建按钮不存在
  - 登录模态框无法触发
  - Feed 内容为空
- **根本原因**: 依赖 Bug #1

---

## 🎯 修复策略

### 策略 1: 使用 .env.production 文件（推荐）⭐

**原因**: 
- Next.js 标准做法
- 代码可追溯
- 易于维护
- Firebase 配置是公开信息，不是敏感数据

**步骤**:
1. 创建 `.env.production` 文件
2. 添加所有 Firebase 环境变量
3. 提交并推送到 GitHub
4. 等待 Firebase App Hosting 自动重新构建
5. 验证修复

**预计时间**: 15-20 分钟

---

### 策略 2: 直接硬编码到 firebase.ts（备选）

**原因**:
- 最直接的方法
- 保证能工作
- Firebase 配置是公开信息

**步骤**:
1. 修改 `src/lib/firebase.ts`
2. 添加默认值
3. 提交并推送
4. 等待重新构建
5. 验证修复

**预计时间**: 15-20 分钟

---

## 📝 执行计划

### 阶段 1: 修复 Firebase 配置（Bug #1）

#### 步骤 1.1: 创建 .env.production 文件
```bash
cat > .env.production << 'EOF'
# Firebase 配置（公开信息）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-1269295870-5fde0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-1269295870-5fde0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-1269295870-5fde0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=204491544475
NEXT_PUBLIC_FIREBASE_APP_ID=1:204491544475:web:dadc0d6d650572156db33e

# 服务端环境变量
GCLOUD_PROJECT=studio-1269295870-5fde0
FIREBASE_STORAGE_BUCKET=studio-1269295870-5fde0.firebasestorage.app
EOF
```

#### 步骤 1.2: 提交并推送
```bash
git add .env.production
git commit -m "fix: add production environment variables for Firebase"
git push origin main
```

#### 步骤 1.3: 等待构建完成
- 监控 Firebase Console
- 预计 10-15 分钟

#### 步骤 1.4: 验证修复
```bash
# 检查环境变量是否注入
curl -s "https://studio--studio-1269295870-5fde0.us-central1.hosted.app/_next/static/chunks/app/page-*.js" | grep -o "AIzaSy[a-zA-Z0-9_-]*"

# 运行测试
npx playwright test tests/integration/chrome-devtools-test.spec.ts --headed --project=chromium
```

---

### 阶段 2: 配置 App Check（Bug #2）

#### 步骤 2.1: 获取 reCAPTCHA Site Key
1. 打开 https://console.cloud.google.com/security/recaptcha
2. 创建或获取 Site Key

#### 步骤 2.2: 添加到环境变量
```bash
# 添加到 .env.production
echo "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-site-key>" >> .env.production
```

#### 步骤 2.3: 提交并推送
```bash
git add .env.production
git commit -m "fix: add reCAPTCHA site key for App Check"
git push origin main
```

---

### 阶段 3: 验证所有功能（Bug #3）

#### 步骤 3.1: 运行完整测试套件
```bash
npx playwright test tests/integration/chrome-devtools-test.spec.ts --headed --project=chromium
```

#### 步骤 3.2: 手动测试
1. 打开生产 URL
2. 检查 Feed 内容是否显示
3. 测试登录功能
4. 测试创建功能
5. 测试交互功能（点赞、评论、分享）

#### 步骤 3.3: 性能测试
```bash
npx lighthouse https://studio--studio-1269295870-5fde0.us-central1.hosted.app --output=html --output-path=test-results/lighthouse-report.html
```

---

## 📊 验收标准

### Bug #1 修复验收
- [ ] Firebase SDK 成功初始化
- [ ] 环境变量在客户端可访问
- [ ] Feed 内容正常显示
- [ ] 登录/注册功能正常
- [ ] 创建按钮可见
- [ ] 无 Console 错误

### Bug #2 修复验收
- [ ] 无 reCAPTCHA 警告
- [ ] App Check 启用

### Bug #3 修复验收
- [ ] 所有 UI 元素可见
- [ ] 所有交互功能正常
- [ ] Feed 滚动正常
- [ ] 创建流程完整

---

## 🔄 回归测试清单

修复后必须测试的功能：
- [ ] 首页加载
- [ ] Feed 显示
- [ ] 登录功能
- [ ] 注册功能
- [ ] 创建设计
- [ ] 点赞/评论/分享
- [ ] 购物车
- [ ] 结算
- [ ] 订单查看
- [ ] 个人资料

---

## 📝 执行日志

### 2025-10-03 17:50 - 开始执行
- 创建修复计划
- 准备执行策略 1

### 待更新...

---

**下一步**: 执行策略 1 - 创建 .env.production 文件

