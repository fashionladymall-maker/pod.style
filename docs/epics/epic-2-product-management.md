# Epic 2: 商品管理系统

**Epic ID**: EPIC-2  
**Status**: Not Started  
**Priority**: P0 (Critical)  
**Estimated Duration**: 1 week

---

## Epic Goal

实现商家端的完整商品管理功能，包括商品的创建、编辑、删除、图片上传和库存管理。商家可以通过管理后台轻松管理自己的商品目录。

---

## Business Value

- 商家可以独立管理商品，无需技术支持
- 支持图片上传，提升商品展示质量
- 库存管理帮助商家避免超卖
- 上架/下架功能提供灵活的商品控制

---

## Success Criteria

- [ ] 商家可以创建新商品并上传图片
- [ ] 商家可以编辑已有商品的所有信息
- [ ] 商家可以删除商品
- [ ] 商家可以查看所有自己的商品列表
- [ ] 商家可以控制商品的上架/下架状态
- [ ] 图片上传功能稳定，支持常见图片格式
- [ ] 所有操作有适当的权限控制

---

## Stories

1. **Story 2.1**: 商品数据模型与 API 基础
2. **Story 2.2**: 图片上传功能
3. **Story 2.3**: 商品创建页面
4. **Story 2.4**: 商品列表与管理页面
5. **Story 2.5**: 商品编辑功能
6. **Story 2.6**: 商品上架/下架功能

---

## Technical Dependencies

- Epic 1 完成（认证系统）
- Cloudinary 账号和 API 密钥
- Prisma schema 更新

---

## User Actions Required

- [ ] 创建 Cloudinary 账号 (https://cloudinary.com/users/register/free)
- [ ] 获取 Cloudinary API 密钥
- [ ] 配置环境变量

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 图片上传失败 | Medium | Medium | 实现错误处理和重试机制 |
| 图片文件过大 | Low | High | 限制文件大小，前端压缩 |
| Cloudinary 配额超限 | Medium | Low | 监控使用量，使用免费额度 |

---

## Definition of Done

- [ ] 所有 6 个 Story 完成
- [ ] 所有验收标准通过
- [ ] 商家可以完成完整的商品管理流程
- [ ] 图片上传功能稳定
- [ ] 单元测试和集成测试通过
- [ ] PO 验收通过

---

## Related Documents

- [PRD](../simpleshop-prd.md)
- [Architecture](../simpleshop-architecture.md)
- [Epic 1](./epic-1-foundation-auth.md)

