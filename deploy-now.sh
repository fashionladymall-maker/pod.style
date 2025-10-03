#!/bin/bash
# 立即部署脚本 - 在后台运行，输出到日志文件

set -e

LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 开始部署 pod.style" | tee -a "$LOG_FILE"
echo "时间: $(date)" | tee -a "$LOG_FILE"
echo "日志文件: $LOG_FILE" | tee -a "$LOG_FILE"
echo "================================" | tee -a "$LOG_FILE"

PROJECT_ID="studio-1269295870-5fde0"

# 1. 安装 Functions 依赖
echo "" | tee -a "$LOG_FILE"
echo "📦 [1/6] 安装 Functions 依赖..." | tee -a "$LOG_FILE"
cd functions
npm install >> "../$LOG_FILE" 2>&1
cd ..
echo "✅ Functions 依赖安装完成" | tee -a "$LOG_FILE"

# 2. 构建 Functions
echo "" | tee -a "$LOG_FILE"
echo "🔨 [2/6] 构建 Functions..." | tee -a "$LOG_FILE"
cd functions
npm run build >> "../$LOG_FILE" 2>&1
cd ..
echo "✅ Functions 构建完成" | tee -a "$LOG_FILE"

# 3. 部署 Firestore 规则
echo "" | tee -a "$LOG_FILE"
echo "📋 [3/6] 部署 Firestore 规则..." | tee -a "$LOG_FILE"
firebase deploy --only firestore:rules --project "$PROJECT_ID" --non-interactive >> "$LOG_FILE" 2>&1
echo "✅ Firestore 规则部署完成" | tee -a "$LOG_FILE"

# 4. 部署 Storage 规则
echo "" | tee -a "$LOG_FILE"
echo "📦 [4/6] 部署 Storage 规则..." | tee -a "$LOG_FILE"
firebase deploy --only storage --project "$PROJECT_ID" --non-interactive >> "$LOG_FILE" 2>&1
echo "✅ Storage 规则部署完成" | tee -a "$LOG_FILE"

# 5. 部署 Functions
echo "" | tee -a "$LOG_FILE"
echo "⚡ [5/6] 部署 Cloud Functions..." | tee -a "$LOG_FILE"
firebase deploy --only functions --project "$PROJECT_ID" --non-interactive >> "$LOG_FILE" 2>&1
echo "✅ Functions 部署完成" | tee -a "$LOG_FILE"

# 6. 部署 App Hosting
echo "" | tee -a "$LOG_FILE"
echo "🌐 [6/6] 部署 App Hosting..." | tee -a "$LOG_FILE"
firebase deploy --only apphosting --project "$PROJECT_ID" --non-interactive >> "$LOG_FILE" 2>&1
echo "✅ App Hosting 部署完成" | tee -a "$LOG_FILE"

# 完成
echo "" | tee -a "$LOG_FILE"
echo "================================" | tee -a "$LOG_FILE"
echo "🎉 部署完成！" | tee -a "$LOG_FILE"
echo "时间: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 获取部署 URL
echo "📊 获取部署信息..." | tee -a "$LOG_FILE"
firebase apphosting:backends:list --project "$PROJECT_ID" >> "$LOG_FILE" 2>&1

echo "" | tee -a "$LOG_FILE"
echo "查看完整日志: cat $LOG_FILE" | tee -a "$LOG_FILE"

