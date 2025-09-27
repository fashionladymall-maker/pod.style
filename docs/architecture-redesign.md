# Firebase Studio 架构重构提案

## 设计目标与约束

- **运行环境**：延续 Firebase Studio 的约定，使用 Next.js App Router + Server Components，服务端写法通过 `"use server"` 动作与 Edge/Node 运行时兼容。
- **Firebase 依赖**：所有认证、数据、存储能力均来自 Firebase（Auth、Firestore、Storage、Cloud Functions、Genkit）。禁止引入外部自建后端，仅可通过 Cloud Functions 扩展。
- **合规与安全**：遵守谷歌云安全最佳实践，不在前端或 Firestore 中存储敏感支付信息，确保 Firestore 规则和 App Check、Authentication 结合使用。
- **可维护性**：按业务域拆分目录和数据访问层，减少巨型组件与“神对象” server action，方便 Firebase Studio 中的可视化建模、部署与多环境配置。
- **可观察性**：使用 Firebase Logging / Crashlytics（Web SDK）以及 Google Analytics for Firebase 进行日志、事件追踪，便于 Studio 中的运营分析。

## 现状痛点梳理

| 痛点 | 说明 |
| --- | --- |
| Firestore 规则过于宽松 | 当前规则允许所有匿名读写直至 2025-10-24，缺乏基于用户的读写限制。`${project}/firestore.rules` |【F:firestore.rules†L1-L17】|
| Server Action 神对象 | `src/app/actions.ts` 集成认证、生成、互动、订单等所有逻辑，达 700+ 行，缺少单元可组合性，难以在 Studio 中复用或通过 Data Connect 暴露接口。|【F:src/app/actions.ts†L1-L760】|
| 客户端组件状态爆炸 | `src/app/app-client.tsx` 同时承担导航、AI 触发、下单、评论、个人中心等职责，状态与副作用耦合，阻碍可测试性与并行开发。|【F:src/app/app-client.tsx†L1-L160】|
| 支付信息安全风险 | `createOrderAction` 直接把卡号、CVV 等敏感信息写入 Firestore，与合规要求冲突，需要迁移至受控的支付网关/Cloud Function。|【F:src/app/actions.ts†L709-L755】【F:src/lib/types.ts†L18-L61】|
| 数据模型散乱 | `types.ts` 将客户端 DTO、Firestore schema 混杂，没有版本控制与转换层；缺乏基于 `Timestamp` 的序列化工具，导致在多处重复转换逻辑。|【F:src/lib/types.ts†L1-L87】|
| 缺少清晰的 AI 调用编排 | `ai/flows` 目录下的流程未与业务层解耦，server action 直接调用，缺少可观测性、重试与队列机制；也未利用 Cloud Functions/Tasks 来跑长耗时生成。|【F:src/ai/flows/generate-t-shirt-pattern-with-style.ts†L1-L160】|
| 组件层缺乏 feature 模块 | `components/screens`/`sheets`/`ui` 目录按 UI 类型而非业务划分，导致跨文件依赖混乱，很难基于 Firebase Studio 的“特性卡片”构建功能。|【F:src/components/screens/home-screen.tsx†L1-L200】|
| 身份迁移逻辑与 UI 耦合 | 匿名账号迁移、Toast 提示等散落在 `AuthContext`，缺少独立的 Auth 服务层，难以在其他特性（如移动端、后台）复用。|【F:src/context/auth-context.tsx†L1-L160】|

## 重构总体架构

### 目录规划

```text
src/
  app/
    (public)/page.tsx
    (dashboard)/layout.tsx
    api/
      creations/
        route.ts          # 仅当需要 API route；优先使用 server action
  features/
    auth/
      components/
      hooks/
      server/
        actions.ts
        auth-service.ts
    creations/
      components/
      hooks/
      server/
        actions.ts        # 仅处理 RSC <-> 服务层桥接
        creation-service.ts
        creation-repository.ts
        creation-model.ts  # Firestore 数据映射 + zod schema
    orders/
      components/
      server/
        actions.ts
        order-service.ts   # 调用支付 Cloud Function、写入 Firestore
    comments/
    feeds/
  server/
    firebase/
      admin.ts           # getDb/getStorage 单例 + withAppCheck
      auth.ts            # verifyIdToken 封装
    ai/
      flows/             # 现有 Genkit 流程，增加可重用 export
      orchestrators/     # 使用 Cloud Tasks/Functions 调度长任务
  utils/
    logger.ts            # Firebase logger 包装
```

