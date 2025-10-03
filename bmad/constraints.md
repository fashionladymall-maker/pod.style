# Pod.Style BMAD Constraints & Contracts

> 本文档定义 pod.style 项目的技术契约、依赖约束和性能预算，供所有 BMAD Story 和开发执行遵循。

## 1. 技术栈约束

### 1.1 强制依赖
- **Node.js**: ≥ 20.18.0（与 Firebase Functions 一致）
- **Next.js**: 15.x（App Router 模式）
- **React**: 18.x
- **TypeScript**: 5.x（严格模式）
- **Firebase SDK**: 
  - firebase: ^10.14.1
  - firebase-admin: ^12.7.0
  - firebase-functions: ^6.4.0

### 1.2 禁止引入
- ❌ 任何包含真实平台名的依赖或代码（如某短视频平台、抖音等）
- ❌ 非 Firebase 的后端服务（除非通过 Cloud Functions 集成）
- ❌ 直接操作 DOM 的库（与 React 冲突）
- ❌ 过时的 Firebase SDK 版本（< v9 模块化 API）

### 1.3 推荐工具
- UI 组件：Radix UI + shadcn/ui
- 样式：Tailwind CSS
- 表单：react-hook-form + zod
- 状态管理：React Context + TanStack Query
- 动画：framer-motion
- 图标：lucide-react

## 2. 架构契约

### 2.1 目录结构契约
```
src/
├─ app/              # Next.js App Router 页面
├─ components/       # UI 组件（原子/分子/有机体）
├─ features/         # 业务域模块（server actions/services/repositories）
├─ lib/              # 共享工具（firebase/utils/types）
├─ hooks/            # 自定义 React Hooks
├─ context/          # React Context Providers
├─ ai/               # Genkit AI 流程
└─ server/           # 服务端聚合逻辑

functions/           # Cloud Functions（Node.js）
├─ index.js          # 入口
└─ *.js              # 各功能模块

bmad/
├─ stories/          # BMAD Story 文件
├─ constraints.md    # 本文档
└─ templates/        # Story 模板
```

### 2.2 命名约定
- **文件名**：kebab-case（`user-profile.tsx`）
- **组件名**：PascalCase（`UserProfile`）
- **函数名**：camelCase（`getUserProfile`）
- **常量名**：UPPER_SNAKE_CASE（`MAX_UPLOAD_SIZE`）
- **类型名**：PascalCase（`UserProfile`）
- **Server Actions**：以 `Action` 结尾（`createOrderAction`）

### 2.3 代码组织原则
- **单一职责**：每个文件/函数只做一件事
- **依赖倒置**：高层模块不依赖低层模块，都依赖抽象
- **关注点分离**：UI/业务逻辑/数据访问分层
- **DRY**：避免重复代码，提取共享逻辑

## 3. 数据模型契约

### 3.1 Firestore 集合结构
```
users/{uid}
  - profile: { displayName, photoURL, preferences }
  - createdAt: Timestamp
  - updatedAt: Timestamp

creations/{creationId}
  - userId: string
  - prompt: string
  - patternUri: string
  - models: Model[]
  - engagement: { view, like, favorite, share, order, comment, remake }
  - isPublic: boolean
  - createdAt: Timestamp

orders/{orderId}
  - userId: string
  - creationId: string
  - status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  - paymentSummary: { tokenId, brand, last4, gateway, status }
  - shippingInfo: { name, address, phone, email }
  - createdAt: Timestamp
```

### 3.2 Storage 路径约定
```
uploads/{uid}/{creationId}/source.*     # 用户上传原图
previews/{creationId}/{sku}/{variant}/{size}.jpg  # 预览图
prints/{orderId}/{lineItemId}/print-ready.tif     # 打印文件
```

### 3.3 数据验证
- 所有写入必须通过 Zod schema 验证
- Firestore 规则必须与应用逻辑一致
- 敏感数据（支付信息）禁止存储在 Firestore

## 4. 性能预算

