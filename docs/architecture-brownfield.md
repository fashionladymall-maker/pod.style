# Pod.Style 现有系统架构文档（Brownfield 实况）

## 引言
- Pod.Style 的愿景是让任何拥有创意的人都能快速生成图案、将创意印制到商品上，并通过分享与裂变获得收益。
- 本文档面向 AI 开发代理，记录当前代码库的真实实现状态，供后续的全面重构、故事拆解与质量治理使用。

## 文档范围
- 覆盖 `src`、`functions`、`dataconnect`、Firebase 配置以及已有文档目录下所有与运行时相关的实现。
- 聚焦现状：页面结构、业务流程、AI 生成链路、数据模型、后台任务、安全约束与技术债务。
- 不重复 PRD/目标架构内容；本文的目标是描述“现在的系统如何运转”。

## 变更记录
- 2025-01-12：首版现状文档，基于仓库最新代码生成，保留旧版重构提案供参考。

## 系统概览
### 产品定位
- 多语言（中英夹杂）的创意电商平台，主打 AI 图案生成 + 商品个性化定制。
- 核心价值：创意生成 → 商品预览 → 极速下单 → 社交传播 → 创作者收益回流。

### 核心用户旅程
1. 首页查看热门/趋势/个人创作，触发灵感或复刻他人作品（`src/components/screens/home-screen.tsx:1`）。
2. 录音或输入提示词，选择艺术风格，调用 AI 生成图案（`src/app/app-client.tsx:1`）。
3. 生成商品 Mockup，浏览模型视图、喜欢/收藏/评论/分享（`src/components/screens/viewer-screen.tsx:1`）。
4. 加入购物车并填写配送/支付信息，创建订单（`src/components/screens/confirmation-screen.tsx` 及服务端动作）。
5. 在个人页管理创作、订单与公开可见性（`src/components/screens/profile-screen.tsx:1`）。

## 技术栈与运行平台
- 前端：Next.js 15 App Router + React 18 + TypeScript + Tailwind + Radix UI + Lucide 图标（`package.json:1`）。
- AI：Genkit + Google Gemini 2.5 Flash / image-preview 模型（`src/ai/genkit.ts:1`）。
- 后端：Firebase Authentication、Cloud Firestore、Firebase Storage、Cloud Functions（`firebase.json:1`）。
- 任务编排：Firebase 定时 Cloud Functions（`functions/index.js:1`）。
- 托管：Firebase App Hosting（`apphosting.yaml:1`）。
- 数据连接：预置 Firebase Data Connect 配置但尚未接入业务（`dataconnect/dataconnect.yaml:1`）。

## 仓库结构快照
- `src/app`：App Router 页面（RSC + Client Components）、全局布局与样式。
- `src/components`：UI 组件、业务屏幕与侧边栏抽屉。
- `src/features`：按业务域拆分的 server actions、service、repository、model。
- `src/ai`：Genkit flow 定义，承载图案生成、Mockup、Prompt 摘要等能力。
- `src/context`：React Context（主要是 Auth）。
- `src/server`：跨特性 server action 聚合与 Firebase Admin 封装。
- `src/utils`/`src/hooks`：通用工具与自定义 Hook。
- `functions`：Firebase Functions（Node 写法，但配置成 Python 运行时，需关注）。
- `dataconnect`：Data Connect schema/示例，当前未被应用逻辑引用。
- `docs`：既有 PRD/目标架构文档与 Story。

## 核心模块
### App Router 与页面层
- `src/app/page.tsx:1`：RSC 主页，预拉取公共与趋势作品，通过 `AuthProvider` 包裹客户端应用。
- `src/app/app-client.tsx:1`：单体式客户端容器，集成导航、AI 生成、下单、互动、个人页逻辑；内部状态复杂，是未来拆分重点。
- `src/app/layout.tsx:1`：全局元数据（多语言 SEO）、字体、`Toaster` 与页面骨架。
- `src/app/admin/page.tsx:1`：占位管理后台，仅渲染静态卡片。

### 客户端交互与状态管理
- `AuthProvider`（`src/context/auth-context.tsx:1`）负责匿名登录、邮箱登录、账号升级，并在登录后执行匿名数据迁移 server action。
- 自定义 Toast（`src/hooks/use-toast.ts:1`）限制一次仅展示一个通知，部分状态持久化在全局内存。
- `AppClient` 内置语音识别、风格选择、加载提示、订单信息、Viewer 状态、Feed 缓存等，且大量业务逻辑直接写在组件内部，缺少拆分。

