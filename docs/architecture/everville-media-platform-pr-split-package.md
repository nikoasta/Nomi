# Everville Media Platform PR Split Package

Status: local preparation only. No public push is approved.

Date: 2026-07-19

Source branch: `everville/media-platform`

Target base: live `origin/main`

Current remote:

`origin git@github.com:aqm857886159/Nomi.git`

## Current Branch Inventory

Recorded locally on 2026-07-19:

- Live `origin/main` after `git fetch origin main`:
  `ea9d7633e00aafa06b28cc1417eca6a7abf5f54a`
- Merge base with live `origin/main`:
  `b638869a4f83ebdf7f091e90e7500fb99dafc97e`
- Current package-prep base HEAD before this document: `071daf39598030ce2b045cb67347277cf78a342d`
- Branch divergence before this package commit: `1159` commits behind and `1204`
  commits ahead of live `origin/main`
- Upstream branch: none configured
- Working tree before this package work: clean
- Local push guard: `.git/hooks/pre-push` blocks `everville/*` and `pr/*`
  pushes to public `origin` unless the owner-approved bypass environment
  variable names `git@github.com:aqm857886159/Nomi.git`
- Local git config: `push.autosetupremote=false`

Rerunnable inventory commands:

```bash
git status --short --branch
git merge-base origin/main HEAD
git rev-parse origin/main
git rev-parse HEAD
git rev-list --left-right --count origin/main...HEAD
git diff --name-status origin/main..HEAD
```

The source branch was built before the live `origin/main` update and is now too
diverged for a raw `origin/main..HEAD` PR. Prepare split PR branches by replaying
the relevant commits onto live `origin/main`; do not offer the monolithic branch
as a direct diff.

`git diff --check` against the previous local base found two blank-line-at-EOF
hygiene issues in Higgsfield tests. This package removes those trailing blank
lines. Against live `origin/main`, `git diff --check origin/main` still reports
older broad browser whitespace noise in the monolithic source branch; treat that
as another reason to verify each replayed split branch independently.

## Goal

Turn the local Everville media-platform branch into a safe upstream contribution
chain without publishing the full corporate branch. The branch is useful, but it
mixes product changes, local orchestration evidence, and Everville platform
planning. Upstream maintainers should receive small reviewable PRs, not the full
history as one package.

This document is the operator package for preparing those PRs locally.

## Non-Negotiables

- Do not push `everville/media-platform` to public `origin` unless the owner
  explicitly approves that exact remote and branch.
- Do not include `.a5c/`, `.beads/`, Babysitter process files, or Everville-only
  RFC artifacts in default upstream PRs.
- Keep provider/model IDs stable; translate display text only.
- Keep local paths, runtime URLs, bucket keys, provider payloads, credentials,
  and secret-bearing prompt text out of persisted asset records.
- Keep browser runtime fail-closed for unsupported local or desktop-only
  capabilities.
- Prefer squash-style PR branches, because the source branch contains
  orchestration and recovery commits that are useful locally but noisy upstream.
- Treat `HIGGSFIELD_RESEARCH.md`, `.codex/*`, `AGENTS.md`, and Everville
  workflow drafts as local/corporate context unless a maintainer asks for them.

## Recommended Local Branches

Prepare each branch from a fresh `origin/main` base. The branch names below are
drafts; change them if the owner or maintainers prefer a different convention.

```bash
git fetch origin
git switch everville/media-platform
git status --short
```

Expected status before split work: clean.

Because live `origin/main` has moved, each draft branch must be created from the
fresh remote base and then replay only its own source commits:

```bash
git switch -c <draft-branch> origin/main
git cherry-pick --no-commit <source-commit-1> <source-commit-2> ...
```

### PR 1: UI Localization

Draft branch:

`pr/i18n-ui-language-switcher`

Purpose:

Add a real Chinese / English / Russian UI layer while keeping upstream provider
and model identifiers intact.

Source commits to inspect and squash:

- `34fcc0be` `feat: add interface language switcher`
- `e60f9fb7` `test: stabilize i18n desktop smoke`
- `7b25d83d` `fix: keep language switcher usable`
- `64ed4cf8` `fix: route unsigned mac updates to manual download`
- `e086a0b1` `fix: translate model catalog display labels`
- `a516e8a5` `fix: translate persisted timeline track labels`
- `b1fd0a20` `fix: translate preview text font labels`
- `41a2d454` `chore: baseline i18n guard on current main`
- `2a8ff617` `chore: keep rebased i18n branch within gates`
- `16f755ac` `fix: complete next i18n interface sweep`

