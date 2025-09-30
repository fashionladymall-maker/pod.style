# Pod.Style Brownfield Enhancement Architecture

## 0. Introduction
This document outlines the architectural approach for enhancing Pod.Style into a full social commerce platform while preserving the existing Next.js + Firebase foundation. It serves as the blueprint for coordinating AI-driven development, social features, real payments, and operational tooling without destabilizing the current system.

**Relationship to Existing Architecture**: The existing brownfield architecture (`docs/architecture-brownfield.md`) captures the factual state of the codebase. This document extends it by defining integration strategies, component responsibilities, and migration patterns required to build the new experience. Whenever new patterns conflict with legacy conventions, the guidance here takes precedence.

## 1. Existing Project Analysis
### 1.1 Current Project State
- **Primary Purpose**: 多语言创意电商平台，核心流程为 AI 生成图案 → 个性化商品下单（docs/architecture-brownfield.md:15）
- **Current Tech Stack**: Next.js 15 App Router、React 18、TypeScript、Tailwind、Radix UI、Genkit + Google Gemini、Firebase Auth/Firestore/Storage/Cloud Functions（docs/architecture-brownfield.md:19,43）
- **Architecture Style**: 单体式 Next.js 应用，Server Components + Server Actions 驱动，业务逻辑通过 Firestore + Cloud Functions 协作（docs/architecture-brownfield.md:19,43）
- **Deployment Method**: Firebase App Hosting + Cloud Functions（docs/architecture-brownfield.md:75）

### 1.2 Available Documentation
- `docs/architecture-brownfield.md` – 现状分析与技术债列表
- `docs/prd.md` / `docs/prd-brownfield.md` – 产品需求与目标
- `docs/architecture-redesign.md` – 先前架构提案，可作为参考
- `README.md`, `docs/firebase-deploy.md` – 启动与部署说明
- `docs/stories/brownfield-mvp-stories.md` – 旧版故事草案

### 1.3 Identified Constraints
- 巨型客户端 `src/app/app-client.tsx` 职责过多，拆分风险高
- 支付流程仍为 mock，Firestore 写入卡号末四位，需满足 PCI 合规
- `firebase.json` 将 Cloud Functions runtime 设为 python313，与 Node 实现冲突
- AI 生成与文件上传耦合，缺少幂等/重试与孤儿文件清理
- 缺乏自动化测试与监控，依赖人工验证
- Data Connect/Cloud SQL 配置存在但未使用，迁移需谨慎
- 浏览器语音识别依赖 Web Speech API，存在兼容性限制

### 1.4 Change Log
| Change | Date | Version | Description | Author |
| --- | --- | --- | --- | --- |
| 初始草稿 | 2025-01-12 | v0.1 | 基于现状分析与 PRD 生成的架构规划 | Winston (architect) |
| Feed Ranking Telemetry | 2025-03-02 | v0.2 | 增加 feed 排名权重说明与分布/命中率监控指标 | James (dev) |

## 2. Enhancement Scope and Integration Strategy
- **Enhancement Type**: 社交电商重构（新功能 + 重大改造 + 多系统集成 + UI/UX 重做）
- **Scope**: 引入短视频式创意 feed、拆分并服务化 AI 创作管线、上线真实支付/物流、补齐社交互动与收益闭环，并保障内容审核与运维能力

**Integration Strategy**
1. **Feed Layer (新)**
   - 在 `src/app` 中新增 `(feed)` 路由组，拆分 `AppClient` 职责
   - 新增 `src/features/feed`（server actions/service/repository），基于 `creations` 与 `personalized_feed_cache` 提供分页/排序
   - 扩展 Firestore `personalized_feed_cache`，支持区域/用户个性化
   - 排名权重：Engagement 0.55、Recency 0.30、Personalization 0.15；缓存中 `rankingSignals` 的 `personalBoost`、`personaAffinity` 提供个性化加成。

2. **AI Pipeline 升级**
   - 保留 `src/ai/flows/*` 同步入口，新增 `src/ai/pipelines` 调度异步任务
   - 将生成任务下发到 Cloud Functions/Cloud Run，写入 Firebase Storage/Firestore，并提供幂等 ID、重试与失败清理

3. **支付与订单**
   - 在 `features/orders` 上方拓展 `features/payments`，封装 Stripe/PayPal 适配器
   - 使用 Cloud Functions/Run 处理 webhook，维护 `payments` 子集合与 `orders` 扩展字段（保持向后兼容）
   - 订单与支付 token 分离，保证合规

