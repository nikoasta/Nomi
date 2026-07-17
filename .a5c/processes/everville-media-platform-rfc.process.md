# Everville Media Platform RFC process

Parent Beads issue: `evmedia-r20.4`

Purpose: produce the reviewed architecture contract that blocks all Alpha
implementation milestones.

## Phases

1. Read the Beads specification and product context at runtime.
2. Run a brownfield reuse audit before proposing infrastructure.
3. Freeze a test-first RFC acceptance matrix without reading implementation.
4. Investigate three independent tracks in parallel:
   - live Nomi runtime and persistence paths;
   - current cloud-stack alternatives and costs;
   - tenancy, provenance, knowledge, and secret boundaries.
5. Prepare an evidence-backed architecture decision brief.
6. Stop at an owner breakpoint. No stack is approved by default.
7. Author the RFC from the approved decision and verbatim evidence.
8. Run deterministic coverage, orchestration, and diff gates.
9. Run independent requirement-by-requirement review, with up to three
   refinement attempts.
10. Stop at the final owner breakpoint before the RFC becomes the downstream
    implementation contract.

## Required outputs

- `docs/architecture/everville-media-platform-acceptance-matrix.md`
- `docs/architecture/everville-media-platform-runtime-audit.md`
- `docs/architecture/everville-media-platform-cloud-options.md`
- `docs/architecture/everville-media-platform-security-data.md`
- `docs/architecture/everville-media-platform-decision-brief.md`
- `docs/architecture/everville-media-platform-rfc.md`

## Intent checks

- The process retains the full Alpha scope represented by `evmedia-r20`.
- It extends existing Nomi workbench/runtime paths instead of replacing them.
- It uses shell tasks for deterministic checks and agent tasks for architecture
  reasoning.
- Specification and artifacts are read at runtime and passed verbatim to
  authors and reviewers.
- Architecture and final RFC approval remain explicit user breakpoints.
- No application code, cloud migration, deployment, or public push is in this
  milestone.