Include:

- `src/i18n/**`
- `src/design/**`, `src/ui/**`, and `src/workbench/**` call sites that consume
  `t(...)`, `translateDisplayText(...)`, or runtime locale helpers
- `scripts/check-i18n-ui.mjs`
- focused i18n tests
- `docs/i18n.md` if it explains the stable translation pattern

Exclude:

- Everville media platform RFC files
- Beads/Babysitter orchestration files
- app reinstall notes that are only local machine evidence

Minimum verification:

```bash
pnpm run check:i18n
pnpm run typecheck
pnpm run test -- --run src/i18n
pnpm run lint:ci
```

Draft title:

`feat: add UI language switcher`

### PR 2: Higgsfield Local Provider

Draft branch:

`pr/higgsfield-local-provider`

Purpose:

Expose Higgsfield as a safe local provider surface while keeping credentials,
shell execution, and cloud topology out of browser code.

Source commits to inspect and squash:

- `41ef06c7` `feat: integrate Higgsfield CLI provider`
- `236b6e6b` `fix: route prompt optimizer to keyed text models`
- `f6db8aa3` `fix: localize fixation prompt templates`
- `dce111f8` `fix: migrate legacy localized fixation prompts`
- `fad71c2e` `fix: make preview text overlays editable`
- `16d59294` `chore: orchestrate Higgsfield provider milestone`
- `b96c4bba` `fix: harden Higgsfield provider process scope`
- `bd1fb0bd` `fix: quote Higgsfield cloud coupling gate`
- `e81d4b53` `fix: include Higgsfield verification evidence`
- `c1ccc63f` `fix: force fresh Higgsfield security review`
- `58959d06` `fix: resume Higgsfield review until acceptance`
- `d054c3b7` `fix: satisfy Higgsfield recovery lint`
- `68d67d3a` `fix: recover contradictory Higgsfield test fixture`
- `e3f3ca0a` `fix: recover Higgsfield fixture after review`
- `d6926716` `test: gate Higgsfield review regressions`
- `01f43d48` `feat: add safe Higgsfield provider contracts`

Include:

- `electron/catalog/higgsfield*.ts`
- `electron/catalog/higgsfield*.test.ts`
- `src/platform/generation/**`
- `docs/architecture/higgsfield-provider-boundary.md`
- prompt optimizer routing only where it is provider-contract relevant

Exclude:

- local CLI auth material
- raw provider responses
- Everville-only architecture decision docs
- broad "enable everything" product claims

Minimum verification:

```bash
pnpm run typecheck
pnpm run test -- --run electron/catalog/higgsfield src/platform/generation
pnpm run check:secrets
pnpm run lint:ci
```

Draft title:

`feat: add safe Higgsfield local provider contracts`

### PR 3: PlatformClient Runtime Contracts

Draft branch:

`pr/platform-client-runtime-contracts`

Purpose:

Create runtime-neutral platform contracts so renderer code can target stable
browser and Electron adapters instead of direct desktop bridge details.

Source commits to inspect and squash:

- `8a961cd4` `chore: define PlatformClient babysitter milestone`
- `4b2e8825` `fix: preserve PATH in PlatformClient orchestration`
- `29ae1bc7` `fix: anchor PlatformClient tests to runtime boundary`
- `1099a044` `fix: include PlatformClient remediation tests in gates`
- `35debfee` `fix: remove unused PlatformClient process result`
- `5c8f3585` `feat: introduce runtime-neutral PlatformClient contracts`
- `594c335a` `chore: record PlatformClient milestone closure`

Include:

- `src/platform/client.ts`
- `src/platform/browserPlatformClient.ts`
- `src/platform/electronPlatformClient.ts`
- `src/platform/platformClient*.test.ts`
- `docs/architecture/platform-client-runtime-boundary.md`

Exclude:

- Babysitter process definitions
- local milestone closure logs
- unrelated media-platform RFC evidence

Minimum verification:

```bash
pnpm run typecheck
pnpm run test -- --run src/platform/platformClient
pnpm run build
pnpm run lint:ci
```

Draft title:

`feat: introduce runtime-neutral platform client contracts`

### PR 4: Authorization Contracts

Draft branch:

`pr/platform-authorization-contracts`

Purpose:

Add organization, project, principal, and policy contracts without choosing a
production auth vendor or adding migrations/RLS.

