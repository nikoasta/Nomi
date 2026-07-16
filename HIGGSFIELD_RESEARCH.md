# Higgsfield Native Integration Research

Date: 2026-07-16

## Decision

Use the official Higgsfield CLI as Nomi's native integration layer. MCP and agent skills are useful for agent workflows, but Nomi's model setup and generation runtime need a deterministic local transport that can list models, inspect schemas, estimate cost, submit jobs, wait for outputs, and auto-upload local media.

## Official Surfaces

- CLI: https://higgsfield.ai/cli
- CLI source/docs: https://github.com/higgsfield-ai/cli
- Skills: https://higgsfield.ai/skills
- Skills source/docs: https://github.com/higgsfield-ai/skills
- Seedance 2.0 product docs: https://higgsfield.ai/seedance/2.0
- Cinema Studio product docs: https://higgsfield.ai/cinematic-video-generator

## Local Findings

- Local CLI is installed at `/opt/homebrew/bin/higgsfield`.
- Local version: `1.1.13`.
- npm latest during research: `1.1.14`.
- Local account is signed in and can read account/workspace status.
- `higgsfield model list --json` returns 68 live models across image, video, audio, 3D, text/data.
- `higgsfield workflow list --json` returns 18 workflow entries.
- `higgsfield voices list --json` returns 41 preset voices.
- `higgsfield model get seedance_2_0 --json` returns parameter schemas and CEL validation rules.

## Why CLI First

The official Higgsfield skills themselves route through the CLI. Their guidance says the CLI handles auth, retries, polling, schema validation, and auto-uploads. This matches Nomi's Electron architecture better than embedding an MCP client in the renderer.

Nomi already has a process transport for Dreamina CLI. Higgsfield should reuse that pattern:

- main process locates the binary and runs it via `spawn`, never shell interpolation
- renderer talks through preload IPC
- model setup shows installation/sign-in/catalog status
- runtime later routes generation through a process parser instead of HTTP
- Nomi does not store Higgsfield passwords or API keys

## Implemented Integration

- Added `electron/catalog/higgsfieldCli.ts`.
- Added `electron/catalog/higgsfieldCodec.ts`.
- Added `electron/catalog/higgsfieldTransport.ts`.
- Added `electron/catalog/higgsfieldIpc.ts`.
- Added preload and bridge methods under `higgsfield`.
- Added `src/ui/onboarding/HiggsfieldCliCard.tsx`.
- Added EN/RU/ZH strings for the card and model setup group.
- Excluded `higgsfield-cli` from generic provider buckets, so it does not appear as a normal API-key vendor.
- Catalog sync imports both `higgsfield model list` and `higgsfield workflow list`.
- Higgsfield model rows use the live `job_type`; workflow rows use `workflow:<job_type>` so runtime can route them through `higgsfield generate workflow`.
- The process runtime now supports parser `higgsfield-cli` and builder `higgsfield-generate`.
- Runtime generation uses `higgsfield generate create <job_type> --wait --json` for models and `higgsfield generate workflow <job_type> --wait --json` for workflows.
- Nomi asset URLs are materialized to local files before CLI execution and passed via media flags such as `--image`, `--video`, `--audio`, `--start-image`, and `--end-image`.
- Final CLI JSON/text output is normalized into Nomi task status and asset URLs for image, video, audio, and 3D results.

## Verification

- Targeted tests cover Higgsfield output normalization, process arg building, workflow routing, and audio process runtime.
- Local non-spending CLI check confirmed the binary, version, account status, and live model/workflow lists.
- Full `pnpm run gates` passed on the integration branch.

## Remaining Advanced Work

1. Add cost preflight with `higgsfield generate cost` before paid generation.
2. Add richer UI surfaces for Soul ID, Marketing Studio products/avatars/hooks/settings, product photoshoot, marketplace cards, voices, and Virality Predictor reports.
3. Add workflow-specific controls for workflows whose schemas need more than the generic model parameter renderer.
4. Add optional install flow using the official shell installer if npm is unavailable on a user's machine.

## Installed Agent Skills

Installed globally for Codex-compatible agents from `higgsfield-ai/skills`:

- `higgsfield-generate`
- `higgsfield-soul-id`
- `higgsfield-product-photoshoot`
- `higgsfield-marketplace-cards`
- `higgsfield-websites`

The installer reported security-risk warnings, so these should be treated as workflow references and only used to spend credits after explicit user confirmation.
