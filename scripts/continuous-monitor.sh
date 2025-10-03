#!/bin/bash

# 持续监控部署状态并自动运行测试

PRODUCTION_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
CHECK_INTERVAL=120  # 2 分钟
MAX_ATTEMPTS=30     # 最多检查 30 次（1 小时）
LAST_DEPLOY_TIME=""

echo "🔄 开始持续监控部署状态"
echo "===================="
echo "生产 URL: $PRODUCTION_URL"
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo "最大尝试次数: $MAX_ATTEMPTS"
echo ""

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  echo "📊 [尝试 $i/$MAX_ATTEMPTS] $(date '+%Y-%m-%d %H:%M:%S')"
  echo "----------------------------------------"
  
  # 1. 检查部署状态
  echo "1️⃣  检查部署状态..."
  DEPLOY_INFO=$(firebase apphosting:backends:list --project studio-1269295870-5fde0 2>&1 | grep "studio")
  DEPLOY_TIME=$(echo "$DEPLOY_INFO" | awk '{print $(NF-1), $NF}')
  echo "   部署时间: $DEPLOY_TIME"
  
  # 2. 检查是否有新的部署
  if [ "$DEPLOY_TIME" != "$LAST_DEPLOY_TIME" ] && [ -n "$LAST_DEPLOY_TIME" ]; then
    echo "   🎉 检测到新的部署！"
    LAST_DEPLOY_TIME="$DEPLOY_TIME"
    
    # 等待一会儿让部署完全生效
    echo "   ⏳ 等待 30 秒让部署生效..."
    sleep 30
    
    # 3. 检查 HTTP 响应
    echo "2️⃣  检查 HTTP 响应..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "   ✅ HTTP $HTTP_CODE OK"
    else
      echo "   ❌ HTTP $HTTP_CODE"
      continue
    fi
    
    # 4. 检查 Firebase 配置是否注入
    echo "3️⃣  检查 Firebase 配置..."
    
    # 获取最新的 JS 文件
    JS_FILE=$(curl -s "$PRODUCTION_URL" | grep -o '/_next/static/chunks/app/page-[a-f0-9]*.js' | head -1)
    
    if [ -n "$JS_FILE" ]; then
      echo "   检查文件: $JS_FILE"
      
      # 检查 Firebase API Key
      API_KEY=$(curl -s "${PRODUCTION_URL}${JS_FILE}" | grep -o 'AIzaSy[a-zA-Z0-9_-]*' | head -1)
      
      if [ -n "$API_KEY" ]; then
        echo "   ✅ Firebase API Key 已注入: ${API_KEY:0:20}..."
        
        # 5. 运行自动化测试
        echo ""
        echo "4️⃣  运行自动化测试..."
        echo "========================================"
        
        FEED_E2E_BASE_URL="$PRODUCTION_URL" npx playwright test tests/integration/chrome-devtools-test.spec.ts --project=chromium --reporter=list
        
        TEST_RESULT=$?
        
        echo "========================================"
        echo ""
        
        if [ $TEST_RESULT -eq 0 ]; then
          echo "✅ 所有测试通过！"
          echo ""
          echo "🎉 部署成功并通过测试！"
          echo ""
          echo "📊 测试报告:"
          echo "   - 首页加载: ✅"
          echo "   - 登录功能: ✅"
          echo "   - 创建功能: ✅"
          echo "   - Feed 交互: ✅"
          echo ""
          echo "🌐 生产 URL: $PRODUCTION_URL"
          echo ""
          
          # 打开浏览器
          echo "🌐 打开浏览器..."
          open "$PRODUCTION_URL"
          
          exit 0
        else
          echo "❌ 测试失败，继续监控..."
        fi
      else
        echo "   ⏳ Firebase API Key 尚未注入"
        echo "   （构建可能还在进行中）"
      fi
    else
      echo "   ❌ 无法找到 JS 文件"
    fi
  else
    if [ -z "$LAST_DEPLOY_TIME" ]; then
      LAST_DEPLOY_TIME="$DEPLOY_TIME"
      echo "   📝 初始部署时间: $LAST_DEPLOY_TIME"
    else
      echo "   ⏳ 等待新的部署..."
    fi
  fi
  
  echo ""
  
  if [ $i -lt $MAX_ATTEMPTS ]; then
    echo "⏰ 等待 ${CHECK_INTERVAL} 秒后再次检查..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo "⏰ 监控超时（${MAX_ATTEMPTS} 次尝试）"
echo ""
echo "建议："
echo "1. 检查 Firebase Console 的构建日志"
echo "2. 手动触发重新部署"
echo "3. 检查代码是否有错误"
echo ""

exit 1

