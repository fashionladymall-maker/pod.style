# pod.style — 监督者（PM）指挥 Codex CLI × BMAD（本地） — 端到端流程蓝皮书（v4.0 / Firebase Studio × VSCode）

> **一句话目标**：在不需进一步确认的前提下，把 **pod.style**（Firebase Studio 项目，`studio-1269295870-5fde0`）规范成“**用户创意 → 极速多品类预览 → 一键下单定制**”的闭环产品，整体体验对标短视频沉浸式范式（**内部代号：OMG**）。**任何代码/配置/数据中禁止出现真实平台名**，一律用 `OMG` 表示。以 **Codex CLI 直接驱动 BMAD（本地模式）** 实现全部代码；由**你（监督者/项目经理）**节拍推进并质量把关，指挥多终端 Codex 执行；**Chrome DevTools MCP** 用于端到端与性能验收。

---

## 0. 原则与代号
- **代号映射**：`OMG` = 短视频沉浸流范式（竖向滚动 Feed、卡片内多角度轮播、悬浮操作栏、自动播放/懒加载、相关推荐）。
- **单线程推进**：你负责派单，统一指挥多终端 Codex CLI 执行单一 Story；未达 DoD 不发布下一个任务。
- **CI 质量闸门**：构建、测试、扫描（敏感词/安全/体积）、性能预算均达标才可合并。
- **守护线**：禁止真实平台名；发现即失败（pre-commit + CI）。
- **可回滚**：任何硬失败先回滚到上一个绿色 tag。

---

## 1. 角色矩阵（RACI）
| 领域 | 监督者（你） | BMAD | Codex CLI 执行端 | DevTools MCP |
|---|---|---|---|---|
| 愿景/PRD/架构 | R/A | C | I | I |
| Story/WBS/DoD | R/A | R | I | I |
| 编码/测试/PR | I | I | R/A | I |
| 端到端/性能验收 | A | I | C | R |
| 部署/回滚 | A | I | C | I |

> R=Responsible, A=Accountable, C=Consulted, I=Informed

---

## 2. 环境矩阵与先决条件
- **Node** ≥ 20、npm/yarn、git、VSCode。
- **Firebase**：已开通 App Hosting / Firestore / Functions / Storage / App Check；项目 `studio-1269295870-5fde0`。
- **Codex CLI**：`npm i -g @openai/codex` → `codex login`；`codex help > docs/tools/codex-help.txt`。
- **BMAD（本地）**：`npx bmad-method install -f -i codex -d .`（`.bmad-core/` 保持忽略）。
- **MCP（可选）**：安装 `chrome-devtools-mcp` 并确保预览域可访问。

---

## 3. 仓库结构（增量规范）
```
root
├─ apps/web/                    # Next.js (App Router) WEB 前端（App Hosting）
│  ├─ app/(routes)/             # /、/create、/preview、/product/[sku]、/checkout、/orders
│  ├─ components/               # UI（OMGFeedCard、SKUSelector、ActionBar、Skeleton 等）
│  ├─ features/                 # 业务（prompt、preview、feed、cart、orders、auth）
│  ├─ lib/                      # firebase 客户端/analytics/hooks/utils
│  ├─ public/                   # 占位资源
│  └─ tests/                    # vitest/jest + playwright
├─ functions/                   # Cloud Functions (Node 20)
│  └─ src/
│     ├─ preview/               # 低时延 Mock，小图标准化
│     ├─ render/                # print-ready 队列（Cloud Tasks）
│     ├─ orders/                # 支付回调/状态机/工厂对接（占位）
│     └─ moderation/            # 文本/图像合规
├─ firestore.rules              # Firestore 规则
├─ storage.rules                # Storage 规则
├─ scripts/                     # 扫描/预算/模板/索引生成器
├─ docs/
│  ├─ vision.md                 # OMG 愿景（不含真实平台名）
│  ├─ architecture.md           # 现状→目标架构、接口契约、质量属性
│  ├─ prd.md                    # 关键路径/体验门槛/性能预算/验收
│  ├─ playbooks/augment-bmad-codex-mcp.md
│  ├─ tools/codex-help.txt      # `codex help` 输出
│  └─ tools/codex-command-map.md# 将 help 映射为 [STATUS]/[RUN] 等（见 §10）
├─ bmad/
│  ├─ stories/                  # Story（YAML 头，含验收/指标）
│  ├─ constraints.md            # 契约/依赖/预算
│  └─ templates/
├─ .github/
│  ├─ workflows/ci.yml          # CI（构建/测试/扫描/预算/预览）
│  └─ PULL_REQUEST_TEMPLATE.md  # PR 验收对照
├─ firebase.json
├─ .firebaserc                  # 缺省项目：studio-1269295870-5fde0
├─ package.json
└─ .bmad-core/                  # 本地模式生成，保持忽略
```