4. **社交互动**
   - 扩展 `creations` 子集合记录 likes/comments/remakes，新增 `social_edges`、`notifications` 集合
   - 抽离 `viewer-screen`、`profile-screen` 等客户端组件，复用 Tailwind + Radix UI

5. **审核与运营**
   - 延续现有定时任务结构，在 `functions/index.js` 增加内容审核任务
   - Firestore 新增 `moderation_flags`、`admin_metrics` 集合，并提供 `/admin` 专用界面
   - 部署上使用 Hosting rewrites 支持 `/beta`、`/admin`，保留回退

**Compatibility Boundaries**
- 旧 `server/actions`（如 `getPublicCreationsAction`）保持可用，新功能通过新命名空间暴露
- Firestore 现有集合 schema 不破坏，只追加可选字段或子集合，并提供迁移脚本
- 客户端继续使用 Tailwind + Radix UI 设计规范，确保视觉一致
- 部署仍以 Firebase Hosting + Cloud Functions 为核心，新增 Cloud Run/队列通过配置注入

## 3. Business & User Experience Architecture
### 3.1 User Experience Flows
- **Inspiration Feed**: 访客进入 `/`（或 `/beta`）即加载个性化 Feed → 支持滚动、点赞、收藏、分享、查看详情；匿名用户交互需提示登录
- **Creation Studio**: 已登录创作者打开创作工作室（新路由 `/studio`）→ 输入提示词/上传灵感 → 触发 AI Pipeline → 浏览生成结果 → 选择/编辑商品配置 → 发布
ew_feed entry + 创作版本记录
- **Commerce Checkout**: 访客/创作者在作品详情或 Studio 中选择商品 → 加入购物车（全局浮层或控制中心）→ 填写配送与支付信息 → Stripe/PayPal Token 化 → 返回订单确认
- **Social & Remix**: 用户从 Feed 或详情页进入 Viewer → 查看模型/评论 → 执行点赞、收藏、关注、复刻、分享、举报等操作 → 触发通知与排名信号更新
- **Moderation & Ops**: 审核人员登录 `/admin` 查看待审核作品 → AI 自动判定结果 + 用户举报 → 人工处理 → 更新作品状态、通知作者、记录审计日志

### 3.2 Business Capabilities
- **创意生成**：AI Pipeline（Genkit flows + Pipelines）负责图案生成、Mockup、Prompt 摘要；支持个性化模型
- **商品定制**：与产品模板（colors/sizes/materials）关联，生成订单化参数
- **社交互动**：Feed 排序、社交图谱、互动计数、通知推送
- **电商履约**：购物车、支付、物流、订单状态同步；未来扩展收益结算
- **内容审核**：自动审核、人工复核、举报处理、合规记录
- **运营分析**：日志、指标、报表（导出到 BigQuery/Looker Studio 等）

### 3.3 Feature Mapping to Architecture
| Feature | Current Modules | Future Modules / Changes |
| --- | --- | --- |
| Feed 浏览 | `AppClient`, `HomeScreen`, `getPublicCreationsAction` | 新 `feed-service`, 拆分为 `(feed)` 路由 + 个性化缓存 + 新 UI 组件 |
| AI 创作 | `src/ai/flows` + `creation-service` | 新 `ai/pipelines`（异步调度）、队列/幂等、作品版本记录 |
| Checkout | `features/orders`, `createOrderAction` | `payments-service` (Stripe/PayPal), 订单/支付拆分, Webhook 处理 |
| 社交互动 | `viewer-screen`, `comments-sheet`, `creation-service` | 拆分 `features/social`, 新集合 (likes/follows/notifications)、速率限制 |
| 审核运营 | 基本占位页 (`admin/page`) + 定时任务 | 扩展审核面板 UI、`moderation-service`, `moderation_flags` 集合, 审计日志 |

## 4. Application Architecture


系统组件图：见 docs/diagrams/system-overview.md

数据流图：见 docs/diagrams/data-flow.md

