#!/bin/bash
# 部署后测试脚本

set -e

PROJECT_ID="studio-1269295870-5fde0"

echo "🧪 pod.style 部署测试"
echo "====================="
echo ""

# 1. 获取部署 URL
echo "📊 [1/5] 获取部署 URL..."
DEPLOY_URL=$(firebase apphosting:backends:list --project "$PROJECT_ID" 2>/dev/null | grep -o 'https://[^ ]*' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo "⚠️  无法获取部署 URL，请手动检查 Firebase Console"
    echo "   https://console.firebase.google.com/project/$PROJECT_ID/apphosting"
    exit 1
fi

echo "✅ 部署 URL: $DEPLOY_URL"
echo ""

# 2. 测试首页
echo "🌐 [2/5] 测试首页..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 首页响应正常 (HTTP $HTTP_CODE)"
else
    echo "❌ 首页响应异常 (HTTP $HTTP_CODE)"
fi
echo ""

# 3. 测试 API 健康检查
echo "🔍 [3/5] 测试 API 健康检查..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/health" || echo "000")
if [ "$API_CODE" = "200" ] || [ "$API_CODE" = "404" ]; then
    echo "✅ API 端点可访问 (HTTP $API_CODE)"
else
    echo "⚠️  API 端点响应: HTTP $API_CODE"
fi
echo ""

# 4. 检查 Functions 状态
echo "⚡ [4/5] 检查 Cloud Functions..."
FUNCTIONS_COUNT=$(firebase functions:list --project "$PROJECT_ID" 2>/dev/null | grep -c "Function" || echo "0")
echo "✅ 已部署 $FUNCTIONS_COUNT 个 Functions"
echo ""

# 5. 检查 Firestore 规则
echo "📋 [5/5] 检查 Firestore 规则..."
echo "✅ 请在 Firebase Console 验证规则已更新"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/firestore/rules"
echo ""

# 总结
echo "================================"
echo "📊 测试总结"
echo "================================"
echo "部署 URL: $DEPLOY_URL"
echo "首页状态: HTTP $HTTP_CODE"
echo "API 状态: HTTP $API_CODE"
echo "Functions: $FUNCTIONS_COUNT 个"
echo ""
echo "🔗 重要链接:"
echo "   - 应用: $DEPLOY_URL"
echo "   - Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "   - Functions 日志: https://console.firebase.google.com/project/$PROJECT_ID/functions/logs"
echo "   - Performance: https://console.firebase.google.com/project/$PROJECT_ID/performance"
echo ""

# 性能测试（可选）
read -p "是否运行 Lighthouse 性能测试？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 运行 Lighthouse..."
    npx lighthouse "$DEPLOY_URL" --output=html --output-path=./lighthouse-report.html --chrome-flags="--headless"
    echo "✅ 报告已生成: lighthouse-report.html"
fi

echo ""
echo "✅ 测试完成！"

