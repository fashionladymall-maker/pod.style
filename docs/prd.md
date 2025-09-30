# Pod.Style Brownfield Enhancement PRD

## 0. Intro Project Analysis and Context
### 0.1 Existing Project Overview
- **Analysis Source**: Document-project output available at `docs/architecture-brownfield.md`
- **Current Project State**:
  - Pod.Style 目前基于 Next.js 15 App Router + Firebase（Auth、Firestore、Storage、Cloud Functions），提供 AI 图案生成与个性化商品定制（docs/architecture-brownfield.md:15）
  - 代码库按业务域拆分：`src/features` 承载 server actions/service/repository，`src/ai` 管理 Genkit 流程，`src/app/app-client.tsx` 集成浏览、生成、下单、社交等客户端逻辑（docs/architecture-brownfield.md:19）
  - AI 管线依赖 Gemini 2.5 image-preview，生成素材上传 Firebase Storage；创作与互动数据记录在 Firestore `creations` 集合及其子文档（docs/architecture-brownfield.md:43）
  - 后台存在 Pub/Sub 定时任务负责存储清理与个性化 Feed 缓存；部署通过 Firebase App Hosting，但当前 Functions runtime 配置与代码不符，属于阻断项（docs/architecture-brownfield.md:75）

### 0.2 Available Documentation Analysis
- ✅ Tech Stack Documentation（document-project 输出）
- ✅ Source Tree / Architecture
- ✅ Coding Standards（部分覆盖）
- ✅ API Documentation
- ✅ External API Documentation
- ⬜️ UX/UI Guidelines（需在本 PRD 中补充）
- ✅ Technical Debt Documentation
- ✅ Other: `docs/prd-brownfield.md`（既有目标方案）
- 说明：本 PRD 直接复用 `docs/architecture-brownfield.md` 作为技术现状依据，避免重复分析

### 0.3 Enhancement Scope Definition
- **Enhancement Type**（复选）: ✅ 新功能新增 / ✅ 重大功能改造 / ✅ 新系统集成 / ✅ UI/UX 重做 / ✅ 技术栈升级
- **Enhancement Description**:
  - 将 Pod.Style 从单一 AI 创作/下单体验升级为完整的社交电商平台，打造“灵感 → 生成 → 购买 → 分享/再创作 → 收益”闭环
  - 整合短视频式 feed、社交互动、创作裂变、创作者收益、运营后台等能力，实现多地区增长
  - 重构后端服务层，支持 AI 管线、支付、物流、内容安全等能力扩展
- **Impact Assessment**: ✅ Significant Impact（大量既有代码改动） / ✅ Major Impact（需要架构级调整）

### 0.4 Goals and Background Context
- **Goals**:
  - 建立沉浸式创意 feed，让访客在 5 秒内开始浏览并持续互动
  - 支持创作者在单个会话内完成 AI 生成 → 商品配置 → 发布
  - 实现一键下单与多渠道支付，保障 ≥95% 的订单成功率
  - 构建社交互动与裂变机制，促进创作者与消费者双向增长
  - 提供审核、履约、数据分析能力，支撑全球扩张运营
- **Background**:
  - 现有应用缺乏吸引用户停留的内容形态，交互以静态页面为主，难与抖音/小红书等平台竞争，需要重构为短视频式体验
  - 技术层面存在巨型客户端组件、AI 流程耦合、支付 mock、缺乏监控等技术债；此次改造将拆分前端模块、服务化 AI、接入真实支付与物流，并补齐内容安全与观测能力

### 0.5 Change Log
| Change | Date | Version | Description | Author |
| --- | --- | --- | --- | --- |
| 初始草稿 | 2025-01-12 | v0.1 | 建立 brownfield PRD，记录现状及改造方向 | John (pm) |

## 1. Vision & Summary
Rebuild Pod.Style into a TikTok-like social commerce platform where users rapidly turn creative ideas into purchasable products. Users can browse an infinite feed of community creations, generate AI-powered product mockups (via nanobanana + Gemini), and check out in one tap. The experience must feel familiar to short-form content platforms while retaining ecommerce reliability.

## 2. Goals & KPIs
- Launch an MVP within 1–4 weeks that supports anonymous browsing, creative generation, and checkout.
- Track and improve:
  - Daily active users (DAU) across US/EU/Middle East cohorts
  - Average session duration & scroll depth (content engagement)
  - Number of AI-generated creations per user
  - Conversion to cart & purchase (overall + per cohort)
  - Gross merchandise value (GMV) and repeat purchase rate
  - Content safety signals (flag rate, manual moderation load)

