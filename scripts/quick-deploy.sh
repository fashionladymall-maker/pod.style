#!/bin/bash
# 快速部署脚本 - 跳过构建，直接部署

set -e

echo "🚀 快速部署到 Firebase"
echo "======================="

PROJECT_ID="studio-1269295870-5fde0"

# 1. 部署 Firestore 规则
echo ""
echo "📋 部署 Firestore 规则..."
firebase deploy --only firestore:rules --project $PROJECT_ID --non-interactive

# 2. 部署 Storage 规则
echo ""
echo "📦 部署 Storage 规则..."
firebase deploy --only storage --project $PROJECT_ID --non-interactive

# 3. 部署 Functions（如果存在）
if [ -d "functions" ] && [ -f "functions/index.js" ]; then
    echo ""
    echo "⚡ 部署 Cloud Functions..."
    firebase deploy --only functions --project $PROJECT_ID --non-interactive
else
    echo "⚠️  跳过 Functions 部署（未找到编译后的文件）"
fi

# 4. 部署 App Hosting
echo ""
echo "🌐 部署 App Hosting..."
firebase deploy --only apphosting --project $PROJECT_ID --non-interactive

echo ""
echo "✅ 部署完成！"
echo ""
echo "查看部署状态："
echo "firebase apphosting:backends:list --project $PROJECT_ID"

