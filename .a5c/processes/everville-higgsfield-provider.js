/**
 * @process everville-higgsfield-provider
 * @description Reversible Higgsfield provider manifest and safe local CLI adapter milestone.
 * @skill methodologies/cc10x/skills/test-driven-development/SKILL.md
 * @skill specializations/desktop-development/skills/electron-ipc-security-audit/SKILL.md
 * @agent methodologies/rpikit/agents/security-reviewer/AGENT.md
 * @inputs { projectRoot: string, beadId: string }
 * @outputs { success: boolean, beadId: string, review: object, commit: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk'

const testPaths = [
  'src/platform/generation/provider.contract.test.ts',
  'src/platform/generation/browserGenerationProvider.test.ts',
  'electron/catalog/higgsfieldProviderManifest.test.ts',
  'electron/catalog/higgsfieldProviderAdapter.test.ts',
]

const protectedDrafts = [
  'docs/architecture/everville-media-platform-acceptance-matrix.md',
  'docs/architecture/everville-media-platform-cloud-options.md',
  'docs/architecture/everville-media-platform-decision-brief.md',
  'docs/architecture/everville-media-platform-rfc.md',
  'docs/architecture/everville-media-platform-runtime-audit.md',
  'docs/architecture/everville-media-platform-security-data.md',
]

const implementationPaths = [
  'src/platform/generation/provider.ts',
  'src/platform/generation/browserGenerationProvider.ts',
  'electron/catalog/higgsfieldProviderManifest.ts',
  'electron/catalog/higgsfieldProviderAdapter.ts',
  'electron/catalog/higgsfieldCli.ts',
  'electron/catalog/higgsfieldTransport.ts',
  'electron/catalog/higgsfieldCodec.ts',
  'electron/catalog/processOperation.ts',
  'electron/catalog/higgsfieldIpc.ts',
]

function quote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

const readSpecTask = defineTask('read-higgsfield-provider-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.beadId} and parent specifications verbatim`,
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `bd show ${quote(args.beadId)}`,
      "printf '\\n--- GENERATION PARENT ---\\n'",
      'bd show evmedia-r20.7',
      "printf '\\n--- ALPHA EPIC ---\\n'",
      'bd show evmedia-r20',
      "printf '\\n--- CONFIRMED PLATFORM EXTENSION DIRECTION ---\\n'",
      "sed -n '205,245p' docs/architecture/platform-client-runtime-boundary.md",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['beads', 'runtime-read', 'spec'],
}))

const preflightTask = defineTask('higgsfield-provider-preflight', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace the live Higgsfield CLI path and installed command surface',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      "printf '%s\\n' '--- PATH COLLISION CHECK ---'",
      `for file in ${implementationPaths.concat(testPaths, ['docs/architecture/higgsfield-provider-boundary.md']).map(quote).join(' ')}; do if [ -e "$file" ]; then echo "EXISTS $file"; else echo "NEW $file"; fi; done`,
      "printf '%s\\n' '--- LIVE HIGGSFIELD REFERENCES ---'",
      "rg -n 'higgsfield|Higgsfield' electron src --glob '*.{ts,tsx}'",
      "printf '%s\\n' '--- CURRENT CLI EXECUTION PATH ---'",
      "for file in electron/catalog/higgsfieldCli.ts electron/catalog/higgsfieldTransport.ts electron/catalog/higgsfieldIpc.ts electron/catalog/processOperation.ts src/desktop/bridge.ts; do printf '\\n--- %s ---\\n' \"$file\"; sed -n '1,760p' \"$file\"; done",
      "printf '%s\\n' '--- INSTALLED CLI EVIDENCE ---'",
      "higgsfield version --json || higgsfield version",
      'higgsfield --help',
      "for command in auth account workspace model workflow voices upload generate soul-id ad-formats ad-references avatars brand-kits dtc-ads hooks products settings webproducts product-photoshoot marketplace-cards website game; do printf '\\n--- higgsfield %s --help ---\\n' \"$command\"; higgsfield \"$command\" --help || true; done",
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['brownfield', 'cli-inventory', 'runtime-call-path', 'shell'],
}))

const hashProtectedDraftsTask = defineTask('freeze-unapproved-rfc-drafts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze checksums for unapproved RFC drafts',
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${protectedDrafts.map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['architecture-unapproved', 'evidence', 'shell'],
}))

const boundaryTask = defineTask('document-higgsfield-provider-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document the reversible provider and CLI security boundary',
  agent: {
    name: 'higgsfield-runtime-architect',
    prompt: {
      role: 'principal TypeScript, Electron, and provider-platform architect',
      task: 'Trace the live Higgsfield paths and write docs/architecture/higgsfield-provider-boundary.md.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        preflightVerbatim: args.preflight,
      },
      instructions: [
        'Treat the Beads specification as authoritative and the six cloud RFC drafts as explicitly unapproved.',
        'Document exact current entry points, process execution, catalog sync, result normalization, and compatibility constraints with file and line references.',
        'Define stable provider, operation, policy, request, result, cancellation, output-limit, safe-environment, and idempotency contracts without selecting local-versus-cloud topology.',
        'Represent the full installed CLI surface, including capabilities that remain gated, deferred, or prohibited; do not reduce Higgsfield to image and video generation.',
        'Forbid auth token, arbitrary command pass-through, shell string construction, raw error output, raw credentials, repository/database/secret administration, and direct publishing.',
        'Record that CLI cancellation stops the local wait/process tree only and must never claim the paid remote job was cancelled. Record that ambiguous create failures are not automatically retried and durable idempotency remains parent scope.',
        'Write only docs/architecture/higgsfield-provider-boundary.md. Do not edit source, tests, Beads, or any unapproved RFC draft.',
      ],
      outputFormat: 'JSON with filesModified, runtimeCallPaths, operationGroups, securityConstraints, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'runtimeCallPaths', 'operationGroups', 'securityConstraints', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        operationGroups: { type: 'array', items: { type: 'string' } },
        securityConstraints: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'brownfield', 'security-boundary'],
}))

const readBoundaryTask = defineTask('read-higgsfield-provider-boundary', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read the provider boundary verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && cat docs/architecture/higgsfield-provider-boundary.md`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['frozen-input', 'runtime-read', 'spec'],
}))

const authorTestsTask = defineTask('author-higgsfield-provider-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author provider contract and local CLI adapter tests before implementation',
  agent: {
    name: 'higgsfield-contract-test-author',
    prompt: {
      role: 'senior TypeScript contract and security testing engineer',
      task: `Author exactly these tests before implementation: ${testPaths.join(', ')}.`,
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
      },
      instructions: [
        'Do not read files under src/, electron/, or any implementation directory. Author tests strictly from the verbatim specifications above.',
        'Import the planned public contracts from src/platform/generation/provider, src/platform/generation/browserGenerationProvider, electron/catalog/higgsfieldProviderManifest, and electron/catalog/higgsfieldProviderAdapter; these modules intentionally do not exist yet.',
        'Freeze the complete documented CLI operation inventory and stable IDs, execution modes, exposure policy, and schema-bearing manifest shape.',
        'Cover typed allowlisting, argv-array construction through an injected executor, no auth token or arbitrary pass-through, no shell interpolation, browser unsupported behavior, stable idempotency metadata, cancellation, safe environment, bounded output, and fail-closed error normalization.',
        'Include hostile argv cases for semicolons, command substitution, backticks, newlines, leading flags, traversal, and Unicode separators. Prove ambiguous create failures are not automatically retried.',
        'Prove cancellation preserves any known remote job ID and reports only local wait cancellation, never remote provider cancellation.',
        'Use hostile fixtures containing API keys, Bearer tokens, cookies, session values, URL credentials, Unix paths, Windows paths, nested causes, and throwing objects. No hostile value may appear in public results or diagnostics.',
        'Cover compatibility with existing status/catalog/model/workflow generation semantics without invoking the network or the real CLI.',
        'Do not create or edit implementation files, existing tests, Beads, or any unapproved RFC draft.',
      ],
      outputFormat: 'JSON with filesModified, testCases, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'testCases', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        testCases: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'contract-tests', 'security-tests', 'test-first'],
}))

const redGateTask = defineTask('verify-higgsfield-provider-tests-red', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prove frozen provider tests fail before implementation',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `for file in ${testPaths.map(quote).join(' ')}; do test -s "$file"; done`,
      `set +e; pnpm exec vitest run ${testPaths.map(quote).join(' ')}; code=$?; set -e; test "$code" -ne 0`,
      "echo 'RED state confirmed before implementation'",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['red-green-refactor', 'shell', 'test-first'],
}))

const hashTestsTask = defineTask('freeze-higgsfield-provider-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze provider test checksums',
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${testPaths.map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['evidence', 'frozen-input', 'shell'],
}))

const readTestsTask = defineTask('read-frozen-higgsfield-provider-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read frozen provider tests verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && for file in ${testPaths.map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['frozen-input', 'runtime-read', 'tests'],
}))

const implementTask = defineTask('implement-higgsfield-provider', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the provider manifest and safe local CLI adapter',
  agent: {
    name: 'higgsfield-provider-implementer',
    prompt: {
      role: 'staff TypeScript, Electron, and secure process-execution engineer',
      task: 'Implement the frozen runtime-neutral provider contract and typed local Higgsfield CLI adapter.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
        frozenTestsVerbatim: args.tests,
      },
      instructions: [
        'Read existing live-path files before editing and preserve current Electron status, catalog sync, model/workflow generation, payload, and error behavior.',
        'Do not edit frozen tests, the provider-boundary document, Beads, or any unapproved RFC draft.',
        `Write only these implementation paths: ${implementationPaths.join(', ')}. Do not add dependencies.`,
        'Expose a versioned runtime-neutral manifest and typed request/result contracts; keep all transport and process details adapter-private.',
        'Use an injected executor accepting an executable plus argv array, a minimal safe environment, AbortSignal, timeout, and output byte cap. Never use a shell, concatenate a command string, invoke auth token, or provide arbitrary command pass-through.',
        'Include the complete documented CLI operation inventory with explicit enabled, gated, deferred, or prohibited policy. Product-gated and prohibited operations must fail before executor invocation.',
        'Remove raw Higgsfield stdout/stderr from the current renderer-facing process result and normalize all expected failures into stable fail-closed codes without credentials, paths, URLs with credentials, argv, or Error causes.',
        'Preserve any known remote job ID when local waiting is aborted, but never claim remote cancellation. Do not automatically retry an ambiguous side-effecting create. Treat idempotency as caller-ledger metadata until the parent durable-job milestone.',
        'Do not inherit the full process environment into the CLI. Keep only the minimal variables needed for executable resolution, user config, locale, and platform behavior, and enforce bounded stdout/stderr collection.',
        'Do not add a cloud SDK, worker, queue, database, migration, remote credential, cloud provider assumption, UI exposure, or publishing action.',
        'Run focused tests while working, but never weaken or rewrite a frozen test.',
      ],
      outputFormat: 'JSON with filesModified, behaviorPreserved, securityDecisions, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'behaviorPreserved', 'securityDecisions', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        behaviorPreserved: { type: 'array', items: { type: 'string' } },
        securityDecisions: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'implementation', 'security', 'higgsfield'],
}))

const verifyFrozenTask = defineTask('verify-higgsfield-provider-frozen-inputs', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify tests and unapproved RFC drafts remain frozen',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `currentTests=$(shasum -a 256 ${testPaths.map(quote).join(' ')})`,
      `test "$currentTests" = ${quote(args.testHashes.trim())}`,
      `currentDrafts=$(shasum -a 256 ${protectedDrafts.map(quote).join(' ')})`,
      `test "$currentDrafts" = ${quote(args.draftHashes.trim())}`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['architecture-unapproved', 'evidence', 'frozen-input', 'shell'],
}))

const focusedGateTask = defineTask('run-higgsfield-provider-focused-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run provider, security, compatibility, and type gates',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `pnpm exec vitest run ${testPaths.map(quote).join(' ')} electron/catalog/higgsfieldCodec.test.ts electron/catalog/processOperation.test.ts electron/runtime.higgsfield-process.test.ts`,
      'pnpm run typecheck',
      `if rg -n "child_process\\.(exec|execSync)|shell\\s*:\\s*true" ${implementationPaths.map(quote).join(' ')}; then echo 'Unsafe shell execution primitive found'; exit 1; fi`,
      `if rg -n "@supabase|@vercel|firebase|aws-sdk|process\\.env\\.(SUPABASE|VERCEL|AWS)" ${implementationPaths.map(quote).join(' ')}; then echo 'Unapproved cloud coupling found'; exit 1; fi`,
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['compatibility', 'contract-tests', 'gate', 'security', 'shell', 'typecheck'],
}))

const readReviewEvidenceTask = defineTask('read-higgsfield-provider-review-evidence', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read provider artifacts and scoped diff verbatim',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `for file in docs/architecture/higgsfield-provider-boundary.md ${implementationPaths.concat(testPaths).map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
      "printf '\\n--- SCOPED DIFF ---\\n'",
      `git diff -- docs/architecture/higgsfield-provider-boundary.md ${implementationPaths.concat(testPaths).map(quote).join(' ')}`,
      "printf '\\n--- STATUS ---\\n'",
      'git status --short',
      "printf '\\n--- OFFICIAL OBSERVED RED EFFECT ---\\n'",
      `printf '%s\\n' ${quote(args.redEvidence)}`,
      "printf '\\n--- FROZEN TEST HASH BASELINE ---\\n'",
      `printf '%s\\n' ${quote(args.testHashes)}`,
      "printf '\\n--- PROTECTED RFC HASH BASELINE ---\\n'",
      `printf '%s\\n' ${quote(args.draftHashes)}`,
      "printf '\\n--- LATEST FROZEN-INPUT EFFECT ---\\n'",
      `printf '%s\\n' ${quote(args.frozenEvidence)}`,
      "printf '\\n--- LATEST FOCUSED-GATE EFFECT ---\\n'",
      `printf '%s\\n' ${quote(args.focusedGateEvidence)}`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['artifacts', 'review', 'runtime-read', 'shell'],
}))

const reviewTask = defineTask('review-higgsfield-provider-v2', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independently review the provider boundary and CLI adapter',
  agent: {
    name: 'independent-higgsfield-security-reviewer',
    prompt: {
      role: 'independent staff TypeScript engineer and application security reviewer',
      task: 'Review every requirement against the implementation. Do not edit files.',
      context: {
        specVerbatim: args.spec,
        artifactsVerbatim: args.artifacts,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative about how ARTIFACTS were built.',
        'Fail on scope reduction, changed frozen tests, incomplete CLI inventory, unstable IDs, product-gated execution, auth token exposure, arbitrary pass-through, shell interpolation, full environment inheritance, unbounded output, automatic retry after ambiguous create, false remote-cancellation claims, missing cancellation/idempotency metadata, secret/path/raw-error leakage, browser import hazards, Electron behavior drift, or cloud-vendor coupling.',
        'Distinguish blockers from parent generation-gateway work and owner-approved product surfaces that intentionally remain pending.',
        'Return exact file and line references for every blocker.',
      ],
      outputFormat: 'JSON with passed, score, blockers, risks, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'blockers', 'risks', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number' },
        blockers: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'independent-review', 'quality-gate', 'security'],
}))

const remediateTask = defineTask('remediate-higgsfield-provider-v2', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate independent provider review blockers',
  agent: {
    name: 'higgsfield-provider-remediator',
    prompt: {
      role: 'staff TypeScript and Electron security maintainer',
      task: 'Fix every independent-review blocker without changing scope or frozen evidence.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        reviewVerbatim: args.review,
        artifactsVerbatim: args.artifacts,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly before editing.',
        'Do not edit frozen tests, Beads, provider-boundary documentation, or unapproved RFC drafts.',
        `Change only these implementation paths: ${implementationPaths.join(', ')}.`,
        'Do not broaden product exposure, add cloud coupling, or weaken a security gate.',
        'Run focused tests and report every file changed.',
      ],
      outputFormat: 'JSON with filesModified, blockersResolved, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'blockersResolved', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        blockersResolved: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'refinement', 'remediation', 'security'],
}))

const fullGatesTask = defineTask('run-higgsfield-provider-full-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run complete repository gates',
  shell: {
    command: `cd ${quote(args.projectRoot)} && pnpm run gates`,
    expectedExitCode: 0,
    timeoutMs: 1800000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['build', 'full-suite', 'gate', 'shell'],
}))

const versionTask = defineTask('version-higgsfield-provider', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit the reviewed reversible provider milestone',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `git add docs/architecture/higgsfield-provider-boundary.md ${implementationPaths.concat(testPaths).map(quote).join(' ')}`,
      'git diff --cached --check',
      "git diff --cached --quiet && { echo 'No Higgsfield provider changes to commit'; exit 1; } || true",
      "git commit -m 'feat: add safe Higgsfield provider contracts'",
      'git rev-parse HEAD',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['commit', 'evidence', 'git', 'shell'],
}))

const closeBeadTask = defineTask('close-higgsfield-provider-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record provider milestone evidence in Beads',
  shell: {
    command: `cd ${quote(args.projectRoot)} && sha=$(git rev-parse HEAD) && bd update ${quote(args.beadId)} --append-notes "Runtime-neutral Higgsfield provider manifest and safe local CLI adapter passed frozen contract/security tests, existing Electron compatibility tests, full repository gates, and independent review score ${args.score}. Versioned at local commit $sha. evmedia-r20.7 remains open for authorized durable jobs; cloud credentials and owner-gated product/publishing surfaces remain unapproved and unimplemented." --status closed && bd show ${quote(args.beadId)}`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['beads', 'evidence', 'milestone', 'shell'],
}))

export async function process(inputs, ctx) {
  const projectRoot = inputs.projectRoot
  const beadId = inputs.beadId || 'evmedia-r20.7.1'

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId })
  const preflight = await ctx.task(preflightTask, { projectRoot })
  const draftHashes = await ctx.task(hashProtectedDraftsTask, { projectRoot })

  await ctx.task(boundaryTask, {
    projectRoot,
    spec: spec.stdout,
    preflight: preflight.stdout,
  })
  const boundary = await ctx.task(readBoundaryTask, { projectRoot })

  await ctx.task(authorTestsTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
  })
  const redGate = await ctx.task(redGateTask, { projectRoot })
  const testHashes = await ctx.task(hashTestsTask, { projectRoot })
  const tests = await ctx.task(readTestsTask, { projectRoot })

  await ctx.task(implementTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
    tests: tests.stdout,
  })
  let frozenVerification = await ctx.task(verifyFrozenTask, {
    projectRoot,
    testHashes: testHashes.stdout,
    draftHashes: draftHashes.stdout,
  })
  let focusedGate = await ctx.task(focusedGateTask, { projectRoot })

  let review = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const artifacts = await ctx.task(readReviewEvidenceTask, {
      projectRoot,
      redEvidence: JSON.stringify(redGate),
      testHashes: testHashes.stdout,
      draftHashes: draftHashes.stdout,
      frozenEvidence: JSON.stringify(frozenVerification),
      focusedGateEvidence: JSON.stringify(focusedGate),
    })
    review = await ctx.task(reviewTask, {
      spec: spec.stdout,
      artifacts: artifacts.stdout,
    })
    if (review.passed) break
    await ctx.task(remediateTask, {
      projectRoot,
      spec: spec.stdout,
      review: JSON.stringify(review),
      artifacts: artifacts.stdout,
    })
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: testHashes.stdout,
      draftHashes: draftHashes.stdout,
    })
    focusedGate = await ctx.task(focusedGateTask, { projectRoot })
  }

  if (!review || !review.passed) {
    return { success: false, beadId, review, reason: 'Independent review blockers remain after three attempts' }
  }

  await ctx.task(fullGatesTask, { projectRoot })
  const version = await ctx.task(versionTask, { projectRoot })
  await ctx.task(closeBeadTask, { projectRoot, beadId, score: review.score })

  return {
    success: true,
    beadId,
    review,
    commit: version.stdout.trim().split('\\n').at(-1),
    parentStillPending: ['evmedia-r20.7', 'evmedia-r20'],
    approvalsStillPending: ['cloud Higgsfield credentials', 'Soul', 'Marketing Studio', 'product pipelines', 'website/game publishing'],
  }
}
