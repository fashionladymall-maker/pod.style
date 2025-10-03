#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/mike/pod.style"
SESSION="${CODEX_TMUX_SESSION:-codex-supervisor}"

log() {
  printf '\n==> %s\n' "$1"
}

log "Start Codex session ($SESSION)"
tmux new-session -d -s "$SESSION" "cd $REPO && codex" 2>/dev/null || {
  log "Codex session already running ($SESSION)"
}

cd "$REPO"

log "Run MCP perf audit"
npm run mcp:perf

log "Run gate check"
npm run gate:check

log "All steps finished. 如果 gate:check 输出 ❌，请根据提示修复后重新运行。"
