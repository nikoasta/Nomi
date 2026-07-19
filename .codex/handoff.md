# Current State

The dedicated `everville/media-platform` branch contains the Everville Media
Platform backlog and a live static web shell at `https://cut.eva.mba/#/studio`.
The branch is aligned to orchestration baseline `balanced-v2.12`.

Beads epic `evmedia-r20` remains the durable product backlog. The first
corporate portal implementation slice is `evmedia-r20.13`: a typed
PlatformClient collaboration contract for projects, revisions, review queues,
approvals, and audit events.

The current auth foundation slice is `evmedia-r20.9.4`: browser portal session
wiring on top of the generated Supabase Auth/RLS migration and browser-safe web
portal adapter. Browser runtimes now parse Supabase magic-link callback tokens,
store a bounded local user session, and configure the portal adapter only when
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and a non-expired user
session are present. Electron remains on the desktop bridge path.

New durable architecture note:

- `docs/architecture/everville-corporate-portal-foundation.md`
- `docs/architecture/everville-supabase-auth-rls-draft.md`
- `supabase/migrations/20260719141528_everville_portal_auth_rls.sql`
- `src/platform/webPortalClient.ts`
- `src/platform/webPortalSession.ts`
- `.env.example`

Verified for the slice:

- focused portal/auth suites passed: 5 files, 24 tests;
- `pnpm exec tsc -p tsconfig.app.json --noEmit` passed;
- `pnpm run gates` passed: 320 test files, 3062 tests, renderer and Electron
  builds;
- `git diff --check` passed.

The upstream contribution branches remain separate and must not receive
Everville-specific orchestration, backend, authorization, or brand-policy work.

## Next recommended

Next stage id: `evmedia-r20.9-live-supabase-apply`

Recommended action: link the target Supabase project, add Vercel env vars for
the browser publishable config, build the visible Auth UI/magic-link request
surface, and run live two-organization/two-user RLS probes before applying the
migration to production.

## Starter prompt for next orchestrator

Use $orchestrator-stage in `/Users/niko.dev/Developer/work/nomi-i18n` on branch
`everville/media-platform`. Read `AGENTS.md`, `.codex/orchestrator.toml`, this
handoff, `.codex/project-index.md`, Beads epic `evmedia-r20`, and children
`evmedia-r20.9`, `evmedia-r20.9.4`, and `evmedia-r20.13`. Preserve upstream
pullability and do not push to the current public `origin`. Produce the
required Parallel Decomposition Matrix before live Supabase adapter work.

## Explicit defers

- Private Everville git remote and Beads Dolt remote configuration.
- Live Supabase project creation/linking and production migration application.
- Auth UI/magic-link request surface, session refresh rotation, BFF/server
  routes, storage signed URL resolver, durable generation workers, Higgsfield
  cloud credential custody, realtime presence, and conflict resolution UI.
