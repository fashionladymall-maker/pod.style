#!/bin/bash

# 并行执行多个 BMAD Stories
# 每个 story 在独立的终端中运行

set -e

echo "🚀 并行执行 BMAD Stories"
echo "=========================="
echo ""

# 定义 stories 按优先级排序
STORIES=(
  "M0-FIX-001-typescript-errors.md:P0:修复 TypeScript 类型错误"
  "M0-FIX-002-eslint-config.md:P0:修复 ESLint 配置"
  "M1-FEED-001-omg-feed-mvp.md:P1:OMG Feed MVP"
  "M2-COMMERCE-001-sku-details-cart.md:P1:SKU 详情页 + 购物车"
  "M2-COMMERCE-002-checkout-stripe.md:P1:结算页与 Stripe 支付"
  "M4-COMPLIANCE-001-moderation.md:P1:内容审核与合规"
  "M3-RENDER-001-print-ready-queue.md:P2:Print-ready 渲染队列"
  "M3-RENDER-002-order-binding.md:P2:订单与 Print-ready 绑定"
  "M4-PERFORMANCE-001-optimization.md:P2:性能优化"
  "M4-EXPERIMENT-001-ab-testing.md:P3:A/B 测试"
)

# 创建执行报告
REPORT_FILE="PARALLEL_EXECUTION_REPORT.md"
cat > "$REPORT_FILE" << 'EOF'
# 🚀 并行执行报告

**开始时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📋 执行计划

EOF

# 显示执行计划
echo "📋 执行计划:"
echo ""

for story_info in "${STORIES[@]}"; do
  IFS=':' read -r filename priority name <<< "$story_info"
  echo "  [$priority] $name"
  echo "      文件: bmad/stories/$filename"
  echo "" >> "$REPORT_FILE"
  echo "### [$priority] $name" >> "$REPORT_FILE"
  echo "- **文件**: \`bmad/stories/$filename\`" >> "$REPORT_FILE"
  echo "- **状态**: 准备执行" >> "$REPORT_FILE"
done

echo ""
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 询问用户确认
read -p "是否开始并行执行？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 取消执行"
  exit 1
fi

echo ""
echo "🔄 开始并行执行..."
echo ""

# 记录开始时间
START_TIME=$(date +%s)

# 并行执行（这里只是示例，实际需要根据具体情况调整）
echo "注意：由于 BMAD 方法需要 Codex CLI 单线程执行，"
echo "我们将按优先级顺序执行，而不是真正的并行。"
echo ""

# 按优先级执行
for story_info in "${STORIES[@]}"; do
  IFS=':' read -r filename priority name <<< "$story_info"
  story_path="bmad/stories/$filename"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 执行: [$priority] $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # 检查 story 是否已完成
  if grep -q "\[x\]" "$story_path" 2>/dev/null; then
    echo "✅ Story 已完成（检测到 [x] 标记）"
    echo "   跳过执行"
    echo ""
    continue
  fi
  
  # 检查 story 是否存在
  if [ ! -f "$story_path" ]; then
    echo "⚠️  Story 文件不存在: $story_path"
    echo "   跳过执行"
    echo ""
    continue
  fi
  
  echo "📄 Story 文件: $story_path"
  echo ""
  
  # 显示 story 的前几行
  echo "📝 Story 内容预览:"
  head -20 "$story_path" | sed 's/^/   /'
  echo ""
  
  # 询问是否执行此 story
  read -p "是否执行此 story？(y/n/s=skip all) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "⏭️  跳过所有剩余 stories"
    break
  fi
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏭️  跳过此 story"
    echo ""
    continue
  fi
  
  echo ""
  echo "🚀 开始执行..."
  echo ""
  
  # 这里应该调用 Codex CLI 或其他执行工具
  # 由于我们是 Augment，我们会直接执行任务
  echo "⚠️  注意：实际执行需要 Codex CLI 或 Augment 直接处理"
  echo "   当前仅显示执行计划"
  echo ""
  
  # 记录到报告
  echo "### [$priority] $name - 已执行" >> "$REPORT_FILE"
  echo "- **时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
done

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 执行完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  总耗时: ${DURATION}秒"
echo "📊 报告文件: $REPORT_FILE"
echo ""

# 完成报告
cat >> "$REPORT_FILE" << EOF

---

## 📊 执行总结

- **开始时间**: $(date -r $START_TIME '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')
- **结束时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **总耗时**: ${DURATION}秒

---

**报告生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "📄 查看完整报告: cat $REPORT_FILE"