## 3. Target Users & Personas
- **Guest Browsers**: Anonymous visitors exploring trending creations, can favorite/share but must sign up to create or purchase.
- **Registered Creators**: Authenticated users who publish creations, interact socially, generate mockups, and place orders.
- **Influencers/Brands**: Verified accounts with advanced analytics, bulk upload, collaboration tools.
- **Moderators/Admins**: Internal staff managing content safety, fulfillment, and dashboards.

## 4. Key User Journeys
1. **Inspiration Scroll (Guest)**  
   Land on localized home feed → infinite scroll of short-form creative cards (auto-play video or animated image stack) → view details, engagement stats → optional share → prompt to sign up when attempting to interact beyond browse.
2. **Create & Publish (Creator)**  
   Open creation composer → input text / upload image(s) → select templates/prompts → AI (nanobanana + Gemini) generates multiple mockups → user tweaks options → publish to feed with captions, tags, product metadata.
3. **Generate & Order (Creator/Guest)**  
   From any creation → tap “Recreate” → modify prompt → regenerate mockups → configure product options (size, color, material) → add to cart → one-tap checkout with stored payment (registered) or guest checkout (limited) → order confirmation.
4. **Engage & Socialize**  
   Like, comment, follow creators, remix/duet (derive new creation) → notifications inbox → share externally.
5. **Moderation & Ops (Admin)**  
   Review flagged content (auto + user reports) → approve/ban → view dashboards for content volume, orders, logistics status → manage refunds/returns.

## 5. Functional Scope
### 5.1 Content & Feed
- Infinite personalized feed with region-aware ranking (language, locale).
- Content types: AI-generated static images, GIF/short-loop video previews, multi-image carousels.
- Metadata: captions, hashtags, creator profile, product availability, engagement metrics.
- Interaction: like, comment, follow, share, save, report, remix.
- Search & discovery: keyword, hashtag, creator, trending topics.

### 5.2 Creation Studio
- Prompt composer with voice input (Web Speech) and inspiration upload.
- AI pipeline orchestrated through Genkit flows:
  - Prompt summarization (Chinese idiom/keyword)
  - Pattern generation (Gemini image-preview)
  - Model mockup placement on product templates
- Personalization via user fine-tuned models (auto-initialization).
- Versioning / history for generated assets.
- Manual tweaks: colorways, art style, product selection.
- Auto-caption suggestions and hashtag recommendations.

### 5.3 Social Graph & Engagement
- Creator profiles with portfolio, follower counts, earnings.
- Follow system with feed weighting.
- Notifications inbox (likes, comments, remix, purchases).
- Remix/duet flow to generate derivative creations while attributing original creator.

### 5.4 Commerce & Fulfillment
- Cart and checkout flow with minimal friction.
- Payment integration (Stripe/PayPal first; Klarna/Tabby expansion).
- Shipping options: standard/express; display of estimated dates.
- Order tracking dashboard (creator + buyer).
- Return/refund workflow via admin tools.

### 5.5 Moderation & Compliance
- Automated moderation (safety filters, forbidden content detection).
- User reporting flow with reason selection.
- Admin review panel (queue, decision logging, analytics).
- Terms enforcement: takedowns, user suspension.

## 6. Requirements
### 6.1 Functional Requirements
- **FR1**: 平台必须提供个性化首页 feed，支持匿名访客在 3 秒内看到至少 10 条公共创作，并根据地区/语言与既有作品互动数据排序，同时保留现有 `creations` 文档结构用于回溯旧内容。
- **FR2**: 创作者需在单个会话内完成“提示词 → 多模型生成 → 商品配置 → 发布”，并将生成素材写入新的创作版本历史，不破坏现有作品数据或文件存储路径。
- **FR3**: 订单流程必须接入真实支付网关（Stripe + PayPal），生成的支付 token 通过 Cloud Functions 安全存储并更新 `orders` 集合，保留旧的模拟支付流程作为回退。
- **FR4**: 社交互动（点赞、收藏、评论、关注、分享、复刻）需在现有 Firestore 结构上扩展，确保旧作品互动记录保持可读，并提供去重与速率限制。
- **FR5**: 内容审核与举报流程需在发布环节触发自动审查，并允许运营团队在后台审批，审批结果同步回创作/Feed 缓存，避免未审核内容曝光。
- **FR6**: 平台需支持创作者收益结算的基础数据采集（销量、复刻次数、收益分成），预留后续与结算系统集成接口且不影响现有履约流程。

