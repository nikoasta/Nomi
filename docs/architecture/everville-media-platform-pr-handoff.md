# Everville Media Platform PR Handoff

Status: local PR-ready branch, not pushed.

Branch: `everville/media-platform`

Base checked locally: `origin/main`

Latest commits:

- `b055c030` - `docs: record media platform rfc evidence`
- `736b3a97` - `feat: add stable asset domain contracts`

Babysitter run:

- Run: `evmedia-r20-8-1-platform-assets-20260718`
- State: `completed`
- Completion proof: `6695c424371d5dfd6547f056e32d3867`
- Independent review: passed, score `95`, blockers `0`

Beads state:

- `evmedia-r20.8.1`: `closed`
- `evmedia-r20.8`: `open`
- `evmedia-r20.4`: `in_progress`

## Recommended PR Strategy

Do not offer the whole `everville/media-platform` branch as one upstream PR without
discussion. The branch is 53 commits ahead of `origin/main` and contains several
independent tracks:

1. Interface localization and installed macOS app verification.
2. Higgsfield CLI/provider integration and safety boundaries.
3. Runtime-neutral PlatformClient contracts.
4. Organization authorization contracts.
5. Vendor-neutral asset identity/version/provenance contracts.
6. Everville media platform RFC and Beads orchestration evidence.

The upstream-friendly path is to split the branch into reviewable PRs in that
order. Each PR should preserve upstream identifiers and runtime behavior, and
should avoid presenting Everville-specific planning docs as required Nomi product
changes unless the maintainers explicitly want those artifacts.

## Upstream-Friendly PR 1: Localization

Goal:

Add a real Chinese / English / Russian UI language layer while preserving Nomi's
existing provider/model identifiers and future update path.

Reviewer framing:

- UI strings move behind dictionaries and display adapters.
- Provider/model IDs remain stable; only display text is translated.
- The installed Electron app was verified separately from repo tests.

Useful evidence:

- `src/i18n/I18nProvider.tsx`
- `src/i18n/LanguageSwitcher.tsx`
- `src/i18n/locales/en.json`
- `src/i18n/locales/ru.json`
- `src/i18n/locales/zh-CN.json`
- `src/i18n/displayText.ts`
- `scripts/check-i18n-ui.mjs`

## Upstream-Friendly PR 2: Higgsfield Local Provider

Goal:

Expose Higgsfield through safe local CLI/provider contracts without leaking
credentials, broad shell access, or cloud topology assumptions.

Reviewer framing:

- The adapter is local-runtime oriented.
- Website/admin/token-style Higgsfield commands remain explicitly out of scope.
- Provider manifests and codec behavior are test-covered.

Useful evidence:

- `docs/architecture/higgsfield-provider-boundary.md`
- `electron/catalog/higgsfieldCli.ts`
- `electron/catalog/higgsfieldProviderAdapter.ts`
- `electron/catalog/higgsfieldProviderManifest.ts`
- `src/platform/generation/provider.ts`

## Upstream-Friendly PR 3: PlatformClient Contracts

Goal:

Introduce runtime-neutral client contracts so renderer code can call stable
platform surfaces instead of depending directly on Electron bridge details.

Reviewer framing:

- Browser behavior is intentionally safe and typed unsupported.
- Electron behavior is preserved behind adapters.
- Direct runtime coupling is reduced at documented boundaries.

Useful evidence:

- `docs/architecture/platform-client-runtime-boundary.md`
- `src/platform/client.ts`
- `src/platform/browserPlatformClient.ts`
- `src/platform/electronPlatformClient.ts`
- `src/platform/platformClient.*.test.ts`

## Upstream-Friendly PR 4: Authorization Contracts

Goal:

Add organization/project/principal authorization contracts without selecting a
production auth vendor or introducing migrations/RLS.

Reviewer framing:

- This is a contract layer, not a cloud auth decision.
- Browser remains fail-closed where authorization is unsupported.
- Parent work remains open for real tenant enforcement.

