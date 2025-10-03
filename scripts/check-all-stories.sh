#!/bin/bash

# 检查所有 BMAD Stories 的状态
# 并生成详细报告

set -e

echo "🔍 检查所有 BMAD Stories"
echo "=========================="
echo ""

STORIES_DIR="bmad/stories"
REPORT_FILE="STORIES_STATUS_REPORT.md"

# 初始化报告
cat > "$REPORT_FILE" << 'EOF'
# 📊 pod.style BMAD Stories 状态报告

**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📋 Stories 列表

EOF

# 统计变量
TOTAL=0
COMPLETED=0
IN_PROGRESS=0
NOT_STARTED=0
BLOCKED=0

# 遍历所有 story 文件
for story in $(find "$STORIES_DIR" -name "*.md" -type f | sort); do
  TOTAL=$((TOTAL + 1))
  
  filename=$(basename "$story")
  echo "检查: $filename"
  
  # 提取 story 信息
  if grep -q "^status:" "$story" 2>/dev/null; then
    status=$(grep "^status:" "$story" | head -1 | sed 's/status: *//' | tr -d '\r')
  else
    status="unknown"
  fi
  
  if grep -q "^name:" "$story" 2>/dev/null; then
    name=$(grep "^name:" "$story" | head -1 | sed 's/name: *//' | tr -d '\r')
  else
    name="N/A"
  fi
  
  if grep -q "^priority:" "$story" 2>/dev/null; then
    priority=$(grep "^priority:" "$story" | head -1 | sed 's/priority: *//' | tr -d '\r')
  else
    priority="N/A"
  fi
  
  # 统计状态
  case "$status" in
    "completed"|"done"|"✅")
      COMPLETED=$((COMPLETED + 1))
      status_icon="✅"
      ;;
    "in-progress"|"in_progress"|"🔄")
      IN_PROGRESS=$((IN_PROGRESS + 1))
      status_icon="🔄"
      ;;
    "blocked"|"⛔")
      BLOCKED=$((BLOCKED + 1))
      status_icon="⛔"
      ;;
    *)
      NOT_STARTED=$((NOT_STARTED + 1))
      status_icon="⏳"
      ;;
  esac
  
  # 添加到报告
  echo "### $status_icon $filename" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "- **名称**: $name" >> "$REPORT_FILE"
  echo "- **状态**: $status" >> "$REPORT_FILE"
  echo "- **优先级**: $priority" >> "$REPORT_FILE"
  echo "- **文件**: \`$story\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
done

# 添加统计信息
cat >> "$REPORT_FILE" << EOF

---

## 📊 统计信息

| 状态 | 数量 | 百分比 |
|------|------|--------|
| ✅ 已完成 | $COMPLETED | $(awk "BEGIN {printf \"%.1f\", ($COMPLETED/$TOTAL)*100}")% |
| 🔄 进行中 | $IN_PROGRESS | $(awk "BEGIN {printf \"%.1f\", ($IN_PROGRESS/$TOTAL)*100}")% |
| ⏳ 未开始 | $NOT_STARTED | $(awk "BEGIN {printf \"%.1f\", ($NOT_STARTED/$TOTAL)*100}")% |
| ⛔ 阻塞 | $BLOCKED | $(awk "BEGIN {printf \"%.1f\", ($BLOCKED/$TOTAL)*100}")% |
| **总计** | **$TOTAL** | **100%** |

---

## 🎯 下一步建议

EOF

# 根据状态给出建议
if [ $NOT_STARTED -gt 0 ]; then
  echo "### 未开始的 Stories" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "以下 stories 尚未开始，建议按优先级执行：" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  for story in $(find "$STORIES_DIR" -name "*.md" -type f | sort); do
    if grep -q "^status:" "$story" 2>/dev/null; then
      status=$(grep "^status:" "$story" | head -1 | sed 's/status: *//' | tr -d '\r')
      if [[ "$status" != "completed" && "$status" != "done" && "$status" != "in-progress" && "$status" != "in_progress" ]]; then
        filename=$(basename "$story")
        name=$(grep "^name:" "$story" 2>/dev/null | head -1 | sed 's/name: *//' | tr -d '\r' || echo "N/A")
        priority=$(grep "^priority:" "$story" 2>/dev/null | head -1 | sed 's/priority: *//' | tr -d '\r' || echo "N/A")
        echo "- **$filename** ($priority): $name" >> "$REPORT_FILE"
      fi
    fi
  done
  echo "" >> "$REPORT_FILE"
fi

if [ $IN_PROGRESS -gt 0 ]; then
  echo "### 进行中的 Stories" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "以下 stories 正在进行中，建议继续完成：" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  for story in $(find "$STORIES_DIR" -name "*.md" -type f | sort); do
    if grep -q "^status:" "$story" 2>/dev/null; then
      status=$(grep "^status:" "$story" | head -1 | sed 's/status: *//' | tr -d '\r')
      if [[ "$status" == "in-progress" || "$status" == "in_progress" ]]; then
        filename=$(basename "$story")
        name=$(grep "^name:" "$story" 2>/dev/null | head -1 | sed 's/name: *//' | tr -d '\r' || echo "N/A")
        echo "- **$filename**: $name" >> "$REPORT_FILE"
      fi
    fi
  done
  echo "" >> "$REPORT_FILE"
fi

if [ $BLOCKED -gt 0 ]; then
  echo "### ⛔ 阻塞的 Stories" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "以下 stories 被阻塞，需要先解决依赖问题：" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  for story in $(find "$STORIES_DIR" -name "*.md" -type f | sort); do
    if grep -q "^status:" "$story" 2>/dev/null; then
      status=$(grep "^status:" "$story" | head -1 | sed 's/status: *//' | tr -d '\r')
      if [[ "$status" == "blocked" ]]; then
        filename=$(basename "$story")
        name=$(grep "^name:" "$story" 2>/dev/null | head -1 | sed 's/name: *//' | tr -d '\r' || echo "N/A")
        echo "- **$filename**: $name" >> "$REPORT_FILE"
      fi
    fi
  done
  echo "" >> "$REPORT_FILE"
fi

echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**报告生成完成**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"

echo ""
echo "✅ 报告已生成: $REPORT_FILE"
echo ""
echo "📊 统计摘要:"
echo "  总计: $TOTAL"
echo "  ✅ 已完成: $COMPLETED"
echo "  🔄 进行中: $IN_PROGRESS"
echo "  ⏳ 未开始: $NOT_STARTED"
echo "  ⛔ 阻塞: $BLOCKED"
echo ""

# 显示报告
cat "$REPORT_FILE"