---

## 4. 数据建模（Firestore / Storage）
**集合**：
- `users/{uid}`：profile、偏好、OMG 个性化信号
- `designs/{designId}`：ownerUid、prompt/source、status、`previews[]`、`printAsset{url,dpi,icc,checksum,reportId}`、`metrics{like,save,share,conversion}`
- `skus/{sku}`：模板、材质、可打印区域（SVG/JSON/warp）、变体、价格/物流参数
- `carts/{uid}/items/{id}`：sku、designId、variants、qty、price
- `orders/{orderId}`：`status(created|paid|printing|shipped|delivered|returned)`、支付信息、工单、物流
- （可选）`feeds/{feedId}`：排序快照（实验）

**Storage**：
- `uploads/{uid}/{designId}/source.*`
- `previews/{designId}/{sku}/{variant}/{size}.jpg`
- `prints/{orderId}/{lineItemId}/print-ready.tif`

**索引建议**：
- `designs(ownerUid, status)` 复合；`designs(metrics.conversion desc)` 排序
- `orders(user, status, updatedAt)` 复合

---

## 5. 安全与配置（规则/变量）
**Firestore 规则（示例片段）**：
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    match /users/{uid} {
      allow read: if isOwner(uid);
      allow write: if isOwner(uid);
    }

    match /designs/{id} {
      allow read: if request.auth != null; // 或更细分
      allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if resource.data.ownerUid == request.auth.uid;
    }

    match /orders/{id} {
      allow read, write: if resource.data.user == request.auth.uid;
    }
  }
}
```
**Storage 规则（示例片段）**：
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isUser(uid) { return request.auth != null && request.auth.uid == uid; }

    match /uploads/{uid}/{allPaths=**} {
      allow read, write: if isUser(uid);
    }
    match /previews/{designId}/{all=**} {
      allow read: if request.auth != null;
      allow write: if false; // 仅后端写
    }
    match /prints/{orderId}/{all=**} {
      allow read: if request.auth != null && resource.metadata.user == request.auth.uid;
      allow write: if false; // 仅后端
    }
  }
}
```
**环境变量**：
- 前端：`NEXT_PUBLIC_*`（Firebase/recaptcha/site-key/preview-endpoint 等）
- 后端：在 GitHub Actions Secrets（STRIPE_KEY、WEBHOOK_SECRET 等）；严禁入库。
- **App Check**：Web reCAPTCHA / DeviceCheck 启用。

---

## 6. 预览与生产渲染流水线
**即时预览（<2s）**：
- 客户端：Canvas/WebGL 叠加（warp + 光影 LUT），水印；并行请求 Functions 标准小图。
- 服务端：`functions/src/preview/http.ts` 输入（designId, sku, variant, params）→ 输出（小图 URL + 元数据）→ 存入 `designs.previews[]`。

**生产图（异步）**：
- 触发：下单或用户点击“生成打印文件”。
- 队列：Cloud Tasks → `functions/src/render/worker.ts`。
- 校验：分辨率、出血、安全区、ICC → 生成 `reportId`；上传 `prints/...`。
- 回填：`designs.printAsset` 并绑定订单项。

---

## 7. 前端 OMG 体验规范
- **OMG Feed**：全屏竖向滚动，卡片包含：多角度轮播、SKU 快切、操作栏（收藏/对比/分享）、价格/时效提示。
- **Create 流**：Prompt/上传 → 进度反馈（骨架屏/进度条）→ 预览栅格（多 SKU）→ 详情。
- **详情页**：尺码/颜色/材质/价格/配送 → CTA（加入购物车/立即下单）。
- **性能/交互节拍**：≤100ms 初次反馈；LCP ≤ 2.5s（4G）；滚动与变体切换无明显掉帧。
- **可访问性**：键盘可达、语义标签、焦点环、对比度校验、图片 alt。

---