### 服务端动作与业务逻辑
- 统一导出入口 `src/server/actions/index.ts:1`。
- 创意/互动：`src/features/creations/server/actions.ts:1` 封装生成、Fork、点赞、收藏、评论、互动日志等 server actions。
- 用户模型：`src/features/user-models/server/actions.ts:1`（确保个性化模型存在、更新设置）。
- 订单：`src/features/orders/server/actions.ts:1` 负责下单与查询；支付网关暂为 Mock。
- 认证：`src/features/auth/server/actions.ts:1` 进行匿名数据迁移。
- 所有 actions 都依赖 `ensureFirestore` 检查 Admin SDK 配置（`src/server/firebase/admin.ts:1`）。

### AI 生成管线
- T 恤图案：`src/ai/flows/generate-t-shirt-pattern-with-style.ts:1` 使用 Gemini image-preview 生成，并强调“禁止文本”“可选灵感图”。
- Mockup：`src/ai/flows/generate-model-mockup.ts:1` 将图案贴合到指定品类，返回 Data URI。
- Prompt 摘要：`src/ai/flows/summarize-prompt.ts:1` 输出四字总结，用于作品标签。
- 其他 Flow (`generate-t-shirt-pattern.ts:1`, `incorporate-inspiration-image.ts:1`, `modify-model-appearance.ts`) 目前在业务中未直接调用，属于备用能力。
- Flow 由 `src/ai/genkit.ts:1` 初始化的 Genkit 实例运行，默认模型为 `googleai/gemini-2.5-flash`。

### 数据访问与存储
- Firestore 操作集中在 repository 层：
  - 创作：`src/features/creations/server/creation-repository.ts:1` + `creation-model.ts:1`（含 Schema、`toCreation` 转换、`nowTimestamp`）。
  - 订单：`src/features/orders/server/order-repository.ts:1` + `order-model.ts:1`（校验支付摘要、状态历史）。
  - 用户个性化模型：`src/features/user-models/server/user-model-repository.ts:1` + `user-model-model.ts:1`。
- `src/features/creations/server/creation-service.ts:1` 作为业务聚合层，完成 AI 调用、文件上传、互动指标更新、模型可见性控制等。
- Firebase Admin 初始化位于 `src/lib/firebase-admin.ts:1`，支持 Service Account / ADC / Emulator 自动检测，构建 Storage/Firestore 单例。
- 前端 Firebase SDK 初始化位于 `src/lib/firebase.ts:1`，含 App Check、Auth 多种持久化策略。

### 社交与创意互动体验
- 首页 Tab（热门/趋势/我的）展示作品，并支持懒加载骨架（`src/components/screens/home-screen.tsx:1`）。
- 评论抽屉（`src/components/sheets/comments-sheet.tsx:1`）使用 Sheet + ScrollArea，支持实时刷新与匿名限制。
- Viewer（`src/components/screens/viewer-screen.tsx:1`）内含拖拽、左右翻页、点赞/收藏/分享/复刻、评论弹层、下单快捷入口。
- 个人页（`src/components/screens/profile-screen.tsx:1`）提供批量选择、删除、公开/私有切换、订单历史查看。

### 订单与支付
- 订单服务（`src/features/orders/server/order-service.ts:1`）在创建订单后写入 Firestore 并调用 `logInteraction` 为作品增加权重。
- 支付信息使用 `buildPaymentSummary` 生成 Mock token（`src/app/app-client.tsx:1`），未对接真实支付网关，属高风险技术债。
- 数据模型 `src/lib/types.ts:1` 将客户端 DTO 与服务端数据混合，包含 `PaymentSummary.gateway` 但目前固定 `mock`。

### 后台任务与定时作业
- `functions/index.js:1` 定义两个 Pub/Sub 定时任务：
  - `processStorageCleanupQueue`：清理 `storage_cleanup_queue` 中的文件，仅处理 50 条/批。
  - `updatePersonalizedFeedCache`：按 engagement 计算热门/趋势缓存写入 `personalized_feed_cache` 集合。
