---
id: M3-RENDER-001
name: Print-ready 渲染队列与校验
type: feature
priority: P2
owner: augment
estimate: 8h
acceptance:
  - Cloud Tasks 队列配置完成
  - 渲染 Worker 实现（分辨率/出血/ICC 校验）
  - 生成 print-ready 文件并上传 Storage
  - 订单绑定 printAsset
  - 单测覆盖 ≥ 80%
telemetry:
  - 渲染成功率、失败原因
  - 平均渲染时长
risk:
  - 渲染超时
  - 文件格式不兼容
---

## 任务目标
实现异步渲染队列，将用户设计转换为工厂可用的 print-ready 文件（高分辨率 TIFF/PDF）。

## 核心需求
1. 配置 Cloud Tasks 队列
2. 实现渲染 Worker（`functions/src/render/worker.ts`）
3. 校验：分辨率 ≥ 300 DPI、出血 3mm、安全区、ICC 配置
4. 生成报告并上传到 `prints/{orderId}/{lineItemId}/`
5. 回填 `designs.printAsset`

## 实现步骤

### Step 1: 配置 Cloud Tasks 队列
- [x] 在 `firebase.json` 中添加 Cloud Tasks 队列配置
- [x] 创建 `infra/tasks/render-queue.yaml` 定义队列参数

### Step 2: 实现渲染 Worker
- [x] 新建 `functions/src/render/worker.ts` 并实现 Sharp 图像处理
- [x] 校验分辨率 ≥ 300 DPI、出血 3mm、安全区、ICC 配置
- [x] 生成 TIFF/PDF 输出并嵌入 ICC Profile

### Step 3: Storage 上传
- [x] 上传 `prints/{orderId}/{lineItemId}/print-ready.tif`
- [x] 生成渲染报告 JSON 并保存同路径

### Step 4: Firestore 回填
- [x] 更新 `designs/{designId}` 的 `printAsset` 字段
- [x] 写入 url/dpi/icc/checksum/reportId 等元数据

### Step 5: 测试与文档
- [x] 添加函数级单测覆盖核心校验逻辑
- [x] 更新 `CHANGELOG.md` 与 Story 文件
- [x] 运行 `npm run lint` / `typecheck` / `test` / `build`

## DoD（Definition of Done）
- [x] `npm run build` 通过（0 错误）
- [x] `npm run lint` 通过（0 错误）
- [x] `npm run typecheck` 通过（0 错误）
- [x] `npm run test` 通过（关键路径）
- [x] 创建分支 `feature/M3-RENDER-001`
- [ ] 提交代码并推送
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 文件标记完成


