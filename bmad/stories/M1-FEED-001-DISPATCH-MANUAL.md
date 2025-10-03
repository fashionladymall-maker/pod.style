# M1-FEED-001 手动派单文档

## 执行方式

```bash
cd /Users/mike/pod.style
codex -C . --full-auto "$(cat bmad/stories/M1-FEED-001-DISPATCH-MANUAL.md)"
```

或交互模式：
```bash
codex -C /Users/mike/pod.style
# 然后粘贴下面的指令
```

---

## 开发指令

你是开发执行者。

**仓库**：`/Users/mike/pod.style`

**故事**：`bmad/stories/M1-FEED-001-omg-feed-mvp.md`

**遵循文档**：
- `docs/architecture.md`
- `docs/prd.md`
- `bmad/constraints.md`

**任务目标**：实现 OMG Feed MVP - 竖向滚动与预览

**核心需求**：
1. 创建竖向全屏滚动 Feed 容器
2. 实现预览卡片（支持多角度轮播）
3. 添加悬浮操作栏（收藏/分享/对比）
4. 客户端 Canvas 叠加逻辑
5. 集成 Functions 标准小图接口
6. 性能优化（懒加载/虚拟滚动）

**技术要求**：
- 使用现有 `src/components/screens/feed-screen.tsx` 作为基础
- 改造为竖向滚动（类似短视频 Feed）
- 使用 `src/components/ui/carousel.tsx` 实现卡片内轮播
- 保持 Firebase 数据结构不变
- 遵循 TypeScript 严格模式

**性能目标**：
- 首屏 LCP ≤ 2.5s（4G 模拟）
- 滚动流畅（掉帧 < 5%）
- 预览卡片 500ms 内出现

**DoD（Definition of Done）**：
- [ ] `npm run build` 通过（0 错误）
- [ ] `npm run lint` 通过（0 错误）
- [ ] `npm run typecheck` 通过（0 错误）
- [ ] `npm run test` 通过（关键路径）
- [ ] 创建分支 `feature/M1-FEED-001`
- [ ] 提交代码并推送
- [ ] 更新 `CHANGELOG.md`
- [ ] 更新 Story 文件标记完成

**禁止事项**：
- ❌ 并发处理多个任务
- ❌ 修改 `main` 分支
- ❌ 引入真实平台名（除 OMG 代号外的实际平台）
- ❌ 破坏现有功能

**输出要求**：
1. PR 链接或分支名
2. 测试说明（如何验证）
3. 风险与缓解措施
4. 性能测试结果

---

## 实现建议

### 1. 文件结构
```
src/components/omg/
  ├── omg-feed-container.tsx      # 竖向滚动容器
  ├── omg-feed-card.tsx            # 单个卡片（含轮播）
  ├── omg-action-bar.tsx           # 悬浮操作栏
  └── omg-preview-canvas.tsx       # Canvas 叠加逻辑
```

### 2. 关键组件

**OmgFeedContainer**：
- 使用 `IntersectionObserver` 实现懒加载
- 虚拟滚动优化（可选，视性能而定）
- 自动播放当前可见卡片

**OmgFeedCard**：
- 使用 `src/components/ui/carousel.tsx`
- 支持左右滑动切换角度
- 显示 SKU 信息、价格、时效

**OmgActionBar**：
- 悬浮在卡片右侧
- 收藏/分享/对比按钮
- 动画效果

### 3. 数据流
```
feed-service.ts (现有)
  ↓
omg-feed-container.tsx
  ↓
omg-feed-card.tsx
  ↓
omg-preview-canvas.tsx (Canvas 叠加)
```

### 4. 性能优化
- 图片懒加载（`loading="lazy"`）
- 预加载下一张卡片
- 使用 `React.memo` 避免重渲染
- Canvas 离屏渲染

### 5. 测试要点
- 滚动性能（Chrome DevTools Performance）
- 图片加载时间
- 交互响应速度
- 内存占用

---

## 验收标准

运行以下命令验证：

```bash
# 1. 构建
npm run build

# 2. Lint
npm run lint

# 3. 类型检查
npm run typecheck

# 4. 测试
npm run test

# 5. 本地预览
npm run dev
# 访问 http://localhost:6000/feed/beta
```

**手动测试**：
1. 打开 `/feed/beta`
2. 检查竖向滚动是否流畅
3. 测试卡片内轮播
4. 测试操作栏交互
5. 使用 Chrome DevTools 检查性能

---

## 完成后

1. 创建分支：`git checkout -b feature/M1-FEED-001`
2. 提交代码：`git add . && git commit -m "feat: OMG Feed MVP"`
3. 推送：`git push origin feature/M1-FEED-001`
4. 更新 `CHANGELOG.md`
5. 更新 `bmad/stories/M1-FEED-001-omg-feed-mvp.md` 标记完成

---

**请开始执行。**
