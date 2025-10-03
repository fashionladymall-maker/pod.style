# SimpleShop - Getting Started Guide

欢迎来到 SimpleShop 项目！这份指南将帮助您了解项目结构、开发流程，并开始第一个 Story 的开发。

---

## 📚 项目文档结构

```
docs/
├── brief.md                      # 项目简介
├── simpleshop-prd.md            # 产品需求文档 (PRD)
├── simpleshop-architecture.md   # 系统架构文档
├── GETTING_STARTED.md           # 本文档
├── epics/                       # Epic 文档目录
│   ├── epic-1-foundation-auth.md
│   ├── epic-2-product-management.md
│   ├── epic-3-product-display.md
│   ├── epic-4-cart-orders.md
│   └── epic-5-payment.md
├── stories/                     # Story 文档目录
│   ├── README.md               # Story 索引
│   ├── story-1.1-project-init.md
│   ├── story-1.4-database-setup.md
│   └── ... (31 个 Story)
└── architecture/                # 架构支持文档
    ├── coding-standards.md
    ├── tech-stack.md
    └── source-tree.md
```

---

## 🎯 项目概述

**SimpleShop** 是一个简单的电商系统，旨在为小型商家提供易用的在线销售解决方案。

### 核心功能

1. **用户认证** - 商家和消费者注册登录
2. **商品管理** - 商家管理商品（CRUD + 图片上传）
3. **商品展示** - 消费者浏览和搜索商品
4. **购物车** - 添加商品到购物车
5. **订单管理** - 创建和管理订单
6. **支付集成** - 支付宝沙箱支付

### 技术栈

- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **后端**: Express.js + TypeScript + Prisma
- **数据库**: PostgreSQL + Redis
- **部署**: Vercel (前端) + Railway (后端)

---

## 📖 开发流程

### 1. 理解项目结构

按照以下顺序阅读文档：

1. **[项目简介](./brief.md)** - 了解项目背景和目标
2. **[PRD](./simpleshop-prd.md)** - 了解功能需求和验收标准
3. **[架构文档](./simpleshop-architecture.md)** - 了解技术架构和设计决策
4. **[Epic 1](./epics/epic-1-foundation-auth.md)** - 了解第一个 Epic 的目标

### 2. 开发顺序

**重要**: 必须按照 Epic 和 Story 的顺序开发！

```
Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5
  ↓
Story 1.1 → 1.2 → 1.3 → ... → 1.8
```

**为什么要按顺序？**
- 后面的 Story 依赖前面的 Story
- Epic 1 建立基础设施，所有后续功能都需要
- 确保每个阶段都有可部署的增量

### 3. Story 开发流程

对于每个 Story，遵循以下步骤：

#### Step 1: 阅读 Story 文档

```bash
# 例如：Story 1.1
cat docs/stories/story-1.1-project-init.md
```

仔细阅读：
- User Story（用户故事）
- Acceptance Criteria（验收标准）
- Technical Details（技术细节）
- Implementation Steps（实现步骤）

#### Step 2: 检查依赖

确保所有前置 Story 已完成：

```markdown
## Dependencies
**Before**: Story 1.3 (API setup)  
**After**: Story 1.5 (User registration)
```

#### Step 3: 准备环境

如果 Story 需要用户操作（如创建账号），先完成：

```markdown
## User Actions Required
- [ ] 创建 Cloudinary 账号
- [ ] 配置环境变量
- [ ] 获取 Stripe 测试密钥（publishable/secret/webhook）
```

##### Stripe 测试环境快速指引

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → 在 **测试模式** 下复制 Publishable key 与 Secret key。
2. 在 `.env.local` 中填入：
   ```ini
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   （Webhook 密钥可通过 Stripe CLI 或 Dashboard 的 Webhook Endpoint 获取，确保来自测试模式。）
3. 保存后重新启动开发服务器，使前端 `StripeProvider` 与后端 API 均能读取密钥。
4. 验证：打开结算页，使用测试卡号 `4242 4242 4242 4242`、任意未来有效期与 `CVC 123` 完成支付流程，确认订单写入 Firestore 并生成渲染队列。

> 若暂未配置真实密钥，可将变量设置为占位符，前端会禁用 Stripe UI 并在控制台给出警告。

#### Step 4: 实现功能

按照 Implementation Steps 逐步实现：

```bash
# 创建分支
git checkout -b story-1.1-project-init

# 开始开发
# ... 按照步骤实现 ...

