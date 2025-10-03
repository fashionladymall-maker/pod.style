# SimpleShop Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2025-10-01  
**Status:** Draft  
**Project:** SimpleShop - 简单电商系统

---

## Goals and Background Context

### Goals

- 为小型商家提供一个简单、易用的电商平台，让他们能在 30 分钟内建立在线商店
- 实现完整的电商核心功能：商品管理、购物车、订单处理、支付集成
- 提供清晰、流畅的购物体验，提高消费者购买转化率
- 建立可扩展的技术架构，支持未来功能迭代
- 确保系统安全、稳定，保护用户数据和交易安全
- 降低小型商家的技术门槛和运营成本

### Background Context

SimpleShop 旨在解决小型商家在线销售的痛点。当前市场上的电商平台要么成本高昂（如 Shopify），要么技术门槛太高（如自建 WooCommerce），导致许多小商家无法顺利开展线上业务。SimpleShop 通过提供开箱即用的轻量级解决方案，专注于核心电商功能，帮助小商家快速建立专业的在线商店。

该项目采用现代化的技术栈（React + Node.js + PostgreSQL），确保良好的性能和用户体验。通过开源方式发布，商家可以自行部署或选择低成本托管服务，完全掌控自己的数据和业务。

### Change Log

| Date       | Version | Description          | Author     |
|------------|---------|----------------------|------------|
| 2025-10-01 | 1.0     | Initial PRD creation | PM Agent   |

---

## Requirements

### Functional Requirements

**用户认证与管理**

1. **FR1**: 系统必须支持用户注册功能，包括商家和消费者两种角色
2. **FR2**: 系统必须支持用户登录功能，使用邮箱和密码进行身份验证
3. **FR3**: 系统必须支持密码重置功能，通过邮箱发送重置链接
4. **FR4**: 系统必须支持用户个人信息管理（姓名、邮箱、地址等）

**商品管理（商家端）**

5. **FR5**: 商家必须能够创建新商品，包括名称、描述、价格、库存数量
6. **FR6**: 商家必须能够上传商品图片（至少支持 1 张主图）
7. **FR7**: 商家必须能够编辑已有商品的所有信息
8. **FR8**: 商家必须能够删除商品
9. **FR9**: 商家必须能够查看所有自己的商品列表
10. **FR10**: 商家必须能够设置商品的上架/下架状态

**商品展示（消费者端）**

11. **FR11**: 消费者必须能够浏览所有上架商品的列表
12. **FR12**: 消费者必须能够查看商品详情页，包括图片、描述、价格、库存状态
13. **FR13**: 消费者必须能够通过关键词搜索商品
14. **FR14**: 商品列表必须支持分页显示
15. **FR15**: 商品详情页必须显示库存状态（有货/缺货）

**购物车**

16. **FR16**: 消费者必须能够将商品添加到购物车
17. **FR17**: 消费者必须能够在购物车中修改商品数量
18. **FR18**: 消费者必须能够从购物车中删除商品
19. **FR19**: 购物车必须显示商品总价
20. **FR20**: 购物车数据必须在用户登录后持久化保存

**订单管理**

21. **FR21**: 消费者必须能够从购物车创建订单
22. **FR22**: 订单必须包含收货地址信息
23. **FR23**: 消费者必须能够查看自己的订单历史
24. **FR24**: 消费者必须能够查看订单详情和状态
25. **FR25**: 商家必须能够查看所有收到的订单
26. **FR26**: 商家必须能够更新订单状态（待处理、已发货、已完成、已取消）
27. **FR27**: 订单创建时必须自动扣减商品库存

**支付集成**

28. **FR28**: 系统必须集成至少一种支付方式（支付宝沙箱环境）
29. **FR29**: 订单必须在支付成功后才能确认
30. **FR30**: 支付失败时必须保留订单并允许重新支付

**管理后台**

31. **FR31**: 商家必须有专门的管理后台界面
32. **FR32**: 管理后台必须显示订单统计（总订单数、待处理订单数）
33. **FR33**: 管理后台必须提供快速访问商品管理和订单管理的入口

### Non-Functional Requirements

**性能**

1. **NFR1**: 首屏加载时间必须小于 2 秒（在 3G 网络环境下）
2. **NFR2**: API 响应时间必须小于 500ms（P95）
3. **NFR3**: 系统必须支持至少 1000 并发用户

**安全**

