---
id: M3-RENDER-002
name: 订单与 Print-ready 文件绑定
type: feature
priority: P2
owner: augment
estimate: 4h
acceptance:
  - 订单创建时触发渲染任务
  - printAsset 绑定到订单项
  - 下载接口实现
  - 工厂回传占位接口
telemetry:
  - 渲染触发成功率
  - 下载次数
risk:
  - 渲染失败导致订单阻塞
---

## 任务目标
将渲染流程与订单流程打通，确保每个订单项都有对应的 print-ready 文件。

## 实现步骤

### Step 1: 订单创建触发渲染
- [x] 在 `/api/orders/place` 中为每个 lineItem 创建 Cloud Tasks 任务
- [x] 记录 `orders/{orderId}/items/{lineItemId}` 渲染元数据与初始状态

### Step 2: printAsset 绑定
- [x] 渲染 Worker 回填订单项 `printAsset`、`renderStatus`、报告路径
- [x] 同步 `designs/{designId}` 的 printAsset 更新保持一致

### Step 3: 下载接口
- [x] 新建 `functions/src/orders/download.ts` 校验 owner 权限并返回 1 小时有效的 Signed URL

### Step 4: 工厂回传占位
- [x] 新建 `functions/src/orders/factory-callback.ts` 接收 printing/shipped/delivered 状态
- [x] 更新订单状态历史与行项目履约状态

## DoD（Definition of Done）
- [x] `npm run build` 通过（0 错误）
- [x] `npm run lint` 通过（0 错误）
- [x] `npm run typecheck` 通过（0 错误）
- [x] `npm run test` 通过（关键路径）
- [x] 创建分支 `feature/M3-RENDER-002`
- [ ] 提交代码并推送
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 文件标记完成
