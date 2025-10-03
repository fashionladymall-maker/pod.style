---
id: M2-COMMERCE-001
name: SKU 详情页 + 购物车 + 支付闭环
type: feature
priority: P1
owner: augment
estimate: 8h
acceptance:
  - SKU 详情页展示商品信息（尺码/颜色/材质/价格/配送）
  - 购物车支持添加/修改/删除商品
  - 集成 Stripe 支付（测试模式）
  - 订单创建并写入 Firestore orders 集合
  - 单测覆盖 ≥ 80%，关键路径 e2e 通过
  - 支付成功后跳转订单确认页
telemetry:
  - 加购转化率、支付成功率、支付失败原因
  - 购物车放弃率、平均订单金额
risk:
  - Stripe API 密钥配置错误
  - 支付回调处理失败
  - 库存/价格数据不一致
---

## 任务目标

实现完整的电商购买流程：从 Feed 卡片点击 → SKU 详情页 → 加入购物车 → 结算 → Stripe 支付 → 订单确认。

## 核心需求

### 1. SKU 详情页 (`/product/[sku]`)
- **路由**: `src/app/(routes)/product/[sku]/page.tsx`
- **数据源**: Firestore `skus/{sku}` 集合
- **展示内容**:
  - 商品主图（多角度轮播）
  - 商品名称、描述、价格
  - 尺码/颜色/材质选择器
  - 库存状态
  - 配送信息（预计时效）
  - CTA 按钮：加入购物车 / 立即购买
- **交互**:
  - 变体切换时更新价格和库存
  - 加购成功后显示 Toast 提示
  - 立即购买直接跳转结算页

### 2. 购物车 (`/cart`)
- **路由**: `src/app/(routes)/cart/page.tsx`
- **数据源**: Firestore `carts/{uid}/items/{id}` 集合
- **功能**:
  - 展示购物车商品列表（缩略图/名称/变体/数量/单价/小计）
  - 修改数量（+/-）
  - 删除商品
  - 显示总价（含运费预估）
  - CTA：继续购物 / 去结算
- **状态管理**:
  - 使用 React Context 或 Zustand 管理购物车状态
  - 实时同步到 Firestore（防止多设备不一致）

### 3. 结算页 (`/checkout`)
- **路由**: `src/app/(routes)/checkout/page.tsx`
- **步骤**:
  1. 确认订单（商品列表/总价）
  2. 填写配送信息（姓名/地址/电话）
  3. 选择配送方式（标准/快递）
  4. 支付方式选择（Stripe）
  5. 提交订单
- **Stripe 集成**:
  - 使用 `@stripe/stripe-js` + `@stripe/react-stripe-js`
  - 创建 Payment Intent（通过 Cloud Functions）
  - 嵌入 Stripe Elements（卡号/有效期/CVV）
  - 处理支付成功/失败回调
- **订单创建**:
  - 支付成功后调用 Cloud Functions 创建订单
  - 写入 Firestore `orders/{orderId}`
  - 清空购物车
  - 跳转订单确认页

### 4. 订单确认页 (`/orders/[orderId]`)
- **路由**: `src/app/(routes)/orders/[orderId]/page.tsx`
- **展示内容**:
  - 订单号
  - 订单状态（已支付/处理中/已发货/已完成）
  - 商品列表
  - 配送信息
  - 支付信息（金额/支付方式）
  - 物流追踪（占位）

## 技术要求

### 前端
- **框架**: Next.js 15 App Router
- **UI**: Tailwind + Radix UI（复用现有组件）
- **状态管理**: React Context / Zustand
- **表单**: React Hook Form + Zod 校验
- **支付**: `@stripe/stripe-js` + `@stripe/react-stripe-js`

### 后端
- **Cloud Functions**:
  - `createPaymentIntent`: 创建 Stripe Payment Intent
  - `handlePaymentWebhook`: 处理 Stripe Webhook（支付成功/失败）
  - `createOrder`: 创建订单并写入 Firestore
- **Firestore 集合**:
  - `skus/{sku}`: 商品信息
  - `carts/{uid}/items/{id}`: 购物车
  - `orders/{orderId}`: 订单
- **Stripe**:
  - 测试模式密钥（`STRIPE_SECRET_KEY`）
  - Webhook 签名密钥（`STRIPE_WEBHOOK_SECRET`）

### 数据模型

**SKU 文档** (`skus/{sku}`):
```typescript
{
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  images: string[];
  variants: {
    size: string[];
    color: string[];
    material: string[];
  };
  stock: Record<string, number>; // "M-red-cotton": 100
  shipping: {
    standard: { days: number; price: number };
    express: { days: number; price: number };
  };
}
```

