# Current State

The dedicated `everville/media-platform` branch contains the Everville Media
Platform backlog and a live static web shell at `https://cut.eva.mba/#/studio`.
The branch is aligned to orchestration baseline `balanced-v2.12`.

Beads epic `evmedia-r20` remains the durable product backlog. The first
corporate portal implementation slice is `evmedia-r20.13`: a typed
PlatformClient collaboration contract for projects, revisions, review queues,
approvals, and audit events.

The current auth foundation slice is `evmedia-r20.9.3`: a generated Supabase
Auth/RLS migration plus a browser-safe web portal adapter. Browser and Electron
adapters still fail closed unless the browser runtime is explicitly configured
with a Supabase endpoint, publishable key, and user bearer session.

New durable architecture note:

- `docs/architecture/everville-corporate-portal-foundation.md`
- `docs/architecture/everville-supabase-auth-rls-draft.md`
- `supabase/migrations/20260719141528_everville_portal_auth_rls.sql`
- `src/platform/webPortalClient.ts`

Verified for the slice:

- focused portal/auth suites passed: 6 files, 31 tests;
- `pnpm exec tsc -p tsconfig.app.json --noEmit` passed;
- `pnpm run gates` passed: 319 test files, 3054 tests, renderer and Electron
  builds;
- `git diff --check` passed.

The upstream contribution branches remain separate and must not receive
Everville-specific orchestration, backend, authorization, or brand-policy work.

## Next recommended

Next stage id: `evmedia-r20.9-live-supabase-apply`

Recommended action: link the target Supabase project, add Vercel env vars for
the browser publishable config, build Auth UI/session storage, and run live
two-organization/two-user RLS probes before applying the migration to
production.

## Starter prompt for next orchestrator

Use $orchestrator-stage in `/Users/niko.dev/Developer/work/nomi-i18n` on branch
`everville/media-platform`. Read `AGENTS.md`, `.codex/orchestrator.toml`, this
handoff, `.codex/project-index.md`, Beads epic `evmedia-r20`, and children
`evmedia-r20.9`, `evmedia-r20.9.3`, and `evmedia-r20.13`. Preserve upstream
pullability and do not push to the current public `origin`. Produce the
required Parallel Decomposition Matrix before live Supabase adapter work.

## Explicit defers

- Private Everville git remote and Beads Dolt remote configuration.
- Live Supabase project creation/linking and production migration application.
- Auth UI/session storage, BFF/server routes, storage signed URL resolver, durable generation
  workers, Higgsfield cloud credential custody, realtime presence, and conflict
  resolution UI.
