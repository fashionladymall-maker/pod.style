# POD.STYLE 部署和维护指南

## 快速开始

### 前置要求
- Node.js 18+ 
- npm 或 yarn
- Firebase CLI
- Firebase项目访问权限

### 环境配置

1. **复制环境变量文件**
```bash
cp .env.example .env.local
```

2. **配置Firebase环境变量**
在 `.env.local` 中设置以下变量：
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
```

### 安装依赖

```bash
npm install
```

### 部署Firebase索引

```bash
firebase deploy --only firestore:indexes
```

等待所有索引构建完成（可能需要几分钟）。

### 运行数据迁移（如果需要）

如果这是首次部署或数据库schema有更新：

```bash
node scripts/migrate-creation-fields.js
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:9002 上运行。

### 构建生产版本

```bash
npm run build
npm start
```

## 维护任务

### 定期检查

#### 1. 检查Firebase索引状态
```bash
firebase firestore:indexes
```

确保所有索引状态为 `SPARSE_ALL` 或 `READY`。

#### 2. 检查应用健康状态
```bash
./scripts/test-app.sh
```

#### 3. 监控错误日志
查看服务器日志，注意任何新的错误模式。

### 数据库维护

#### 运行数据迁移
当添加新字段或更改schema时：
```bash
node scripts/migrate-creation-fields.js
```

#### 触发 Feed 缓存重新构建
当需要回填/刷新 `personalized_feed_cache` 与 `feed_entries` 时：

1. 在环境变量中启用新管道：
   ```bash
   NEXT_PUBLIC_ENABLE_FEED_INGESTION=true
   FEED_INGESTION_FORCE=true
   ```
2. 为手动触发配置令牌（可选）：
   ```bash
   FEED_INGESTION_TOKEN=your_secure_token
   ```
3. 调用 Cloud Function 重新构建缓存：
   ```bash
   curl -X POST \
     -H "x-feed-ingestion-token: $FEED_INGESTION_TOKEN" \
     "https://<region>-<project>.cloudfunctions.net/reprocessFeedCache"
   ```
4. 监控日志关键字 `feed.ingestion.success|failure|summary`，确认重建状况。
5. 如需快速回滚，只需将 `FEED_INGESTION_FORCE` 或 `NEXT_PUBLIC_ENABLE_FEED_INGESTION` 置为 `false`，即可恢复到旧的定时缓存逻辑。

#### 调整 Feed 实时刷新策略
- 通过环境变量开启：
  ```bash
  NEXT_PUBLIC_ENABLE_FEED_REFRESH=true
  FEED_REFRESH_FORCE=true
  ```
- 观察指标 `feed.service.refresh.frequency` 与 `feed.service.refresh.new_items`，确认刷新节奏符合预期。
- 若需停用刷新，撤回上述开关即可，客户端会退回手动加载模式。

#### 备份数据
定期备份Firestore数据：
```bash
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

### 性能优化

#### 1. 图片优化
当前Firebase Storage图片未经优化。考虑：
- 实现自定义图片优化服务
- 使用CDN缓存
- 压缩图片

#### 2. 数据缓存
为频繁访问的数据添加缓存：
- Redis缓存
- Next.js ISR（增量静态再生成）
- 客户端缓存

#### 3. 查询优化
- 监控慢查询
- 添加更多索引（如需要）
- 使用分页减少数据传输

## 故障排除

### 问题：索引错误

**症状：**
```
FAILED_PRECONDITION: The query requires an index
```

**解决方案：**
1. 检查索引状态：`firebase firestore:indexes`
2. 如果索引缺失，部署索引：`firebase deploy --only firestore:indexes`
3. 等待索引构建完成

### 问题：Zod验证错误

**症状：**
```
ZodError: Required field missing
```

**解决方案：**
1. 运行数据迁移：`node scripts/migrate-creation-fields.js`
2. 检查数据模型定义
3. 确保所有必需字段都有默认值

### 问题：图片加载超时

**症状：**
```
TimeoutError: Image optimization timeout
```

**解决方案：**
1. 确保使用 `FirebaseImage` 组件而不是 `next/image`
2. 检查Firebase Storage权限
3. 验证图片URL可访问

### 问题：Firestore设置警告

**症状：**
```
Firestore has already been initialized
```

**解决方案：**
这是一个无害的警告，不影响功能。可以忽略。

## 监控和日志

### 设置错误监控

推荐使用Sentry或类似服务：

```bash
npm install @sentry/nextjs
```

配置 `sentry.config.js`：
```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 日志级别

开发环境：
- 所有日志输出到控制台
- 包括警告和调试信息

生产环境：
- 仅错误和关键信息
- 发送到日志聚合服务

## 安全最佳实践

### 1. 环境变量
- 永远不要提交 `.env.local` 到版本控制
- 使用环境变量管理敏感信息
- 定期轮换API密钥

### 2. Firebase安全规则
定期审查和更新：
- Firestore安全规则
- Storage安全规则
- 认证规则

### 3. 依赖更新
定期更新依赖：
```bash
npm audit
npm update
```

## 性能基准

### 当前性能指标
- 首页加载时间：1-3秒
- API响应时间：300-800毫秒
- 数据库查询时间：400-700毫秒

### 性能目标
- 首页加载时间：< 2秒
- API响应时间：< 500毫秒
- 数据库查询时间：< 500毫秒

## 扩展性考虑

### 数据库扩展
- 使用Firestore集合组查询
- 实现数据分片
- 考虑读写分离

### 应用扩展
- 使用Next.js边缘函数
- 实现CDN缓存
- 考虑多区域部署

## 备份和恢复

### 自动备份
设置定时任务：
```bash
# 每天凌晨2点备份
0 2 * * * firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

### 恢复数据
```bash
firebase firestore:import gs://your-bucket/backups/20250930
```

## 联系和支持

### 文档
- [Firebase文档](https://firebase.google.com/docs)
- [Next.js文档](https://nextjs.org/docs)
- [项目测试报告](./TEST_REPORT.md)
- [修复总结](./FIXES_SUMMARY.md)

### 问题报告
如果遇到问题：
1. 检查日志
2. 运行测试脚本
3. 查看故障排除部分
4. 联系开发团队

## 版本历史

### v1.0.0 (2025-09-30)
- ✅ 修复所有Firebase索引问题
- ✅ 修复Zod验证错误
- ✅ 修复图片加载超时
- ✅ 实现数据迁移
- ✅ 添加全面测试
- ✅ 应用生产就绪

## 下一步

1. **监控**：设置生产监控和告警
2. **测试**：添加更多自动化测试
3. **优化**：实现图片优化服务
4. **文档**：完善API文档
5. **CI/CD**：设置持续集成和部署

---

**状态：生产就绪** 🎉

最后更新：2025-09-30