Source commits to inspect and squash:

- `f8de06e8` `chore: orchestrate authorization contract milestone`
- `dc9c643a` `fix: preserve authorization test evidence through commit`
- `9cabb839` `fix: preserve authorization compatibility evidence`
- `f28eaf9f` `fix: enforce authorization process gates`
- `a73201fd` `fix: harden authorization evidence gates`
- `bbbb282f` `feat: add organization authorization contracts`

Include:

- `src/platform/authorization/**`
- `src/platform/platformAuthorization*.test.ts`
- `docs/architecture/platform-authorization-boundary.md`

Exclude:

- real tenant enforcement claims
- migrations, RLS, or cloud provider setup
- privileged server key handling not implemented in this slice

Minimum verification:

```bash
pnpm run typecheck
pnpm run test -- --run src/platform/authorization src/platform/platformAuthorization
pnpm run check:secrets
pnpm run lint:ci
```

Draft title:

`feat: add organization authorization contracts`

### PR 5: Asset Domain Contracts

Draft branch:

`pr/platform-asset-domain-contracts`

Purpose:

Introduce stable asset and asset-version identity, provenance, validation, and
runtime resolution contracts without picking cloud storage or persisting runtime
locators.

Source commits to inspect and squash:

- `5a51f744` `chore: orchestrate stable asset domain milestone`
- `dbab37f5` `fix: converge failed asset gates`
- `1ad6e8ec` `fix: keep asset convergence run active`
- `f44b5e1e` `fix: recover asset gate compiler pollution`
- `ad9c7cdf` `fix: allow distinct asset record transport`
- `736b3a97` `feat: add stable asset domain contracts`

Include:

- `src/platform/assets/**`
- `src/platform/platformAssetRecords*.test.ts`
- `electron/assets/assetIdentity.ts`
- `electron/assets/projectAssetStore.ts`
- `electron/assets/projectAssetStore.identity.test.ts`
- `docs/architecture/platform-assets-boundary.md`

Exclude:

- cloud storage adapter claims
- signed delivery
- historical migration
- parent `evmedia-r20.8` completion claims

Minimum verification:

```bash
pnpm run typecheck
pnpm run test -- --run src/platform/assets src/platform/platformAssetRecords electron/assets/projectAssetStore.identity
pnpm run check:secrets
pnpm run lint:ci
```

Draft title:

`feat: add stable asset domain contracts`

### PR 6: Optional Everville Planning RFC

Draft branch:

`everville/media-platform-rfc-only`

Purpose:

Keep corporate planning evidence available for Everville and optional maintainer
discussion, but do not mix it into product PRs by default.

Source commits:

- `1c0804a6` `bd init: initialize beads issue tracking`
- `2dd3178c` `chore: bootstrap Everville media platform orchestration`
- `a5f76953` `chore: close media platform bootstrap task`
- `800fdd70` `chore: define media platform RFC babysitter process`
- `54b5cf1c` `chore: inventory Higgsfield capabilities in RFC preflight`
- `4222a761` `fix: make media RFC run evidence-complete`
- `b055c030` `docs: record media platform rfc evidence`
- `071daf39` `docs: add media platform pr handoff`

Include only for Everville or if maintainers explicitly request the architecture
story:

- `docs/architecture/everville-media-platform-*.md`
- `.beads/interactions.jsonl`
- `.a5c/processes/*`

Default upstream action:

Do not include this PR in the initial maintainer-facing chain. Use it for
owner review and internal continuity.

## Local Split Procedure

Use this procedure for each upstream PR branch. It keeps the source branch
recoverable and avoids accidental public push.

```bash
git fetch origin
git switch -c <draft-branch> origin/main
git cherry-pick --no-commit <source-commit-1> <source-commit-2> ...
git status --short
```

Then inspect and clean the staged changes:

```bash
git diff --cached --stat
git diff --cached
```

If orchestration-only files are staged, unstage them:

```bash
git restore --staged .a5c .beads
git restore --staged docs/architecture/everville-media-platform-*.md
```

Commit as a single upstream-facing changeset:

```bash
git commit -m "<draft PR title>"
```

Do not push until the owner approves the target remote:

```bash
git push -u <owner-approved-private-remote> <draft-branch>
```

## Local Patch Export

For owner review before any remote push, export patches from each prepared split
branch or a raw source-branch bundle to a private handoff location outside the
public upstream repository.

