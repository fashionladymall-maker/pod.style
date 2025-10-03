# SimpleShop User Stories

This directory contains all user stories for the SimpleShop project, organized by Epic.

---

## Epic 1: 项目基础设施与用户认证

| Story ID | Title | Status | Priority | Effort |
|----------|-------|--------|----------|--------|
| [1.1](./story-1.1-project-init.md) | 项目初始化与 Monorepo 设置 | Not Started | P0 | 4h |
| [1.2](./story-1.2-nextjs-setup.md) | Next.js 前端应用骨架 | Not Started | P0 | 3h |
| [1.3](./story-1.3-express-setup.md) | Express.js 后端 API 骨架 | Not Started | P0 | 3h |
| [1.4](./story-1.4-database-setup.md) | PostgreSQL 数据库设置与 Prisma 集成 | Not Started | P0 | 3h |
| [1.5](./story-1.5-user-registration.md) | 用户注册功能 | Not Started | P0 | 4h |
| [1.6](./story-1.6-user-login.md) | 用户登录功能 | Not Started | P0 | 3h |
| [1.7](./story-1.7-auth-middleware.md) | 认证中间件与受保护路由 | Not Started | P0 | 4h |
| [1.8](./story-1.8-cicd-setup.md) | CI/CD 流程设置 | Not Started | P0 | 4h |

**Epic Total**: 28 hours (~1-2 weeks)

---

## Epic 2: 商品管理系统

| Story ID | Title | Status | Priority | Effort |
|----------|-------|--------|----------|--------|
| [2.1](./story-2.1-product-model-api.md) | 商品数据模型与 API 基础 | Not Started | P0 | 4h |
| [2.2](./story-2.2-image-upload.md) | 图片上传功能 | Not Started | P0 | 4h |
| [2.3](./story-2.3-product-create.md) | 商品创建页面 | Not Started | P0 | 4h |
| [2.4](./story-2.4-product-list.md) | 商品列表与管理页面 | Not Started | P0 | 4h |
| [2.5](./story-2.5-product-edit.md) | 商品编辑功能 | Not Started | P0 | 3h |
| [2.6](./story-2.6-product-status.md) | 商品上架/下架功能 | Not Started | P0 | 2h |

**Epic Total**: 21 hours (~1 week)

---

## Epic 3: 商品展示与搜索

| Story ID | Title | Status | Priority | Effort |
|----------|-------|--------|----------|--------|
| [3.1](./story-3.1-product-list-customer.md) | 商品列表页面（消费者端） | Not Started | P0 | 4h |
| [3.2](./story-3.2-product-search.md) | 商品搜索功能 | Not Started | P0 | 3h |
| [3.3](./story-3.3-product-detail.md) | 商品详情页面 | Not Started | P0 | 4h |
| [3.4](./story-3.4-product-sort.md) | 商品排序功能 | Not Started | P1 | 2h |

**Epic Total**: 13 hours (~3-5 days)

---

## Epic 4: 购物车与订单流程

| Story ID | Title | Status | Priority | Effort |
|----------|-------|--------|----------|--------|
| [4.1](./story-4.1-cart-model-api.md) | 购物车数据模型与 API | Not Started | P0 | 4h |
| [4.2](./story-4.2-cart-page.md) | 购物车页面 | Not Started | P0 | 4h |
| [4.3](./story-4.3-cart-icon.md) | 购物车图标与数量提示 | Not Started | P0 | 2h |
| [4.4](./story-4.4-order-model-api.md) | 订单数据模型与创建 API | Not Started | P0 | 5h |
| [4.5](./story-4.5-checkout-page.md) | 结算页面 | Not Started | P0 | 4h |
| [4.6](./story-4.6-order-confirmation.md) | 订单确认与详情页面 | Not Started | P0 | 3h |
| [4.7](./story-4.7-order-history.md) | 订单历史列表（消费者端） | Not Started | P0 | 3h |
| [4.8](./story-4.8-merchant-orders.md) | 订单管理（商家端） | Not Started | P0 | 5h |

**Epic Total**: 30 hours (~1-2 weeks)

---

## Epic 5: 支付集成与订单完成

| Story ID | Title | Status | Priority | Effort |
|----------|-------|--------|----------|--------|
| [5.1](./story-5.1-payment-sdk.md) | 支付宝 SDK 集成与配置 | Not Started | P0 | 4h |
| [5.2](./story-5.2-payment-create.md) | 创建支付订单 | Not Started | P0 | 4h |
| [5.3](./story-5.3-payment-callback.md) | 支付回调处理 | Not Started | P0 | 4h |
| [5.4](./story-5.4-payment-status.md) | 支付状态查询 | Not Started | P0 | 3h |
| [5.5](./story-5.5-merchant-dashboard.md) | 商家管理后台首页 | Not Started | P0 | 4h |

**Epic Total**: 19 hours (~1 week)

---

## Project Summary

- **Total Stories**: 31
- **Total Estimated Effort**: 111 hours (~3-4 weeks for 1 developer)
- **Total Epics**: 5

---

## Story Status Legend

- **Not Started**: Story has not been started
- **In Progress**: Story is currently being worked on
- **In Review**: Story is complete and awaiting review
- **Done**: Story is complete and approved

---

## Priority Legend

- **P0**: Critical - Must have for MVP
- **P1**: High - Important but not blocking
- **P2**: Medium - Nice to have
- **P3**: Low - Future enhancement

---

## How to Use This Directory

1. **Start with Epic 1**: Complete all stories in Epic 1 before moving to Epic 2
2. **Follow Story Order**: Stories within each Epic should be completed in order
3. **Update Status**: Mark stories as you progress
4. **Reference Documents**: Each story links to relevant architecture and Epic documents
5. **Track Time**: Compare actual time spent vs estimates to improve future planning

---

## Development Workflow

1. Read the story document thoroughly
2. Review acceptance criteria
3. Check dependencies are met
4. Implement the story
5. Run tests
6. Update story status
7. Move to next story

---

## Notes

- All stories include detailed acceptance criteria
- Technical implementation details are provided
- Testing checklists ensure quality
- Dependencies are clearly marked
- User actions are identified where needed

---

## Related Documents

- [Project Brief](../brief.md)
- [PRD](../simpleshop-prd.md)
- [Architecture](../simpleshop-architecture.md)
- [Epics Directory](../epics/)

