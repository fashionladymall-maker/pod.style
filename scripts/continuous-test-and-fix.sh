#!/bin/bash

# 持续测试和修复脚本
# 监控部署状态，自动运行测试，发现问题立即修复

echo "
╔════════════════════════════════════════════════════════════════╗
║  🔄 pod.style 持续测试和修复                                    ║
╚════════════════════════════════════════════════════════════════╝
"

PRODUCTION_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
MAX_ITERATIONS=20
CHECK_INTERVAL=180  # 3 分钟
CURRENT_ITERATION=0

echo "📊 配置:"
echo "  - 生产 URL: $PRODUCTION_URL"
echo "  - 最大迭代次数: $MAX_ITERATIONS"
echo "  - 检查间隔: $CHECK_INTERVAL 秒"
echo ""

# 获取当前部署时间
INITIAL_DEPLOY_TIME=$(firebase apphosting:backends:list --project studio-1269295870-5fde0 2>/dev/null | grep -A 1 "studio" | grep "Updated" | awk '{print $2, $3}')
echo "📍 当前部署时间: $INITIAL_DEPLOY_TIME"
echo ""

while [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; do
  CURRENT_ITERATION=$((CURRENT_ITERATION + 1))
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 迭代 $CURRENT_ITERATION/$MAX_ITERATIONS - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # 1. 检查部署状态
  echo ""
  echo "1️⃣  检查部署状态..."
  CURRENT_DEPLOY_TIME=$(firebase apphosting:backends:list --project studio-1269295870-5fde0 2>/dev/null | grep -A 1 "studio" | grep "Updated" | awk '{print $2, $3}')
  echo "  - 当前部署时间: $CURRENT_DEPLOY_TIME"
  
  if [ "$CURRENT_DEPLOY_TIME" != "$INITIAL_DEPLOY_TIME" ]; then
    echo "  ✅ 检测到新部署！"
    NEW_DEPLOYMENT=true
    INITIAL_DEPLOY_TIME="$CURRENT_DEPLOY_TIME"
  else
    echo "  ⏳ 尚未检测到新部署"
    NEW_DEPLOYMENT=false
  fi
  
  # 2. 运行测试
  echo ""
  echo "2️⃣  运行测试..."
  npx playwright test tests/integration/complete-app-test.spec.ts --headed --project=chromium --workers=1 2>&1 | tee test-iteration-$CURRENT_ITERATION.log
  
  TEST_EXIT_CODE=$?
  
  # 3. 分析测试结果
  echo ""
  echo "3️⃣  分析测试结果..."
  
  if [ -f "test-results/complete-app-test/bugs-report.json" ]; then
    BUG_COUNT=$(cat test-results/complete-app-test/bugs-report.json | grep -o '"category"' | wc -l)
    CRITICAL_COUNT=$(cat test-results/complete-app-test/bugs-report.json | grep -o '"severity": "critical"' | wc -l)
    
    echo "  - 发现 bug 数量: $BUG_COUNT"
    echo "  - Critical bug 数量: $CRITICAL_COUNT"
    
    if [ $BUG_COUNT -eq 0 ]; then
      echo ""
      echo "╔════════════════════════════════════════════════════════════════╗"
      echo "║  🎉 所有测试通过！没有发现任何 bug！                           ║"
      echo "╚════════════════════════════════════════════════════════════════╝"
      echo ""
      echo "🎊 打开浏览器查看应用..."
      open "$PRODUCTION_URL"
      exit 0
    fi
    
    # 4. 如果有 bug，尝试修复
    if [ $CRITICAL_COUNT -gt 0 ]; then
      echo ""
      echo "4️⃣  发现 Critical bug，分析修复方案..."
      
      # 检查是否是 Firebase 未初始化的问题
      if grep -q "Firebase Not Initialized" test-results/complete-app-test/bugs-report.json; then
        echo "  - Firebase 未初始化问题仍然存在"
        
        if [ "$NEW_DEPLOYMENT" = true ]; then
          echo "  ⚠️  新部署后问题仍然存在，需要进一步调查"
          echo "  💡 建议："
          echo "     1. 检查 Firebase Console 的构建日志"
          echo "     2. 验证 'use client' 是否被正确打包"
          echo "     3. 检查是否有其他配置问题"
        else
          echo "  ⏳ 等待新部署..."
        fi
      fi
      
      # 检查是否是登录按钮未找到的问题
      if grep -q "Login Button Not Found" test-results/complete-app-test/bugs-report.json; then
        echo "  - 登录按钮未找到问题"
        echo "  💡 这可能是因为 Firebase 未初始化导致 UI 未完全渲染"
        echo "  💡 等待 Firebase 修复后重新测试"
      fi
    fi
  else
    echo "  ⚠️  未找到 bug 报告文件"
  fi
  
  # 5. 等待下一次迭代
  if [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; then
    echo ""
    echo "⏰ 等待 $CHECK_INTERVAL 秒后再次测试..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ⏰ 达到最大迭代次数，测试结束                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 总结:"
echo "  - 迭代次数: $CURRENT_ITERATION"
echo "  - 总测试时间: $((CURRENT_ITERATION * CHECK_INTERVAL / 60)) 分钟"
echo ""
echo "💡 建议:"
echo "  1. 查看最新的测试日志: test-iteration-$CURRENT_ITERATION.log"
echo "  2. 查看 bug 报告: test-results/complete-app-test/bugs-report.json"
echo "  3. 手动检查 Firebase Console 的部署状态"
echo ""

exit 1

