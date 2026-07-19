# cut.eva.mba Launch Runbook

Status: ready for a static browser-shell deployment, not a full collaborative
media platform backend.

Date: 2026-07-19

Target hostname: `cut.eva.mba`

Current observation:

- `cut.eva.mba` resolves to Vercel IPs.
- `https://cut.eva.mba` returns Vercel `DEPLOYMENT_NOT_FOUND`.
- That means DNS is already pointed at Vercel, but no Vercel project/deployment
  is currently serving this hostname.

## Launch Goal

Serve the Nomi/Everville media workbench as a private company web portal shell
at `cut.eva.mba`.

This launch does not claim that cloud generation, shared project persistence,
Supabase tenancy, asset storage, review/approval workflows, or Higgsfield cloud
execution are complete. Browser runtime must remain fail-closed for desktop-only
capabilities until the platform backend exists.

## Verified Local Web Readiness

Renderer production build:

```bash
pnpm run build:renderer
```

Result:

- Vite production build passed.
- Output directory: `dist`
- Output size: approximately `33M`

Local static smoke:

```bash
pnpm exec vite preview --host 127.0.0.1 --port 4174
```

Playwright smoke result:

- `GET http://127.0.0.1:4174/` returned `200`
- Final URL: `http://127.0.0.1:4174/#/studio`
- Page title: `Nomi`
- Rendered Project Library shell
- Console/page errors: `0`
- Screenshot: `/tmp/nomi-cut-local-preview.png`

Security/localization checks:

```bash
pnpm run check:secrets
pnpm run check:i18n
```

## Vercel Configuration

Tracked deployment config:

- `vercel.json`
- `.vercelignore`

Build settings:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm run build:renderer`
- Output: `dist`

The app uses `HashRouter`, so the production route is naturally
`https://cut.eva.mba/#/studio`. `vercel.json` also includes direct path rewrites
for `/studio/*` and `/workspace/*`.

## Vercel Project Recommendation

Create a dedicated Vercel project instead of reusing `eva-mba`.

Recommended project name:

`everville-cut`

Recommended team:

`Everville_Ecosystem` / `team_ABNTmMu3nUrQDWUGEMoZrYoX`

Reason:

- `eva-mba` is the public/investor website surface.
- `cut.eva.mba` is a tool/workbench surface with different rollout risk,
  headers, logs, access policy, and future backend needs.
- A dedicated project lets us add auth, protected deployments, environment
  variables, and rollback without coupling to the public site.

## Domain Attachment

Attach this hostname to the dedicated Vercel project:

`cut.eva.mba`

Because DNS already points to Vercel, the domain should begin serving once the
hostname is assigned to the correct project and a production deployment exists.

## Deploy Commands

With Vercel CLI access:

```bash
pnpm dlx vercel@latest link --yes --project everville-cut --scope everville
pnpm dlx vercel@latest build --prod
pnpm dlx vercel@latest deploy --prebuilt --prod
```

If the project does not exist yet, create it in Vercel first or run the
equivalent Vercel dashboard/API flow, then link non-interactively.

After deployment, attach the domain:

```bash
pnpm dlx vercel@latest domains inspect cut.eva.mba
```

If the domain is not assigned to `everville-cut`, add it through the Vercel
dashboard or API for the Everville team.

## Production Smoke

After Vercel reports the production deployment is ready:

```bash
curl -I https://cut.eva.mba
curl -I https://cut.eva.mba/assets/
```

Browser smoke:

- Open `https://cut.eva.mba`
- Confirm redirect/render to `#/studio`
- Confirm Project Library loads
- Switch language English/Russian/Chinese
- Open Model setup and confirm browser-only unsupported paths do not expose
  local credentials
- Confirm no provider API keys appear in page source, network requests, or
  client bundle search

Suggested bundle search after deployment artifact is built:

```bash
pnpm run check:secrets
rg -n -i "(api[_-]?key|bearer|private[_-]?key|sk-[A-Za-z0-9])" dist || true
```

## Explicit Non-Claims

This first deployment is not:

- a completed multi-user collaboration platform;
- a Supabase-backed project database;
- cloud asset storage;
- a cloud Higgsfield executor;
- production tenant enforcement;
- an approved Everville Alpha.

Those remain in the open media-platform architecture tasks.
