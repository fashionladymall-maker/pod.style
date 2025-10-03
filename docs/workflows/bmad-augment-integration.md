# BMAD ↔ Augment Code Integration Guide

This guide explains how to blend the BMAD Method documentation pipeline with Augment Code's Specs Driven Development flow. The goal is to treat every BMAD output (PRDs, architecture notes, stories) as structured specifications that Augment Code sub-agents can consume automatically.

## 1. Prerequisites
- Node.js 20.18+
- BMAD core already installed in this repo (`npm run bmad:refresh` if upgrades are needed)
- Augment Code access (CLI or IDE plug-in) with a workspace pointing at this repository
- Optional: MCP-compatible runtime (Claude Code, Cursor, Codeium, etc.) when you want live agent orchestration

## 2. BMAD Story Export → Augment Specs
BMAD stores authoritative implementation work in `docs/stories`. Run the exporter to transform those Markdown stories into machine-readable JSON specs for Augment Code.

```bash
npm run augment:export            # exports every story under docs/stories
npm run augment:export 1.1 feed   # exports only stories matching tokens "1.1" and "feed"
npm run augment:export -- --format yaml --out augment/specs-yaml   # export YAML specs to a custom folder
```

The exporter produces `augment/specs/*.json` plus `augment/specs/manifest.json`. Each spec bundles:
- Story metadata (id, title, status, originating file)
- User story, acceptance criteria, nested task tree, testing expectations
- Dev Notes broken down by BMAD subsections
- `augment.recommendedPlaybooks` scaffolding for mapping each acceptance criterion or task to an Augment sub-agent workflow
- When a story is missing sections (e.g., no Testing block), the manifest entry includes a `missingSections` array so you can triage gaps before handoff.
- The optional summary JSON (via `--summary`) captures the CLI options, aggregate stats, and the manifest entries, making it easy to feed downstream workflows or dashboards.
- Both manifest and summary embed a `missingSectionsDetail` list with severity tags (`critical` for required sections, `optional` otherwise).
- Summary stats also include top-level vs total task counts, missing-section severity totals, overall "missing score" (weighted by critical/optional weights), and any status warnings triggered by `--status-warn`.

> The exporter is idempotent; run it after every BMAD story update to keep specs in sync.

### CLI options
- `--format <json|yaml>` controls the artifact format (defaults to JSON).
- `--out <path>` writes specs to a different directory (default: `augment/specs`).
- `--no-manifest` skips manifest generation when Augment consumes specs one by one.
- `npm run augment:test` executes the exporter unit tests to ensure parsing stays healthy.
- `--format json,yaml` (or `--formats`) emits multiple formats in one pass; manifest records every generated artifact.
- `--status Ready,Ready for Review` limits exports to stories whose status matches the provided list (case-insensitive).
- `--dry-run` previews the files that would be written without touching the filesystem (pairs well with `--stats`).
- `--stats` prints an aggregate summary (counts, formats, status breakdown).
- `--strict` fails the run if any selected story is missing required sections.
- `--summary <path>` writes the aggregated summary (stats + manifest entries) to a JSON file for downstream automation.
- `--quiet` suppresses per-story logs while retaining summary output.
- `--require Story,Testing` overrides the default required-sections set (used by `--strict`, `--missing-only`, and summary diagnostics).
- `--missing-only` exports only stories that are missing at least one of the required sections (useful for gap triage).
- `--summary-format json|yaml|md` explicitly chooses the summary output format (otherwise inferred from the file extension, default JSON).
- `--status-warn Ready,QA` logs warnings when a story status falls outside the provided set (without skipping exports).
- `--critical-weight` / `--optional-weight` adjust the scoring applied to missing sections in summaries and manifest entries.
- `--top-missing 3` prints and records the most frequently missing sections (with severity tags) to help prioritize remediation.
- `--weights-config path/to/config.json` loads reusable weight, severity, and goal settings (see below).
- `--baseline summary.json` compares the current run against a previous summary, reporting regressions/improvements and score deltas.

