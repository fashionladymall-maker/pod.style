# SimpleShop Architecture Document

**Version:** 1.0  
**Date:** 2025-10-01  
**Status:** Draft  
**Project:** SimpleShop - 简单电商系统

---

## Introduction

This document outlines the overall project architecture for SimpleShop, including backend systems, frontend application, database design, and integration with third-party services. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development, ensuring consistency and adherence to chosen patterns and technologies.

The architecture is designed to support the PRD goals of providing a simple, scalable, and maintainable e-commerce platform for small merchants. It emphasizes developer experience, type safety, and modern best practices while keeping the system simple enough for rapid development and deployment.

### Starter Template

**Decision**: We will use a custom Turborepo monorepo setup rather than a pre-built starter template.

**Rationale**:
- Turborepo provides excellent monorepo management with minimal configuration
- Custom setup allows us to include only what we need, avoiding bloat
- Better learning experience and full control over the architecture
- Easy to add/remove packages as needed

### Change Log

| Date       | Version | Description                    | Author          |
|------------|---------|--------------------------------|-----------------|
| 2025-10-01 | 1.0     | Initial architecture document  | Architect Agent |

---

## High Level Architecture

### Technical Summary

SimpleShop采用前后端分离的单体架构，使用 Turborepo 管理 monorepo。前端基于 Next.js 14 (App Router) 提供服务端渲染和静态生成能力，后端使用 Express.js 提供 RESTful API。数据持久化采用 PostgreSQL + Prisma ORM，确保类型安全和开发效率。系统部署在云平台（Vercel + Railway），利用免费额度降低运营成本。整体架构支持 PRD 中定义的所有功能需求，同时保持简单性和可扩展性。

### High Level Overview

**架构风格**: 前后端分离的单体架构（Monolithic with separated frontend）

**Repository Structure**: Monorepo（使用 Turborepo）
- 统一管理前后端代码
- 共享类型定义和工具
- 简化依赖管理和构建流程

**Service Architecture**:
- **Frontend Service**: Next.js 应用，处理 UI 渲染和用户交互
- **Backend Service**: Express.js API，处理业务逻辑和数据操作
- **Database**: PostgreSQL，存储所有业务数据
- **Cache Layer**: Redis，用于会话管理和缓存
- **External Services**: Cloudinary（图片存储）、Resend（邮件）、Alipay（支付）

**User Interaction Flow**:
1. 用户通过浏览器访问 Next.js 前端应用
2. 前端调用后端 RESTful API 获取/提交数据
3. 后端通过 Prisma ORM 与 PostgreSQL 交互
4. 后端集成第三方服务（支付、图片存储等）
5. 响应数据返回前端，更新 UI

**Key Architectural Decisions**:
- **Monorepo**: 便于代码共享和统一管理，适合全栈项目
- **TypeScript**: 全栈类型安全，减少运行时错误
- **Prisma ORM**: 类型安全的数据库访问，优秀的开发体验
- **JWT Authentication**: 无状态认证，易于扩展
- **RESTful API**: 简单直观，易于理解和使用

### High Level Project Diagram

