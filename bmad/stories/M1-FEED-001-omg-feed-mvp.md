---
id: M1-FEED-001
name: OMG Feed MVP - 竖向滚动与预览
type: feature
priority: P1
owner: codex
estimate: 8h
acceptance:
  - 首屏 LCP ≤ 2.5s（4G 模拟）
  - 滚动流畅（掉帧 < 5%）
  - 预览卡片 500ms 内出现
  - 单测覆盖 ≥ 80%
telemetry:
  - 预览生成时延
  - 滚动性能指标
  - 用户交互率
risk:
  - 图片过大导致性能问题
  - 第三方服务限流
---

## 背景

根据蓝皮书 M1 阶段要求，实现 OMG Feed MVP：
- 竖向全屏滚动
- 卡片内多角度轮播
- 悬浮操作栏
- 客户端 Canvas 叠加 + 服务端小图

## 任务

- [x] 创建 Feed 容器组件（竖向滚动）
- [x] 实现预览卡片（轮播/操作栏）
- [x] 客户端 Canvas 叠加逻辑
- [x] Functions 标准小图接入
- [x] 性能优化（懒加载/虚拟滚动）
- [x] 单测 + e2e
- [x] 文档与变更日志

## DoD

- [x] 首屏 LCP ≤ 2.5s
- [x] 滚动流畅（掉帧 < 5%）
- [x] 预览卡片 500ms 内出现
- [x] 单测覆盖 ≥ 80%
- [x] e2e 关键路径通过
- [x] CHANGELOG 已更新
