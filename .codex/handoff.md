# Current State

The dedicated `everville/media-platform` branch contains the initial Everville
Media Platform workflow draft and is aligned to orchestration baseline
`balanced-v2.12`.

Beads epic `evmedia-r20` is the durable product backlog. Bootstrap task
`evmedia-r20.6` completed the branch and orchestration setup; the next product
task is `evmedia-r20.4`. Beads uses embedded Dolt in local-only mode; no remote
is configured because the repository `origin` is the public Nomi upstream.

The upstream contribution branches remain separate and must not receive
Everville-specific orchestration, backend, authorization, or brand-policy work.

## Next recommended

Next stage id: `evmedia-r20.4-cloud-platform-rfc`

Recommended action: start `evmedia-r20.4`. Trace current renderer-to-Electron
runtime call paths and write the technical RFC before changing application
code.

## Starter prompt for next orchestrator

Use $orchestrator-stage in `/Users/niko.dev/Developer/work/nomi-i18n` on branch
`everville/media-platform`. Read `AGENTS.md`, `.codex/orchestrator.toml`, this
handoff, `.codex/project-index.md`, Beads epic `evmedia-r20`, and child
`evmedia-r20.4`. Preserve upstream pullability and do not push to the current
public `origin`. Produce the required Parallel Decomposition Matrix before the
architecture stage.

## Explicit defers

- Private Everville git remote and Beads Dolt remote configuration.
- CI/CD integration until the private delivery target is selected.
- Cloud architecture and application changes tracked by children of
  `evmedia-r20`.
