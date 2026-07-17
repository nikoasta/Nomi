# Everville PlatformClient Process

## Purpose

Implement the reversible part of `evmedia-r20.2` while architecture issue
`evmedia-r20.4` remains explicitly unapproved. This run creates a stable,
vendor-neutral renderer boundary without selecting a cloud topology.

## Scope

- Runtime-read the durable Beads specification and current RFC state.
- Trace confirmed live Electron bridge call paths before changing source.
- Freeze contract and boundary tests before implementation and prove RED.
- Add a typed PlatformClient contract plus Electron and browser adapters.
- Migrate only conversation persistence and asset upload in this slice.
- Preserve Electron IPC behavior and make browser imports safe.
- Reject cloud SDKs, migrations, production secrets, and provider assumptions.
- Run focused tests, typecheck, independent review, and full repository gates.
- Commit only milestone files and close only `evmedia-r20.2.1`.

## Governance

The run does not approve, close, or satisfy `evmedia-r20.4`. The parent
`evmedia-r20.2` remains open and blocked for final completion until the owner
approves an architecture. Untracked RFC drafts are excluded from the commit.

## Quality Controls

1. Tests are authored from the Beads spec without reading implementation.
2. The pre-implementation test run must fail.
3. Test checksums must remain unchanged through implementation and remediation.
4. Selected call paths must contain no direct desktop bridge access.
5. Platform code must contain no unapproved cloud-vendor coupling.
6. An independent reviewer compares the verbatim spec to final artifacts.
7. `pnpm run gates` must pass before the milestone is versioned.
