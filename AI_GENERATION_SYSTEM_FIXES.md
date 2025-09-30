# AI生成系统全面修复报告

## 修复日期
2025-09-30

## 问题总结

用户报告AI生成系统完全崩溃：
1. **创意生成系统崩溃** - 无法生成图案
2. **商品生成系统崩溃** - 无法生成商品mockup
3. **API密钥错误** - Gemini API返回"API key not valid"

## 根本原因分析

### 1. Gemini API密钥未配置

**错误信息：**
```
Error: [GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent: 
[400 Bad Request] API key not valid. Please pass a valid API key.
```

**原因：**
- `.env.local`中的`GEMINI_API_KEY`设置为占位符`REPLACE_WITH_YOUR_GEMINI_KEY`
- Genkit的googleAI插件需要有效的API密钥才能调用Gemini API

**位置：**
- 文件：`.env.local`
- 行：17

### 2. Order文档缺少paymentSummary字段

**错误信息：**
```
Error [ZodError]: [
  {
    "code": "invalid_type",
    "expected": "object",
    "received": "undefined",
    "path": ["paymentSummary"],
    "message": "Required"
  }
]
```

**原因：**
- 数据库中的Order文档缺少`paymentSummary`字段
- Zod schema要求该字段为必需

**位置：**
- 文件：`src/features/orders/server/order-repository.ts`
- 行：13

## 修复方案

### 修复1: 配置Gemini API密钥

**步骤1：获取API密钥**

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录Google账号
3. 点击"Create API Key"
4. 复制生成的API密钥

**步骤2：配置环境变量**

用户提供的API密钥：`AIzaSyBdOZshtv6cmKKqc0XBZY3ZnXH4O4eKKeE`

更新`.env.local`文件：
```bash
GEMINI_API_KEY=AIzaSyBdOZshtv6cmKKqc0XBZY3ZnXH4O4eKKeE
```

**步骤3：验证API密钥**

需要在Google AI Studio中确认：
1. API密钥是否有效
2. 是否启用了以下API：
   - Gemini 2.5 Flash
   - Gemini 2.5 Flash Image Preview
   - Text Embedding 004

**步骤4：重启服务器**

```bash
# 停止当前服务器
Ctrl+C

# 重新启动
npm run dev
```

### 修复2: 修复Order的paymentSummary字段

**方案A：更新Zod Schema（推荐）**

修改`src/features/orders/server/order-model.ts`，使`paymentSummary`字段可选：

```typescript
export const orderDataSchema = z.object({
  // ... 其他字段
  paymentSummary: z.object({
    subtotal: z.number(),
    tax: z.number(),
    shipping: z.number(),
    total: z.number(),
  }).optional().default({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  }),
  // ... 其他字段
});
```

**方案B：数据迁移**

创建迁移脚本添加缺失的字段：

```javascript
// scripts/migrate-order-payment-summary.js
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateOrders() {
  const ordersRef = db.collection('orders');
  const snapshot = await ordersRef.get();
  
  const batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    if (!data.paymentSummary) {
      batch.update(doc.ref, {
        paymentSummary: {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
        }
      });
      count++;
    }
  }
  
  await batch.commit();
  console.log(`Updated ${count} orders`);
}

migrateOrders().then(() => process.exit(0));
```

## AI生成系统架构

### 组件概览

```
用户输入
    ↓
generatePatternAction (Server Action)
    ↓
generatePattern (Service)
    ↓
generateTShirtPatternWithStyle (Genkit Flow)
    ↓
Gemini 2.5 Flash Image Preview API
    ↓
生成的图案 (Data URI)
    ↓
上传到Firebase Storage
    ↓
创建Creation文档
```

### 关键文件

1. **Genkit配置**
   - `src/ai/genkit.ts` - Genkit实例初始化
   - 插件：`@genkit-ai/googleai`
   - 默认模型：`googleai/gemini-2.5-flash`

2. **AI Flows**
   - `src/ai/flows/generate-t-shirt-pattern-with-style.ts` - 图案生成
   - `src/ai/flows/generate-model-mockup.ts` - 商品mockup生成
   - `src/ai/flows/summarize-prompt.ts` - 提示词摘要

3. **Service层**
   - `src/features/creations/server/creation-service.ts` - 创意服务
   - `generatePattern()` - 图案生成逻辑
   - `generateModel()` - 商品模型生成逻辑

4. **Server Actions**
   - `src/features/creations/server/actions.ts`
   - `generatePatternAction()` - 图案生成Action
   - `generateModelAction()` - 商品生成Action

### 生成流程详解

#### 1. 图案生成流程

```typescript
// 用户输入
{
  userId: "user123",
  prompt: "一只可爱的猫咪",
  style: "卡通风格",
  referenceImage: "data:image/jpeg;base64,..."  // 可选
}

// 调用链
generatePatternAction()
  → generatePattern()
    → ensureUserFineTunedModel()  // 获取用户个性化模型
    → generateTShirtPatternWithStyle()  // Genkit Flow
      → ai.generate()  // 调用Gemini API
        → 返回生成的图片 (Data URI)
    → summarizePrompt()  // 生成四字摘要
    → uploadToStorage()  // 上传到Firebase Storage
    → createCreation()  // 创建Firestore文档
```