### 6.2 Non-Functional Requirements
- **NFR1**: 首页 feed 首屏加载 ≤ 2 秒；AI 生成任务排队时间 ≤ 30 秒，超时需提示并允重试。
- **NFR2**: 所有新服务必须沿用 Firebase Auth + Firestore 规则，匿名用户仅能浏览；支付信息仅存 token，不落敏感数据。
- **NFR3**: AI 生成与媒体处理需异步作业化，支持每日 10k+ 请求，并提供幂等/重试，避免孤儿文件。
- **NFR4**: 部署流程需兼容 Firebase Hosting + Cloud Functions，并支持灰度/快速回滚；必要时可扩展至 Cloud Run。
- **NFR5**: 平台需新增统一日志与指标采集（OpenTelemetry + Cloud Logging），覆盖 AI 失败率、支付错误率、审核延迟。

### 6.3 Compatibility Requirements
- **CR1**: 新增 Feed/API 必须保持对现有 `server/actions` 导出的兼容，确保旧页面可读取作品数据。
- **CR2**: Firestore `creations`、`orders`、`userFineTunedModels` 核心 schema 不得破坏；新增字段须为可选并提供迁移方案。
- **CR3**: 新 UI 需沿用现有 Tailwind + Radix 组件体系与品牌视觉（色彩/字体），保证体验连续性。
- **CR4**: 与 Firebase Auth、Storage、Cloud Functions 的集成必须保持既有配置/部署流程；外部服务通过统一配置层注入。

## 7. User Interface Enhancement Goals
### 7.1 Integration with Existing UI
- 复用 Tailwind 设计令牌、Radix 组件、`src/components/ui` 库构建新 Feed 卡片、模态与抽屉，确保视觉统一
- 在 `AppClient` 的客户端路由拆分模块，引入独立 Feed/Studio/Checkout/Profile 子页面，同时复用 `AuthProvider`、Toaster、Sheet/Popover 等基础交互
- 延续现有暗色高对比风格，新动画与手势体验采用渐进增强，避免升级突兀

### 7.2 Modified/New Screens and Views
- 首页 Feed（短视频卡片式浏览）
- 创作工作室（提示输入、AI 生成、模型预览、商品配置）
- 作品详情 / Viewer（评论、复刻、分享增强）
- 购物流程（购物车、配送信息、支付确认）
- 社交通知与消息中心
- 创作者主页与收益控制台
- 后台审核 / 运营面板

### 7.3 UI Consistency Requirements
- 新组件遵循现有命名和 `cn()` 辅助组合方式，集中在 `src/components/ui`
- 动画/过渡使用统一缓动与时长，拖拽/手势提供无动画 fallback
- 文案继续支持中英双语（默认），图标保持 lucide 风格
- 表单/Toast/抽屉等在移动与桌面需一致的布局规范，防止视觉割裂

## 8. Technical Constraints and Integration Requirements
### 8.1 Existing Technology Stack
**Languages**: TypeScript（前端/服务端共享）、JavaScript（部分 Functions legacy）、SQL/GraphQL（Data Connect 预留）  
**Frameworks**: Next.js 15、React 18、TailwindCSS、Radix UI、Genkit  
**Database**: Firestore（主存储）、Firebase Storage（素材）、Data Connect/Cloud SQL（规划中）  
**Infrastructure**: Firebase App Hosting、Firebase Cloud Functions、Firebase Authentication、App Check  
**External Dependencies**: Google Gemini / nanobanana、Firebase Admin SDK、Web Speech API、计划接入的 Stripe/PayPal/物流、Cloudflare R2/Images

### 8.2 Integration Approach
**Database**: 在现有集合上扩展字段/子集合，保持向后兼容；引入批量写和缓存同步；预留导出通道  
**API**: 通过 Server Actions + Route Handlers 暴露；外部服务封装为 Cloud Functions/Run；统一 webhook 入口  
**Frontend**: 拆分路由组，复用基础组件；使用 streaming/suspense；在可行处使用 Edge Runtime  
**Testing**: 建立 Jest/Playwright 基础套件；使用 Firebase Emulator；CI 执行 lint/type/test