## 8. 工程化（VSCode/脚手架/脚本）
- TypeScript 严格、ESLint + Prettier、Husky（`pre-commit: lint+test+scan-banned`、`commit-msg: commitlint`）。
- VSCode 扩展：ESLint、Error Lens、GitLens、Tailwind、Playwright、Firebase Rules。
- `package.json`（节选）：
```json
{
  "scripts": {
    "dev": "next dev -p 6000",
    "build": "next build",
    "start": "next start -p 6000",
    "lint": "eslint .",
    "test": "vitest run",
    "e2e": "playwright test",
    "scan:banned": "node scripts/scan-banned.js",
    "bundle:size": "node scripts/bundle-size-check.mjs",
    "bmad:refresh": "augment:export -- --dry-run --stats --summary augment/specs/summary.json || true",
    "bmad:list": "node scripts/bmad-list.js",
    "bmad:validate": "node scripts/bmad-validate.js"
  }
}
```
- **敏感词扫描（禁止真实平台名）**：`scripts/scan-banned.js`（示例）：
```js
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const banned = [/\bti\s*kt\s*ok\b/i, /\btik\s*tok\b/i, /\b抖音\b/];
const exts = [".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".yml", ".yaml", ".env"];
let failed = false;
function walk(dir){ for(const f of fs.readdirSync(dir)){ const p=path.join(dir,f); const s=fs.statSync(p);
  if(s.isDirectory() && !["node_modules", ".git", ".bmad-core", "dist"].includes(f)) walk(p);
  else if(exts.includes(path.extname(p))) check(p);
}}
function check(file){ const t=fs.readFileSync(file, "utf8"); for(const rg of banned){ if(rg.test(t)){ console.error(`BANNED WORD in ${file}`); failed=true; }} }
walk(process.cwd()); if(failed) process.exit(1);
```
- **体积预算**：`scripts/bundle-size-check.mjs` 统计 `.next` 产物并对比阈值，超限 exit 1。

---

## 9. CI/CD（GitHub Actions → Firebase）
**.github/workflows/ci.yml（示例）**：
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test --workspaces=false --if-present
      - run: npm run scan:banned
      - run: npm run build
      - run: npm run bundle:size
  preview:
    needs: build-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}
      - run: |
          npm i -g firebase-tools@latest
          firebase deploy --only apphosting --project "studio-1269295870-5fde0" --non-interactive --force
```
> 将 Secrets（如 `FIREBASE_SERVICE_ACCOUNT_JSON`、支付密钥）配置在仓库 Settings → Secrets。

---

## 10. BMAD（本地）× Codex CLI
**一次性**：
```bash
npx bmad-method install -f -i codex -d .   # 生成 AGENTS.md / bmad 模板
codex login
codex help > docs/tools/codex-help.txt
```
**命令映射机制**（避免遗漏）：
1) 打开 `docs/tools/codex-command-map.md`，根据 `codex help` 输出填写：
```
[STATUS]   -> <如 /status 或 codex status>
[RUN]      -> <如 /run 或 codex run>
[TEST]     -> <如 /test 或 codex test>
[COMMIT]   -> <如 /commit>
[PR]       -> <创建/更新 PR 的实际命令或流程>
[EXPLAIN]  -> <解释代码>
[REFACTOR] -> <重构>
```
2) 本蓝皮书后续都用语义标签指代实际命令；以你的映射为准。

**派单卡（由你贴进目标 Codex 会话）**：
```
角色：你是开发执行者（监督者指派）。
仓库：https://github.com/<org>/pod.style
故事：bmad/stories/<id>.md
遵循：docs/architecture.md、docs/prd.md、bmad/constraints.md
DoD：构建+测试通过；文档更新；PR -> feature/<id>；CI 全绿；性能预算达标。
禁止：并发任务/修改 main/引入敏感词。
输出：PR 链接、测试说明、风险与缓解。
```

- **多终端指挥**：你维护 Codex CLI 执行端清单（终端/Story/状态），确保上下文隔离、日志可靠回溯，并在节拍同步时更新干系人。

---

## 11. 监督者节拍循环（状态机）
```
state INIT -> DISPATCH -> EXECUTING -> REVIEW -> ACCEPT | REWORK

INIT: 生成/校验 BMAD 资产；准备 DoD 与门槛
DISPATCH: 你挑选执行终端，发布单一 Story 给目标 Codex 会话
EXECUTING: 你每 5–15 分钟执行节拍：
  - [STATUS] 读取进度；查看 PR/Checks
  - 遇阻塞先排障（依赖/密钥/权限/配额）
  - 未达 DoD 不进入 REVIEW
REVIEW: 对照验收；必要时触发 MCP 端到端/性能脚本；形成整改清单
ACCEPT: 合并；更新 CHANGELOG/Retrospective；进入下一 Story
REWORK: 附整改项返回 EXECUTING（仍然同一 Story）
```
> **禁止**：秒级轮询、构建时频繁打断、未收敛先并发新任务。

---

## 12. Story 模板（YAML 头）
```markdown
---
id: FEA-123
name: OMG Feed 首屏 & 预览栅格
type: feature
priority: P2
owner: supervisor
estimate: 6h
acceptance:
  - 首页首屏 LCP ≤ 2.5s（4G，预览页面）
  - 滚动不卡顿（掉帧 < 5%）
  - 预览卡片 500ms 内出现骨架或首帧
  - 单测覆盖 ≥ 80%，关键路径 e2e 通过