### 4.1 Components & Responsibilities
- **Routes & Pages**: 拆分为 `(feed)`, `(studio)`, `(shop)`, `(profile)`, `(admin)` 路由组；复用全局 `AuthProvider` 与 `Toaster`
- **Server Actions**: 分域放置于 `src/features/{domain}/server/actions.ts`；通过新命名空间（如 `feed`, `social`, `payments`）导出
- **Services**: 纯业务逻辑位于 `src/features/{domain}/server/{service}.ts`，负责 orchestrate Repository + External APIs
- **Repositories**: 在 Firestore/Firebase Admin 层抽象数据读写；保持 schema 兼容
- **AI Pipelines**: 新增 `src/ai/pipelines/{pipeline}.ts`，处理长耗时生成、排队、状态记录
- **Cloud Functions/Run**: 承载异步任务（AI 渲染、支付 webhook、缓存刷新、审核队列）
- **Client Components**: 每个体验模块（Feed、Studio、Checkout、Viewer、Profile、Admin）独立模块化，提供数据 hooks 与上下文

### 4.2 Interaction Diagram (High-Level)
1. 用户访问 Feed → Next.js RSC 获取初始作品 + 个性化缓存 → 客户端切换 Tab 时通过 server actions 拉取更多数据 → social service 更新互动计数
2. 创作者在 Studio 提交生成 → server action 立即返回 job ID → Cloud Function 调用 AI Pipeline → 完成后写入 `creations` & Storage → 客户端轮询或订阅
3. 订单下单 → server action 校验 stock & price → 调用 payment service 生成 payment intent → Cloud Function 监听 webhook → 更新 `orders` → 通知 feed/creator
4. 用户举报或自动审核命中 → moderation service 标记 `moderation_flags` → 管理员在 `/admin` 审核 → 更新状态并通知创作者

### 4.3 Module Responsibilities
| Module | Responsibility |
| --- | --- |
| `feed-service` | Feed 数据聚合、排名、分页、缓存更新 |
| `ai/pipelines` | 处理生成任务、状态管理、幂等与重试 |
| `payments-service` | 支付网关封装、token 管理、webhook 处理 |
| `social-service` | 社交图谱、互动计数、通知触发 |
| `moderation-service` | 自动审核、人工审核队列、审计记录 |
| `analytics-service` | 日志、指标与导出任务（预留） |

## 5. Data Architecture### 5.1 Core Collections & Changes
- `creations`: 保持现有字段；新增 `versions`, `moderationStatus`, `shareCount`, `remixCount`, `lastGeneratedAt` 等可选字段
- `creations/{id}/versions`: 记录生成历史（prompt, assets, metadata）
- `personalized_feed_cache`: 扩充字段（region, personaVector, updatedAt, rankingSignals）
- `orders`: 增加 `paymentId`, `fulfillmentStatus`, `region`, `tax`, `historicalStatusEvents`
- `payments`: 新集合，存储 tokenized payment intent / method（仅 metadata）
- `social_edges`: 记录关注关系（from, to, createdAt, state）
- `notifications`: 通知列表（recipientId, type, payload, readAt）
- `moderation_flags`: 存储审核状态、理由、处理记录
- `admin_metrics`: 各类运营报表缓存

### 5.2 Data Flow Updates
- AI Pipelines 产出写入 `creations` + Storage → 生成成功后写入 `versions` 子集合
- Feed 更新：作品交互后触发 Cloud Function 更新 `personalized_feed_cache`
- 支付 Webhook → 更新 `payments` + `orders`
- 社交互动 → 写入 `social_edges` / `notifications` → 更新 feed 排序信号
- 审核队列 → `moderation_flags` 状态变更 → 若拒绝则更新 `creations` + 通知创作者

### 5.7 Creator Earnings Flow
- Firestore 字段：在 `orders` 增加 `creatorShare`, `payoutStatus`；新建 `creatorEarnings` 集合，文档形如 `{creatorId, period, grossSales, shareAmount, lastPayoutAt, status}`。
- 汇总作业：新增 Cloud Function `aggregateCreatorEarnings`（每天运行），扫描当天订单，写入/更新相应的 `creatorEarnings` 文档。
- 报表展示：后台 “创作者收益” 页面读取 `creatorEarnings` 集合，可导出 CSV。
- 支付流程：当运营确认支付时，将 `payoutStatus` 改为 `paid`，记录时间戳与操作人。


## 6. Integration Architecture

| Endpoint | Method | Request | Response |
| --- | --- | --- | --- |
| `/api/feed/list` | POST | `{ region, locale, cursor? }` | `{ items: FeedItem[], nextCursor? }` |
| `/api/ai/generate` | POST | `{ prompt, references[] }` | `{ jobId }` |
| `/api/payments/webhook` | POST | Stripe event JSON | `{ ok: true }` |

