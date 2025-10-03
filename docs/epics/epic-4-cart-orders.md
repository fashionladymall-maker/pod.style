# Epic 4: 购物车与订单流程

**Epic ID**: EPIC-4  
**Status**: Not Started  
**Priority**: P0 (Critical)  
**Estimated Duration**: 1-2 weeks

---

## Epic Goal

实现完整的购物车和订单管理功能，让消费者可以添加商品到购物车、创建订单，商家可以管理订单。

---

## Business Value

- 消费者可以收集商品并统一结算
- 订单系统记录所有交易
- 商家可以追踪和处理订单
- 库存自动管理，避免超卖

---

## Success Criteria

- [ ] 消费者可以添加商品到购物车
- [ ] 购物车可以修改数量和删除商品
- [ ] 消费者可以从购物车创建订单
- [ ] 订单创建时自动扣减库存
- [ ] 消费者可以查看订单历史
- [ ] 商家可以查看和管理订单
- [ ] 订单状态可以更新

---

## Stories

1. **Story 4.1**: 购物车数据模型与 API
2. **Story 4.2**: 购物车页面
3. **Story 4.3**: 购物车图标与数量提示
4. **Story 4.4**: 订单数据模型与创建 API
5. **Story 4.5**: 结算页面
6. **Story 4.6**: 订单确认与详情页面
7. **Story 4.7**: 订单历史列表（消费者端）
8. **Story 4.8**: 订单管理（商家端）

---

## Technical Dependencies

- Epic 1 完成（用户认证）
- Epic 2 完成（商品数据）
- Epic 3 完成（商品展示）
- Prisma schema 更新

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 库存并发问题 | High | Medium | 使用数据库事务，乐观锁 |
| 购物车数据丢失 | Medium | Low | 持久化到数据库 |
| 订单创建失败 | High | Low | 实现完整的错误处理和回滚 |

---

## Definition of Done

- [ ] 所有 8 个 Story 完成
- [ ] 消费者可以完成完整的购物流程
- [ ] 商家可以管理订单
- [ ] 库存管理正确
- [ ] 所有边界情况测试通过
- [ ] PO 验收通过

---

## Related Documents

- [PRD](../simpleshop-prd.md)
- [Architecture](../simpleshop-architecture.md)
- [Epic 1](./epic-1-foundation-auth.md)
- [Epic 2](./epic-2-product-management.md)
- [Epic 3](./epic-3-product-display.md)