- `firebase.json:1` 将 Functions `runtime` 设置为 `python313`，与 JS 实现不匹配（部署将失败），属阻断性问题。

### 配置与环境依赖
- 环境变量：`src/lib/firebase.ts:1` 需要多个 `NEXT_PUBLIC_FIREBASE_*`、`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`；`src/lib/firebase-admin.ts:1` 需要 `FIREBASE_SERVICE_ACCOUNT` 或 ADC。
- App Check：开发模式自动启用 debug token，生产需提供 reCAPTCHA key。
- Firestore 规则位于 `firestore.rules:1`，对作品/订单/评论的字段进行严格校验，但对匿名写入限制需确认。
- Data Connect (`dataconnect/dataconnect.yaml:1`) 指向 Cloud SQL，但项目尚未引用生成 SDK（`src/dataconnect-generated` 仅为示例）。

## 数据模型
- **creations**：作品文档，含 prompt/style/summary、pattern/model URL、互动指标等（`src/features/creations/server/creation-model.ts:1`）。
- **creations/{id}/comments**：评论子集合，写入时递增 `commentCount`，用于 Viewer & CommentsSheet。
- **orders**：订单记录，包含配送、支付摘要、状态历史（`src/features/orders/server/order-model.ts:1`）。
- **userFineTunedModels**：用户个性化模型文档（`src/features/user-models/server/user-model-model.ts:1`）。
- **personalized_feed_cache**：个性化 Feed 缓存，由定时任务刷新。
- **storage_cleanup_queue**：待清理文件清单，供定时任务扫描。
- **其他集合**：互动日志/Engagement 字段存储在作品文档内部，未拆分独立集合。
- **存储对象**：图案/模型图保存在 Firebase Storage，路径形如 `creations/{userId}/{uuid}`，通过 `uploadDataUriToStorage` 上传并设为公开（`src/features/creations/server/creation-service.ts:1`）。

## 安全与合规现状
- Firestore 规则覆盖字段级校验与计数递增，但：
  - 对匿名用户提交作品/订单的限制需结合 Auth 逻辑验证。
  - 缺乏对订单支付信息的服务端二次校验，且目前允许存储卡号后四位等信息。
- Storage 删除依赖后台任务，无额外访问控制（公开 URL）。
- App Check 在开发模式下自动放行，生产部署需确保 `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` 设置。

## 外部服务与集成
- Google Gemini（图像生成、Mockup、Prompt 摘要）。
- Firebase Authentication（匿名 + 邮箱密码 + 匿名迁移）。
- Firestore / Storage / App Hosting / Cloud Functions。
- 浏览器语音识别（Web Speech API），在部分浏览器环境存在兼容性差异。

## 运行与部署流程
- 本地开发：
  1. 配置 `.env.local`，提供所有 `NEXT_PUBLIC_FIREBASE_*`、`GEMINI_API_KEY` 等变量（`README.md:1` 提示）。
  2. 运行 `npm install`（如需）。
  3. 启动前端：`npm run dev`（Turbopack，端口 9002）。
  4. 启动 Genkit 调试：`npm run genkit:dev` 或 `npm run genkit:watch`。
- 构建与部署：
  - Next.js 构建：`npm run build` → `npm run start`。
  - Firebase 部署需修正 Functions runtime 后使用 `firebase deploy`（`docs/firebase-deploy.md` 提供流程）。

## 测试与质量现状
- 未提供任何自动化测试（单元、集成、端到端均缺失）。
- 质量保障依赖人工测试与 Toast/Console 日志；`src/utils/logger.ts:1` 仅在非生产打印 debug。
- `npm run lint`、`npm run typecheck` 为主要静态检查手段，但未在脚本中强制执行。