```mermaid
graph TB
    User[用户浏览器]
    
    subgraph "Frontend - Vercel"
        NextJS[Next.js App<br/>React + TypeScript]
    end
    
    subgraph "Backend - Railway/Render"
        API[Express.js API<br/>TypeScript]
        Auth[JWT Auth<br/>Middleware]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Supabase)]
        Cache[(Redis<br/>Upstash)]
    end
    
    subgraph "External Services"
        Cloudinary[Cloudinary<br/>Image Storage]
        Resend[Resend<br/>Email Service]
        Alipay[Alipay<br/>Payment Gateway]
    end
    
    User -->|HTTPS| NextJS
    NextJS -->|REST API| API
    API --> Auth
    Auth -->|Prisma ORM| DB
    API --> Cache
    API -->|Upload Images| Cloudinary
    API -->|Send Emails| Resend
    API -->|Process Payments| Alipay
    
    style NextJS fill:#61dafb
    style API fill:#68a063
    style DB fill:#336791
    style Cache fill:#dc382d
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with SSR/SSG |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first CSS framework |
| shadcn/ui | Latest | Pre-built UI components |
| Zustand | 4+ | State management |
| React Hook Form | 7+ | Form handling |
| Zod | 3+ | Schema validation |
| Axios | 1+ | HTTP client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4+ | Web framework |
| TypeScript | 5+ | Type safety |
| Prisma | 5+ | ORM and database toolkit |
| bcrypt | 5+ | Password hashing |
| jsonwebtoken | 9+ | JWT authentication |
| multer | 1+ | File upload handling |
| express-validator | 7+ | Request validation |

### Database & Cache

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 14+ | Primary database |
| Redis | 7+ | Cache and session storage |

### External Services

| Service | Purpose |
|---------|---------|
| Cloudinary | Image storage and CDN |
| Resend | Transactional emails |
| Alipay Sandbox | Payment processing |
| Sentry | Error tracking and monitoring |

### Development Tools

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo management |
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| Jest | Unit testing |
| Supertest | API testing |
| Playwright | E2E testing |
| GitHub Actions | CI/CD |

### Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend API | Railway or Render |
| Database | Supabase PostgreSQL |
| Redis | Upstash |

---

## Project Structure

```
simpleshop/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── (auth)/    # Auth routes group
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (customer)/ # Customer routes group
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── cart/
│   │   │   │   │   └── orders/
│   │   │   │   ├── (merchant)/ # Merchant routes group
│   │   │   │   │   └── merchant/
│   │   │   │   │       ├── dashboard/
│   │   │   │   │       ├── products/
│   │   │   │   │       └── orders/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # shadcn/ui components
│   │   │   │   ├── layout/    # Layout components
│   │   │   │   ├── products/  # Product components
│   │   │   │   ├── cart/      # Cart components
│   │   │   │   └── orders/    # Order components
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   │   ├── api.ts     # API client
│   │   │   │   ├── auth.ts    # Auth utilities
│   │   │   │   └── utils.ts   # General utilities
│   │   │   ├── stores/        # Zustand stores
│   │   │   │   ├── auth.ts
│   │   │   │   └── cart.ts
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── types/         # TypeScript types
│   │   ├── public/            # Static assets
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                    # Express.js backend application
│       ├── src/
│       │   ├── index.ts       # Application entry point
│       │   ├── app.ts         # Express app configuration
│       │   ├── routes/        # API routes
│       │   │   ├── auth.routes.ts
│       │   │   ├── products.routes.ts
│       │   │   ├── cart.routes.ts
│       │   │   ├── orders.routes.ts
│       │   │   ├── payments.routes.ts
│       │   │   └── upload.routes.ts
│       │   ├── controllers/   # Route controllers
│       │   │   ├── auth.controller.ts
│       │   │   ├── products.controller.ts
│       │   │   ├── cart.controller.ts
│       │   │   ├── orders.controller.ts
│       │   │   └── payments.controller.ts
│       │   ├── services/      # Business logic
│       │   │   ├── auth.service.ts
│       │   │   ├── products.service.ts
│       │   │   ├── cart.service.ts
│       │   │   ├── orders.service.ts
│       │   │   └── payments.service.ts
│       │   ├── middleware/    # Express middleware
│       │   │   ├── auth.middleware.ts
│       │   │   ├── error.middleware.ts
│       │   │   └── validation.middleware.ts
│       │   ├── utils/         # Utilities
│       │   │   ├── jwt.ts
│       │   │   ├── bcrypt.ts
│       │   │   └── response.ts
│       │   ├── config/        # Configuration
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   └── cloudinary.ts
│       │   └── types/         # TypeScript types
│       ├── prisma/
│       │   ├── schema.prisma  # Prisma schema
│       │   ├── migrations/    # Database migrations
│       │   └── seed.ts        # Seed data
│       ├── tests/             # Tests
│       │   ├── unit/
│       │   └── integration/
│       └── package.json
│
├── packages/
│   ├── shared/                # Shared code
│   │   ├── src/
│   │   │   ├── types/         # Shared TypeScript types
│   │   │   └── constants/     # Shared constants
│   │   └── package.json
│   │
│   ├── ui/                    # Shared UI components (if needed)
│   │   └── package.json
│   │
│   └── config/                # Shared configurations
│       ├── eslint-config/
│       ├── typescript-config/
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI workflow
│       └── deploy.yml         # Deployment workflow
│
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json
├── .gitignore
└── README.md
```

---

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model - supports both merchants and customers
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      UserRole @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  products  Product[]
  cartItems CartItem[]
  orders    Order[]

  @@index([email])
  @@map("users")
}

enum UserRole {
  MERCHANT
  CUSTOMER
}

// Product model
model Product {
  id          String        @id @default(cuid())
  merchantId  String
  name        String
  description String?       @db.Text
  price       Decimal       @db.Decimal(10, 2)
  stock       Int           @default(0)
  imageUrl    String?
  status      ProductStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  merchant   User        @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@index([merchantId])
  @@index([status])
  @@index([createdAt])
  @@map("products")
}

enum ProductStatus {
  ACTIVE
  INACTIVE
}

// Cart item model
model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@map("cart_items")
}

// Order model
model Order {
  id              String      @id @default(cuid())
  userId          String
  totalAmount     Decimal     @db.Decimal(10, 2)
  status          OrderStatus @default(PENDING)
  shippingName    String
  shippingPhone   String
  shippingAddress String      @db.Text
  paymentId       String?
  paidAt          DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

enum OrderStatus {
  PENDING       // 待支付
  PAID          // 已支付
  PROCESSING    // 处理中
  SHIPPED       // 已发货
  COMPLETED     // 已完成
  CANCELLED     // 已取消
}

// Order item model
model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2) // Snapshot of price at order time
  createdAt DateTime @default(now())

  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}
```

