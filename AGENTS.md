# Nomi Everville product branch

This repository is the Nomi 0.16.6 Electron + React workbench extended on the
`everville/media-platform` product branch. The current `origin` is the public
Nomi upstream, so do not push this branch until a private Everville remote is
configured. Keep generic upstream contributions on dedicated `pr/*` branches.

## Entrypoints

- `src/main.tsx` starts the React renderer.
- `electron/main.ts` starts the Electron runtime and IPC surface.
- `src/desktop/bridge.ts` defines the current desktop capability contract.
- `src/workbench/` owns projects, canvas, timeline, generation, and preview.
- `docs/product/2026-07-16-everville-media-portal-workflow-draft.md` is the
  current product workflow draft.

## Verification

- Process-only changes: `scripts/orchestration/run_process_verification.sh`
- Documentation-only changes: process verification plus `git diff --check`
- Code changes: `pnpm run gates`
- User-visible runtime changes: run the relevant Electron journey or
  `pnpm run test:e2e` in addition to the code gates.

## Orchestration

- Read `.codex/orchestrator.toml`, `.codex/handoff.md`, and
  `.codex/project-index.md` before non-trivial work.
- Beads is the only durable task truth. Create or claim an issue before
  file-changing, delegated, handoff-prone, or longer-than-15-minute work.
- `.a5c/` is Babysitter execution state, never a second backlog. Every
  Babysitter run must carry exactly one parent Beads ID and its acceptance
  criteria.
- Keep simple work local. Medium or complex work uses `orchestrator-stage` and
  `task-router`, starts with a Parallel Decomposition Matrix, and launches all
  independent authorized streams as separate visible Codex subagents.
- Sequential medium or complex work must record the concrete dependency,
  shared resource, write conflict, or verification bottleneck.
- Subagents inherit model and reasoning by default. Record the reason for
  higher reasoning or any authorized model override.
- Write-heavy delegated streams use dedicated branches or worktrees unless an
  explicit exception is recorded.
- Delegated prompts include Documentation and Asset Routing blocks and follow
  `.codex/subagent-task-contract.md`.

## Boundaries

- Preserve upstream pullability: prefer adapters and stable contracts over
  rewriting provider IDs or core Nomi data models.
- Keep Everville-specific backend, authorization, brand policy, and knowledge
  logic outside generic upstream PR commits.
- Do not expose provider secrets to renderer or browser code.
- Do not silently defer in-scope debt. Record every justified defer in Beads
  and `.codex/handoff.md`.
- Review child diffs and verification evidence before accepting completion.
