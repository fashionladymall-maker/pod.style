# Story 1.1: 项目初始化与 Monorepo 设置

**Story ID**: STORY-1.1  
**Epic**: [Epic 1 - 项目基础设施与用户认证](../epics/epic-1-foundation-auth.md)  
**Status**: Not Started  
**Priority**: P0 (Critical)  
**Estimated Effort**: 4 hours

---

## User Story

As a **开发者**,  
I want **建立 Turborepo monorepo 结构并配置基础工具链**,  
so that **团队可以在统一的代码库中高效开发前后端应用**。

---

## Acceptance Criteria

1. ✅ 创建 Turborepo monorepo 结构，包含 `apps/web`、`apps/api`、`packages/shared`、`packages/config` 目录
2. ✅ 配置 TypeScript，所有包共享统一的 tsconfig 基础配置
3. ✅ 配置 ESLint 和 Prettier，确保代码风格一致
4. ✅ 配置 Husky 和 lint-staged，实现 pre-commit 代码检查
5. ✅ 创建 package.json scripts：`dev`、`build`、`lint`、`test`
6. ✅ 添加 README.md，包含项目说明和开发指南
7. ✅ 初始化 Git 仓库并创建 .gitignore 文件
8. ✅ 项目可以成功运行 `npm run dev` 启动开发环境

---

## Technical Details

### Directory Structure

```
simpleshop/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # Express.js backend
├── packages/
│   ├── shared/                 # Shared types and utilities
│   ├── ui/                     # Shared UI components (optional)
│   └── config/                 # Shared configs
│       ├── eslint-config/
│       └── typescript-config/
├── .github/
│   └── workflows/
├── turbo.json
├── package.json
├── .gitignore
├── .eslintrc.js
├── .prettierrc
└── README.md
```

### Root package.json

```json
{
  "name": "simpleshop",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^14.0.0"
  }
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# Turbo
.turbo
```

---

## Implementation Steps

1. **Initialize Project**
   ```bash
   mkdir simpleshop
   cd simpleshop
   npm init -y
   ```

2. **Install Turborepo**
   ```bash
   npm install turbo --save-dev
   ```

3. **Create Directory Structure**
   ```bash
   mkdir -p apps/web apps/api packages/shared packages/config/eslint-config packages/config/typescript-config
   ```

4. **Setup Turbo Configuration**
   - Create `turbo.json` with pipeline configuration

5. **Setup TypeScript**
   - Create base `tsconfig.json` in `packages/config/typescript-config/`
   - Create app-specific tsconfig files

6. **Setup ESLint & Prettier**
   - Install dependencies
   - Create `.eslintrc.js` and `.prettierrc`
   - Create shared ESLint config in `packages/config/eslint-config/`

7. **Setup Husky & lint-staged**
   ```bash
   npx husky-init
   npm install lint-staged --save-dev
   ```
   - Configure pre-commit hook

8. **Create README.md**
   - Project description
   - Setup instructions
   - Development workflow

9. **Initialize Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Project setup"
   ```

10. **Verify Setup**
    ```bash
    npm run lint
    npm run type-check
    ```

---

## Testing Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run lint` runs successfully
- [ ] `npm run format` formats code correctly
- [ ] Git pre-commit hook runs lint-staged
- [ ] Directory structure matches specification
- [ ] README.md is clear and complete

---

## Dependencies

**Before**: None (first story)  
**After**: Story 1.2, 1.3 (app setup)

---

## Notes

- Use npm workspaces for package management
- Keep turbo.json simple initially, can expand later
- Ensure all team members can run the setup successfully
- Document any platform-specific setup requirements

---

## Related Documents

- [Epic 1](../epics/epic-1-foundation-auth.md)
- [Architecture](../simpleshop-architecture.md)
- [Next Story: 1.2](./story-1.2-nextjs-setup.md)