### Database Relationships

```mermaid
erDiagram
    User ||--o{ Product : "creates"
    User ||--o{ CartItem : "has"
    User ||--o{ Order : "places"
    Product ||--o{ CartItem : "in"
    Product ||--o{ OrderItem : "in"
    Order ||--o{ OrderItem : "contains"

    User {
        string id PK
        string email UK
        string password
        string name
        enum role
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK
        string merchantId FK
        string name
        string description
        decimal price
        int stock
        string imageUrl
        enum status
        datetime createdAt
        datetime updatedAt
    }

    CartItem {
        string id PK
        string userId FK
        string productId FK
        int quantity
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        string userId FK
        decimal totalAmount
        enum status
        string shippingName
        string shippingPhone
        string shippingAddress
        string paymentId
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        decimal price
        datetime createdAt
    }
```

---

## API Design

### API Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.simpleshop.com/api`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

### API Endpoints

#### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |

#### Products

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/products` | List products | No | - |
| GET | `/products/:id` | Get product details | No | - |
| POST | `/products` | Create product | Yes | Merchant |
| PUT | `/products/:id` | Update product | Yes | Merchant |
| DELETE | `/products/:id` | Delete product | Yes | Merchant |
| PATCH | `/products/:id/status` | Update product status | Yes | Merchant |

#### Cart

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get cart items | Yes |
| POST | `/cart` | Add item to cart | Yes |
| PUT | `/cart/:id` | Update cart item quantity | Yes |
| DELETE | `/cart/:id` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear cart | Yes |

#### Orders

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/orders` | List user's orders | Yes | Customer |
| GET | `/orders/:id` | Get order details | Yes | Customer |
| POST | `/orders` | Create order | Yes | Customer |
| GET | `/merchant/orders` | List merchant's orders | Yes | Merchant |
| PATCH | `/orders/:id/status` | Update order status | Yes | Merchant |

#### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments/create` | Create payment | Yes |
| POST | `/payments/callback` | Payment callback | No |
| GET | `/payments/return` | Payment return | No |
| GET | `/payments/status/:orderId` | Check payment status | Yes |

#### Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload image | Yes |

#### Merchant Stats

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/merchant/stats` | Get merchant statistics | Yes | Merchant |

---

## Frontend Architecture

### Routing Structure

```
/                           # Home page (product list)
/products                   # Product list page
/products/:id               # Product detail page
/cart                       # Shopping cart page
/checkout                   # Checkout page
/orders                     # Order history (customer)
/orders/:id                 # Order detail page
/orders/:id/confirmation    # Order confirmation page
/login                      # Login page
/register                   # Register page