4. **NFR4**: 所有 API 通信必须使用 HTTPS
5. **NFR5**: 用户密码必须使用 bcrypt 加密存储
6. **NFR6**: 系统必须防护 SQL 注入攻击
7. **NFR7**: 系统必须防护 XSS 攻击
8. **NFR8**: 系统必须实现 CSRF 保护
9. **NFR9**: 敏感操作必须要求用户认证

**可用性**

10. **NFR10**: 系统正常运行时间必须达到 99.5%
11. **NFR11**: 系统必须提供友好的错误提示信息
12. **NFR12**: 界面必须支持响应式设计，适配桌面和移动设备

**可维护性**

13. **NFR13**: 代码必须使用 TypeScript 编写，确保类型安全
14. **NFR14**: 代码必须遵循 ESLint 规范
15. **NFR15**: 关键功能必须有单元测试覆盖
16. **NFR16**: API 必须有清晰的文档说明

**可扩展性**

17. **NFR17**: 系统架构必须支持未来功能扩展
18. **NFR18**: 数据库设计必须考虑未来数据增长

---

## User Interface Design Goals

### Overall UX Vision

SimpleShop 的用户体验设计遵循"简单至上"的原则。界面应该清晰、直观，让用户无需培训即可上手使用。设计风格采用现代简约风格，使用充足的留白和清晰的视觉层次。所有关键操作应该在 3 次点击内完成。

**消费者端**：提供类似主流电商平台的购物体验，让用户感到熟悉和舒适。重点优化商品浏览、搜索和结账流程。

**商家端**：提供高效的管理界面，让商家能够快速完成日常运营任务（上架商品、处理订单）。使用仪表板展示关键数据，减少信息查找时间。

### Key Interaction Paradigms

- **即时反馈**：所有用户操作必须有即时的视觉反馈（加载状态、成功/失败提示）
- **渐进式披露**：复杂功能通过分步引导，避免一次性展示过多信息
- **容错设计**：重要操作提供确认对话框，支持撤销操作
- **响应式交互**：界面自动适配不同屏幕尺寸，触摸友好
- **键盘导航**：支持键盘快捷键，提高效率用户的操作速度

### Core Screens and Views

**消费者端**
- 首页/商品列表页
- 商品详情页
- 购物车页面
- 结账页面
- 订单确认页面
- 个人中心（订单历史、个人信息）
- 登录/注册页面

**商家端**
- 管理后台首页（仪表板）
- 商品管理列表页
- 商品创建/编辑页面
- 订单管理列表页
- 订单详情页面

### Accessibility

**WCAG AA 级别**

- 所有交互元素必须支持键盘访问
- 颜色对比度必须符合 WCAG AA 标准（至少 4.5:1）
- 所有图片必须有 alt 文本
- 表单必须有清晰的标签和错误提示
- 支持屏幕阅读器

### Branding

- **色彩方案**：采用现代、专业的配色
  - 主色：蓝色系（信任、专业）
  - 辅助色：绿色（成功）、红色（警告/删除）、橙色（待处理）
- **字体**：使用系统默认字体栈，确保跨平台一致性
- **图标**：使用 Heroicons 或 Lucide 图标库，保持视觉一致性
- **风格**：简约、现代、扁平化设计

### Target Device and Platforms

**Web Responsive**

- **桌面端**：1280px 及以上（主要使用场景）
- **平板端**：768px - 1279px
- **移动端**：320px - 767px

**浏览器支持**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**优先级**：桌面端 > 移动端 > 平板端

---

## Technical Assumptions

### Repository Structure

**Monorepo**

使用 Turborepo 管理 monorepo，结构如下：

```
/
├── apps/
│   ├── web/          # Next.js 前端应用
│   └── api/          # Node.js 后端 API
├── packages/
│   ├── shared/       # 共享类型定义
│   ├── ui/           # 共享 UI 组件
│   └── config/       # 共享配置（ESLint, TypeScript）
└── package.json
```

**理由**：Monorepo 便于代码共享、统一依赖管理，适合全栈项目。

### Service Architecture

**前后端分离的单体架构**

- **前端**：Next.js 应用，部署在 Vercel
- **后端**：Express.js API，部署在 Railway/Render
- **数据库**：PostgreSQL（单一数据库实例）
- **缓存**：Redis（会话管理和缓存）

**理由**：
- MVP 阶段用户量不大，单体架构足够
- 前后端分离便于独立开发和部署
- 未来可根据需要拆分为微服务

