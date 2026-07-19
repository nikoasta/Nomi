# Current State

The dedicated `everville/media-platform` branch contains the Everville Media
Platform backlog and a live static web shell at `https://cut.eva.mba/#/studio`.
The branch is aligned to orchestration baseline `balanced-v2.12`.

Beads epic `evmedia-r20` remains the durable product backlog. The first
corporate portal implementation slice is `evmedia-r20.13`: a typed
PlatformClient collaboration contract for projects, revisions, review queues,
approvals, and audit events.

The next auth foundation slice is `evmedia-r20.9.2`: runtime-neutral
organization, workspace, and membership contracts in `src/platform/organizations`
plus a Supabase Auth/RLS draft. Browser and Electron adapters intentionally
fail closed with `UNSUPPORTED_CAPABILITY` for collaboration and organization
capabilities until the Supabase/BFF backend exists.

New durable architecture note:

- `docs/architecture/everville-corporate-portal-foundation.md`
- `docs/architecture/everville-supabase-auth-rls-draft.md`

Verified for the slice:

- focused Vitest platform suites passed;
- `pnpm exec tsc -p tsconfig.app.json --noEmit` passed;
- `pnpm run check:i18n` passed;
- `pnpm run check:secrets` passed;
- `pnpm run build:renderer` passed;
- `curl -I https://cut.eva.mba` returned `HTTP/2 200`;
- `scripts/orchestration/run_process_verification.sh` passed before handoff
  update.

The upstream contribution branches remain separate and must not receive
Everville-specific orchestration, backend, authorization, or brand-policy work.

## Next recommended

Next stage id: `evmedia-r20.9-live-supabase-adapter`

Recommended action: create the first real Supabase migration with the Supabase
CLI from the reviewed RLS draft, add two-organization/two-user RLS tests, and
add a web PlatformClient adapter that uses only publishable browser credentials
while all service-role/provider secrets remain server-only.

## Starter prompt for next orchestrator

Use $orchestrator-stage in `/Users/niko.dev/Developer/work/nomi-i18n` on branch
`everville/media-platform`. Read `AGENTS.md`, `.codex/orchestrator.toml`, this
handoff, `.codex/project-index.md`, Beads epic `evmedia-r20`, and children
`evmedia-r20.9`, `evmedia-r20.9.2`, and `evmedia-r20.13`. Preserve upstream
pullability and do not push to the current public `origin`. Produce the
required Parallel Decomposition Matrix before live Supabase adapter work.

## Explicit defers

- Private Everville git remote and Beads Dolt remote configuration.
- Live Supabase project creation/linking and production migration application.
- Auth UI, BFF/server routes, storage signed URL resolver, durable generation
  workers, Higgsfield cloud credential custody, realtime presence, and conflict
  resolution UI.