/merchant/dashboard         # Merchant dashboard
/merchant/products          # Merchant product list
/merchant/products/new      # Create new product
/merchant/products/:id/edit # Edit product
/merchant/orders            # Merchant order list
/merchant/orders/:id        # Merchant order detail
```

### State Management

**Zustand Stores**:

1. **Auth Store** (`stores/auth.ts`)
   - User information
   - Login/logout actions
   - Token management

2. **Cart Store** (`stores/cart.ts`)
   - Cart items
   - Cart count
   - Add/update/remove actions

### Component Organization

**UI Components** (`components/ui/`):
- Button, Input, Card, Dialog, etc. (shadcn/ui)

**Layout Components** (`components/layout/`):
- Header, Footer, Sidebar, Layout

**Feature Components**:
- `components/products/` - ProductCard, ProductList, ProductForm
- `components/cart/` - CartItem, CartSummary
- `components/orders/` - OrderCard, OrderList, OrderStatus

### API Client

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Enter credentials
    Frontend->>API: POST /auth/login
    API->>DB: Query user
    DB-->>API: User data
    API->>API: Verify password (bcrypt)
    API->>API: Generate JWT token
    API-->>Frontend: Return token + user data
    Frontend->>Frontend: Store token in localStorage
    Frontend-->>User: Redirect to dashboard
```

### Authorization

**Role-Based Access Control (RBAC)**:

- **Customer Role**:
  - Browse products
  - Manage cart
  - Create orders
  - View own orders

- **Merchant Role**:
  - All customer permissions
  - Manage own products
  - View orders containing own products
  - Update order status

**Middleware Implementation**:

```typescript
// middleware/auth.middleware.ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### Data Protection

1. **Password Security**:
   - Passwords hashed with bcrypt (salt rounds: 10)
   - Never store plain text passwords
   - Never return passwords in API responses

2. **SQL Injection Prevention**:
   - Use Prisma ORM (parameterized queries)
   - Never concatenate user input into queries

3. **XSS Prevention**:
   - React automatically escapes output
   - Sanitize user input on backend
   - Use Content Security Policy headers

4. **CSRF Protection**:
   - Use SameSite cookies
   - Implement CSRF tokens for state-changing operations

5. **HTTPS**:
   - All production traffic over HTTPS
   - Secure cookies with httpOnly and secure flags

---

## Deployment Architecture

### Infrastructure Diagram

```mermaid
graph TB
    subgraph "Client"
        Browser[Web Browser]
    end

    subgraph "Vercel"
        NextJS[Next.js App<br/>CDN + Edge Functions]
    end

    subgraph "Railway/Render"
        API[Express.js API<br/>Container]
    end

    subgraph "Supabase"
        DB[(PostgreSQL)]
    end

    subgraph "Upstash"
        Redis[(Redis)]
    end

    subgraph "External Services"
        Cloudinary[Cloudinary]
        Resend[Resend]
        Alipay[Alipay]
        Sentry[Sentry]
    end

    Browser -->|HTTPS| NextJS
    NextJS -->|API Calls| API
    API --> DB
    API --> Redis
    API --> Cloudinary
    API --> Resend
    API --> Alipay
    API --> Sentry
    NextJS --> Sentry
```

### Environment Variables

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Backend (.env)**:
```bash
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/simpleshop

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend
RESEND_API_KEY=your_resend_api_key

# Alipay
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# Sentry
SENTRY_DSN=your_sentry_dsn
```

### CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C{Branch?}
    C -->|PR| D[Run Tests]
    C -->|main| E[Run Tests]
    D --> F[Lint & Type Check]
    F --> G[Build]
    E --> H[Lint & Type Check]
    H --> I[Build]
    I --> J[Deploy Frontend to Vercel]
    I --> K[Deploy Backend to Railway]
```

**GitHub Actions Workflow**:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
```

---

## Development Workflow

### Getting Started

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/simpleshop.git
   cd simpleshop
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment Variables**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

4. **Setup Database**:
   ```bash
   cd apps/api
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev
   ```

### Development Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:e2e": "turbo run test:e2e"
  }
}
```

### Coding Standards

1. **TypeScript**:
   - Use strict mode
   - Define explicit types for function parameters and return values
   - Avoid `any` type

2. **Naming Conventions**:
   - Components: PascalCase (`ProductCard.tsx`)
   - Files: kebab-case (`product-card.tsx`)
   - Functions: camelCase (`getUserById`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

3. **Code Organization**:
   - One component per file
   - Group related files in feature folders
   - Keep files under 300 lines

4. **Testing**:
   - Write tests for all business logic
   - Test happy paths and error cases
   - Use descriptive test names

---

## Next Steps

This architecture document provides the foundation for implementing SimpleShop. The next steps are:

1. **PO Review**: Product Owner should review and validate the architecture against PRD requirements
2. **Document Sharding**: PO should shard the PRD and Architecture into individual Epic and Story documents
3. **Development**: Begin implementing stories in sequential order, starting with Epic 1

---

**Document End**