### 分层说明

1. **Server Action 层**（Next.js）
   - 仅做输入验证、会话解析、调用服务层。
   - 使用 `zod` 校验 payload，返回统一的 `Result` 对象（`{ ok, data, error }`）。
2. **Service 层**
   - 落地业务用例（如“创建创作”“点赞”“下单”）。
   - 内部调用 repository、AI orchestrator、Cloud Functions。
3. **Repository 层**
   - 封装 Firestore 文档读写，提供强类型映射。
   - 输出与 service 层交互的 domain model。
4. **Model & Mapper**
   - 使用 zod/TypeScript 类型把 Firestore `Timestamp` 转换为 ISO 字符串等序列化格式。
5. **UI Feature 层**
   - 每个业务域拥有自己的 hook（如 `useCreationsFeed`）和组件（如 `CreationGrid`），`app-client` 只负责组合。
   - 使用 `zustand` 或 `redux-toolkit`（限前端）管理局部状态，避免 300+ 行 `useState`。

### Firebase 专项设计

- **Firestore 安全**：
  - 重写规则，按集合划分：
    - `creations`：读对所有登录用户开放，写仅限文档所有者或 Cloud Functions。
    - `orders`：仅创建者和云函数可读写；支付状态变更由后台函数执行。
    - `comments`：读公开、写需登录，引用父 `creations/{id}` 的 `isPublic` 状态。
  - 使用 [Firebase Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests) 在 CI 中校验。
- **支付流程**：
  - 前端仅收集支付 token（来自 Stripe/Paypal SDK），调用 `createOrderAction` -> Cloud Function `placeOrder`，由函数与支付网关交互并写入安全的 `orders` 集合。
  - Firestore 中只存支付摘要（品牌、后四位、交易号），完全移除 CVV/完整卡号字段。
- **AI 流程**：
  - Genkit 流程迁至 `src/server/ai`，Server Action 不直接调用长任务，而是触发 Cloud Function/Task `startPatternGeneration`，由函数写入 `creations/{id}` 的 `status` 字段并通过 Firestore 监听更新客户端。
  - 对于轻量操作（如 prompt 总结），仍可直接在 server action 中调用。
- **Cloud Functions**：
  - `functions/src/` 中拆分模块：`auth.ts`（匿名迁移）、`creations.ts`（AI 触发 & 数据清洗）、`orders.ts`（支付）、`webhooks.ts`（AI/支付回调）。
  - 使用 Firebase Studio 的 Function 触发器配置（HTTP + Firestore）保持部署一致。
- **Storage 管理**：
  - 生成的图案 & 模型 mockup 上传至 Storage。Server action 返回签名 URL，前端只读。
  - 引入基于 `firebase-admin` 的上传助手，自动写入元数据（style、prompt hash）。

### 数据模型规划

| 集合 | 文档字段 | 说明 |
| --- | --- | --- |
| `creations` | `prompt`, `style`, `summary`, `patternRef`, `models[]`, `status`, `engagement`（嵌套结构） | `patternRef`/`models[].fileRef` 保存 Storage 路径；`status` 支持 `draft/generating/ready/failed`。|
| `creationEngagement`（子集合） | `likes`, `favorites`, `shares`, `comments` | 分表减少热文档冲突，使用 Cloud Function 聚合得分。|
| `orders` | `userId`, `creationId`, `lineItems[]`, `paymentSummary`, `shipping`, `statusHistory[]` | `paymentSummary` 仅保存 token id、maskedPan、gateway 状态。|
| `comments` | `userId`, `text`, `createdAt`, `parentCreationId` | 与 `creations` 同级集合，或作为子集合加索引。|
| `users` | `profile`, `preferences`, `stats` | Auth 同步，便于个性化 feed。|