### Testing Requirements

**完整测试金字塔**

- **单元测试**：使用 Jest + React Testing Library
  - 覆盖核心业务逻辑
  - 覆盖 UI 组件
  - 目标覆盖率：> 70%

- **集成测试**：使用 Supertest
  - 覆盖 API 端点
  - 覆盖数据库交互
  - 目标覆盖率：> 60%

- **E2E 测试**：使用 Playwright
  - 覆盖关键用户流程（注册、购物、下单）
  - 至少 5 个核心场景

**理由**：完整的测试策略确保代码质量，减少回归问题。

### Additional Technical Assumptions and Requests

- **前端框架**：Next.js 14+ (App Router)，使用 TypeScript
- **UI 库**：Tailwind CSS + shadcn/ui 组件库
- **状态管理**：Zustand（轻量级，适合中小型应用）
- **表单处理**：React Hook Form + Zod（类型安全的表单验证）
- **后端框架**：Express.js + TypeScript
- **ORM**：Prisma（类型安全，开发体验好）
- **认证**：JWT + httpOnly cookies
- **图片存储**：Cloudinary（免费额度足够 MVP）
- **邮件服务**：Resend（现代化，开发体验好）
- **支付集成**：支付宝沙箱 API
- **部署**：
  - 前端：Vercel（免费，自动 CI/CD）
  - 后端：Railway 或 Render（免费额度）
  - 数据库：Supabase PostgreSQL（免费额度）
  - Redis：Upstash（免费额度）
- **监控**：Sentry（错误追踪）
- **代码质量**：ESLint + Prettier + Husky（pre-commit hooks）
- **版本控制**：Git + GitHub
- **CI/CD**：GitHub Actions

---

## Epic List

1. **Epic 1: 项目基础设施与用户认证** - 建立项目基础架构、开发环境、CI/CD 流程，并实现用户注册登录功能
2. **Epic 2: 商品管理系统** - 实现商家端的商品 CRUD 功能，包括图片上传和库存管理
3. **Epic 3: 商品展示与搜索** - 实现消费者端的商品浏览、搜索和详情查看功能
4. **Epic 4: 购物车与订单流程** - 实现购物车功能和完整的订单创建、管理流程
5. **Epic 5: 支付集成与订单完成** - 集成支付功能，完成交易闭环

---

## Epic 1: 项目基础设施与用户认证

**Epic Goal**: 建立完整的项目基础设施，包括 monorepo 结构、前后端应用骨架、数据库连接、CI/CD 流程，并实现用户注册、登录、认证功能。这个 Epic 完成后，项目将具备可部署的基础架构和基本的用户管理能力。

### Story 1.1: 项目初始化与 Monorepo 设置

As a **开发者**,
I want **建立 Turborepo monorepo 结构并配置基础工具链**,
so that **团队可以在统一的代码库中高效开发前后端应用**。

**Acceptance Criteria**:

1. 创建 Turborepo monorepo 结构，包含 `apps/web`、`apps/api`、`packages/shared`、`packages/config` 目录
2. 配置 TypeScript，所有包共享统一的 tsconfig 基础配置
3. 配置 ESLint 和 Prettier，确保代码风格一致
4. 配置 Husky 和 lint-staged，实现 pre-commit 代码检查
5. 创建 package.json scripts：`dev`、`build`、`lint`、`test`
6. 添加 README.md，包含项目说明和开发指南
7. 初始化 Git 仓库并创建 .gitignore 文件
8. 项目可以成功运行 `npm run dev` 启动开发环境

### Story 1.2: Next.js 前端应用骨架

As a **开发者**,
I want **创建 Next.js 前端应用的基础结构**,
so that **可以开始开发用户界面**。

**Acceptance Criteria**:

1. 在 `apps/web` 中初始化 Next.js 14+ 应用（App Router）
2. 配置 Tailwind CSS 和 shadcn/ui
3. 创建基础布局组件（Header、Footer、Layout）
4. 创建首页路由 `/` 显示欢迎信息
5. 配置环境变量支持（.env.local）
6. 添加基础的 SEO 配置（metadata）
7. 应用可以在 http://localhost:3000 访问
8. 页面响应式设计，在桌面和移动端正常显示

### Story 1.3: Express.js 后端 API 骨架

As a **开发者**,
I want **创建 Express.js 后端 API 的基础结构**,
so that **可以开始开发 API 端点**。

