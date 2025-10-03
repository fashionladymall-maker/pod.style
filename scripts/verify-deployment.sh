#!/bin/bash

# 验证部署脚本
# 用于检查 Firebase App Hosting 部署是否成功，以及环境变量是否正确注入

set -e

PROD_URL="https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
PROJECT_ID="studio-1269295870-5fde0"

echo "🔍 pod.style 部署验证"
echo "===================="
echo ""

# 1. 检查部署状态
echo "📊 [1/6] 检查部署状态..."
firebase apphosting:backends:list --project "$PROJECT_ID" || echo "⚠️  无法获取部署状态"
echo ""

# 2. 检查 HTTP 响应
echo "🌐 [2/6] 检查 HTTP 响应..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTP 200 OK"
else
    echo "❌ HTTP $HTTP_CODE"
    exit 1
fi
echo ""

# 3. 检查环境变量是否被注入
echo "🔧 [3/6] 检查环境变量注入..."
FIREBASE_KEY_FOUND=$(curl -s "$PROD_URL/_next/static/chunks/app/page-*.js" 2>/dev/null | grep -o "AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0" | head -1)
if [ -n "$FIREBASE_KEY_FOUND" ]; then
    echo "✅ Firebase API Key 已注入到构建中"
else
    echo "❌ Firebase API Key 未找到"
    echo "   这可能意味着："
    echo "   1. 构建还在进行中"
    echo "   2. 环境变量配置有误"
    echo "   3. 需要清除缓存重新构建"
    exit 1
fi
echo ""

# 4. 检查页面内容
echo "📄 [4/6] 检查页面内容..."
PAGE_CONTENT=$(curl -s "$PROD_URL")
if echo "$PAGE_CONTENT" | grep -q "POD.STYLE"; then
    echo "✅ 页面标题正确"
else
    echo "❌ 页面标题未找到"
    exit 1
fi

if echo "$PAGE_CONTENT" | grep -q "lucide-loader-circle"; then
    echo "⚠️  页面仍显示加载动画（可能是正常的初始状态）"
else
    echo "✅ 页面没有永久加载动画"
fi
echo ""

# 5. 检查 JavaScript 文件
echo "📦 [5/6] 检查 JavaScript 文件..."
JS_FILES=$(echo "$PAGE_CONTENT" | grep -o '/_next/static/chunks/[^"]*\.js' | head -5)
JS_COUNT=$(echo "$JS_FILES" | wc -l | tr -d ' ')
echo "   找到 $JS_COUNT 个 JavaScript 文件"
if [ "$JS_COUNT" -gt 0 ]; then
    echo "✅ JavaScript 文件正常加载"
else
    echo "❌ 未找到 JavaScript 文件"
    exit 1
fi
echo ""

# 6. 检查 Firebase 配置
echo "🔥 [6/6] 检查 Firebase 配置..."
echo "   检查以下环境变量是否存在："
echo "   - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   - NEXT_PUBLIC_FIREBASE_APP_ID"

# 尝试从 JS 文件中查找配置
SAMPLE_JS=$(echo "$JS_FILES" | head -1)
if [ -n "$SAMPLE_JS" ]; then
    JS_CONTENT=$(curl -s "$PROD_URL$SAMPLE_JS")
    
    if echo "$JS_CONTENT" | grep -q "studio-1269295870-5fde0"; then
        echo "✅ Firebase Project ID 已注入"
    else
        echo "⚠️  Firebase Project ID 未在此文件中找到"
    fi
    
    if echo "$JS_CONTENT" | grep -q "1:204491544475:web:dadc0d6d650572156db33e"; then
        echo "✅ Firebase App ID 已注入"
    else
        echo "⚠️  Firebase App ID 未在此文件中找到"
    fi
fi
echo ""

# 总结
echo "✅ 部署验证完成！"
echo ""
echo "📝 下一步："
echo "1. 在浏览器中打开: $PROD_URL"
echo "2. 检查浏览器控制台是否有错误"
echo "3. 测试用户登录功能"
echo "4. 测试创建和预览功能"
echo ""
echo "🔗 Firebase Console:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/apphosting"