## 当前技术债与风险
- 巨型客户端组件 `src/app/app-client.tsx:1`，职责过多、难以测试，易导致回归。
- 支付流程使用 Mock Token，仍在 Firestore 保存卡号末四位等信息，缺乏 PCI 合规（`src/features/orders/server/order-service.ts:1`, `src/lib/types.ts:1`）。
- Cloud Functions runtime 设置为 Python，与实际 Node 代码冲突（`firebase.json:1`）。
- 缺乏错误兜底：server actions 多处直接 `throw new Error`，在前端以 Toast 呈现，需补充可恢复方案。
- AI 调用与文件上传紧耦合，缺少幂等/重试，失败后可能留下孤儿文件（`src/features/creations/server/creation-service.ts:1`）。
- 个性化模型默认自动创建，尚未真正进行微调/训练（`src/features/user-models/server/user-model-service.ts:1`），功能与命名不符。
- Data Connect/Cloud SQL 相关代码未投入使用，需清理或接入，否则增加迁移负担（`dataconnect/dataconnect.yaml:1`）。
- 缺乏日志/监控，无法追踪 AI 失败原因、订单链路、用户行为。

## 关键改造触点（面向全面重构）
1. **体验层拆分**：按场景拆分 `AppClient`，引入状态机或模块化路由，确保 Home / Studio / Checkout / Profile 独立可测。
2. **AI 服务化**：将生成逻辑从 `creation-service` 中抽离，对接专用任务队列，实现异步推送与失败重试。
3. **支付合规**：改造订单流程为 Token 化 + 安全后端处理，前端仅保留 Gateway 引导。
4. **社交闭环**：为喜欢/收藏/评论建立独立集合与缓存，提供推送/通知能力。
5. **内容策展与裂变**：完善分享统计、Fork 机制、创作者收益记账模型。
6. **后台任务治理**：补全 `storage_cleanup_queue` 写入链路，修复 Functions runtime 配置，并增加观测指标。
7. **数据契约**：为 Firestore 模型建立版本化 DTO + Zod 校验，减少隐式转换。
8. **测试体系**：引入最小化单元测试、Server Action 测试与端到端冒烟脚本。

## 调试与常见问题
- Firebase Admin 初始化失败：检查 `FIREBASE_SERVICE_ACCOUNT` JSON 是否可解析（`src/lib/firebase-admin.ts:1`）。
- 浏览器语音识别仅在 Chrome 系列可用；需在 UI 层做能力检测 fallback。
- App Check 未配置 reCAPTCHA Key 时仅能在开发模式使用，生产将报错（`src/lib/firebase.ts:1`）。
- 匿名迁移依赖用户在登录前的匿名 UID，若浏览器阻止第三方 Cookie 可能失败。

## 常用命令
- 开发服务器：`npm run dev`
- Genkit 调试：`npm run genkit:dev`
- 构建生产包：`npm run build`
- 生产服务：`npm run start`
- Lint：`npm run lint`
- 类型检查：`npm run typecheck`
- Bmad 工具：`npm run bmad:refresh` / `npm run bmad:list` / `npm run bmad:validate`

## 后续建议
- 在重构前建立“现状 → 目标”的对照矩阵，逐步替换而非一次性大改。
- 优先解决阻断项（Functions runtime、支付合规、超大组件拆分），为后续故事排期打基础。
- 利用本文档作为 Story/PRD 的引用来源，确保 AI 代理在实现阶段不再反复探索现状。

---

## 附录：先前的重构方案（原文保留）
# Pod.Style Brownfield Enhancement Architecture

## 1. Introduction
This document specifies the technical architecture for rebuilding Pod.Style into a TikTok-like social commerce platform. The goal is to integrate short-form creative discovery, AI-assisted product creation, and seamless commerce while preserving core Firebase infrastructure. It supplements existing Next.js + Firebase architecture by defining new services, data flows, and integration rules needed for the social feed, AI generation, and checkout.

## 2. Current System Assessment
- **Primary Purpose**: Print-on-demand storefront built with Next.js 15, Firebase Hosting, App Router, Tailwind UI, and Firebase functions.
- **Tech Stack**: Next.js (App Router), React 18, TypeScript, Firebase Authentication, Firestore, Firebase Storage, Cloud Functions (Node), minimal Genkit integrations.
- **Architecture Style**: Monolithic Next.js app with server components and API routes backed by Firebase services.
- **Deployment**: Firebase App Hosting + Cloud Functions deployments via Firebase CLI; CI/CD manual.
- **Constraints**:
  - Firestore as primary database (limited aggregation, transaction constraints).
  - Node runtimes must align with Firebase supported versions.
  - Existing auth + user data stored in Firebase; must migrate without breaking sessions.
  - Limited CDN optimization for rich media; need dedicated media pipeline.
  - Current UI not optimized for infinite-scroll or high-frequency content updates.