**Acceptance Criteria**:

1. 在 `apps/api` 中创建 Express.js + TypeScript 应用
2. 配置基础中间件（cors、helmet、morgan、express.json）
3. 创建健康检查端点 `GET /api/health` 返回 `{ status: 'ok' }`
4. 配置环境变量支持（dotenv）
5. 实现统一的错误处理中间件
6. 实现统一的响应格式（success/error）
7. 配置请求日志记录
8. API 可以在 http://localhost:4000 访问
9. 编写健康检查端点的单元测试

### Story 1.4: PostgreSQL 数据库设置与 Prisma 集成

As a **开发者**,
I want **设置 PostgreSQL 数据库并集成 Prisma ORM**,
so that **可以进行类型安全的数据库操作**。

**Acceptance Criteria**:

1. 创建 Prisma schema 文件，定义 User 模型（id、email、password、role、createdAt、updatedAt）
2. 配置 Prisma 连接到 PostgreSQL 数据库
3. 创建数据库迁移脚本
4. 生成 Prisma Client
5. 在 API 中创建数据库连接模块
6. 实现数据库连接健康检查
7. 添加 seed 脚本用于开发环境数据初始化
8. 数据库迁移可以成功执行
9. 可以通过 Prisma Client 查询数据库

### Story 1.5: 用户注册功能

As a **用户**,
I want **通过邮箱和密码注册账号**,
so that **可以使用系统功能**。

**Acceptance Criteria**:

1. 创建 `POST /api/auth/register` 端点
2. 接受 email、password、role（merchant/customer）参数
3. 验证邮箱格式有效性
4. 验证密码强度（至少 8 位，包含字母和数字）
5. 检查邮箱是否已被注册
6. 使用 bcrypt 加密密码（salt rounds: 10）
7. 创建用户记录到数据库
8. 返回成功响应（不包含密码）
9. 实现输入验证错误处理
10. 编写注册端点的集成测试
11. 前端创建注册页面 `/register`
12. 注册表单包含邮箱、密码、确认密码、角色选择
13. 实现表单验证（使用 React Hook Form + Zod）
14. 注册成功后跳转到登录页面

### Story 1.6: 用户登录功能

As a **用户**,
I want **使用邮箱和密码登录系统**,
so that **可以访问我的账号**。

**Acceptance Criteria**:

1. 创建 `POST /api/auth/login` 端点
2. 接受 email、password 参数
3. 验证用户是否存在
4. 验证密码是否正确（使用 bcrypt.compare）
5. 生成 JWT token（包含 userId、email、role）
6. Token 有效期设置为 7 天
7. 返回 token 和用户信息（不包含密码）
8. 实现登录失败错误处理
9. 编写登录端点的集成测试
10. 前端创建登录页面 `/login`
11. 登录表单包含邮箱、密码字段
12. 实现表单验证
13. 登录成功后保存 token 到 localStorage
14. 登录成功后根据角色跳转（商家 -> 管理后台，消费者 -> 首页）

### Story 1.7: 认证中间件与受保护路由

As a **开发者**,
I want **实现 JWT 认证中间件**,
so that **可以保护需要登录的 API 端点**。

**Acceptance Criteria**:

1. 创建认证中间件 `authMiddleware`
2. 从请求头 `Authorization: Bearer <token>` 中提取 token
3. 验证 token 有效性
4. 解析 token 获取用户信息
5. 将用户信息附加到 `req.user`
6. Token 无效或过期时返回 401 错误
7. 创建角色检查中间件 `requireRole(['merchant'])`
8. 创建测试端点 `GET /api/auth/me` 返回当前用户信息
9. 编写认证中间件的单元测试
10. 前端创建 API 客户端，自动在请求头添加 token
11. 实现前端路由守卫，未登录用户访问受保护页面时跳转到登录页
12. 创建用户上下文（React Context）管理登录状态

### Story 1.8: CI/CD 流程设置

As a **开发者**,
I want **设置 GitHub Actions CI/CD 流程**,
so that **代码提交时自动运行测试和部署**。

**Acceptance Criteria**:

1. 创建 `.github/workflows/ci.yml` 工作流
2. CI 流程包含：代码检查（lint）、类型检查、单元测试、集成测试
3. CI 在 PR 和 main 分支推送时触发
4. 创建 `.github/workflows/deploy.yml` 部署流程
5. 配置 Vercel 部署前端应用
6. 配置 Railway/Render 部署后端 API
7. 部署流程仅在 main 分支推送时触发
8. 添加部署状态徽章到 README
9. 所有 CI 检查必须通过才能合并 PR