#### 2. 商品模型生成流程

```typescript
// 用户输入
{
  creationId: "creation123",
  userId: "user123",
  patternDataUri: "https://storage.googleapis.com/...",
  category: "T恤 (T-shirt)",
  colorName: "白色"
}

// 调用链
generateModelAction()
  → generateModel()
    → fetch(patternDataUri)  // 获取图案图片
    → generateModelMockup()  // Genkit Flow
      → ai.generate()  // 调用Gemini API
        → 返回商品mockup (Data URI)
    → uploadToStorage()  // 上传到Firebase Storage
    → updateCreation()  // 更新Creation文档
```

## 环境变量配置

### 必需的环境变量

```bash
# Gemini API密钥
GEMINI_API_KEY=your_api_key_here

# 或者使用别名
GOOGLE_API_KEY=your_api_key_here

# Firebase配置
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT=...
```

### 环境变量优先级

Genkit的googleAI插件按以下顺序查找API密钥：
1. 插件配置中直接传入的`apiKey`
2. `GEMINI_API_KEY`环境变量
3. `GOOGLE_API_KEY`环境变量

## 支持的模型

### 文本生成模型
- `googleai/gemini-2.5-flash` - 默认模型，快速响应
- `googleai/gemini-2.5-pro` - 更强大的模型

### 图像生成模型
- `googleai/gemini-2.5-flash-image-preview` - 图案生成
- `googleai/imagen-3.0-generate-002` - Imagen图像生成

### 文本嵌入模型
- `googleai/text-embedding-004` - 文本嵌入

## 测试清单

### API密钥验证
- [ ] API密钥格式正确（以AIza开头）
- [ ] API密钥在Google AI Studio中有效
- [ ] 启用了Gemini API
- [ ] 启用了Imagen API（如果使用）
- [ ] 环境变量正确设置
- [ ] 服务器重启后加载新环境变量

### 图案生成测试
- [ ] 简单文本提示生成
- [ ] 带风格的文本提示生成
- [ ] 带参考图片的生成
- [ ] 生成结果保存到Storage
- [ ] Creation文档正确创建
- [ ] 摘要正确生成

### 商品模型生成测试
- [ ] T恤mockup生成
- [ ] 帽子mockup生成
- [ ] 不同颜色测试
- [ ] 生成结果保存到Storage
- [ ] Creation文档正确更新

### 错误处理测试
- [ ] API密钥无效时的错误提示
- [ ] 网络错误时的重试机制
- [ ] 生成失败时的用户提示
- [ ] 安全策略违规时的处理

## 常见问题排查

### 问题1: API密钥无效

**症状：**
```
API key not valid. Please pass a valid API key.
```

**解决方案：**
1. 检查API密钥是否正确复制（没有多余空格）
2. 在Google AI Studio中验证密钥是否有效
3. 检查是否启用了必要的API
4. 确认环境变量名称正确（`GEMINI_API_KEY`）
5. 重启服务器以加载新环境变量

### 问题2: 模型不可用

**症状：**
```
Model not found or not available
```

**解决方案：**
1. 检查模型名称是否正确
2. 确认该模型在你的地区可用
3. 检查API配额是否用完
4. 尝试使用其他模型

### 问题3: 生成超时

**症状：**
```
Request timeout
```

**解决方案：**
1. 增加超时时间配置
2. 简化提示词
3. 减小参考图片大小
4. 检查网络连接

### 问题4: 安全策略违规

**症状：**
```
The AI failed to return an image. This might be due to a safety policy violation.
```

**解决方案：**
1. 修改提示词，避免敏感内容
2. 检查参考图片是否合规
3. 使用更通用的描述

## 监控和日志

### 关键日志点

1. **API调用日志**
```typescript
console.log('Calling Gemini API with prompt:', prompt);
console.log('API response:', response);
```

2. **错误日志**
```typescript
console.error('Pattern generation failed:', error);
console.error('Model generation failed:', error);
```

3. **性能日志**
```typescript
console.time('Pattern Generation');
// ... 生成逻辑
console.timeEnd('Pattern Generation');
```

### 建议的监控指标

- API调用成功率
- 平均生成时间
- API配额使用情况
- 错误类型分布
- 用户生成频率

## 下一步行动

### 立即行动
1. ✅ 配置Gemini API密钥
2. ⏳ 验证API密钥有效性
3. ⏳ 修复Order的paymentSummary字段
4. ⏳ 测试图案生成流程
5. ⏳ 测试商品模型生成流程

### 后续优化
1. 添加API调用重试机制
2. 实现生成结果缓存
3. 优化提示词模板
4. 添加生成进度反馈
5. 实现批量生成功能

## 总结

### 当前状态
- ✅ API密钥已配置到`.env.local`
- ⏳ 等待验证API密钥有效性
- ⏳ Order schema需要修复
- ⏳ 需要测试完整生成流程

### 预期结果
修复完成后，用户应该能够：
- 输入文本提示生成图案
- 选择艺术风格
- 上传参考图片
- 生成不同品类的商品mockup
- 查看生成历史
- 分享和下单

---

**修复人员：** Augment Agent  
**状态：** 进行中  
**最后更新：** 2025-09-30