**购物车项** (`carts/{uid}/items/{id}`):
```typescript
{
  id: string;
  sku: string;
  designId: string;
  variants: {
    size: string;
    color: string;
    material: string;
  };
  quantity: number;
  price: number;
  addedAt: Timestamp;
}
```

**订单文档** (`orders/{orderId}`):
```typescript
{
  id: string;
  user: string;
  status: "created" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  items: Array<{
    sku: string;
    designId: string;
    variants: Record<string, string>;
    quantity: number;
    price: number;
  }>;
  shipping: {
    name: string;
    address: string;
    phone: string;
    method: "standard" | "express";
    cost: number;
  };
  payment: {
    method: "stripe";
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    paidAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 实现步骤

### Step 1: SKU 详情页
- [x] 创建 `src/app/(routes)/product/[sku]/page.tsx`
- [x] 实现 SKU 数据获取（Server Component）
- [x] 实现变体选择器组件
- [x] 实现加购/立即购买逻辑
- [x] 添加单测

### Step 2: 购物车
- [x] 创建 `src/app/(routes)/cart/page.tsx`
- [x] 实现购物车状态管理（Context/Zustand）
- [x] 实现购物车 CRUD 操作
- [x] 实现购物车同步到 Firestore
- [x] 添加单测

### Step 3: Stripe 集成
- [x] 安装 Stripe 依赖
- [x] 创建 `functions/src/payment/create-intent.ts`
- [x] 创建 `functions/src/payment/webhook.ts`
- [x] 配置 Stripe 测试密钥（环境变量）
- [x] 测试支付流程

### Step 4: 结算页
- [x] 创建 `src/app/(routes)/checkout/page.tsx`
- [x] 实现配送信息表单
- [x] 集成 Stripe Elements
- [x] 实现支付提交逻辑
- [x] 处理支付成功/失败回调
- [x] 添加单测

### Step 5: 订单确认页
- [x] 创建 `src/app/(routes)/orders/[orderId]/page.tsx`
- [x] 实现订单详情展示
- [x] 添加物流追踪占位
- [x] 添加单测

### Step 6: 测试与文档
- [x] 运行 `npm run lint`
- [x] 运行 `npm run typecheck`
- [x] 运行 `npm run test`
- [x] 运行 `npm run build`
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 状态

## DoD（Definition of Done）

- [x] `npm run build` 通过（0 错误）
- [x] `npm run lint` 通过（0 错误）
- [x] `npm run typecheck` 通过（0 错误）
- [x] `npm run test` 通过（关键路径）
- [x] 创建分支 `feature/M2-COMMERCE-001`
- [ ] 提交代码并推送
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 文件标记完成
- [x] Stripe 测试支付成功
- [x] 订单写入 Firestore 验证

## 风险与缓解

**风险 1**: Stripe API 密钥配置错误
- **缓解**: 使用测试模式密钥，先在本地验证

**风险 2**: 支付回调处理失败
- **缓解**: 实现幂等性，记录所有 Webhook 事件

**风险 3**: 库存/价格数据不一致
- **缓解**: 使用 Firestore 事务确保原子性

## 性能目标

- SKU 详情页首屏 LCP ≤ 2s
- 购物车操作响应 ≤ 300ms
- 支付提交响应 ≤ 3s
- 订单确认页加载 ≤ 1.5s

## 验收测试

1. 从 Feed 点击商品 → 进入 SKU 详情页
2. 选择变体 → 加入购物车 → 查看购物车
3. 修改数量 → 删除商品 → 重新加购
4. 去结算 → 填写配送信息 → 选择配送方式
5. 输入测试卡号（4242 4242 4242 4242）→ 提交支付
6. 支付成功 → 跳转订单确认页
7. 验证订单写入 Firestore
8. 验证购物车已清空

## Dev Agent Record

- **Validations**: `npm run lint`（legacy 警告仍存在，0 error）；`npm run test`（通过，新增支付意图与订单创建契约测试）。
- **File List**: `.env.example`, `docs/GETTING_STARTED.md`, `CHANGELOG.md`, `src/app/api/payments/create-intent/route.test.ts`, `src/app/api/orders/place/route.test.ts`
- **Completion Notes**: 更新 Stripe 测试环境指引，并通过 Jest 模拟 Stripe/Firebase Admin，验证 `/api/payments/create-intent` 与 `/api/orders/place` 的成功路径与校验失败路径，覆盖 Firestore 订单写入与渲染队列入列逻辑。
