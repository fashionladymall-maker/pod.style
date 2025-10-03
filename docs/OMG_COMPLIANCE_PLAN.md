# OMG Compliance Cleanup Plan

> **紧急**: 根据蓝皮书 §0，项目中发现 687 处违规（真实平台名），必须立即清理。

## 违规统计

- **总违规数**: 687
- **受影响文件**: 约 30+ 个
- **主要违规类型**:
  - 文档文件（.md）
  - 代码目录名（src/components/omg, src/app/omg）
  - 代码文件名（omg-client.tsx, omg-app.tsx 等）
  - 代码内容（import 路径、注释、字符串）

## 清理策略

### 阶段 1: 归档历史文档（低风险）
将所有包含真实平台名的文档文件重命名为 `DEPRECATED_*`，保留历史记录但不再使用。

**受影响文件**:
- ALL_P0_FEATURES_COMPLETED.md
- ALL_P1_FEATURES_COMPLETED.md
- COMPREHENSIVE_ERROR_CHECK_PLAN.md
- ERROR_CHECK_PROGRESS.md
- ERROR_FIXES.md
- FINAL_IMPLEMENTATION_SUMMARY.md
- FINAL_SUMMARY.md
- FUNCTIONALITY_RESTORATION.md
- IMPLEMENTATION_STATUS.md
- P0_IMPLEMENTATION_PROGRESS.md
- P1_FEATURES_COMPLETED.md
- PROGRESS_REPORT.md
- QUICK_VERIFICATION.md
- READY_TO_TEST.md
- STAGE2_*.md
- TESTING_PLAN.md
- OMG_*.md

**操作**: 批量重命名，添加 `DEPRECATED_` 前缀

### 阶段 2: 重命名代码目录（中风险）
将代码目录从 `omg` 重命名为 `omg`。

**受影响目录**:
- `src/components/omg/` → `src/components/omg/`
- `src/app/omg/` → `src/app/omg/`

**操作**: 使用 `git mv` 保留历史记录

### 阶段 3: 重命名代码文件（中风险）
将代码文件名中的 `omg` 替换为 `omg`。

**受影响文件**:
- `src/app/omg-client.tsx` → `src/app/omg-client.tsx`
- `src/components/omg/*.tsx` → `src/components/omg/*.tsx`

**操作**: 使用 `git mv` 保留历史记录

### 阶段 4: 更新代码内容（高风险）
更新所有代码文件中的 import 路径、注释、字符串等。

**替换规则**:
- `omg` → `omg`
- `OMG` → `OMG`
- `OMG` → `OMG`
- `Tiktok` → `Omg`

**受影响文件类型**:
- `.ts`, `.tsx`, `.js`, `.jsx`
- `.json`
- `.md` (非 DEPRECATED)
- `.yml`, `.yaml`

**操作**: 使用 `sed` 或手动替换

### 阶段 5: 更新路由和配置（高风险）
更新路由配置和相关引用。

**受影响**:
- 路由: `/omg` → `/omg`
- 环境变量（如有）
- 配置文件

### 阶段 6: 验证和测试
- 运行 `npm run scan:banned` 确保无违规
- 运行 `npm run typecheck` 确保类型正确
- 运行 `npm run build` 确保构建成功
- 运行 `npm run test` 确保测试通过
- 手动测试关键路径

## 执行计划

### 方案 A: 自动化脚本（快速但风险高）
使用 `scripts/omg-compliance-cleanup.sh` 一键执行所有清理。

**优点**: 快速
**缺点**: 可能遗漏边缘情况，难以回滚

### 方案 B: 分阶段手动执行（慢但安全）
按照上述阶段逐步执行，每个阶段后验证。

**优点**: 可控，易于回滚
**缺点**: 耗时

### 推荐方案: 混合方案
1. 阶段 1（文档归档）: 自动化
2. 阶段 2-3（重命名）: 自动化 + 验证
3. 阶段 4（内容替换）: 半自动化（生成替换列表，人工审核）
4. 阶段 5-6（验证）: 手动

## 回滚方案

如果清理后出现问题：
1. 使用 `git reset --hard HEAD` 回滚所有更改
2. 或使用 `git revert` 撤销特定提交
3. 保留 `.bak` 备份文件以便恢复

## 执行命令

### 阶段 1: 归档文档
```bash
for file in OMG_*.md ALL_P0_*.md ALL_P1_*.md COMPREHENSIVE_*.md ERROR_*.md FINAL_*.md FUNCTIONALITY_*.md IMPLEMENTATION_*.md P0_*.md P1_*.md PROGRESS_*.md QUICK_*.md READY_*.md STAGE2_*.md TESTING_*.md; do
  [ -f "$file" ] && git mv "$file" "DEPRECATED_$file"
done
```

### 阶段 2-3: 重命名目录和文件
```bash
# 目录
git mv src/components/omg src/components/omg
git mv src/app/omg src/app/omg

# 文件
git mv src/app/omg-client.tsx src/app/omg-client.tsx
```

### 阶段 4: 内容替换
```bash
# 使用 sed 批量替换（macOS 需要 -i '' 而非 -i.bak）
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./.next/*" \
  -not -path "./DEPRECATED_*" \
  -exec sed -i '' \
    -e 's/omg/omg/g' \
    -e 's/OMG/OMG/g' \
    -e 's/OMG/OMG/g' \
    {} \;
```

### 阶段 5: 验证
```bash
npm run scan:banned
npm run typecheck
npm run build
npm run test
```

## 注意事项

1. **备份**: 在执行前确保代码已提交或备份
2. **分支**: 建议在新分支上执行清理
3. **测试**: 每个阶段后都要测试
4. **文档**: 更新相关文档（README, architecture 等）
5. **团队沟通**: 通知团队成员路由和目录结构的变更

## 预期结果

清理完成后：
- ✅ `npm run scan:banned` 通过（0 违规）
- ✅ 所有构建和测试通过
- ✅ 路由 `/omg` 可访问（原 `/omg`）
- ✅ 代码结构清晰，符合 OMG 范式
- ✅ 历史文档已归档，不影响新开发

## 时间估算

- 阶段 1: 5 分钟
- 阶段 2-3: 10 分钟
- 阶段 4: 20 分钟
- 阶段 5-6: 30 分钟
- **总计**: 约 1 小时

## 状态跟踪

- [ ] 阶段 1: 归档历史文档
- [ ] 阶段 2: 重命名代码目录
- [ ] 阶段 3: 重命名代码文件
- [ ] 阶段 4: 更新代码内容
- [ ] 阶段 5: 更新路由和配置
- [ ] 阶段 6: 验证和测试
- [ ] 最终验证: `npm run scan:banned` 通过

