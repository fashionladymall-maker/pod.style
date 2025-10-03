#!/bin/bash

echo "🔧 Firebase 认证系统修复脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 .env.local 文件
echo "📋 步骤 1: 检查环境变量配置..."
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local 文件不存在${NC}"
    exit 1
fi

# 检查必需的环境变量
required_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}❌ 缺少以下环境变量:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    exit 1
else
    echo -e "${GREEN}✅ 环境变量配置完整${NC}"
fi

# 清除缓存
echo ""
echo "🧹 步骤 2: 清除缓存..."
rm -rf .next
echo -e "${GREEN}✅ 缓存已清除${NC}"

# 检查端口
echo ""
echo "🔍 步骤 3: 检查端口 9002..."
if lsof -Pi :9002 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  端口 9002 已被占用，正在停止...${NC}"
    kill -9 $(lsof -ti:9002) 2>/dev/null
    sleep 2
fi
echo -e "${GREEN}✅ 端口已就绪${NC}"

# 提示用户
echo ""
echo "================================"
echo -e "${GREEN}✅ 准备工作完成！${NC}"
echo ""
echo "📝 接下来请执行以下步骤："
echo ""
echo "1. 访问 Firebase Console:"
echo "   https://console.firebase.google.com/project/studio-1269295870-5fde0/authentication/providers"
echo ""
echo "2. 确保以下登录方法已启用:"
echo "   ✓ Anonymous (匿名登录)"
echo "   ✓ Email/Password (邮箱/密码)"
echo ""
echo "3. 检查授权域名:"
echo "   https://console.firebase.google.com/project/studio-1269295870-5fde0/authentication/settings"
echo "   确保包含: localhost"
echo ""
echo "4. 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "5. 访问诊断工具测试:"
echo "   http://localhost:9002/test-firebase.html"
echo ""
echo "================================"