---

## Epic 2: 商品管理系统

**Epic Goal**: 实现商家端的完整商品管理功能，包括商品的创建、编辑、删除、图片上传和库存管理。商家可以通过管理后台轻松管理自己的商品目录。

### Story 2.1: 商品数据模型与 API 基础

As a **开发者**,
I want **创建商品数据模型和基础 CRUD API**,
so that **可以存储和管理商品数据**。

**Acceptance Criteria**:

1. 在 Prisma schema 中定义 Product 模型（id、merchantId、name、description、price、stock、imageUrl、status、createdAt、updatedAt）
2. 创建数据库迁移
3. 创建 `POST /api/products` 端点（创建商品）
4. 创建 `GET /api/products` 端点（获取商品列表，支持分页）
5. 创建 `GET /api/products/:id` 端点（获取商品详情）
6. 创建 `PUT /api/products/:id` 端点（更新商品）
7. 创建 `DELETE /api/products/:id` 端点（删除商品）
8. 所有端点需要商家认证
9. 商家只能操作自己的商品
10. 实现输入验证（价格 > 0，库存 >= 0）
11. 编写商品 API 的集成测试

### Story 2.2: 图片上传功能

As a **商家**,
I want **上传商品图片**,
so that **消费者可以看到商品的外观**。

**Acceptance Criteria**:

1. 集成 Cloudinary SDK
2. 创建 `POST /api/upload` 端点
3. 接受 multipart/form-data 图片上传
4. 验证文件类型（仅允许 jpg、png、webp）
5. 验证文件大小（最大 5MB）
6. 上传图片到 Cloudinary
7. 返回图片 URL
8. 实现错误处理（上传失败、文件过大等）
9. 编写图片上传的集成测试
10. 前端实现图片上传组件（支持拖拽和点击选择）
11. 显示上传进度
12. 显示图片预览

### Story 2.3: 商品创建页面

As a **商家**,
I want **通过表单创建新商品**,
so that **可以在我的商店中销售商品**。

**Acceptance Criteria**:

1. 创建商品创建页面 `/merchant/products/new`
2. 表单包含字段：商品名称、描述、价格、库存、图片上传
3. 实现表单验证（React Hook Form + Zod）
4. 名称必填，最多 100 字符
5. 描述可选，最多 1000 字符
6. 价格必填，必须 > 0
7. 库存必填，必须 >= 0
8. 图片必填
9. 提交表单调用创建商品 API
10. 创建成功后跳转到商品列表页
11. 显示创建成功提示
12. 实现表单错误提示

### Story 2.4: 商品列表与管理页面

As a **商家**,
I want **查看和管理我的所有商品**,
so that **可以了解商品状态并进行操作**。

**Acceptance Criteria**:

1. 创建商品列表页面 `/merchant/products`
2. 以表格形式显示商品列表
3. 显示字段：图片缩略图、名称、价格、库存、状态、操作按钮
4. 实现分页功能（每页 20 条）
5. 显示商品总数
6. 每个商品有"编辑"和"删除"按钮
7. 删除操作需要确认对话框
8. 删除成功后刷新列表
9. 添加"创建新商品"按钮
10. 库存为 0 时显示"缺货"标识
11. 实现加载状态和空状态

### Story 2.5: 商品编辑功能

As a **商家**,
I want **编辑已有商品的信息**,
so that **可以更新商品详情或修正错误**。

**Acceptance Criteria**:

1. 创建商品编辑页面 `/merchant/products/:id/edit`
2. 页面加载时获取商品详情并填充表单
3. 表单字段与创建页面相同
4. 支持更换商品图片
5. 保留原图片预览
6. 实现表单验证
7. 提交表单调用更新商品 API
8. 更新成功后跳转到商品列表页
9. 显示更新成功提示
10. 处理商品不存在的情况（显示 404）

### Story 2.6: 商品上架/下架功能

As a **商家**,
I want **控制商品的上架和下架状态**,
so that **可以管理商品的可见性**。

**Acceptance Criteria**:

1. 在 Product 模型中添加 status 字段（active/inactive）
2. 创建 `PATCH /api/products/:id/status` 端点
3. 接受 status 参数（active/inactive）
4. 更新商品状态
5. 仅商家可以操作自己的商品
6. 在商品列表页添加状态切换开关
7. 切换状态时调用 API
8. 显示当前状态（已上架/已下架）
9. 下架商品在消费者端不可见
10. 编写状态切换的测试

---

## Epic 3: 商品展示与搜索

**Epic Goal**: 实现消费者端的商品浏览、搜索和详情查看功能，提供流畅的购物体验。消费者可以轻松找到感兴趣的商品并查看详细信息。

### Story 3.1: 商品列表页面（消费者端）

As a **消费者**,
I want **浏览所有上架的商品**,
so that **可以发现感兴趣的商品**。

**Acceptance Criteria**:

1. 创建商品列表页面 `/products`
2. 调用 `GET /api/products?status=active` 获取上架商品
3. 以网格布局显示商品卡片（桌面端 4 列，移动端 2 列）
4. 商品卡片显示：图片、名称、价格、库存状态
5. 实现分页功能（每页 20 条）
6. 显示商品总数
7. 点击商品卡片跳转到商品详情页
8. 实现加载状态（骨架屏）
9. 实现空状态（暂无商品）
10. 缺货商品显示"缺货"标签
11. 页面响应式设计

### Story 3.2: 商品搜索功能

As a **消费者**,
I want **通过关键词搜索商品**,
so that **可以快速找到我需要的商品**。

**Acceptance Criteria**:

1. 在 `GET /api/products` 端点添加 `search` 查询参数
2. 搜索商品名称和描述字段（不区分大小写）
3. 返回匹配的商品列表
4. 在商品列表页添加搜索框
5. 搜索框位于页面顶部
6. 输入关键词后自动搜索（防抖 500ms）
7. 显示搜索结果数量
8. 搜索无结果时显示提示信息
9. 清空搜索框恢复显示所有商品
10. 搜索状态保留在 URL 查询参数中
11. 编写搜索功能的测试

### Story 3.3: 商品详情页面

As a **消费者**,
I want **查看商品的详细信息**,
so that **可以了解商品并决定是否购买**。

**Acceptance Criteria**:

1. 创建商品详情页面 `/products/:id`
2. 调用 `GET /api/products/:id` 获取商品详情
3. 显示商品大图（可点击放大）
4. 显示商品名称、价格、描述
5. 显示库存状态（有货/缺货）
6. 显示"加入购物车"按钮
7. 缺货时禁用"加入购物车"按钮
8. 实现数量选择器（默认 1，最大为库存数量）
9. 处理商品不存在的情况（显示 404）
10. 实现加载状态
11. 页面响应式设计
12. 添加面包屑导航（首页 > 商品列表 > 商品名称）

### Story 3.4: 商品排序功能

As a **消费者**,
I want **按不同方式排序商品**,
so that **可以更容易找到合适的商品**。

**Acceptance Criteria**:

1. 在 `GET /api/products` 端点添加 `sortBy` 和 `order` 参数
2. 支持排序选项：最新上架、价格从低到高、价格从高到低
3. 在商品列表页添加排序下拉菜单
4. 选择排序方式后自动刷新列表
5. 排序状态保留在 URL 查询参数中
6. 默认排序为最新上架
7. 编写排序功能的测试

---

## Epic 4: 购物车与订单流程

**Epic Goal**: 实现完整的购物车和订单管理功能，让消费者可以添加商品到购物车、创建订单，商家可以管理订单。

### Story 4.1: 购物车数据模型与 API

As a **开发者**,
I want **创建购物车数据模型和 API**,
so that **可以存储和管理用户的购物车数据**。

**Acceptance Criteria**:

1. 在 Prisma schema 中定义 CartItem 模型（id、userId、productId、quantity、createdAt、updatedAt）
2. 创建数据库迁移
3. 创建 `POST /api/cart` 端点（添加商品到购物车）
4. 创建 `GET /api/cart` 端点（获取购物车内容）
5. 创建 `PUT /api/cart/:id` 端点（更新购物车商品数量）
6. 创建 `DELETE /api/cart/:id` 端点（从购物车删除商品）
7. 创建 `DELETE /api/cart` 端点（清空购物车）
8. 所有端点需要用户认证
9. 添加商品时检查库存是否充足
10. 同一商品多次添加时累加数量
11. 编写购物车 API 的集成测试

### Story 4.2: 购物车页面