## 3. Enhancement Scope & Integration Strategy
- **Enhancement Type**: Full rebuild into social commerce platform.
- **Scope**: Replace legacy storefront with feed-driven experience, AI creation pipeline, social graph, checkout tied to user-generated products.
- **Integration Approach**:
  - Retain Firebase Auth, Firestore, Storage; introduce new collections for feed, creation artifacts, social graph, orders.
  - Introduce dedicated media processing + CDN layer (Cloudflare Images/Stream) for feed assets.
  - Add AI Service abstraction layer for nanobanana + Gemini calls via Cloud Functions (Genkit pipelines) to standardize prompt/response formats.
  - Use App Router server actions for low-latency interactions; heavy processing delegated to Cloud Functions/Cloud Run.
  - Leverage Firestore event-driven Cloud Functions to sync orders with fulfillment/analytics systems.

## 4. Target Architecture Overview
```
[Next.js 15 App Router]
  ↓ (GraphQL/REST API via server actions & route handlers)
[API Gateway Layer]
  ↘ Firestore (content, social graph, orders)
  ↘ Firebase Storage / Cloudflare R2 (raw uploads)
  ↘ Cloud Functions / Cloud Run (AI pipelines, moderation, checkout)
  ↘ External Services (nanobanana, Gemini, Stripe, PayPal, Klarna, Tabby, ShipBob/EasyPost)
```
Key components:
- **Experience Layer**: Next.js app with separate bundles for Home Feed, Creation Studio, Product Detail, Checkout, Profile, Admin.
- **Service Layer**: Route handlers exposing JSON APIs, orchestrating Firestore queries, caching, personalization.
- **AI Pipeline**: Genkit-based orchestrators wrapping nanobanana & Gemini, generating mockups & copy, persisting outputs + metadata.
- **Social Graph Engine**: Firestore-based follower/following edges with cached denormalized counts.
- **Moderation Layer**: Cloud Functions invoking AI content filters + human review queue stored in Firestore.
- **Commerce Layer**: Unified order service handling cart, pricing, inventory, payments, shipping integrations.
- **Analytics/Data**: BigQuery export from Firestore + event instrumentation (GA4 + custom events) feeding admin dashboards.

## 5. Component Design
### 5.1 Frontend Applications
- **Home Feed**: Client-side infinite scroll, server-side hydration with personalization token. Prefetch creation detail & mockup previews.
- **Creation Studio**: Multi-step wizard; handles asset uploads (direct to Storage signed URLs) and triggers AI generation.
- **Social Interactions**: WebSocket/RTDB channel or SSE for live engagement counts; optimistic UI updates.
- **Checkout**: Reusable commerce SDK encapsulating payment providers, address collection, shipping selection.
- **Admin Console**: Protected routes with feature flags; displays moderation queues, dashboards.

### 5.2 Backend Services
- **Feed Service**: Cloud Function triggered by creation publish events to build feed documents, rank features (region, trend score). API endpoint `/api/feed` supports cursor-based pagination & filters.
- **Creation Service**: Accepts creation requests, stores prompt, triggers AI pipeline, maintains generation jobs; returns job updates via WebSocket or poll.
- **Orders Service**: Handles cart persistence, calculates pricing, communicates with payment SDKs (Stripe/PayPal/regional), emits events to fulfillment queue.
- **Notification Service**: Processes follow/comment/order events, schedules push/email notifications, writes to notification inbox.
- **Moderation Service**: Auto-scan via third-party APIs (e.g., Hive, AWS Rekognition, Google Content Safety). Human queue stored in `moderation_tasks` collection; admin actions propagate status.

### 5.3 Data Model (Firestore Collections)
- `users_v2`: profile, locale, roles, preference flags.
- `creations`: creation metadata, creatorId, captions, AI prompt, product template link, moderation status.
- `creation_assets`: per variant asset data (url, type, generation metadata, product attributes).
- `feed_entries`: denormalized feed docs per region/locale with ranking signals.
- `social_edges`: docs representing follow relationships, plus aggregated counters.
- `engagement_events`: like/comment/remix events (optionally stored in BigQuery via streaming).
- `products`: product template with SKU options, price matrix, fulfillment mapping.
- `carts`: session-based cart states referencing creation variants + product config.
- `orders`: order header, payment tokens, fulfillment status, tracking IDs.
- `notifications`: user inbox items.
- `moderation_flags`: flagged content + reviewer status.
- `admin_metrics`: cached aggregates for dashboards.

