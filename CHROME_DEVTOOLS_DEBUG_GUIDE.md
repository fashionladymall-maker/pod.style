# 🔧 Chrome DevTools 调试指南

**项目**: pod.style  
**更新时间**: 2025-10-03

---

## 🎯 调试目标

使用 Chrome DevTools 进行端到端调试，发现并修复所有前端和后端问题。

---

## 🚀 快速开始

### 方式 1: 浏览器内置 DevTools（推荐）

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **打开浏览器**
   ```bash
   open http://localhost:6100
   ```

3. **打开 Chrome DevTools**
   - 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - 或右键点击页面 → "检查"

4. **开始调试**
   - **Console**: 查看 JavaScript 错误和日志
   - **Network**: 检查 API 请求和响应
   - **Application**: 查看 Firebase 配置和存储
   - **Performance**: 分析性能问题
   - **Sources**: 设置断点调试代码

---

## 📋 调试检查清单

### 1. Console 检查 ✅
打开 Console 标签，检查：
- [ ] 无红色错误信息
- [ ] 无黄色警告（或仅有已知的低优先级警告）
- [ ] Firebase 初始化成功
- [ ] 无网络请求失败

**已知警告**:
- ⚠️ "Firestore settings already configured" - 不影响功能

### 2. Network 检查 ✅
打开 Network 标签，检查：
- [ ] 所有请求返回 200 或 304
- [ ] 无 404 或 500 错误
- [ ] API 响应时间合理（< 1s）
- [ ] Firebase 请求成功

**关键请求**:
- `GET /` - 首页加载
- `GET /_next/static/*` - 静态资源
- Firebase API 请求

### 3. Application 检查 ✅
打开 Application 标签，检查：
- [ ] Local Storage 包含 Firebase 配置
- [ ] Session Storage 正常
- [ ] Cookies 正常
- [ ] Service Worker（如果有）正常

### 4. Performance 检查 ✅
打开 Performance 标签，录制页面加载：
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTI < 3.5s

### 5. Sources 调试 ✅
打开 Sources 标签，设置断点：
- [ ] 在关键函数设置断点
- [ ] 检查变量值
- [ ] 单步执行代码
- [ ] 查看调用栈

---

## 🐛 常见问题诊断

### 问题 1: 页面空白或加载动画不消失
**检查步骤**:
1. 打开 Console，查看是否有错误
2. 打开 Network，检查 API 请求是否失败
3. 检查 React 组件是否正确渲染

**可能原因**:
- Firebase 配置错误
- 数据获取失败
- 组件渲染错误

**解决方案**: 参考 `BUG_TRACKING.md`

### 问题 2: Firebase 初始化失败
**检查步骤**:
1. Console 查看 Firebase 错误信息
2. Application → Local Storage 检查配置
3. 检查 `.env.local` 文件

**可能原因**:
- 缺少环境变量
- API Key 错误
- 项目 ID 错误

**解决方案**: 更新 `.env.local` 文件

### 问题 3: API 请求失败
**检查步骤**:
1. Network 标签查看请求详情
2. 检查请求 URL 和参数
3. 查看响应状态码和内容

**可能原因**:
- 后端服务未启动
- CORS 配置错误
- 认证失败

**解决方案**: 检查后端日志和配置

---

## 🧪 自动化测试脚本

### 运行所有测试
```bash
npm test
```

### 运行端到端测试
```bash
npm run e2e
```

### 运行性能测试
```bash
npm run test:performance
```

---

## 📊 性能监控

### 使用 Lighthouse
1. 打开 Chrome DevTools
2. 切换到 Lighthouse 标签
3. 选择 "Performance" 和 "Best practices"
4. 点击 "Analyze page load"

### 性能预算
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.5s
- **Bundle Size**: < 500KB

---

## 🔍 调试技巧

### 1. 使用 Console.log
```javascript
console.log('Debug:', variable);
console.table(array);
console.error('Error:', error);
```

### 2. 使用 Debugger
```javascript
debugger; // 代码会在这里暂停
```

### 3. 使用 Network Throttling
- 模拟慢速网络
- 测试加载性能
- 发现性能瓶颈

### 4. 使用 React DevTools
```bash
# 安装 React DevTools 扩展
# Chrome Web Store: React Developer Tools
```

### 5. 使用 Redux DevTools（如果使用 Redux）
```bash
# 安装 Redux DevTools 扩展
# Chrome Web Store: Redux DevTools
```

---

## 📝 调试日志模板

### 问题报告模板
```markdown
## 问题描述
[简要描述问题]

## 重现步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

## 预期行为
[描述预期的正确行为]

## 实际行为
[描述实际发生的行为]

## 环境信息
- 浏览器: Chrome [版本]
- 操作系统: [macOS/Windows/Linux]
- Node 版本: [版本]
- 项目版本: [Git commit hash]

## Console 错误
```
[粘贴 Console 错误信息]
```

## Network 请求
[粘贴相关的网络请求信息]

## 截图
[如果有，添加截图]
```

---

## 🚀 生产环境调试

### 启用 Source Maps
确保 `next.config.js` 包含：
```javascript
module.exports = {
  productionBrowserSourceMaps: true,
}
```

### 远程调试
1. 打开生产环境 URL
2. 打开 Chrome DevTools
3. 使用 Source Maps 调试压缩代码

---

## 📞 获取帮助

### 文档
- `BUG_TRACKING.md` - Bug 跟踪记录
- `DEBUGGING_COMPLETE.md` - 调试完成报告
- `TEST_SUMMARY.md` - 测试总结

### 日志位置
- **浏览器 Console**: Chrome DevTools → Console
- **服务端日志**: 终端输出
- **Firebase 日志**: Firebase Console → Functions → Logs

---

## ✅ 调试完成检查

完成调试后，确认：
- [ ] 所有 Console 错误已修复
- [ ] 所有 Network 请求成功
- [ ] 页面正常渲染
- [ ] 性能指标达标
- [ ] 用户流程可用
- [ ] 代码已提交到 Git

---

**最后更新**: 2025-10-03  
**状态**: ✅ 可用