As a **消费者**,
I want **查看和管理我的购物车**,
so that **可以调整购买的商品和数量**。

**Acceptance Criteria**:

1. 创建购物车页面 `/cart`
2. 显示购物车中的所有商品
3. 每个商品显示：图片、名称、价格、数量选择器、小计、删除按钮
4. 实现数量修改功能（最小 1，最大为库存数量）
5. 修改数量时自动更新小计和总价
6. 实现删除商品功能（需要确认）
7. 显示购物车总价
8. 添加"继续购物"按钮（返回商品列表）
9. 添加"去结算"按钮（跳转到结算页面）
10. 购物车为空时显示空状态和"去购物"按钮
11. 实现加载状态
12. 页面响应式设计

### Story 4.3: 购物车图标与数量提示

As a **消费者**,
I want **在导航栏看到购物车图标和商品数量**,
so that **可以随时了解购物车状态并快速访问**。

**Acceptance Criteria**:

1. 在导航栏添加购物车图标
2. 图标上显示购物车商品总数量徽章
3. 点击图标跳转到购物车页面
4. 添加商品到购物车后自动更新数量
5. 数量为 0 时不显示徽章
6. 实现购物车状态管理（Zustand）
7. 页面加载时获取购物车数量

### Story 4.4: 订单数据模型与创建 API

As a **开发者**,
I want **创建订单数据模型和创建订单 API**,
so that **可以存储和管理订单数据**。

**Acceptance Criteria**:

1. 在 Prisma schema 中定义 Order 模型（id、userId、totalAmount、status、shippingAddress、createdAt、updatedAt）
2. 在 Prisma schema 中定义 OrderItem 模型（id、orderId、productId、quantity、price、createdAt）
3. 创建数据库迁移
4. 创建 `POST /api/orders` 端点（从购物车创建订单）
5. 接受 shippingAddress 参数（姓名、电话、地址）
6. 验证购物车不为空
7. 验证所有商品库存充足
8. 创建订单记录和订单项记录
9. 扣减商品库存
10. 清空购物车
11. 返回订单详情
12. 实现事务处理（确保数据一致性）
13. 编写创建订单的集成测试

### Story 4.5: 结算页面

As a **消费者**,
I want **填写收货地址并创建订单**,
so that **可以完成购买**。

**Acceptance Criteria**:

1. 创建结算页面 `/checkout`
2. 显示购物车商品摘要（商品列表、总价）
3. 显示收货地址表单（姓名、电话、详细地址）
4. 实现表单验证（所有字段必填）
5. 电话号码格式验证
6. 添加"提交订单"按钮
7. 提交订单调用创建订单 API
8. 订单创建成功后跳转到订单确认页面
9. 显示创建订单的加载状态
10. 处理库存不足等错误情况
11. 页面响应式设计

### Story 4.6: 订单确认与详情页面

As a **消费者**,
I want **查看订单确认信息和订单详情**,
so that **可以确认订单已成功创建**。

**Acceptance Criteria**:

1. 创建订单确认页面 `/orders/:id/confirmation`
2. 显示订单号、创建时间
3. 显示订单状态
4. 显示商品列表（图片、名称、数量、价格）
5. 显示订单总价
6. 显示收货地址
7. 添加"继续购物"按钮
8. 添加"查看订单详情"按钮
9. 创建订单详情页面 `/orders/:id`
10. 订单详情页面显示相同信息
11. 添加"去支付"按钮（如果订单未支付）
12. 处理订单不存在的情况

### Story 4.7: 订单历史列表（消费者端）

As a **消费者**,
I want **查看我的所有订单历史**,
so that **可以追踪我的购买记录**。

**Acceptance Criteria**:

1. 创建 `GET /api/orders` 端点（获取当前用户的订单列表）
2. 支持分页
3. 按创建时间倒序排列
4. 创建订单历史页面 `/orders`
5. 显示订单列表（订单号、创建时间、总价、状态）
6. 点击订单跳转到订单详情页
7. 实现订单状态标签（待支付、待发货、已发货、已完成、已取消）
8. 实现分页功能
9. 实现加载状态和空状态
10. 页面响应式设计

### Story 4.8: 订单管理（商家端）

As a **商家**,
I want **查看和管理收到的订单**,
so that **可以处理订单并发货**。

**Acceptance Criteria**:

