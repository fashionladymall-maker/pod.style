#!/bin/bash

# 持续监控部署状态并验证修复
# 每 2 分钟检查一次，直到环境变量被正确注入

set -e

PROD_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
PROJECT_ID="studio-1269295870-5fde0"
MAX_ATTEMPTS=15  # 最多检查 30 分钟
INTERVAL=120     # 每 2 分钟检查一次

echo "🔄 开始监控部署状态"
echo "===================="
echo "生产 URL: $PROD_URL"
echo "检查间隔: ${INTERVAL}秒"
echo "最大尝试次数: $MAX_ATTEMPTS"
echo ""

attempt=1

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "📊 [尝试 $attempt/$MAX_ATTEMPTS] $(date '+%Y-%m-%d %H:%M:%S')"
    echo "----------------------------------------"
    
    # 1. 检查部署状态
    echo "1️⃣  检查部署状态..."
    BACKEND_INFO=$(firebase apphosting:backends:list --project "$PROJECT_ID" 2>/dev/null | tail -n 2 | head -n 1)
    echo "   $BACKEND_INFO"
    
    # 2. 检查 HTTP 响应
    echo "2️⃣  检查 HTTP 响应..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ HTTP 200 OK"
    else
        echo "   ❌ HTTP $HTTP_CODE"
    fi
    
    # 3. 检查环境变量注入
    echo "3️⃣  检查环境变量注入..."
    
    # 获取页面内容
    PAGE_CONTENT=$(curl -s "$PROD_URL")
    
    # 提取 JS 文件路径
    JS_FILE=$(echo "$PAGE_CONTENT" | grep -o '/_next/static/chunks/app/page-[^"]*\.js' | head -1)
    
    if [ -n "$JS_FILE" ]; then
        echo "   检查文件: $JS_FILE"
        
        # 检查 Firebase API Key
        if curl -s "$PROD_URL$JS_FILE" 2>/dev/null | grep -q "AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0"; then
            echo "   ✅ Firebase API Key 已注入！"
            
            # 检查 Project ID
            if curl -s "$PROD_URL$JS_FILE" 2>/dev/null | grep -q "studio-1269295870-5fde0"; then
                echo "   ✅ Firebase Project ID 已注入！"
            fi
            
            # 检查 App ID
            if curl -s "$PROD_URL$JS_FILE" 2>/dev/null | grep -q "1:204491544475:web:dadc0d6d650572156db33e"; then
                echo "   ✅ Firebase App ID 已注入！"
            fi
            
            echo ""
            echo "🎉 =========================================="
            echo "🎉  环境变量注入成功！修复完成！"
            echo "🎉 =========================================="
            echo ""
            echo "📝 下一步："
            echo "1. 在浏览器中打开: $PROD_URL"
            echo "2. 检查页面是否正常加载（不再只显示加载动画）"
            echo "3. 打开浏览器控制台，确认没有 Firebase 初始化错误"
            echo "4. 测试用户登录功能"
            echo "5. 测试创建和预览功能"
            echo ""
            echo "🔗 Firebase Console:"
            echo "https://console.firebase.google.com/project/$PROJECT_ID/apphosting"
            echo ""
            
            # 运行完整验证
            echo "🧪 运行完整验证..."
            ./scripts/verify-deployment.sh
            
            exit 0
        else
            echo "   ⏳ Firebase API Key 尚未注入"
            echo "   （构建可能还在进行中）"
        fi
    else
        echo "   ⚠️  无法找到 JS 文件"
    fi
    
    echo ""
    
    # 如果不是最后一次尝试，等待下一次检查
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
        echo "⏰ 等待 ${INTERVAL} 秒后再次检查..."
        echo ""
        sleep $INTERVAL
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo "❌ =========================================="
echo "❌  超时：环境变量仍未注入"
echo "❌ =========================================="
echo ""
echo "可能的原因："
echo "1. 构建失败或被卡住"
echo "2. apphosting.yaml 配置有误"
echo "3. next.config.ts 配置有误"
echo "4. Firebase App Hosting 服务问题"
echo ""
echo "建议操作："
echo "1. 检查 Firebase Console 的构建日志"
echo "2. 手动触发新的构建"
echo "3. 联系 Firebase 支持"
echo ""
echo "🔗 Firebase Console:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/apphosting"

exit 1

