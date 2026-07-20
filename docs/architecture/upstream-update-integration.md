# Upstream Update Integration

This branch is kept upgrade-friendly by replaying Everville changes onto a fresh upstream base instead of merging a long-diverged branch.

## Current Integration Point

- Upstream base: `origin/main` at `1745f8e7` (`v0.16.7` line).
- Working branch: `update-integration`.
- Replay model: `origin/main` first, then Everville feature commits.
- Conflict memory: `git rerere.enabled=true`.

## Future Update Procedure

1. Fetch upstream:

   ```bash
   git fetch origin --prune
   ```

2. Start from a clean worktree and run a dry plan:

   ```bash
   node scripts/integrate-upstream-update.mjs --source=update-integration --target=update-integration-next
   ```

3. Apply the replay only when the commit list looks right:

   ```bash
   node scripts/integrate-upstream-update.mjs --source=update-integration --target=update-integration-next --apply
   ```

4. Resolve conflicts with these priorities:

   - Keep upstream structure and new upstream behavior unless it breaks an Everville contract.
   - Keep UI i18n in dictionaries and adapters, not inline replacement strings.
   - Keep portal auth server-proxied; never expose service-role keys or private Supabase access to the browser.
   - Keep public asset imports on the shared hardened public path; allow private origins only for explicit main-process internal generator calls.
   - Treat `public/tailwind.generated.css` as generated output. Prefer current upstream during conflict resolution, then regenerate once after the replay.

5. Run verification:

   ```bash
   pnpm run check:i18n
   pnpm run typecheck
   pnpm run test
   pnpm run build
   ```

6. For release readiness, run the full gate:

   ```bash
   pnpm run gates
   ```

## Why Not Direct Merge?

The old branch can be dozens of commits behind upstream while also carrying many Everville-specific commits. A direct merge creates broad add/add and generated-file conflicts. Replaying feature commits onto fresh upstream gives maintainers a readable PR and makes the next update repeatable.
