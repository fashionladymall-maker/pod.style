# Story 1.4: PostgreSQL 数据库设置与 Prisma 集成

**Story ID**: STORY-1.4  
**Epic**: [Epic 1 - 项目基础设施与用户认证](../epics/epic-1-foundation-auth.md)  
**Status**: Not Started  
**Priority**: P0 (Critical)  
**Estimated Effort**: 3 hours

---

## User Story

As a **开发者**,  
I want **设置 PostgreSQL 数据库并集成 Prisma ORM**,  
so that **可以进行类型安全的数据库操作**。

---

## Acceptance Criteria

1. ✅ 创建 Prisma schema 文件，定义 User 模型（id、email、password、role、createdAt、updatedAt）
2. ✅ 配置 Prisma 连接到 PostgreSQL 数据库
3. ✅ 创建数据库迁移脚本
4. ✅ 生成 Prisma Client
5. ✅ 在 API 中创建数据库连接模块
6. ✅ 实现数据库连接健康检查
7. ✅ 添加 seed 脚本用于开发环境数据初始化
8. ✅ 数据库迁移可以成功执行
9. ✅ 可以通过 Prisma Client 查询数据库

---

## Technical Details

### Prisma Schema

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      UserRole @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

enum UserRole {
  MERCHANT
  CUSTOMER
}
```

### Database Connection Module

```typescript
// apps/api/src/config/database.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### Seed Script

```typescript
// apps/api/prisma/seed.ts

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test merchant
  const merchantPassword = await bcrypt.hash('password123', 10);
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@test.com' },
    update: {},
    create: {
      email: 'merchant@test.com',
      password: merchantPassword,
      name: 'Test Merchant',
      role: UserRole.MERCHANT,
    },
  });

  // Create test customer
  const customerPassword = await bcrypt.hash('password123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: customerPassword,
      name: 'Test Customer',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('Seed data created:', { merchant, customer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Implementation Steps

1. **Install Prisma**
   ```bash
   cd apps/api
   npm install prisma @prisma/client
   npm install -D prisma
   ```

2. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

3. **Configure Database URL**
   - Update `.env` with DATABASE_URL
   - For local development: `postgresql://user:password@localhost:5432/simpleshop`
   - For Supabase: Use provided connection string

4. **Create Prisma Schema**
   - Define User model in `prisma/schema.prisma`

5. **Create Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

7. **Create Database Config Module**
   - Create `src/config/database.ts`

8. **Add Health Check Endpoint**
   ```typescript
   // In apps/api/src/routes/health.routes.ts
   router.get('/health/db', async (req, res) => {
     const isHealthy = await checkDatabaseConnection();
     res.json({ status: isHealthy ? 'ok' : 'error' });
   });
   ```

9. **Create Seed Script**
   - Create `prisma/seed.ts`
   - Add to package.json:
     ```json
     "prisma": {
       "seed": "ts-node prisma/seed.ts"
     }
     ```

10. **Run Seed**
    ```bash
    npx prisma db seed
    ```

---

## Environment Variables

```bash
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/simpleshop"
```

---

## Testing Checklist

- [ ] Prisma migration runs successfully
- [ ] Prisma Client generates without errors
- [ ] Can connect to database
- [ ] Health check endpoint returns success
- [ ] Seed script creates test users
- [ ] Can query users from database
- [ ] Database connection closes gracefully

---

## Dependencies

**Before**: Story 1.3 (API setup)  
**After**: Story 1.5 (User registration - needs User model)

---

## User Actions Required

- [ ] Setup PostgreSQL database (local or Supabase)
- [ ] Configure DATABASE_URL in .env file

---

## Notes

- Use Supabase for easy PostgreSQL hosting (free tier)
- Keep migrations in version control
- Seed data is for development only
- Use connection pooling in production

---

## Related Documents

- [Epic 1](../epics/epic-1-foundation-auth.md)
- [Architecture - Database Schema](../simpleshop-architecture.md#database-schema)
- [Previous Story: 1.3](./story-1.3-express-setup.md)
- [Next Story: 1.5](./story-1.5-user-registration.md)