### 6.1 External Services
| Service | Purpose | Integration Pattern |
| --- | --- | --- |
| Google Gemini / nanobanana | 图案与文案生成 | Genkit flows → Pipelines → Cloud Function/Run |
| Stripe / PayPal | 支付处理 | Server Actions 调用 Payment Service → Webhook → Firestore |
| Logistics Provider (TBD) | 配送与追踪 | Cloud Function/Run webhook → `orders` 更新 |
| CDN/Media (Cloudflare R2/Images) | 静态/视频内容分发 | Storage → 复制/同步 → CDN URL |
| Analytics (GA, BigQuery) | 指标与行为分析 | 日志/事件导出 → BigQuery/GA |

### 6.2 Compatibility Rules
- **Existing API Compatibility**: 保留 `server/actions` 旧 API；新 API 使用 `/feed/*`, `/social/*`, `/payments/*` 命名空间
- **Database Integration**: 所有新增字段必须为可选，写操作采 idempotent key，迁移脚本保障现有文档解析
- **Error Handling**: server actions 捕获错误后返回统一错误对象，通过 Toast/日志呈现；AI Pipelines 失败写入状态并允许重试
- **Logging Consistency**: 所有服务使用 `logger` 包统一格式；关键操作写入 Cloud Logging + BigQuery

## 7. Infrastructure & Deployment
### 7.1 Current Setup
- Firebase App Hosting 作为前端托管，Cloud Functions 承担 server actions & cron
- VCS: GitHub（假设），部署多为手动运行 `firebase deploy`
- 环境变量通过 `.env.local` + Firebase config 注入

### 7.2 Infrastructure Changes
- 引入 Cloud Run（或延伸 Cloud Functions v2）执行 CPU/GPU 密集任务（AI, webhooks, moderation）
- 采用 Cloud Tasks / Pub/Sub 管理异步队列（AI pipeline, cache refresh, moderation）
- 调整 `firebase.json` runtime 至 Node16/18/20（与代码一致）
- 对接 Secret Manager 存储支付与第三方凭证

### 7.3 Deployment Strategy
- 构建流程：CI 执行 `npm run lint && npm run typecheck && npm run test` → `npm run build`
- 部署步骤：先部署 Cloud Functions/Run → Hosting 预览 → `/beta` 灰度 → 观察指标后切主站
- 引入 Feature Flags（Firestore/Remote Config）控制模块上线
- Feed Beta 开关：默认读取 `NEXT_PUBLIC_ENABLE_FEED_BETA`，可用 `FEED_BETA_FORCE=true/false` 在部署后强制开启或关闭；关闭时 `/beta` rewrite 需撤销，打开前先在 Remote Config 灰度 5% 流量并监控指标。
- Feed Ingestion 开关：通过 `NEXT_PUBLIC_ENABLE_FEED_INGESTION` + `FEED_INGESTION_FORCE` 控制新缓存管道；如需回滚，关闭开关后清理新增字段即可恢复 legacy 定时任务。
- 建立回滚脚本：撤回 Hosting rewrite、停用新 Cloud Function/Run 版本

### 7.4 Observability
- 统一使用 OpenTelemetry + Cloud Logging + Error Reporting
- 关键指标：Feed 延迟、AI 成功率、支付成功率、审核耗时、活跃用户数
- Feed 仪表盘：追踪 `feed.service.latency`, `feed.service.cache_hit`, `feed.service.cache_miss`, `feed.service.fallback_used`；建立缓存命中率、首次渲染耗时、fallback 次数告警（24h 命中率 <60% 或 fallback 次数 > 阈值时通知 SRE）。
- 排名监控：追踪 `feed.service.ranking.score_distribution`（min/max/avg）与 `feed.service.cache.hit_ratio`，设定评分异常（平均分骤降 >30%）或命中率 <50% 的警报。
- 设置报警：AI/支付失败率、队列积压、Functions 错误、Hosting 错误率

## 8. Testing Strategy
### 8.1 Integration with Existing Tests
- **Existing Test Framework**: TypeScript + Jest（需补充），目前无测试基础
- **Test Organization**: 按 `features/{domain}/__tests__` 分类
- **Coverage Requirements**: 新模块 ≥70% 覆盖，关键路径（支付、AI pipeline）≥80%