### 4.1 前端性能
- **LCP (Largest Contentful Paint)**: ≤ 2.5s（4G 网络）
- **FID (First Input Delay)**: ≤ 100ms
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **TTI (Time to Interactive)**: ≤ 3.5s
- **Bundle Size**: 
  - 首屏 JS: ≤ 200KB（gzip）
  - 总 JS: ≤ 500KB（gzip）
  - CSS: ≤ 50KB（gzip）

### 4.2 后端性能
- **Server Action 响应**: ≤ 500ms（P95）
- **Cloud Function 冷启动**: ≤ 2s
- **Firestore 查询**: ≤ 200ms（P95）
- **Storage 上传**: ≤ 5s（10MB 文件）

### 4.3 AI 生成性能
- **即时预览**: ≤ 2s（客户端 Canvas + 服务端小图）
- **生产图**: ≤ 30s（异步队列）

## 5. 安全约束

### 5.1 认证与授权
- 所有 API 必须验证 `request.auth`
- Firestore 规则必须检查 `request.auth.uid`
- 匿名用户仅可读取公开内容

### 5.2 数据保护
- 禁止在前端存储敏感信息
- 环境变量必须使用 `NEXT_PUBLIC_*` 前缀（客户端）
- 服务端密钥存储在 GitHub Secrets 或 Firebase Config

### 5.3 App Check
- 开发环境：自动启用 debug token
- 生产环境：必须配置 reCAPTCHA v3

### 5.4 敏感词过滤
- 禁止在代码/配置/文档中出现真实平台名
- pre-commit hook 自动扫描
- CI 流程强制检查

## 6. 测试约束

### 6.1 覆盖率要求
- **单元测试**: ≥ 80%
- **集成测试**: 关键路径 100%
- **E2E 测试**: 主流程覆盖

### 6.2 测试工具
- 单元测试：Vitest / Jest
- 集成测试：Jest + Firebase Emulator
- E2E 测试：Playwright
- 可访问性：axe-core

### 6.3 测试原则
- 测试行为，不测试实现
- 优先测试用户路径
- Mock 外部依赖（AI、支付等）

## 7. CI/CD 约束

### 7.1 合并门槛（DoD）
- ✅ 构建成功（`npm run build`）
- ✅ 测试通过（`npm run test`）
- ✅ Lint 通过（`npm run lint`）
- ✅ 类型检查通过（`npm run typecheck`）
- ✅ 敏感词扫描通过（`npm run scan:banned`）
- ✅ Bundle 体积检查通过（`npm run bundle:size`）
- ✅ E2E 测试通过（关键路径）

### 7.2 部署流程
- **预览环境**：每个 PR 自动部署
- **生产环境**：仅从 `main` 分支部署
- **回滚机制**：保留最近 5 个版本的 tag

## 8. 依赖管理

### 8.1 版本锁定
- 使用 `package-lock.json` 锁定版本
- 定期更新依赖（每月）
- 安全漏洞立即修复

### 8.2 依赖审查
- 新增依赖必须评估：
  - 许可证兼容性
  - 维护活跃度
  - Bundle 体积影响
  - 安全漏洞历史

## 9. 文档约束

### 9.1 必需文档
- README.md：项目概述和快速开始
- CHANGELOG.md：版本变更记录
- docs/architecture.md：架构设计
- docs/prd.md：产品需求
- 每个 Story：验收标准和技术方案

### 9.2 代码注释
- 复杂逻辑必须注释
- 公共 API 必须有 JSDoc
- TODO/FIXME 必须关联 Issue

## 10. OMG 范式约束

### 10.1 体验要求
- 竖向滚动 Feed（全屏卡片）
- 卡片内多角度轮播
- 悬浮操作栏（收藏/分享/购买）
- 自动播放/懒加载
- 相关推荐

### 10.2 交互节拍
- 首次反馈：≤ 100ms
- 滚动流畅：掉帧 < 5%
- 变体切换：≤ 300ms

## 11. 更新日志

| 日期 | 版本 | 变更 | 作者 |
|------|------|------|------|
| 2025-10-01 | v1.0 | 初始版本，基于蓝皮书 v4.0 | Augment |

## 参考

- 蓝皮书 v4.0
- docs/architecture.md
- docs/prd.md