### 功能模块职责

1. **Auth Feature**
   - `AuthProvider` 只负责监听 Firebase Auth，状态管理迁移至 `features/auth` hook。
   - 匿名迁移调用 `auth-service.migrateAnonymousUser`，统一日志 & 错误处理。
2. **Creations Feature**
   - `useCreationComposer`：管理 prompt、style、上传图像、提交任务。
   - `CreationService`：`createDraft`、`commitPattern`, `togglePublic`, `logEngagement`。
   - `CreationFeedService`：封装 `popular`, `trending`, `personalized` 查询，并结合 Firestore 索引。
3. **Orders Feature**
   - `useCheckoutFlow`：State machine（`xstate` 或 `zustand`）管理流程。
   - `OrderService`：`estimatePrice`, `createOrder`, `listOrders`。
4. **Comments Feature**
   - `CommentService` + Realtime listener，通过 Firestore `onSnapshot` 或 Realtime Database（可选）提供实时评论。
5. **Analytics/Interaction**
   - 使用 Firebase Analytics logEvent（`view_creation`, `like_creation`, `generate_pattern`），供 Studio 分析。

### 开发流程与工具链

- **类型安全**：所有 server action 入参使用 `zod` + `@firebase/util` 校验，自动生成 TypeScript 类型。
- **测试策略**：
  - `vitest` + `@firebase/rules-unit-testing` 进行规则 & repository 单测。
  - `playwright` 做端到端（利用 Firebase Emulator Suite）。
- **CI/CD**：
  - GitHub Actions：`lint` -> `test` -> `firebase emulators:exec` -> `deploy --only hosting,functions`（在 main）。
  - 使用 Firebase Studio 的“预览渠道”发布测试环境。
- **监控**：Cloud Functions 使用 `functions.logger`；前端使用 `console.info` 包装到 `Firebase Performance Monitoring`。

### 迁移路线图

1. **安全基线**
   - 立即更新 Firestore 规则、移除订单中的敏感字段。
   - 增加 `.env` 校验，确保 server action 仅在配置完整时运行。|【F:src/app/actions.ts†L44-L72】|
2. **分层重构**
   - 创建 `src/features` 与 `src/server` 结构，逐步迁移 `actions.ts` 中逻辑。
   - 拆分 `AppClient`：建立 `AppShell`（导航）+ `HomePage`（feed）+ `CheckoutFlow` 等子组件。
3. **支付与 Cloud Function**
   - 引入支付服务（Stripe/PayPal）SDK，通过 Cloud Function 完成结算。
   - Firestore 迁移脚本：遍历 `orders` 集合，删除 `paymentInfo`，写入 `paymentSummary`。
4. **AI 任务编排**
   - 将生成/Mockup 调用迁移至 Cloud Function，并为 `creations` 增加 `status` 字段。
   - 前端通过 Firestore 监听更新 UI。
5. **数据驱动 Feed**
   - 使用 `creationEngagement` 聚合 + Cloud Function 定时任务刷新 `trending` 排名。
   - Personalization 读取 `users.preferences`。
6. **组件重构**
   - feature 组件使用 `Suspense` + `React.lazy`，按需加载。
   - 引入 Storybook + Chromatic 验证 UI。

### Firebase Studio 集成建议

- 使用 Studio 的 **Data Connect** 为移动/第三方提供 GraphQL 接口，repository 层可被自动代码生成消费。
- 借助 **App Hosting** 的多环境功能，将 `preview`、`staging`、`production` 渠道映射到 Git 分支策略。
- 在 Studio 中配置 **Extensions**（如 `firestore-send-email`）用于订单通知，减轻自建工作量。

---

通过以上拆分，项目能够：
- 遵循 Firebase Studio 的无服务器、模块化最佳实践。
- 提升安全与合规，尤其是支付和 Firestore 访问。
- 改善可维护性与团队协作效率，使 AI/订单等功能可独立演化。
- 为后续多端扩展（Web、移动、小程序）打下可复用的服务基础。
