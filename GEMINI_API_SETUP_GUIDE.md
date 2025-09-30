# Gemini API 设置指南

## 当前状态

✅ **API密钥已配置到`.env.local`**
```
GEMINI_API_KEY=AIzaSyBdOZshtv6cmKKqc0XBZY3ZnXH4O4eKKeE
```

⚠️ **API密钥验证失败**
```
Error: API key not valid. Please pass a valid API key.
```

## 问题原因

API密钥可能存在以下问题之一：
1. 密钥无效或已过期
2. 密钥没有启用必要的API
3. 密钥有使用限制或配额已用完
4. 密钥格式不正确

## 解决步骤

### 步骤1: 验证API密钥

访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 并执行以下操作：

1. **登录Google账号**
   - 使用创建API密钥的账号登录

2. **检查API密钥状态**
   - 在"API Keys"页面查看密钥列表
   - 确认密钥`AIzaSyBdOZshtv6cmKKqc0XBZY3ZnXH4O4eKKeE`是否存在
   - 检查密钥是否被禁用或删除

3. **如果密钥无效，创建新密钥**
   - 点击"Create API Key"按钮
   - 选择项目（或创建新项目）
   - 复制新生成的API密钥

### 步骤2: 启用必要的API

在 [Google Cloud Console](https://console.cloud.google.com/) 中：

1. **选择项目**
   - 选择与API密钥关联的项目

2. **启用Gemini API**
   - 访问 [API Library](https://console.cloud.google.com/apis/library)
   - 搜索"Generative Language API"
   - 点击"Enable"启用API

3. **确认API已启用**
   - 访问 [Enabled APIs](https://console.cloud.google.com/apis/dashboard)
   - 确认"Generative Language API"在列表中

### 步骤3: 检查配额和限制

1. **查看配额**
   - 访问 [Quotas](https://console.cloud.google.com/iam-admin/quotas)
   - 搜索"Generative Language API"
   - 检查每日请求限制和当前使用量

2. **检查计费**
   - 访问 [Billing](https://console.cloud.google.com/billing)
   - 确认项目已启用计费（如果需要）
   - 检查是否有未支付的账单

### 步骤4: 测试API密钥

使用以下命令测试API密钥是否有效：

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBdOZshtv6cmKKqc0XBZY3ZnXH4O4eKKeE" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, Gemini!"
      }]
    }]
  }'
```

**预期结果：**
- 如果API密钥有效，应该返回JSON响应
- 如果API密钥无效，会返回400错误

### 步骤5: 更新环境变量

如果创建了新的API密钥：

1. **更新`.env.local`文件**
```bash
GEMINI_API_KEY=your_new_api_key_here
```

2. **重启开发服务器**
```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## 常见问题

### Q1: 为什么我的API密钥无效？

**可能原因：**
- API密钥已被删除或禁用
- API密钥有IP地址限制
- API密钥有HTTP referrer限制
- 项目已被暂停或删除

**解决方案：**
- 在Google AI Studio中检查密钥状态
- 检查密钥的限制设置
- 创建新的API密钥

### Q2: 如何设置API密钥限制？

**步骤：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入"APIs & Services" > "Credentials"
3. 点击API密钥进行编辑
4. 设置应用程序限制：
   - **None**: 无限制（开发环境）
   - **HTTP referrers**: 限制特定域名
   - **IP addresses**: 限制特定IP
   - **Android apps**: 限制Android应用
   - **iOS apps**: 限制iOS应用

### Q3: Gemini API是免费的吗？

**免费配额：**
- Gemini 2.5 Flash: 每分钟15个请求
- Gemini 2.5 Pro: 每分钟2个请求
- 每天有总请求限制

**付费计划：**
- 超过免费配额后需要启用计费
- 按使用量计费

### Q4: 如何监控API使用情况？

**方法：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入"APIs & Services" > "Dashboard"
3. 选择"Generative Language API"
4. 查看请求图表和配额使用情况

## 所需的API

POD.STYLE应用需要以下API：

### 1. Generative Language API
- **用途**: 文本生成、图像生成
- **模型**:
  - `gemini-2.5-flash` - 文本生成
  - `gemini-2.5-flash-image-preview` - 图像生成
  - `text-embedding-004` - 文本嵌入

### 2. Cloud Storage API (可选)
- **用途**: 存储生成的图片
- **注意**: 如果使用Firebase Storage，此API会自动启用

## 验证清单

完成以下检查以确保API配置正确：

- [ ] API密钥格式正确（以`AIza`开头）
- [ ] API密钥在Google AI Studio中存在且有效
- [ ] Generative Language API已启用
- [ ] 项目有足够的配额
- [ ] 计费已启用（如果需要）
- [ ] 环境变量正确设置在`.env.local`
- [ ] 开发服务器已重启
- [ ] 使用curl命令测试API密钥成功

## 测试API连接

### 测试1: 简单文本生成

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello in Chinese"
      }]
    }]
  }'
```

### 测试2: 图像生成

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Generate an image of a cute cat"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["IMAGE"]
    }
  }'
```

## 下一步

完成API密钥配置后：

1. **重启服务器**
```bash
npm run dev
```

2. **测试创意生成**
   - 打开应用 http://localhost:9002
   - 输入创意描述
   - 点击"生成图案"
   - 观察是否成功生成

3. **检查日志**
   - 查看服务器终端输出
   - 确认没有API错误
   - 验证生成流程完整

4. **测试商品生成**
   - 选择一个生成的图案
   - 点击"生成商品"
   - 选择品类和颜色
   - 确认商品mockup生成成功

## 获取帮助

如果仍然遇到问题：

1. **查看错误日志**
   - 检查服务器终端的详细错误信息
   - 记录错误代码和消息

2. **访问Google AI Studio文档**
   - [Gemini API文档](https://ai.google.dev/docs)
   - [快速开始指南](https://ai.google.dev/tutorials/get_started_web)

3. **检查Firebase配置**
   - 确认Firebase项目配置正确
   - 验证Storage规则允许上传

4. **联系支持**
   - [Google AI Studio支持](https://support.google.com/)
   - [Firebase支持](https://firebase.google.com/support)

---

**重要提示：** 
- 不要在公开的代码仓库中提交API密钥
- 使用环境变量管理敏感信息
- 定期轮换API密钥以提高安全性
- 设置适当的API限制以防止滥用

**最后更新：** 2025-09-30
