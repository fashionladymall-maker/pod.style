#!/bin/bash

# 监控 Firebase 配置修复的效果
# 检查生产环境是否成功注入 Firebase 配置

set -e

PROD_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
MAX_ATTEMPTS=20
INTERVAL=120  # 2 minutes
FIREBASE_API_KEY="AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0"

echo "🔄 开始监控 Firebase 配置修复"
echo "===================="
echo "生产 URL: $PROD_URL"
echo "检查间隔: ${INTERVAL}秒"
echo "最大尝试次数: $MAX_ATTEMPTS"
echo ""

for i in $(seq 1 $MAX_ATTEMPTS); do
  echo "📊 [尝试 $i/$MAX_ATTEMPTS] $(date '+%Y-%m-%d %H:%M:%S')"
  echo "----------------------------------------"
  
  # 1. 检查部署状态
  echo "1️⃣  检查部署状态..."
  firebase apphosting:backends:list --project studio-1269295870-5fde0 2>/dev/null | grep -E "studio|BACKEND|Updated" | head -3 || echo "   ⚠️  无法获取部署状态"
  
  # 2. 检查 HTTP 响应
  echo "2️⃣  检查 HTTP 响应..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ HTTP 200 OK"
  else
    echo "   ❌ HTTP $HTTP_CODE"
  fi
  
  # 3. 检查页面内容
  echo "3️⃣  检查页面内容..."
  PAGE_CONTENT=$(curl -s "$PROD_URL")
  
  # 检查是否有 Firebase API Key
  if echo "$PAGE_CONTENT" | grep -q "$FIREBASE_API_KEY"; then
    echo "   ✅ Firebase API Key 已注入到页面中！"
    echo ""
    echo "🎉 成功！Firebase 配置已正确注入！"
    echo "===================="
    
    # 4. 运行完整验证
    echo ""
    echo "4️⃣  运行完整验证..."
    if [ -f "./scripts/verify-deployment.sh" ]; then
      chmod +x ./scripts/verify-deployment.sh
      ./scripts/verify-deployment.sh
    fi
    
    # 5. 打开浏览器
    echo ""
    echo "5️⃣  打开浏览器..."
    open "$PROD_URL"
    
    exit 0
  else
    echo "   ⏳ Firebase API Key 尚未注入"
  fi
  
  # 4. 检查 JavaScript 文件
  echo "4️⃣  检查 JavaScript 文件..."
  
  # 提取主要的 JS 文件路径
  JS_FILE=$(echo "$PAGE_CONTENT" | grep -o '/_next/static/chunks/app/page-[a-f0-9]*.js' | head -1)
  
  if [ -n "$JS_FILE" ]; then
    echo "   检查文件: $JS_FILE"
    
    # 检查 JS 文件中是否包含 Firebase API Key
    if curl -s "$PROD_URL$JS_FILE" | grep -q "$FIREBASE_API_KEY"; then
      echo "   ✅ Firebase API Key 在 JS 文件中找到！"
      echo ""
      echo "🎉 成功！Firebase 配置已正确注入到构建中！"
      echo "===================="
      
      # 运行完整验证
      echo ""
      echo "5️⃣  运行完整验证..."
      if [ -f "./scripts/verify-deployment.sh" ]; then
        chmod +x ./scripts/verify-deployment.sh
        ./scripts/verify-deployment.sh
      fi
      
      # 打开浏览器
      echo ""
      echo "6️⃣  打开浏览器..."
      open "$PROD_URL"
      
      exit 0
    else
      echo "   ⏳ Firebase API Key 尚未注入到 JS 文件"
      echo "   （构建可能还在进行中）"
    fi
  else
    echo "   ⚠️  无法找到主 JS 文件"
  fi
  
  # 5. 检查是否有错误
  echo "5️⃣  检查错误..."
  if echo "$PAGE_CONTENT" | grep -qi "error\|exception\|failed"; then
    echo "   ⚠️  页面中可能包含错误"
  else
    echo "   ✅ 未发现明显错误"
  fi
  
  echo ""
  
  if [ $i -lt $MAX_ATTEMPTS ]; then
    echo "⏰ 等待 $INTERVAL 秒后再次检查..."
    echo ""
    sleep $INTERVAL
  fi
done

echo ""
echo "❌ 超时：经过 $MAX_ATTEMPTS 次检查后，Firebase 配置仍未注入"
echo "===================="
echo ""
echo "建议："
echo "1. 检查 Firebase App Hosting 构建日志"
echo "2. 手动触发新的构建"
echo "3. 检查 src/lib/firebase.ts 中的 PRODUCTION_FIREBASE_CONFIG"
echo ""
echo "查看详细日志："
echo "  firebase apphosting:backends:logs --project studio-1269295870-5fde0"
echo ""

exit 1

