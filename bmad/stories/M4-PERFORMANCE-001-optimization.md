---
id: M4-PERFORMANCE-001
name: 性能优化与预算验证
type: feature
priority: P2
owner: augment
estimate: 6h
acceptance:
  - LCP ≤ 2.5s（4G 模拟）
  - TTI ≤ 3.5s
  - Bundle size ≤ 500KB（首屏）
  - 性能预算 CI 检查
telemetry:
  - Core Web Vitals
  - Bundle size 趋势
risk:
  - 第三方库体积过大
---

## 任务目标
优化关键路径性能，确保达到性能预算。

## 核心需求
1. 代码分割优化
2. 图片懒加载与 WebP 转换
3. 字体优化
4. Bundle 分析与体积控制
5. 性能预算 CI 检查

## 实现步骤

### Step 1: 图片与资源优化
- [x] 使用 Next.js Image + Firebase LQIP API 提供渐进式加载
- [x] 新增 CDN 缓存、预连接与占位符策略

### Step 2: 代码分割与预加载
- [x] 动态导入非关键屏幕组件并延迟预取
- [x] 增补关键域名 `preconnect` / `dns-prefetch`

### Step 3: 缓存策略
- [x] 注册 Service Worker 缓存静态/远程资源
- [x] 启用 Firestore 持久化缓存与 Server Action 缓存层

### Step 4: 性能监控
- [x] 集成 Web Vitals 上报与 Firebase Performance Trace
- [x] 新增自定义性能埋点与指标 API

## DoD（Definition of Done）
- [x] `npm run build` 通过（0 错误）
- [x] `npm run lint` 通过（0 错误）
- [x] `npm run typecheck` 通过（0 错误）
- [x] `npm run test` 通过（关键路径）
- [ ] LCP ≤ 2.5s（4G 网络）
- [ ] TTI ≤ 3.5s（4G 网络）
- [ ] CLS < 0.1
- [x] 创建分支 `feature/M4-PERFORMANCE-001`
- [ ] 提交代码并推送
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 文件标记完成