telemetry:
  - 预览生成时延、失败码、重试次数
risk:
  - 图片过大 / 第三方限流
---
## 任务分解
- [ ] Feed 容器与骨架屏
- [ ] 预览卡片（轮播/操作栏）
- [ ] Functions 标准小图接入
- [ ] 单测 + e2e
- [ ] 文档与变更日志
```

---

## 13. MCP 端到端/性能脚本（验收时）
常用工具意图：
```
page_goto {url}
page_fill {selector, value}
page_click {selector}
screenshot_capture
performance_start_trace {categories, duration}
performance_stop_trace
```
建议跑在**预览环境**，避开本地编译/测试窗口。

---

## 14. 测试策略
- **单测**：组件/逻辑；覆盖阈值 ≥ 80%。
- **集成**：Functions handler 与 Firestore 读写的契约。
- **E2E**：登录/创建/预览/下单主路径；Playwright。
- **可访问性**：axe 或 eslint-plugin-jsx-a11y；CI 抽样。
- **视觉回归**（可选）：关键页面快照。

---

## 15. 性能与观测
- **预算**：LCP/TTI/CLS 阈值；Bundle 限值（超限 CI 失败）。
- **埋点**：预览生成时延、失败率、下单转化、重试次数、滚动掉帧监控。
- **日志**：Functions 结构化日志，关联 `designId/orderId/uid`；错误聚合。

---

## 16. 安全与合规
- App Check + reCAPTCHA，拒绝未校验请求。
- Firestore/Storage 最小权限；后端校验 ownerUid。
- 文本/图像合规模块（分级、申诉记录）。
- 依赖漏洞扫描（SCA）；Secrets 仅在 CI/平台安全存储。

---

## 17. 里程碑（Day 0–14）
- **M0（D0–1）**：BMAD 基线、命令映射、CI Gate、敏感词扫描、App Check、规则收紧。
- **M1（D2–4）**：OMG Feed + 预览 MVP（客户端叠加 + 服务端小图）。
- **M2（D5–7）**：SKU 详情/购物车/支付闭环（优先 Stripe）。
- **M3（D8–10）**：print-ready 队列与校验、订单绑定、下载/工厂回传占位。
- **M4（D11–14）**：合规/性能/实验（Remote Config + A/B）。

---

## 18. 回滚与故障处置
- **软失败**：让 Codex 修复 → 复测 → 合并。
- **硬失败**：`git tag` 回滚；冻结合并仅允许修复；补 e2e 后解冻。
- **事故记录**：`docs/retrospective/<milestone>.md`。

---

## 19. PR 模板 / CODEOWNERS（示例）
**.github/PULL_REQUEST_TEMPLATE.md**：
```md
## 动机
## 变更点
## 测试说明（含命令/覆盖率）
## 风险与回滚
## 验收对照（Story: <id>）
- [ ] …
```
**.github/CODEOWNERS**：
```
*       @team/supervisor @team/arch
/docs/* @team/pm
```

---

## 20. 本地开发与模拟器
```bash
firebase emulators:start # apphosting、functions、firestore、dataconnect、extensions
# 若 functions 未启，确保有 scripts & npm run dev / start 脚本
```
端口冲突时按日志调整；若提示缺少 `dev` 脚本，前端补充 `"dev": "next dev -p 6000"`。

---

## 21. 常见陷阱与规避
- 未开启 App Check → 被刷/配额异常。
- `.bmad-core/` 被提交 → `git rm -r --cached .bmad-core/` 并恢复忽略。
- 并发派单 → Codex 上下文混乱/崩溃。
- 真实平台名混入 → pre-commit & CI 扫描拦截。
- `--only hosting` vs App Hosting：注意 `firebase.json` 配置目标一致。

---

## 22. 交付定义（DoD）清单（合并门槛）
- [ ] 构建/测试/扫描/预算全部绿灯
- [ ] 文档与 CHANGELOG 更新
- [ ] e2e 关键路径通过
- [ ] 性能预算满足（LCP/TTI/Bundle）
- [ ] 安全检查通过（SCA、规则、App Check）

---

## 23. 版本与记录
- v4.0（2025-10-01）：最全面规范版（pod.style 定制）。
- 历史版本：v3.0（OMG 代号/禁词 Gate）、v2.0（端到端流程）、v1.x（初始）。

https://github.com/bmad-code-org/BMAD-METHOD，https://github.com/openai/codex，https://github.com/ChromeDevTools/chrome-devtools-mcp/?tab=readme-ov-file#chrome-devtools-mcp。
通过这些地址来寻找所有工具的功能和用法。
