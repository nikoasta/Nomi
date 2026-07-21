# Current State

Branch `update-integration` contains the shared Everville Nomi storage layer for
the web portal and macOS app. Production is live at `https://cut.eva.mba` and
the installed desktop bundle is Nomi `0.16.9` at `/Applications/Nomi.app`.

The active implementation slice is Beads task `evmedia-r20.8.2`, under epic
`evmedia-r20.8`. It keeps the upstream-compatible Nomi renderer shared between
web and Electron while routing portal-bound projects through one authenticated
storage contract.

## Storage Architecture

- Dropbox Team Space owns private immutable media bytes under
  `/Content/NOMI/projects/{project-id}`.
- Supabase owns organizations, project membership, asset/version identity,
  checksums, provenance, ingestion state, and private Dropbox locators.
- The portal BFF authorizes every write/read, hides provider and Dropbox URLs,
  supports byte ranges, and persists provider output before project snapshots.
- Web and portal-bound desktop projects use the same opaque `ast_*` and `av_*`
  identities. Local-only desktop projects keep Electron local storage.
- Retries are idempotent and concurrent ingestion is serialized by a database
  advisory lock.

Primary implementation and runbook:

- `docs/architecture/everville-dropbox-asset-storage.md`
- `supabase/migrations/20260721070857_dropbox_asset_storage.sql`
- `server/dropboxAssetStorage.js`
- `server/portalApiHandler.js`
- `src/platform/webPortalAssets.ts`
- `scripts/smoke-portal-storage.mjs`

## Production State

- Vercel project: `everville-cut`
- Production deployment: `dpl_2nYkLit3vmaiLRFW9UTbgFMjVpwk`
- Supabase project ref: `tcrrmyodvyqbpccjqnfo`
- Dropbox app: `Everville Nomi Storage`
- Dropbox Team Space root namespace: configured server-side
- Storage root: `/Content/NOMI`

All secret values are server-only Vercel variables. Do not copy them into Git,
Vite variables, project snapshots, logs, or desktop preferences.

## Verification Evidence

- Storage-focused suites passed: 91 tests.
- Final full release gate passed: 337 files passed, 1 skipped; 3240 tests
  passed, 1 skipped; lint, typecheck, i18n/security checks, renderer build, and
  Electron build were green.
- Production authenticated smoke passed idempotent upload, list, resolve, full
  download, and Range download with byte-integrity checks.
- Anonymous list/content requests returned HTTP 401 with no media bytes.
- Supabase migration was dry-run, applied, and queried in production.
- `pnpm run dist:mac:dir`, `pnpm run install:mac:local`, and
  `pnpm run verify:installed` passed for Nomi `0.16.9`.

## Release And Recovery Commands

```bash
pnpm run gates
pnpm run smoke:portal-storage
pnpm run dist:mac:dir
pnpm run install:mac:local
pnpm run verify:installed
```

The storage smoke removes its Supabase fixture and reports the exact isolated
Dropbox fixture path for explicit cleanup. Credential rotation needs only a
Vercel env update and redeploy; stable asset identities and stored bytes remain
unchanged.

## Next Recommended

1. Reopen one real shared project from authenticated web and desktop sessions,
   confirming the same asset IDs and byte content on both clients.
2. Add operational metrics for ingestion latency, retry count, Dropbox errors,
   and orphan candidates before introducing automated retention.
3. Keep future upstream integrations on `update-integration`: run
   `pnpm run upstream:plan`, inspect conflicts at platform boundaries, then
   `pnpm run upstream:merge` and the complete release gate.

Do not merge Everville credentials, tenant policy, or Dropbox implementation
details into the public upstream contribution branch.