Default required sections: `Story`, `Acceptance Criteria`, `Tasks / Subtasks`, `Dev Notes`, `Testing`. Use `--require` to narrow or expand this set.

Both manifest and summary embed a `missingSectionsDetail` list with severity tags (`critical` or `optional`), per-section weights, and goal statements sourced from optional config files. Summary stats also include top-level vs total task counts, severity breakdowns, aggregate missing-score totals, status warnings, and an optional `topMissingSections` snapshot.

If `--baseline` is provided, summaries receive a `delta` object highlighting regressions (newly missing sections), improvements (resolved sections), and the change in missing-score versus the baseline run.

### Weight Config File

Use `--weights-config` to avoid repeating CLI flags. Example JSON:

```json
{
  "criticalWeight": 4,
  "sections": {
    "Testing": {
      "weight": 6,
      "goal": "Ensure QA coverage"
    },
    "Dev Notes": {
      "severity": "optional",
      "goal": "Capture implementation context"
    }
  }
}
```

The config can also be written in YAML. Section names are case-insensitive; overrides adjust severity, weight, and goal messaging surfaced in manifests and summaries.

## 3. Feeding Specs to Augment Code
Augment Code can ingest the JSON specs directly:
1. Point Augment's spec loader at `augment/specs/manifest.json` (most deployments accept a manifest path or directory).
2. Use the `story.recommendedPlaybooks` array to seed Augment sub-agents:
   - `design` → UX/design prompts
   - `implementation` → coding subtasks (checkbox tree mirrors BMAD task hierarchy)
   - `qa` → testing scenarios and observability hooks
3. When Augment completes a task, push results back into the matching BMAD story (Dev Agent Record or QA sections).

### Suggested folder mapping
| Augment Input Type | Path | Notes |
| --- | --- | --- |
| Spec manifest | `augment/specs/manifest.json` | Enumerates every generated spec |
| Individual spec | `augment/specs/<story>.json` | Self-contained doc for a single story |
| Additional context | `docs/architecture/*.md` | Load selectively when Augment tasks reference them |

## 4. Automating the Bridge
To keep BMAD and Augment synchronized:
- **File watcher:** add a watch task (e.g., `nodemon` or VS Code Tasks) that runs `npm run augment:export` whenever `docs/stories/**/*.md` changes.
- **CI hook:** include the exporter in CI pipelines prior to Augment execution. Example snippet:
  ```bash
  npm run bmad:refresh
  npm run augment:export
  augment run --manifest augment/specs/manifest.json
  ```
- **MCP server glue:** if you use Claude Code or any MCP-aware IDE, register an MCP tool that wraps the exporter command and passes the resulting spec to Augment's API/CLI.

## 5. Round-Trip Updates
When Augment agents finish work:
1. Commit generated code/tests as usual.
2. Update the corresponding BMAD story (Dev Agent Record & File List) either manually or via an MCP task.
3. Re-run `npm run augment:export` so future Augment cycles see the updated status and testing notes.

## 6. Extending the Spec Schema
The JSON schema is intentionally simple (see `scripts/augment/export-augment-specs.mjs`):
- Add new fields in `story` for telemetry, rollout notes, or PR links.
- Extend `augment.recommendedPlaybooks` with project-specific automation hints (e.g., default toolchains per acceptance criterion).
- Emit alternative formats (YAML, Markdown) if other agent platforms need different payloads.

## 7. Troubleshooting
- **Missing sections warnings:** the exporter logs a warning if a BMAD story omits an expected heading. Run `bmad-method validate` to regenerate incomplete stories.
- **Spec drift:** delete `augment/specs` and rerun the exporter if manifest references stale files.
- **Augment parsing errors:** open the offending JSON spec to ensure fields match the augmented agent contract; the files are human-readable for easy patching.

With this bridge in place, BMAD remains the single source of truth for requirements, while Augment Code handles rapid implementation through spec-driven automation.