### 8.2 New Testing Requirements
- **Unit Tests**: 使用 Jest + ts-jest；位置 `src/features/{domain}/__tests__`；覆盖 service/repository；使用 Firebase Emulator 模拟
- **Integration Tests**: 定义 Feed/Ai/Checkout end-to-end 流程；使用 Playwright 或 Cypress；验证旧功能完好（旧页面）
- **Regression Tests**: 建立自动化冒烟脚本（Feed 浏览、生成、下单、互动）；关键流程人工回归 checklist

## 9. Security Integration
- **Existing Security**: Firebase Auth (匿名 + 邮箱)、Firestore 规则、App Check Debug（需生产配置）
- **New Security Measures**: 支付 token 化、Webhook 验证、内容审核策略、Feature Flags 鉴权
- **Integration Points**: server actions 需校验 Auth 角色；Webhook 验证签名；Storage 上传限制 MIME 类型
- **Compliance**: 支付卡信息不得存储；GDPR/CCPA 导出/删除；内容政策与审核记录
- **Security Testing**: Firebase Emulator 规则测试、支付 Webhook 模拟、内容审核逃逸测试、定期渗透测试

## 10. Checklist Results Report
### Execution Summary
- Mode: Comprehensive (all sections processed)
- Project Type: Full-stack (frontend + backend)
- Documents Reviewed: docs/architecture.md, docs/prd.md, docs/architecture-brownfield.md
- Gaps: No diagrams provided; FR6 earnings flow needs more detail; compliance & resilience plans high level

### Section Pass Rates
- Section 1 – Requirements Alignment: 6/15 pass/partial (notable gaps: FR6 detail, performance/resilience specifics)
- Section 2 – Architecture Fundamentals: 10/20 pass/partial, 1 fail (missing diagrams, interface contracts)
- Remaining sections: Not yet evaluated (future work recommended once diagrams & detailed patterns added)

### Key Risks & Follow-ups
1. Diagram & interface clarity – provide high-level component/data flow diagrams and explicit API contracts before development.
2. Creator earnings (FR6) – define data schema, processing jobs, reporting pipeline to avoid scope gaps.
3. Compliance & resilience – articulate data retention, audit logging, incident response, and failover strategy.
4. Rate limits & SLAs – capture Stripe/PayPal/logistics quotas and fallback behavior.
5. Tooling/DevEx – specify CI, emulator usage, local dev workflow enhancements to support modularization.

View full checklist findings in architect analysis logs (available upon request).

_Architect checklist pending execution_  
(将在最终审阅阶段运行 `*execute-checklist architect-checklist` 并填入结果)

## 11. Next Steps
### 11.1 Story Manager Handoff
"参考 docs/prd.md 与 docs/architecture.md，按照 Feed → 创作 → Checkout → 社交 → 审核的顺序拆分单个 Epic。每个 Story 必须验证：旧 server actions 兼容、新 Firestore 字段保持可选、AI Pipeline 异步任务幂等、支付 Token 化与回退方案、审核队列接入。首个 Story 先聚焦 Feed 拆分（路由、服务、缓存）并确认旧首页仍可访问。"

### 11.2 Developer Handoff
"实现前请阅读 docs/architecture.md 与 docs/architecture-brownfield.md。遵循 `src/features/{domain}` 结构、Zod 输入校验、统一日志 `logger`。先完成 Feed 拆分 + 个性化服务，再处理 AI Pipeline 异步化、支付服务、社交模块、审核模块。每个阶段需运行 lint/type/test + Firebase Emulator 冒烟，并记录旧功能回归。安全侧重点：支付 Token、Webhook 验证、内容审核流程。部署前使用 `/beta` 灰度与 Feature Flags 控制范围。"


## 9. Rollback & Compliance Strategy
- 支付：Stripe 限速 100 rps、PayPal 30 rps；超限时切回 mock 服务。所有 webhook 必须验证签名，失败重试 3 次后报警。
- AI：Gemini 调用失败时写入重试队列（最多 3 次），全部失败则通知用户，保持旧流程可用。
- 审核：自动审核挂掉时，作品进人工队列且不公开，通知运营处理。
- 监控指标与报警：`feed.service.latency`、`ai.pipeline.failRate`、`payments.successRate`、`moderation.backlogSize`，每个指标设定阈值（例如 failRate > 5% 即报警）。
- 灰度与回滚：所有新功能先在 `/beta` 落地；异常时关闭 Remote Config 并回到旧 `AppClient`。
- 合规：支付仅存储 token；日志保存 90 天；提供 GDPR 数据导出/删除流程。
