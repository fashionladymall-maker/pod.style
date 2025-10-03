---
id: M2-COMMERCE-002
name: 结算页与 Stripe 支付集成
type: feature
priority: P1
owner: augment
estimate: 6h
acceptance:
  - 结算页展示订单摘要和配送表单
  - Stripe Elements 集成完成
  - 支付成功后创建订单
  - Webhook 处理支付回调
  - 单测覆盖 ≥ 80%
telemetry:
  - 支付成功率、失败原因分布
  - 结算页放弃率
risk:
  - Stripe Webhook 签名验证失败
  - 支付成功但订单创建失败
---

## 任务目标
实现完整的 Stripe 支付流程：结算页 → Payment Intent → 支付确认 → Webhook → 订单创建。

## 核心需求
详见 M2-COMMERCE-001，本任务聚焦 Stripe 集成部分。

