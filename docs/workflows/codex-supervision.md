# Codex Supervision Runtime (Plugin + CLI + MCP + CI)

This repository now ships a repeatable harness that mirrors the “插件当指挥台、CLI当执行机、MCP当验收官、CI当裁判” workflow. It lets you supervise long-running stories without holding a single chat window open.

## Components

| Layer | Tooling | Purpose |
| --- | --- | --- |
| 控制面 | VS Code Codex 插件 + `.vscode/tasks.json` | 触发监督口令：启动 Codex CLI、发送 `/status`、执行 MCP 审计、触发 Gate |
| 执行面 | Codex CLI (`tmux` 常驻) | 在独立 git worktree / 分支完成故事实现与测试 |
| 验收面 | Chrome DevTools MCP + `npm run mcp:perf` | 端到端巡检（响应、截图、性能 trace），生成 `docs/reports/gate-report.md` |
| 裁判面 | CI + `npm run gate:check` | 本地汇总 lint/test/禁词/体积 + CI 状态；出具 `docs/reports/summary.md` |

## 一次性准备

1. **安装 tmux**（macOS `brew install tmux`, Ubuntu `sudo apt install tmux`）。
2. **启动 Chrome DevTools MCP server**（独立终端执行 `npm run mcp:chrome-devtools` 或自定义命令）。保留终端以便 Codex 连接。
3. **可选**：通过 `codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` 将 MCP 注册到 Codex。

## 监督循环

1. **Start**
   - `⌘⇧P` → *Run Task* → **Codex: Start Session**。该任务在后台创建 tmux session（默认 `codex-supervisor`）并运行 `codex`。
   - `⌘⇧P` → *Run Task* → **Codex: Attach Session**（按需查看实时对话，Ctrl+b d 可断开保持后台运行）。
   - 在对话里贴入 Story 任务卡 / DoD / 禁止项。
2. **Status**
   - 周期性执行 *Run Task* → **Codex: Status Ping**。脚本会向 tmux 内的 Codex 会话发送 `/status`，Codex 会将进度写回 tmux 终端。
3. **MCP 验收**
   - Dev 完成一个阶段后，运行 *Run Task* → **MCP: Perf Audit**。该命令：
     - GET 预览地址（`PREVIEW_URL`，默认 `http://localhost:6100`）。
     - 汇总 MCP 截图/trace/笔记（根据下文环境变量）。
     - 输出 `docs/reports/gate-report.md`。
4. **Gate 裁决**
   - 运行 *Run Task* → **Gate: Check**。脚本会顺序执行 lint → typecheck → test → 禁词扫描 → 体积检查，并确认 MCP 报告存在。
   - 结果写入 `docs/reports/summary.md`。若失败，脚本即刻返回非 0，继续修复后重跑。
5. **CI**
   - 推送 PR 后，CI 负责复核同样的检查项（推荐在 CI 流程中调用 `npm run gate:check` 以确保一致性）。只有 CI、MCP、Gate 三者都绿灯才合并。

> **提示**：需要在环境中设置 `PREVIEW_URL`、`MCP_SCREENSHOT_PATH`、`MCP_TRACE_PATH` 等变量，让 `scripts/mcp-perf.ts` 能引用到由 Chrome DevTools MCP 生成的资源。例如：
>
> ```bash
> export PREVIEW_URL="https://preview.my-app.example"
> export MCP_SCREENSHOT_PATH="docs/reports/preview.png"
> export MCP_TRACE_PATH="docs/reports/trace.json"
> npm run mcp:perf
> ```

## 多故事并行的推荐做法

1. 使用 `git worktree add ../pod.style-FEA-001 -b feature/FEA-001` 为每个 Story 建独立目录。
2. 在 VS Code 中打开不同工作树窗口；设置 `CODEX_TMUX_SESSION` 环境变量（例如 `feature-fea-001`）后再运行 `Codex: Start Session`，避免冲突：
   ```bash
   CODEX_TMUX_SESSION=feature-fea-001 code ../pod.style-FEA-001
   ```
3. 每个工作树运行自己的 MCP/Gate 任务，互不干扰。

## 产出位置

| 文件 | 说明 |
| --- | --- |
| `docs/reports/gate-report.md` | MCP 审计摘要（响应时间、截图 / trace 元信息、后续动作） |
| `docs/reports/summary.md` | Gate 检查总览（lint/test/禁词/体积/CI 状态） |
| `scripts/queue.yaml` | 监督队列示例，可供 Codex 插件或外部看板读取 |

## 故障排查

- **`tmux` 命令未找到**：请安装 tmux 或将 tasks.json 中命令替换为自定义脚本。
- **`MCP: Perf Audit` 缺少 trace / screenshot**：确认 DevTools MCP server 已运行，并将生成的文件路径写入环境变量 (`MCP_TRACE_PATH` / `MCP_SCREENSHOT_PATH`)。
- **Gate 阶段耗时过长**：可通过设置 `SKIP_LINT=1` 等环境变量略过某些步骤，但 CI 最终仍需全部通过。
- **Codex CLI 需要重启**：`Codex: Start Session` 会尝试新建 tmux 会话；如需重启，先执行 `tmux kill-session -t codex-supervisor` 再运行任务。

这一机制保持“指挥-执行-验收-裁决”分层清晰，同时所有证据都落在仓库文件中，便于审计与长时间监督。