# 提交代码
git add .
git commit -m "feat: Story 1.1 - Project initialization"
```

#### Step 5: 测试

运行 Testing Checklist 中的所有测试：

```bash
npm run lint
npm run type-check
npm run test
```

#### Step 6: 验证验收标准

逐一检查 Acceptance Criteria：

```markdown
1. ✅ 创建 Turborepo monorepo 结构
2. ✅ 配置 TypeScript
3. ✅ 配置 ESLint 和 Prettier
...
```

#### Step 7: 更新文档

- 更新 Story 状态为 "Done"
- 记录实际花费时间
- 记录遇到的问题和解决方案

#### Step 8: 代码审查

- 自我审查代码
- 确保符合 [Coding Standards](./architecture/coding-standards.md)
- 提交 Pull Request

---

## 🚀 开始第一个 Story

### Story 1.1: 项目初始化与 Monorepo 设置

这是整个项目的第一个 Story，将建立项目基础结构。

#### 快速开始

1. **阅读 Story 文档**
   ```bash
   cat docs/stories/story-1.1-project-init.md
   ```

2. **创建项目目录**
   ```bash
   mkdir simpleshop
   cd simpleshop
   ```

3. **按照 Implementation Steps 执行**
   - 初始化 npm 项目
   - 安装 Turborepo
   - 创建目录结构
   - 配置工具链
   - 初始化 Git

4. **验证设置**
   ```bash
   npm run lint
   npm run type-check
   ```

5. **完成后继续 Story 1.2**

---

## 📝 开发最佳实践

### 1. 使用 BMad Method

本项目使用 BMad Method 进行开发：

- **@dev** - 开发代理，实现功能
- **@qa** - QA 代理，质量保证
- **@po** - PO 代理，验证需求

### 2. 小步快跑

- 每个 Story 是一个小的、可完成的单元
- 不要跳过 Story
- 不要同时开发多个 Story

### 3. 测试驱动

- 为每个功能编写测试
- 运行测试确保没有破坏现有功能
- 保持测试覆盖率 > 70%

### 4. 文档同步

- 代码变更时更新文档
- 记录重要的设计决策
- 更新 README 和 API 文档

### 5. 代码质量

- 遵循 [Coding Standards](./architecture/coding-standards.md)
- 使用 TypeScript 严格模式
- 保持代码简洁和可读

---

## 🛠️ 常用命令

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm run test

# 格式化代码
npm run format
```

### 数据库

```bash
# 创建迁移
cd apps/api
npx prisma migrate dev --name <migration-name>

# 生成 Prisma Client
npx prisma generate

# 运行 seed
npx prisma db seed

# 打开 Prisma Studio
npx prisma studio
```

### Git

```bash
# 创建功能分支
git checkout -b story-<epic>.<story>-<name>

# 提交代码
git add .
git commit -m "feat: <description>"

# 推送分支
git push origin story-<epic>.<story>-<name>
```

---

## 📊 进度追踪

### Epic 进度

| Epic | Status | Progress |
|------|--------|----------|
| Epic 1: 基础设施与认证 | Not Started | 0/8 |
| Epic 2: 商品管理 | Not Started | 0/6 |
| Epic 3: 商品展示 | Not Started | 0/4 |
| Epic 4: 购物车与订单 | Not Started | 0/8 |
| Epic 5: 支付集成 | Not Started | 0/5 |

**总进度**: 0/31 Stories (0%)

### 更新进度

在 [Story README](./stories/README.md) 中更新每个 Story 的状态。

---

## 🆘 获取帮助

### 文档资源

- [PRD](./simpleshop-prd.md) - 功能需求
- [Architecture](./simpleshop-architecture.md) - 技术架构
- [Coding Standards](./architecture/coding-standards.md) - 编码规范
- [Story Index](./stories/README.md) - Story 列表

### 遇到问题？

1. **检查相关文档** - 大多数问题在文档中有答案
2. **查看 Story 的 Notes 部分** - 包含常见问题和提示
3. **参考架构文档** - 了解设计决策的原因
4. **使用 @dev 代理** - 让 AI 帮助实现功能

---

## 🎉 准备好了吗？

现在您已经了解了项目结构和开发流程，可以开始第一个 Story 了！

**下一步**:
1. 阅读 [Story 1.1](./stories/story-1.1-project-init.md)
2. 创建项目目录
3. 开始实现！

祝您开发愉快！🚀
