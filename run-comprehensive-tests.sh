#!/bin/bash

# 全面测试执行脚本
# 使用 Playwright 进行端到端测试

set -e

echo "🧪 pod.style 全面测试开始"
echo "======================================"
echo ""
echo "测试账号: 1504885923@qq.com"
echo "生产 URL: https://studio--studio-1269295870-5fde0.us-central1.hosted.app"
echo ""

# 创建测试结果目录
mkdir -p test-results
mkdir -p test-reports

# 记录开始时间
START_TIME=$(date +%s)

echo "📦 安装 Playwright 浏览器（如果需要）..."
npx playwright install chromium --with-deps || true

echo ""
echo "🚀 开始运行测试..."
echo ""

# 运行测试并生成报告
npx playwright test tests/comprehensive-production-test.spec.ts \
  --reporter=html \
  --reporter=list \
  --output=test-results \
  --timeout=60000 \
  --retries=2 \
  2>&1 | tee test-reports/test-output-$(date +%Y%m%d-%H%M%S).log

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "======================================"
echo "✅ 测试完成！"
echo "总耗时: ${DURATION} 秒"
echo ""
echo "📊 查看详细报告:"
echo "   npx playwright show-report"
echo ""
echo "📁 测试结果目录:"
echo "   test-results/"
echo "   test-reports/"
echo ""