Useful evidence:

- `docs/architecture/platform-authorization-boundary.md`
- `src/platform/authorization/contracts.ts`
- `src/platform/authorization/policy.ts`
- `src/platform/platformAuthorization.*.test.ts`

## Upstream-Friendly PR 5: Asset Domain Contracts

Goal:

Add stable asset and asset-version identities, provenance, validation, and
runtime resolution contracts while keeping persisted identity separate from
runtime locators.

Reviewer framing:

- New persisted asset records contain no local paths, URLs, bucket keys,
  provider payloads, credentials, or secret-bearing prompt data.
- Runtime locators are ephemeral and Electron-only.
- Browser import/resolution remains typed unsupported until a cloud adapter is
  explicitly approved.
- Existing local asset list/import behavior remains compatible.

Useful evidence:

- `docs/architecture/platform-assets-boundary.md`
- `src/platform/assets/contracts.ts`
- `src/platform/assets/runtime.ts`
- `electron/assets/assetIdentity.ts`
- `electron/assets/projectAssetStore.ts`
- `src/platform/platformAssetRecords.*.test.ts`
- `electron/assets/projectAssetStore.identity.test.ts`

Verification already recorded:

- Focused asset/PlatformClient/security gate: 15 suites, 215 tests passed.
- App and Electron typecheck passed.
- Scoped eslint passed with 0 errors and 7 existing warnings in `electron/main.ts`.
- Full repository gate passed during Babysitter orchestration.
- Independent review passed with score `95`, blockers `0`.

## Everville-Only Docs

The following files are useful for Everville planning but should be offered to
Nomi maintainers only if they want the corporate media-platform direction:

- `docs/architecture/everville-media-platform-rfc.md`
- `docs/architecture/everville-media-platform-acceptance-matrix.md`
- `docs/architecture/everville-media-platform-cloud-options.md`
- `docs/architecture/everville-media-platform-decision-brief.md`
- `docs/architecture/everville-media-platform-runtime-audit.md`
- `docs/architecture/everville-media-platform-security-data.md`
- `.beads/interactions.jsonl`
- `.a5c/processes/*`

These are evidence and planning artifacts, not upstream product requirements.

## Draft PR Body For Asset Contracts

Title:

`feat: add stable asset domain contracts`

Body:

```markdown
## Summary

- Adds vendor-neutral Asset and AssetVersion domain contracts with opaque IDs,
  organization/project scope, integrity, validation, lineage, classification,
  and truthful provenance.
- Adds Electron projection over the existing local asset store while keeping
  runtime locators ephemeral.
- Adds typed PlatformClient asset-record surfaces and browser-safe unsupported
  behavior without selecting cloud storage, migrations, RLS, or a provider.

## What is intentionally out of scope

- Cloud object storage and signed delivery.
- Tenant-enforced production authorization.
- Historical migration of existing project assets.
- Storage vendor/topology selection.
- Parent media-platform completion claims.

## Verification

- Focused asset/platform gate: 15 test files, 215 tests passed.
- `pnpm run typecheck` passed.
- Scoped eslint passed with 0 errors; existing warnings remain in
  `electron/main.ts`.
- Full repository gate passed in the local Babysitter run.
- Independent security/data-integrity review passed with score 95 and 0 blockers.

## Notes

The existing legacy asset facade remains compatible. New persisted asset records
must not store runtime URLs, absolute paths, bucket keys, raw provider payloads,
credentials, or secret-bearing prompt data.
```

## Push Guard

Do not push this branch until the owner explicitly approves the target remote
and PR split.

Current remote:

`origin git@github.com:aqm857886159/Nomi.git`

Public `origin` is not the default publish target for this Everville branch. A
push to `origin git@github.com:aqm857886159/Nomi.git` requires explicit owner
approval that names that public remote.

When approved, use an explicit owner-approved target remote:

```bash
git push -u <owner-approved-private-remote> everville/media-platform
```
