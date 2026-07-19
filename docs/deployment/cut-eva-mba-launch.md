# cut.eva.mba Launch Runbook

Status: live static browser shell with a browser-only portal auth UI, not a
full collaborative media platform backend.

Date: 2026-07-19

Target hostname: `cut.eva.mba`

Initial observation:

- `cut.eva.mba` resolves to Vercel IPs.
- `https://cut.eva.mba` returns Vercel `DEPLOYMENT_NOT_FOUND`.
- That means DNS is already pointed at Vercel, but no Vercel project/deployment
  is currently serving this hostname.

Final launch state:

- Vercel project: `everville-cut`
- Team: `Everville_Ecosystem` / `everville`
- Production hostname: `https://cut.eva.mba`
- Primary app route: `https://cut.eva.mba/#/studio`
- Deployment: `dpl_69PNszKSJ5GPaRb69nKZuN2p34YT`
- Deployment URL: `https://everville-25txag4cx-everville.vercel.app`
- Public Vercel alias: `https://everville-cut.vercel.app`
- Inspector: `https://vercel.com/everville/everville-cut/69PNszKSJ5GPaRb69nKZuN2p34YT`

## Launch Goal

Serve the Nomi/Everville media workbench as a company web portal shell at
`cut.eva.mba`.

This launch does not claim that cloud generation, shared project persistence,
Supabase tenancy, asset storage, review/approval workflows, or Higgsfield cloud
execution are complete. Browser runtime must remain fail-closed for desktop-only
capabilities until the platform backend exists. The browser auth UI can request
Supabase magic links once Vercel public env vars and Supabase redirect URLs are
configured.

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

Attached this hostname to the dedicated Vercel project:

`cut.eva.mba`

Verification result:

```bash
pnpm dlx vercel@latest domains verify cut.eva.mba --scope everville --non-interactive
```

Result:

- `status`: `ok`
- `domainStatus`: `configured-correctly`
- `configurationStatus`: `configured-correctly`
- `project.attached`: `true`
- `project.verified`: `true`
- `issues`: `[]`

## Deploy Commands

Actual setup/deploy flow:

```bash
pnpm dlx vercel@latest project add everville-cut --scope everville --non-interactive
pnpm dlx vercel@latest link --yes --team everville --project everville-cut
pnpm dlx vercel@latest deploy --yes --scope everville --project everville-cut --logs
pnpm dlx vercel@latest domains add cut.eva.mba everville-cut --scope everville --non-interactive
pnpm dlx vercel@latest domains verify cut.eva.mba --scope everville --non-interactive
```

For future production redeploys from a clean linked checkout:

```bash
pnpm dlx vercel@latest deploy --yes --prod --scope everville --project everville-cut --logs
```

The local `.vercel/project.json` link file is intentionally ignored and should
not be committed.

## Production Smoke

HTTP smoke:

```bash
curl -I https://cut.eva.mba
```

Result:

- `HTTP/2 200`
- `server: Vercel`
- `content-type: text/html; charset=utf-8`

Browser smoke result:

- URL: `https://cut.eva.mba/#/studio`
- Status: `200`
- Page title: `Nomi`
- Rendered Project Library shell
- Portal auth control visible
- Console/page errors: `0`
- Screenshot: `/tmp/cut-eva-portal-auth-smoke.png`

Remaining manual smoke before team rollout:

- Configure Vercel env: `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Configure Supabase Auth redirect allowlist: `https://cut.eva.mba/`.
- Request a magic link from the Project Library and confirm callback returns to
  `https://cut.eva.mba/#/studio` with no tokens left in the visible URL.
- Switch language English/Russian/Chinese.
- Open Model setup and confirm browser-only unsupported paths do not expose
  local credentials.
- Confirm no provider API keys appear in page source, network requests, or
  client bundle search.

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
