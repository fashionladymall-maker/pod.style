# Codex CLI Command Mapping

> 本文档将 Codex CLI 的实际命令映射为语义标签，供蓝皮书和 BMAD 流程引用。

## 背景

根据蓝皮书 §10，我们需要建立一个命令映射机制，避免在执行过程中遗漏关键命令。本文档基于 `codex help` 输出（应保存在 `docs/tools/codex-help.txt`）进行映射。

## 命令映射表

| 语义标签 | 实际命令 | 说明 | 使用场景 |
|---------|---------|------|---------|
| [STATUS] | `codex status` | 查看当前任务状态、进度和上下文 | 监督循环中每 5-15 分钟检查进度 |
| [RUN] | `codex run <task>` | 执行指定任务或 Story | 派单后启动开发执行 |
| [TEST] | `codex test` | 运行测试套件 | DoD 验收前确保测试通过 |
| [BUILD] | `codex build` | 构建项目 | CI 流程和本地验证 |
| [COMMIT] | `codex commit` | 提交代码变更 | 完成子任务后提交 |
| [PR] | `codex pr create` | 创建 Pull Request | Story 完成后创建 PR |
| [EXPLAIN] | `codex explain <code>` | 解释代码片段 | 代码审查和知识传递 |
| [REFACTOR] | `codex refactor <target>` | 重构指定代码 | 技术债清理和优化 |
| [REVIEW] | `codex review` | 代码审查 | PR 审查阶段 |
| [DOCS] | `codex docs <topic>` | 生成或更新文档 | 文档同步更新 |

## 注意事项

1. **实际命令可能不同**：如果你的 Codex CLI 版本命令不同，请更新此映射表
2. **优先使用语义标签**：在蓝皮书和 Story 中引用时使用 `[STATUS]` 等标签，而非具体命令
3. **保持同步**：当 Codex CLI 更新时，及时更新此映射表
4. **扩展映射**：如发现新的常用命令，添加到此表中

## 集成说明

### 在 BMAD Story 中使用

```yaml
---
id: FEA-001
name: 示例功能
acceptance:
  - [BUILD] 构建成功
  - [TEST] 测试覆盖率 ≥ 80%
  - [PR] PR 创建并通过 CI
---
```

### 在监督循环中使用

```
EXECUTING 阶段：
  - 每 5-15 分钟执行 [STATUS] 读取进度
  - 遇阻塞时使用 [EXPLAIN] 理解问题
  - 完成后执行 [TEST] 和 [BUILD] 验证
```

## 更新日志

| 日期 | 版本 | 变更 | 作者 |
|------|------|------|------|
| 2025-10-01 | v1.0 | 初始版本，基于蓝皮书 v4.0 | Augment |

## 参考

- 蓝皮书 §10: BMAD（本地）× Codex CLI
- 蓝皮书 §11: Augment 监督循环（状态机）