### 8.3 Code Organization and Standards
**File Structure**: 继续按领域划分，新增 feed/social/payments 等目录；AI 流程抽象到 `src/ai/pipelines`；客户端使用 `(feed)/(studio)/(shop)` 路由组  
**Naming**: PascalCase 组件、camelCase 函数、kebab-case 文件；Firestore 字段 lowerCamelCase；模块遵循 `*-service.ts`、`*-repository.ts`  
**Coding Standards**: 沿用 ESLint/Prettier；Server Actions 使用 Zod 校验；AI/管线需错误捕获写日志；禁止 Client 使用 Admin SDK  
**Documentation**: 新特性需更新 PRD/架构文档；server actions 及 schema 添加 docstring；UI 组件写 Story/示例

### 8.4 Deployment and Operations
**Build**: `npm run build` 生成 Next.js bundle；Cloud Functions 独立部署；CI（GitHub Actions）执行 lint/type/test + preview  
**Strategy**: Firebase App Hosting 继续使用，增加 rewrite 灰度；先上线 `/beta` 收集反馈后切主站；Cloud Functions/Run 采用版本化发布  
**Monitoring**: OpenTelemetry -> Cloud Logging；Firebase Crashlytics/GA 采集前端事件；关键任务写入 `logger` 并导出 BigQuery  
**Config**: 环境变量管理在 `.env` + Firebase env；敏感密钥放 Secret Manager；使用 Feature Flags 控制上线；文档记录配置依赖

### 8.5 Risk Assessment and Mitigation
**Technical Risks**: 支付网关集成的安全合规；AI 异步化导致孤儿文件；拆分 AppClient 引入回归；Functions runtime 配置错误  
**Integration Risks**: 支付/物流接入失败导致订单阻塞；审核延迟影响正常内容；多地区运营增加时区/汇率复杂度  
**Deployment Risks**: 缺乏灰度导致上线风险；Cloud Functions/Run 配额限制；无自动测试引发回归  
**Mitigation**: 阶段性上线支付并留回退；引入队列+幂等；渐进拆分 + e2e 冒烟测试；修正 runtime 并纳入 CI；实施灰度 + 指标监控 + 回滚脚本

## 9. Out of Scope (for initial MVP)
- Full livestream shopping features.
- Direct creator payout automation (manual exports acceptable initially).
- Native mobile apps (responsive web only).
- In-app messaging system.
- Complex merchandising (bundles, subscriptions, limited drops).

## 10. Requirements Traceability & Further Planning
将依据本 PRD 制定单一大型 Epic，并分解为 Feed → 创作 → Checkout → 社交 → 审核/运营 的 Story 顺序，确保每个阶段验证既有功能。

## 11. Milestones & Phasing (Indicative)
1. **Week 1** – Feed MVP、匿名浏览、AI 生成流程雏形
2. **Week 2** – 完整创作工作室、素材存储、基础个人主页
3. **Week 3** – Checkout 接入 Stripe/PayPal sandbox
4. **Week 4** – 社交互动（关注、点赞、评论、复刻）+ 审核工具
5. **Week 5+** – 盈利仪表板、国际化、合作伙伴集成

## 12. Risks & Mitigation (High Level)
- **AI Reliability**: 存储原始 prompt/响应，提供 fallback 渲染
- **Performance**: 使用缓存 + streaming，发布前压测
- **Moderation**: 多层审核（AI + 人工），提供升级流程
- **Compliance**: 与法务协作内容政策与隐私条款
- **Feature Creep**: 严格控制 MVP 范围，后续再评估扩展

## 13. Success Criteria
- 50%+ 新访客滚动 ≥3 张卡片
- ≥30% 注册创作者每周发布 ≥1 个作品
- Checkout 转化率 ≥5%
- 80% AI 生成会话在 2 分钟内完成发布
- 高峰期审核处理时长 <2 小时

## 14. Appendices
- Architecture reference: `docs/architecture-brownfield.md`
- 既有目标文档: `docs/prd-brownfield.md`
- Launch playbook: phased rollout, metrics dashboards, incident response

## 15. Epic and Story Structure
**Epic Structure Decision**: 单一大型 Epic（分阶段故事交付），因为所有模块（Feed、AI 创作、Checkout、社交、审核）在架构与数据层高度耦合，需要按顺序逐步上线以维护旧系统稳定性，并便于统一风险治理。

> 注：详细故事拆分将在后续 Story 准备环节补充，按 feed → 创作 → checkout → 社交 → 审核/运营 的顺序推进。
