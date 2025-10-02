---
id: M4-COMPLIANCE-001
name: 内容审核与合规
type: feature
priority: P1
owner: augment
estimate: 6h
acceptance:
  - 文本审核（敏感词/违禁内容）
  - 图像审核（暴力/色情/政治）
  - 审核结果记录与申诉
  - 单测覆盖 ≥ 80%
telemetry:
  - 审核通过率、拒绝原因分布
  - 人工复审率
risk:
  - 误杀率过高
  - 审核延迟影响发布
---

## 任务目标
实现自动化内容审核，确保平台内容合规。

## 核心需求
1. 集成文本审核 API（Google Cloud Natural Language / 自建敏感词库）
2. 集成图像审核 API（Google Cloud Vision Safe Search）
3. 发布前自动审核
4. 审核结果记录到 Firestore
5. 提供申诉接口

## 实现步骤

### Step 1: 文本审核模块
- [x] 新建 `functions/src/moderation/text.ts` 并实现敏感词检测/正则规则
- [x] 添加 `functions/src/moderation/__tests__/text.test.ts` 单测覆盖通用/自定义规则

### Step 2: 图像审核模块
- [x] 新建 `functions/src/moderation/image.ts`，集成 Google Vision Safe Search API
- [x] 通过 `functions/src/preview/http.ts` 聚合图像检测结果与阈值

### Step 3: 审核流程集成
- [x] Cloud Function `previewModeration` 暴露 HTTP 审核入口
- [x] `src/app/app-client.tsx` 客户端预检 + `generatePattern` 服务端强制审核

### Step 4: 审核记录与申诉
- [x] Firestore `moderations` 集合记录审核状态/哈希/时间戳/申诉状态
- [x] `src/app/api/moderations/route.ts` 提供后台查询与申诉占位接口

## DoD（Definition of Done）
- [x] `npm run build` 通过（0 错误）
- [x] `npm run lint` 通过（0 错误）
- [x] `npm run typecheck` 通过（0 错误）
- [x] `npm run test` 通过（关键路径）
- [x] 创建分支 `feature/M4-COMPLIANCE-001`
- [ ] 提交代码并推送
- [x] 更新 `CHANGELOG.md`
- [x] 更新 Story 文件标记完成