### 5.4 External Integrations
- **AI**: Cloud Functions using Genkit to call nanobanana (creative ideation) & Gemini (rapid rendering + copy). Results stored in GCS/S3-compatible store.
- **Payments**: Stripe as primary; integrate PayPal, Klarna, Tabby using separate adapters behind PaymentService interface.
- **Shipping**: Use EasyPost/ShipBob aggregator. Order service posts shipments; webhooks update Firestore & notify users.
- **CDN/Media**: Upload to Firebase Storage, replicate to Cloudflare R2/Images for fast delivery. Video loops encoded via Stream service.

## 6. Workflows
1. **Creation Publish**: User composes → uploads assets → AI pipeline generates variants → user selects → creation saved → moderation pre-check → feed entry created → notifications triggered.
2. **Remix/Recreate**: Viewer selects remix → pre-populate prompt → new creation pipeline reuses original product template, inherits attribution metadata.
3. **Checkout**: Cart service builds line items → PaymentService collects payment → Order saved → shipping request queued → confirmation notifications.
4. **Moderation**: Automated scan on publish; if flagged, queue for admin; admin action updates status & notifies creator; banned assets removed from feed/CDN.
5. **Analytics Export**: Nightly export of Firestore collections to BigQuery; real-time events pushed via Cloud Functions to Pub/Sub for near-real-time dashboards.

## 7. Security & Compliance
- **Auth**: Firebase Auth (email/password, OAuth, phone). Mandatory auth for creation & purchase; guest checkout collects email + minimal data, then prompts account creation.
- **Authorization**: Firestore security rules + custom claims for roles (creator, moderator, admin). Backend services enforce ownership checks.
- **PII & Payments**: Payments handled via provider tokens; no card storage. Orders store minimal necessary data.
- **Content Safety**: Moderation service + Takedown workflow. Logs actions for compliance.
- **Privacy**: GDPR/CCPA compliance — Implement data export/delete pipeline and cookie/banner for tracking.

## 8. Performance & Scalability
- Use edge caching for feed endpoints (Cache-Control + SWR) while respecting personalization.
- Store feed entries denormalized by region to minimize query cost.
- Offload heavy AI generation to async jobs; front-end polls job status; show low-res placeholders instantly.
- Adopt Cloud Run for CPU-intensive tasks if Cloud Functions quotas insufficient.
- Use Firestore composite indexes for feed filters, top creators, trending hashtags.

## 9. Observability
- Instrument Next.js with OpenTelemetry, logging to Cloud Logging.
- Metrics dashboards: response time, AI latency, order conversion, moderation backlog.
- Alerting on payment errors, AI pipeline failures, feed latency spikes.

## 10. Migration & Rollout Strategy
- Build new experience on separate route (`/beta`) while legacy remains accessible.
- Migrate user data to new collections with migration scripts (Cloud Functions).
- Soft launch to limited cohorts per region; use feature flags for social interactions & payments.
- Monitor KPIs, then cut over root domain; keep rollback path via Firebase Hosting rewrites.

## 11. Open Technical Questions
- Final selection of CDN/video hosting provider?
- Decision on real-time infrastructure (Firestore listeners vs. WebSockets via Cloud Run)?
- Content delivery localization strategy for large media (region-specific buckets)?
- Policy for creator revenue share and payout integration?

## 12. Handoffs
### 12.1 Story Manager Prompt
"Use docs/prd-brownfield.md and docs/architecture-brownfield.md to break the rebuild into epics and detailed stories. Respect Firestore-based architecture, AI pipeline abstractions, and phased rollout. Start with feed + creation MVP, then commerce, social, moderation. Ensure stories track integration points (AI services, payments, logistics)."

### 12.2 Developer Prompt
"Reference docs/prd-brownfield.md and docs/architecture-brownfield.md. Follow Next.js App Router patterns, Firestore data models listed, and Cloud Functions wrappers for AI/payments. Implement features in MVP order (feed → creation → checkout → social → moderation), adding tests and respecting Firestore security rules. Coordinate with moderation & analytics requirements during implementation."

