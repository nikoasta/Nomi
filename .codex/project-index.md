# Project Index - Nomi Everville Media Platform

Stable navigation map for this repository. Keep history and current task state
in `.codex/handoff.md`, Beads, and `.codex/stages/`, not here.

## Runtime Shape

- Single TypeScript repository with a React/Vite renderer and Electron main
  process.
- Electron currently acts as the local backend for filesystem, projects,
  assets, provider credentials, generation tasks, browser capture, and FFmpeg.
- The renderer owns the project library, creation editor, generation canvas,
  timeline preview, and model setup UI.
- Native projects live under `~/Documents/Nomi Projects`; external folders can
  be registered as workspaces.
- The `everville/media-platform` branch is an online-first product branch based
  on the upstream-compatible Nomi workbench.
- The current `origin` is public upstream. Product delivery requires a private
  remote before any push.

## Primary Entrypoints

- `AGENTS.md` - primary repository and orchestration contract.
- `CLAUDE.md` - upstream Nomi engineering discipline and runtime rules.
- `.codex/orchestrator.toml` - machine-readable orchestration policy.
- `.codex/handoff.md` - current operational state and next stage only.
- `package.json` - scripts, dependencies, Electron packaging, and gates.
- `src/main.tsx` - renderer bootstrap.
- `src/NomiRouterApp.tsx` - top-level renderer routes.
- `src/workbench/NomiStudioApp.tsx` - project library and studio orchestration.
- `electron/main.ts` - Electron lifecycle, security, protocols, and IPC setup.
- `electron/preload.ts` - privileged IPC surface exposed to the renderer.
- `src/desktop/bridge.ts` - renderer-facing desktop capability types.
- `scripts/orchestration/run_process_verification.sh` - process contract gate.

## Core Subsystems

- `src/workbench/` - project, canvas, generation, timeline, preview, assets,
  agent, conversation, and export UI/domain logic.
- `src/workbench/project/` - persisted project schema, migrations, snapshots,
  hydration, autosave, and browser fallback storage.
- `src/workbench/generationCanvas/` - node graph, categories, runners,
  storyboard planning, and canvas interaction.
- `src/workbench/timeline/` and `src/workbench/preview/` - editing model,
  playback, text overlays, and export preparation.
- `src/workbench/api/` - renderer wrappers around desktop task, catalog,
  prompts, skills, uploads, and generation services.
- `src/desktop/` - Electron bridge types and active-project coordination.
- `src/design/` and `src/theme/` - design primitives, tokens, and theme.
- `src/i18n/` - Chinese, English, and Russian locale and display adapters.
- `electron/projects/` and `electron/workspace/` - project folders, manifests,
  registry, path boundaries, and legacy migration.
- `electron/assets/` and `electron/protocol/` - local media persistence and the
  `nomi-local://` runtime protocol.
- `electron/catalog/` and `electron/tasks/` - provider/model configuration,
  authentication, request execution, polling, and result parsing.
- `electron/export/` and `electron/video/` - FFmpeg planning, render jobs,
  media probing, frame extraction, and export storage.
- `electron/capabilityCore/` - external MCP/RPC canvas integration.
- `docs/` - product, architecture, plans, research, audits, and runbooks.
- `tests/ux/`, `tests/system/`, and `evals/` - Electron journeys, system gates,
  evaluation datasets, and evidence.

## Integrations And Sources Of Truth

- Project snapshots and local asset bytes currently live in workspace folders;
  renderer memory is a projection, not an independent source of truth.
- Provider/model IDs and mappings remain stable; localization translates only
  display values.
- Provider credentials currently use Electron `safeStorage` when available and
  must never enter renderer/browser bundles.
- Higgsfield desktop support uses the official local CLI and synced catalog.
- `everville-core` is the reviewed knowledge source for future project-scoped
  Knowledge Packs; candidate facts are not publication-safe.
- Dropbox originals and Atlas outputs remain evidence sources, not automatic
  canonical KB writes.
- Future cloud project data must preserve the existing project schema through
  versioned migrations rather than ad hoc rewrites.
- Future cloud media must use stable asset identities; `nomi-local://` remains a
  desktop runtime URL, not a portable persisted cloud identity.
- Beads is the only durable task ledger. Babysitter `.a5c/` journals are
  execution state only.

## Verification

- Process-only: `scripts/orchestration/run_process_verification.sh`.
- Documentation-only: process verification and `git diff --check`.
- Full code gate: `pnpm run gates`.
- Focused unit tests: `pnpm vitest run <paths>`.
- Electron smoke: `pnpm run test:e2e`.
- System suites: `pnpm run test:system:ci` or the explicitly selected larger
  profile.
- macOS package: `pnpm run dist:mac:dir`.
- Installed-app verification is required when changing desktop runtime or
  packaging behavior.

## Conventions And Boundaries

- Preserve unrelated user changes and never reset or clean the worktree
  destructively.
- Keep upstream-generic commits separate from Everville-specific product work.
- Prefer runtime-neutral adapters and contracts over parallel implementations.
- Follow `docs/engineering-rules.md`, including architecture planning,
  documentation research, file-size gates, and user-visible journey checks.
- Use `apply_patch` for manual edits and keep file changes tightly scoped.
- Do not store secrets, credentials, private investor data, or source documents
  in Beads, Babysitter prompts, commits, or generated artifacts.
- Medium and complex stages require a Parallel Decomposition Matrix before
  implementation; sequential execution needs a concrete recorded reason.
- Write-heavy delegated streams use dedicated worktrees and disjoint write
  zones.
- Every child completion requires diff review, verification evidence, and an
  explicit accept or reject decision by the orchestrator.
- Record justified defers in both Beads and `.codex/handoff.md`; use `none` only
  when no defer exists.
- Keep this index between 80 and 150 lines and free of active stage history.
