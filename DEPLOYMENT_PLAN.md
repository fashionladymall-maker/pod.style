# pod.style 部署计划

**时间**: 2025-10-03
**项目**: studio-1269295870-5fde0
**状态**: 🚀 进行中

## 部署步骤

### ✅ 已完成

1. **代码质量检查**
   - ✅ TypeScript 类型检查通过
   - ✅ ESLint 检查通过（23 个警告）
   - ⚠️ 敏感词扫描（部分历史文档仍有违规，已标记为 DEPRECATED）

2. **代码清理**
   - ✅ 删除 `src/app/tiktok*` 和 `src/components/tiktok/`
   - ✅ 重命名违规文档为 `DEPRECATED_*`
   - ✅ 更新 `src/app/page.tsx` 使用 OMG 客户端
   - ✅ 清理 `.next` 缓存
   - ✅ 推送到 GitHub

3. **Firebase 配置**
   - ✅ 修复 `firebase.json` Functions 配置（Python → Node.js 20）
   - ✅ 创建 `functions/package.json`
   - ✅ 项目 ID: `studio-1269295870-5fde0`

### 🔄 进行中

4. **Firestore 规则部署**
   - 🔄 正在部署...

### ⏳ 待执行

5. **Storage 规则部署**
   ```bash
   firebase deploy --only storage --project studio-1269295870-5fde0
   ```

6. **Cloud Functions 部署**
   ```bash
   cd functions && npm install && npm run build
   firebase deploy --only functions --project studio-1269295870-5fde0
   ```

7. **App Hosting 部署**
   ```bash
   firebase deploy --only apphosting --project studio-1269295870-5fde0
   ```

8. **验证部署**
   - 获取部署 URL
   - 检查健康状态
   - 运行冒烟测试

9. **性能测试**
   - Lighthouse 测试
   - Web Vitals 监控
   - Firebase Performance 检查

10. **端到端测试**
    - Playwright E2E 测试
    - 关键路径验证

## 部署命令快速参考

### 完整部署
```bash
./scripts/deploy-and-test.sh
```

### 快速部署（跳过测试）
```bash
./scripts/quick-deploy.sh
```

### 单独部署组件
```bash
# Firestore 规则
firebase deploy --only firestore:rules --project studio-1269295870-5fde0

# Storage 规则
firebase deploy --only storage --project studio-1269295870-5fde0

# Functions
firebase deploy --only functions --project studio-1269295870-5fde0

# App Hosting
firebase deploy --only apphosting --project studio-1269295870-5fde0
```

## 环境变量检查清单

- [ ] `.env.local` 文件存在
- [ ] `NEXT_PUBLIC_FIREBASE_*` 配置正确
- [ ] `STRIPE_SECRET_KEY` 已配置（如需支付）
- [ ] `STRIPE_WEBHOOK_SECRET` 已配置
- [ ] Firebase App Check 已启用

## 部署后验证清单

- [ ] 访问部署 URL 正常
- [ ] Firebase Console 无错误
- [ ] Functions 日志正常
- [ ] Firestore 数据可读写
- [ ] Storage 文件可上传
- [ ] 性能指标达标（LCP ≤ 2.5s）

## 回滚计划

如果部署失败：
```bash
# 回滚到上一个版本
git revert HEAD
git push origin main

# 或回滚到特定 commit
git reset --hard <commit-hash>
git push origin main --force
```

## 监控链接

- **Firebase Console**: https://console.firebase.google.com/project/studio-1269295870-5fde0
- **Functions 日志**: https://console.firebase.google.com/project/studio-1269295870-5fde0/functions/logs
- **Performance**: https://console.firebase.google.com/project/studio-1269295870-5fde0/performance
- **Analytics**: https://console.firebase.google.com/project/studio-1269295870-5fde0/analytics
- **GitHub Repo**: https://github.com/fashionladymall-maker/pod.style

## 注意事项

1. **敏感词合规**: 所有代码中禁止出现真实平台名，使用 `OMG` 代号
2. **Functions Runtime**: 确保使用 Node.js 20
3. **App Hosting**: 首次部署可能需要 5-10 分钟
4. **Firestore 索引**: 如需复合索引，需在 Console 手动创建
5. **Storage 规则**: 确保安全规则正确配置

## 下一步

部署完成后：
1. 配置 Firebase Remote Config
2. 启用 A/B 测试实验
3. 设置性能预算告警
4. 配置错误监控（Sentry/Firebase Crashlytics）
5. 设置 CI/CD 自动部署

