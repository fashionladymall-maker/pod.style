#!/bin/bash

# 浏览器调试辅助脚本
# 用于自动化打开浏览器并进行基本检查

set -e

echo "🔧 POD.STYLE 浏览器调试工具"
echo "================================"
echo ""

# 检查开发服务器是否运行
check_server() {
    echo "📡 检查开发服务器..."
    if curl -s http://localhost:6100 > /dev/null 2>&1; then
        echo "✅ 开发服务器正在运行"
        return 0
    else
        echo "❌ 开发服务器未运行"
        return 1
    fi
}

# 启动开发服务器
start_server() {
    echo "🚀 启动开发服务器..."
    npm run dev &
    SERVER_PID=$!
    echo "⏳ 等待服务器启动..."
    sleep 10
    
    if check_server; then
        echo "✅ 服务器启动成功 (PID: $SERVER_PID)"
    else
        echo "❌ 服务器启动失败"
        exit 1
    fi
}

# 打开浏览器
open_browser() {
    echo "🌐 打开浏览器..."
    
    # 检测操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open -a "Google Chrome" http://localhost:6100
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        google-chrome http://localhost:6100 || chromium-browser http://localhost:6100
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start chrome http://localhost:6100
    else
        echo "⚠️  无法自动打开浏览器，请手动访问: http://localhost:6100"
        return 1
    fi
    
    echo "✅ 浏览器已打开"
}

# 显示调试提示
show_debug_tips() {
    echo ""
    echo "🔍 调试提示"
    echo "================================"
    echo ""
    echo "1. 打开 Chrome DevTools:"
    echo "   - 按 F12 或 Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)"
    echo ""
    echo "2. 检查 Console 标签:"
    echo "   - 查看是否有红色错误"
    echo "   - 查看 Firebase 初始化日志"
    echo ""
    echo "3. 检查 Network 标签:"
    echo "   - 查看所有请求是否成功 (200/304)"
    echo "   - 检查 API 响应时间"
    echo ""
    echo "4. 检查 Application 标签:"
    echo "   - Local Storage → Firebase 配置"
    echo "   - Session Storage"
    echo ""
    echo "5. 运行 Lighthouse:"
    echo "   - 切换到 Lighthouse 标签"
    echo "   - 点击 'Analyze page load'"
    echo ""
    echo "📝 详细指南: CHROME_DEVTOOLS_DEBUG_GUIDE.md"
    echo ""
}

# 运行基本健康检查
health_check() {
    echo "🏥 运行健康检查..."
    echo ""
    
    # 检查 HTTP 状态
    echo "1. HTTP 状态检查..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6100)
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ HTTP 200 OK"
    else
        echo "   ❌ HTTP $STATUS"
    fi
    
    # 检查响应时间
    echo "2. 响应时间检查..."
    TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:6100)
    echo "   ⏱️  响应时间: ${TIME}s"
    if (( $(echo "$TIME < 1.0" | bc -l) )); then
        echo "   ✅ 响应时间良好"
    else
        echo "   ⚠️  响应时间较慢"
    fi
    
    # 检查 Console 错误
    echo "3. Console 错误检查..."
    ERRORS=$(curl -s http://localhost:6100 | grep -i "error" | wc -l)
    if [ "$ERRORS" -eq 0 ]; then
        echo "   ✅ 无明显错误"
    else
        echo "   ⚠️  发现 $ERRORS 个可能的错误"
    fi
    
    echo ""
}

# 主函数
main() {
    # 检查服务器状态
    if ! check_server; then
        read -p "是否启动开发服务器? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            start_server
        else
            echo "❌ 请先启动开发服务器: npm run dev"
            exit 1
        fi
    fi
    
    # 运行健康检查
    health_check
    
    # 打开浏览器
    read -p "是否打开浏览器? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open_browser
    fi
    
    # 显示调试提示
    show_debug_tips
    
    echo "✨ 调试工具已准备就绪！"
    echo ""
    echo "按 Ctrl+C 停止开发服务器"
    
    # 保持脚本运行
    if [ ! -z "$SERVER_PID" ]; then
        wait $SERVER_PID
    fi
}

# 运行主函数
main

