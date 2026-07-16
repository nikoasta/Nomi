# Everville Media Platform orchestration bootstrap

Status: completed

Date: 2026-07-16

Beads task: `evmedia-r20.6`

## Scope

- Create a dedicated `everville/media-platform` product branch from the current
  Nomi + i18n + Higgsfield baseline.
- Preserve the product workflow draft in the repository.
- Initialize an embedded, local-only Beads database and create the technical
  foundation epic with dependency-aware child work.
- Install orchestration baseline `balanced-v2.12` and its verification scripts.
- Make the repository ready for future Babysitter runs without creating a
  second backlog.

## Non-goals

- Do not push to the current public upstream `origin`.
- Do not configure a private git or Dolt remote before its destination exists.
- Do not modify upstream CI/CD.
- Do not implement cloud architecture or application code in this bootstrap.
- Do not run the interactive `cradle/project-install` process, which would also
  request CI/CD choices and modify broader project-profile surfaces.

## Delivery Boundaries

- Generic Nomi contributions remain on clean `pr/*` branches.
- Everville-specific orchestration, authorization, brand policy, and knowledge
  integration remain on the product branch or a future private repository.
- The current `origin` is read-only for this product branch until a private
  Everville delivery remote is configured.

## Rollback

- Switch back to `pr/higgsfield-integration`; that branch remains at commit
  `fad71c2e` and does not contain this bootstrap.
- Delete the product branch only after confirming no later product work depends
  on it.
- Beads is local-only and has no remote side effects.

## Acceptance Gates

- `scripts/orchestration/run_process_verification.sh`
- orchestration audit reports `aligned`
- `.codex/project-index.md` remains between 80 and 150 lines
- `git diff --check`
- `bd migrate --inspect`
- `bd status` and `bd list`
- `bd dolt show` reports no remotes
- setup task closes only after a product-branch commit exists

## Result

- Product branch: `everville/media-platform`
- Beads epic: `evmedia-r20`
- Bootstrap task: `evmedia-r20.6`
- Next technical task: `evmedia-r20.4`
- Beads backend: embedded Dolt, local-only, no remote
- Orchestration baseline: `balanced-v2.12`
- CI/CD: unchanged
- Public upstream push: not performed
