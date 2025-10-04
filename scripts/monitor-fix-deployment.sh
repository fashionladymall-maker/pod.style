#!/bin/bash

# 监控修复部署脚本
# 等待新构建完成并自动测试 Firebase 初始化

echo "
╔════════════════════════════════════════════════════════════════╗
║  🔍 监控 Firebase 修复部署                                      ║
╚════════════════════════════════════════════════════════════════╝
"

PRODUCTION_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
MAX_CHECKS=30
CHECK_INTERVAL=120  # 2 分钟
CURRENT_CHECK=0

echo "📊 配置:"
echo "  - 生产 URL: $PRODUCTION_URL"
echo "  - 最大检查次数: $MAX_CHECKS"
echo "  - 检查间隔: $CHECK_INTERVAL 秒"
echo "  - 预计最长等待时间: $((MAX_CHECKS * CHECK_INTERVAL / 60)) 分钟"
echo ""

# 获取当前部署时间作为基准
echo "📍 获取当前部署时间..."
INITIAL_DEPLOY_TIME=$(firebase apphosting:backends:list --project studio-1269295870-5fde0 2>/dev/null | grep -A 1 "studio" | grep "Updated" | awk '{print $2, $3}')
echo "  - 当前部署时间: $INITIAL_DEPLOY_TIME"
echo ""

while [ $CURRENT_CHECK -lt $MAX_CHECKS ]; do
  CURRENT_CHECK=$((CURRENT_CHECK + 1))
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 检查 $CURRENT_CHECK/$MAX_CHECKS - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # 1. 检查部署状态
  echo ""
  echo "1️⃣  检查部署状态..."
  CURRENT_DEPLOY_TIME=$(firebase apphosting:backends:list --project studio-1269295870-5fde0 2>/dev/null | grep -A 1 "studio" | grep "Updated" | awk '{print $2, $3}')
  echo "  - 当前部署时间: $CURRENT_DEPLOY_TIME"
  
  if [ "$CURRENT_DEPLOY_TIME" != "$INITIAL_DEPLOY_TIME" ]; then
    echo "  ✅ 检测到新部署！"
    NEW_DEPLOYMENT=true
  else
    echo "  ⏳ 尚未检测到新部署"
    NEW_DEPLOYMENT=false
  fi
  
  # 2. 检查 HTTP 状态
  echo ""
  echo "2️⃣  检查 HTTP 状态..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
  echo "  - HTTP 状态码: $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ 页面可访问"
  else
    echo "  ❌ 页面不可访问"
  fi
  
  # 3. 检查 Firebase 配置是否在页面中
  echo ""
  echo "3️⃣  检查 Firebase 配置..."
  
  # 下载页面内容
  PAGE_CONTENT=$(curl -s "$PRODUCTION_URL")
  
  # 检查是否包含 Firebase 相关内容
  if echo "$PAGE_CONTENT" | grep -q "firebase"; then
    echo "  ✅ 页面包含 Firebase 相关内容"
  else
    echo "  ❌ 页面不包含 Firebase 相关内容"
  fi
  
  # 4. 检查 JS 文件中的 'use client'
  echo ""
  echo "4️⃣  检查 JS 文件中的修复..."
  
  # 查找包含 Firebase 配置的 JS 文件
  FIREBASE_JS=$(echo "$PAGE_CONTENT" | grep -o '/_next/static/chunks/[^"]*\.js' | head -20)
  
  FOUND_USE_CLIENT=false
  CHECKED_FILES=0
  
  for js_file in $FIREBASE_JS; do
    CHECKED_FILES=$((CHECKED_FILES + 1))
    
    if [ $CHECKED_FILES -gt 5 ]; then
      break
    fi
    
    JS_CONTENT=$(curl -s "$PRODUCTION_URL$js_file")
    
    # 检查是否包含 'use client' 和 Firebase 配置
    if echo "$JS_CONTENT" | grep -q "use client" && echo "$JS_CONTENT" | grep -q "AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0"; then
      echo "  ✅ 找到包含 'use client' 和 Firebase 配置的文件: $js_file"
      FOUND_USE_CLIENT=true
      break
    fi
  done
  
  if [ "$FOUND_USE_CLIENT" = false ]; then
    echo "  ⏳ 尚未找到包含 'use client' 的 Firebase 文件"
  fi
  
  # 5. 如果检测到新部署且找到修复，运行测试
  if [ "$NEW_DEPLOYMENT" = true ] && [ "$FOUND_USE_CLIENT" = true ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  🎉 检测到修复已部署！开始运行测试...                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # 运行 Firebase 运行时检查测试
    echo "🧪 运行 Firebase 运行时检查测试..."
    npx playwright test tests/integration/firebase-runtime-check.spec.ts --headed --project=chromium --workers=1
    
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
      echo ""
      echo "╔════════════════════════════════════════════════════════════════╗"
      echo "║  ✅ 所有测试通过！Firebase 修复成功！                          ║"
      echo "╚════════════════════════════════════════════════════════════════╝"
      echo ""
      echo "🎊 打开浏览器查看修复后的应用..."
      open "$PRODUCTION_URL"
      
      exit 0
    else
      echo ""
      echo "╔════════════════════════════════════════════════════════════════╗"
      echo "║  ⚠️  测试失败！需要进一步调查...                               ║"
      echo "╚════════════════════════════════════════════════════════════════╝"
      echo ""
      
      exit 1
    fi
  fi
  
  # 6. 等待下一次检查
  if [ $CURRENT_CHECK -lt $MAX_CHECKS ]; then
    echo ""
    echo "⏰ 等待 $CHECK_INTERVAL 秒后再次检查..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ⏰ 达到最大检查次数，监控结束                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 总结:"
echo "  - 检查次数: $CURRENT_CHECK"
echo "  - 总等待时间: $((CURRENT_CHECK * CHECK_INTERVAL / 60)) 分钟"
echo ""
echo "💡 建议:"
echo "  1. 手动检查 Firebase Console 的部署状态"
echo "  2. 查看构建日志是否有错误"
echo "  3. 手动运行测试: npx playwright test tests/integration/firebase-runtime-check.spec.ts"
echo ""

exit 1

