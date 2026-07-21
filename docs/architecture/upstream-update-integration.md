# Upstream Update Integration

Everville Nomi is a long-lived corporate distribution of public Nomi. It keeps the public repository's history intact and adds localization, portal collaboration, provider integrations, and desktop packaging in `update-integration`.

## Branch Contract

- `origin/main`: public Nomi upstream. Never push corporate commits here.
- `nikoasta/update-integration`: Everville release branch for web and desktop.
- Integration model: no-force merge of `origin/main` into `update-integration`.
- Every update creates a local `backup/update-integration-before-*` recovery ref before merging.
- Translation is a display-layer adapter. Provider/model IDs, persisted project data, and upstream component boundaries stay stable.
- The same source commit must build both `cut.eva.mba` and `/Applications/Nomi.app`.

The current integration includes `origin/main` at `c4568576` on the Nomi `0.16.8` line.

## Routine Update

Start with a clean `update-integration` worktree.

```bash
git switch update-integration
pnpm upstream:plan
```

The plan fetches `origin`, reports ahead/behind counts and changes nothing. If upstream has new commits:

```bash
pnpm upstream:merge
```

The command creates a timestamped backup branch and performs a normal `--no-ff` merge. Running it again after a successful update is safe: it reports that the branch is current and creates no commit.

If Git pauses on conflicts:

1. Keep upstream structure and new behavior unless it violates an Everville contract.
2. Preserve i18n dictionaries/adapters, portal auth, shared projects, server-side secrets, provider IDs, and Electron URL handling.
3. Resolve generated files from source. For Tailwind, run `node scripts/build-tailwind.mjs --minify` after source conflicts are resolved.
4. Scan for conflict markers and hardcoded Chinese UI.
5. Stage only resolved files, then continue:

```bash
pnpm run check:i18n
pnpm run typecheck
git add <resolved-files>
pnpm upstream:continue -- --verify
```

`--verify` runs the complete `pnpm run gates` suite after the merge commit.

## Release Checklist

An upstream merge is not released until all of the following use the same commit:

```bash
pnpm run gates
pnpm run dist:mac:dir
node scripts/verify-installed-nomi.mjs
npx vercel@latest deploy --prod --yes
```

Then verify:

- `https://cut.eva.mba` loads behind Everville authentication.
- Portal auth, shared-project list/create/open, and provider/model setup work.
- English and Russian surfaces contain no hardcoded Chinese UI outside the explicit language selector.
- `/Applications/Nomi.app` reports the expected version and commit-derived build, opens the same project model, and can authenticate to the portal.
- Web and desktop use the same portal project schema; local-only projects remain local until explicitly shared.
- Push with `git push nikoasta update-integration`. Never force-push the release branch.

## Cadence

- Run `pnpm upstream:plan` weekly and before every corporate release.
- Integrate security and data-loss fixes immediately.
- Bundle ordinary feature updates into one reviewed merge rather than repeatedly merging throughout the day.
- Record each integration in Beads and run the release workflow through Babysitter so gates, package, deploy, and smoke evidence are durable.

## Recovery

Before the merge is committed, `git merge --abort` returns to the pre-merge worktree. After commit or deployment, keep history immutable:

- create a normal revert commit for the merge if source rollback is needed;
- use the printed `backup/update-integration-before-*` ref for comparison or recovery work;
- roll the web deployment back in Vercel;
- reinstall the previously packaged macOS bundle if desktop verification fails.

Do not use `git reset --hard`, rewrite corporate history, or force-push as part of this workflow.