Patch directory for a prepared split branch:

```bash
mkdir -p /Users/niko.dev/Developer/work/nomi-i18n/.handoff/pr-split
git format-patch origin/main..HEAD \
  --output-directory /Users/niko.dev/Developer/work/nomi-i18n/.handoff/pr-split
```

Raw source branch bundle for recovery only:

```bash
git bundle create /Users/niko.dev/Developer/work/nomi-i18n/.handoff/everville-media-platform.bundle \
  origin/main everville/media-platform
```

These files are local owner-review artifacts. They are not approval to publish.

## Risk And Rollback Notes

Localization:

- Risk: translating persisted or provider/model identifiers instead of display
  labels can break compatibility.
- Rollback: revert the localization PR branch; project data should still contain
  stable upstream IDs.

Higgsfield local provider:

- Risk: accidentally exposing local CLI execution or provider credentials to a
  browser runtime.
- Rollback: remove the Higgsfield provider registration and keep the generic
  generation provider contracts disabled for browser use.

PlatformClient contracts:

- Risk: renderer paths can silently fall back to direct Electron bridge usage if
  adapters are incomplete.
- Rollback: revert the PlatformClient PR; Electron legacy bridge behavior should
  remain intact if the PR is scoped correctly.

Authorization contracts:

- Risk: reviewers may read contracts as production tenant enforcement.
- Rollback: remove the contract/policy layer; no migration or RLS should exist
  in this slice.

Asset domain contracts:

- Risk: persisting runtime locators would lock the architecture to local paths or
  a premature cloud topology.
- Rollback: drop asset-record/resolution contracts and keep the legacy local
  asset facade; no asset bytes should be migrated by this PR.

Everville planning RFC:

- Risk: maintainers may interpret Everville Alpha goals as upstream Nomi product
  requirements.
- Rollback: keep RFC material in private Everville branches/docs only.

## Full Pre-PR Verification

Run this on each prepared branch before opening a PR:

```bash
pnpm run check:secrets
pnpm run check:i18n
pnpm run typecheck
pnpm run test
pnpm run build
```

Run this before asking maintainers to review the entire chain:

```bash
git diff --check origin/main
pnpm run gates
```

Run `git diff --check origin/main` on each prepared split branch, not as an
acceptance signal for the current monolithic source branch.

Known local evidence:

- `evmedia-r20.8.1` is closed after asset-contract verification.
- Babysitter asset run `evmedia-r20-8-1-platform-assets-20260718` completed with
  proof `6695c424371d5dfd6547f056e32d3867`.
- The parent asset feature `evmedia-r20.8`, RFC task `evmedia-r20.4`, and Alpha
  epic `evmedia-r20` remain open.

## PR Body Template

```markdown
## Summary

- Adds <specific capability>.
- Preserves existing Electron behavior and keeps browser behavior safe.
- Keeps Everville-only architecture and orchestration artifacts out of this PR.

## What is intentionally out of scope

- Everville corporate workflow requirements.
- Public cloud deployment.
- Production tenant enforcement unless this PR specifically implements it.
- Provider credentials, raw provider payloads, or secret-bearing prompt data.

## Verification

- `pnpm run check:secrets`
- `pnpm run typecheck`
- `<focused tests>`
- `<build or gates result>`

## Notes

This PR is split from a larger local Everville media-platform exploration. The
split is intended to keep upstream review focused and preserve future pullability.
```

## Current Beads Tracking

This package is tracked by:

`evmedia-r20.12` - `Prepare upstream-safe PR split package`

Close it only after:

- this document is committed locally;
- independent agent review has no blocker;
- `git status --short` is clean;
- no public push has been made.

## Beads And RFC Reconciliation

Do not claim the media platform is complete.

Current state:

- `evmedia-r20.8.1`: closed; the vendor-neutral asset identity/provenance slice
  is complete.
- `evmedia-r20.8`: open; real cloud object storage, signed delivery, tenant
  policy, migration, and rollback are still future work.
- `evmedia-r20.4`: in progress; architecture/topology is not approved until the
  owner accepts the RFC breakpoint.
- `evmedia-r20`: open; the Everville Alpha is not complete until a real
  campaign passes the full deployed workflow.

Therefore upstream PRs must not claim:

- approved Vercel/Supabase or any other topology;
- completed cloud storage;
- completed tenant enforcement;
- completed web deployment;
- completed Everville Alpha;
- production-ready multi-user collaboration.
