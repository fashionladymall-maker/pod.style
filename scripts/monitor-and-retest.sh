#!/bin/bash

# 监控部署并自动重新测试所有功能
# 用法: ./scripts/monitor-and-retest.sh

set -e

PRODUCTION_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
MAX_CHECKS=30
CHECK_INTERVAL=120  # 2分钟
CURRENT_CHECK=0

echo "🚀 pod.style 部署监控与自动测试"
echo "================================"
echo "生产URL: $PRODUCTION_URL"
echo "最大检查次数: $MAX_CHECKS"
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo ""

# 获取当前的 Firebase 修复提交
FIREBASE_FIX_COMMIT=$(git log --oneline -1 | grep -o "^[a-f0-9]*")
echo "📝 当前提交: $FIREBASE_FIX_COMMIT"
echo ""

# 检查部署状态
check_deployment() {
  echo "[$CURRENT_CHECK/$MAX_CHECKS] 🔍 检查部署状态..."
  
  # 检查 Firebase 是否初始化
  FIREBASE_CHECK=$(curl -s "$PRODUCTION_URL" | grep -o "use client" | head -1 || echo "")
  
  if [ -n "$FIREBASE_CHECK" ]; then
    echo "  ✅ 检测到 'use client' - Firebase 修复可能已部署"
    return 0
  else
    echo "  ⏳ 还未检测到 Firebase 修复"
    return 1
  fi
}

# 运行全面测试
run_comprehensive_tests() {
  echo ""
  echo "🧪 运行全面功能测试..."
  echo "================================"
  
  FEED_E2E_BASE_URL="$PRODUCTION_URL" npx playwright test tests/integration/comprehensive-functionality-test.spec.ts \
    --headed \
    --project=chromium \
    --workers=1 \
    2>&1 | tee test-results/latest-test-run.log
  
  TEST_EXIT_CODE=${PIPESTATUS[0]}
  
  echo ""
  echo "================================"
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过！"
    return 0
  else
    echo "❌ 测试失败，退出码: $TEST_EXIT_CODE"
    return 1
  fi
}

# 分析测试结果
analyze_results() {
  echo ""
  echo "📊 分析测试结果..."
  echo "================================"
  
  if [ -f "test-results/comprehensive-functionality/comprehensive-report.json" ]; then
    echo "测试报告:"
    cat test-results/comprehensive-functionality/comprehensive-report.json | jq '.summary'
    
    TOTAL_BUGS=$(cat test-results/comprehensive-functionality/comprehensive-report.json | jq '.summary.totalBugs')
    CRITICAL_BUGS=$(cat test-results/comprehensive-functionality/comprehensive-report.json | jq '.summary.critical')
    
    echo ""
    echo "总 Bug 数: $TOTAL_BUGS"
    echo "Critical Bug 数: $CRITICAL_BUGS"
    
    if [ "$TOTAL_BUGS" -eq 0 ]; then
      echo ""
      echo "🎉 没有发现 Bug！所有功能正常！"
      return 0
    else
      echo ""
      echo "⚠️  仍有 $TOTAL_BUGS 个 Bug 需要修复"
      
      # 显示 Bug 列表
      echo ""
      echo "Bug 列表:"
      cat test-results/comprehensive-functionality/comprehensive-report.json | jq -r '.bugs[] | "  - [\(.severity | ascii_upcase)] \(.testName): \(.description)"'
      
      return 1
    fi
  else
    echo "❌ 未找到测试报告"
    return 1
  fi
}

# 主循环
echo "开始监控..."
echo ""

while [ $CURRENT_CHECK -lt $MAX_CHECKS ]; do
  CURRENT_CHECK=$((CURRENT_CHECK + 1))
  
  if check_deployment; then
    echo ""
    echo "🎯 检测到新部署！等待 30 秒让服务稳定..."
    sleep 30
    
    echo ""
    echo "🧪 开始运行测试..."
    
    if run_comprehensive_tests; then
      echo ""
      echo "✅ 测试通过！"
      
      if analyze_results; then
        echo ""
        echo "🎉 所有功能测试通过！没有 Bug！"
        echo ""
        echo "📂 打开测试结果..."
        open test-results/comprehensive-functionality/
        
        echo ""
        echo "🌐 打开生产网站..."
        open "$PRODUCTION_URL"
        
        exit 0
      else
        echo ""
        echo "⚠️  测试通过但仍有 Bug，请查看报告"
        open test-results/comprehensive-functionality/comprehensive-report.json
        exit 1
      fi
    else
      echo ""
      echo "❌ 测试失败"
      analyze_results || true
      exit 1
    fi
  fi
  
  if [ $CURRENT_CHECK -lt $MAX_CHECKS ]; then
    echo "  ⏳ 等待 ${CHECK_INTERVAL} 秒后重试..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo ""
echo "⏰ 达到最大检查次数 ($MAX_CHECKS)，停止监控"
echo "请手动检查部署状态: firebase apphosting:backends:list --project studio-1269295870-5fde0"
exit 1