1. 创建 `GET /api/merchant/orders` 端点（获取商家的所有订单）
2. 仅返回包含该商家商品的订单
3. 支持按状态筛选
4. 创建商家订单列表页面 `/merchant/orders`
5. 显示订单列表（订单号、客户、创建时间、总价、状态）
6. 实现状态筛选（全部、待处理、已发货、已完成）
7. 点击订单查看详情
8. 创建商家订单详情页面 `/merchant/orders/:id`
9. 显示订单完整信息（商品、收货地址、状态）
10. 添加"更新状态"按钮
11. 创建 `PATCH /api/orders/:id/status` 端点
12. 商家可以更新订单状态（待处理 -> 已发货 -> 已完成）
13. 实现状态更新功能
14. 编写订单管理的测试

---

## Epic 5: 支付集成与订单完成

**Epic Goal**: 集成支付宝沙箱支付功能，完成交易闭环，让消费者可以在线支付订单。

### Story 5.1: 支付宝 SDK 集成与配置

As a **开发者**,
I want **集成支付宝 SDK 并配置沙箱环境**,
so that **可以处理支付请求**。

**Acceptance Criteria**:

1. 安装支付宝 Node.js SDK
2. 配置支付宝沙箱应用信息（APPID、私钥、公钥）
3. 创建支付服务模块
4. 实现生成支付 URL 的方法
5. 实现验证支付回调签名的方法
6. 添加支付配置到环境变量
7. 编写支付服务的单元测试

### Story 5.2: 创建支付订单

As a **消费者**,
I want **为订单发起支付**,
so that **可以完成购买**。

**Acceptance Criteria**:

1. 创建 `POST /api/payments/create` 端点
2. 接受 orderId 参数
3. 验证订单存在且属于当前用户
4. 验证订单状态为待支付
5. 调用支付宝 API 创建支付订单
6. 返回支付 URL
7. 在订单详情页添加"去支付"按钮
8. 点击按钮调用创建支付 API
9. 跳转到支付宝支付页面
10. 实现错误处理
11. 编写支付创建的集成测试

### Story 5.3: 支付回调处理

As a **系统**,
I want **处理支付宝的支付回调**,
so that **可以更新订单支付状态**。

**Acceptance Criteria**:

1. 创建 `POST /api/payments/callback` 端点（支付宝异步通知）
2. 验证回调签名
3. 解析支付结果
4. 更新订单状态为已支付
5. 记录支付信息（交易号、支付时间）
6. 返回 success 给支付宝
7. 创建 `GET /api/payments/return` 端点（支付宝同步返回）
8. 显示支付成功页面
9. 提供"查看订单"链接
10. 处理支付失败情况
11. 编写支付回调的测试

### Story 5.4: 支付状态查询

As a **消费者**,
I want **查询订单的支付状态**,
so that **可以确认支付是否成功**。

**Acceptance Criteria**:

1. 创建 `GET /api/payments/status/:orderId` 端点
2. 调用支付宝查询接口获取支付状态
3. 返回支付状态（未支付、已支付、支付失败）
4. 在订单详情页显示支付状态
5. 支付成功后隐藏"去支付"按钮
6. 实现轮询支付状态（每 3 秒查询一次，最多 10 次）
7. 编写支付状态查询的测试

### Story 5.5: 商家管理后台首页

As a **商家**,
I want **查看业务数据概览**,
so that **可以了解店铺运营情况**。

**Acceptance Criteria**:

1. 创建商家后台首页 `/merchant/dashboard`
2. 显示关键指标卡片：
   - 总订单数
   - 待处理订单数
   - 总商品数
   - 总销售额
3. 创建 `GET /api/merchant/stats` 端点返回统计数据
4. 显示最近订单列表（最新 10 条）
5. 添加快捷操作链接（商品管理、订单管理）
6. 实现加载状态
7. 页面响应式设计

---

## Next Steps

### Architect Prompt

请作为架构师，基于本 PRD 创建详细的系统架构文档。文档应包括：

1. 系统架构图（前端、后端、数据库、第三方服务）
2. 数据库 Schema 设计（完整的 Prisma schema）
3. API 端点规范（详细的 RESTful API 设计）
4. 前端路由结构
5. 状态管理方案
6. 安全架构（认证、授权、数据保护）
7. 部署架构
8. 技术栈详细说明
9. 代码组织结构
10. 开发规范和最佳实践

请使用 `/architect` 命令并参考本 PRD 开始创建架构文档。

---

**文档结束**

