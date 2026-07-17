/**
 * @process everville-platform-client
 * @description Reversible brownfield PlatformClient milestone for Electron and browser runtimes.
 * @inputs { projectRoot: string, beadId: string }
 * @outputs { success: boolean, beadId: string, review: object, commit: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk'

const selectedPaths = ['src/workbench/ai/conversationPersistence.ts', 'src/workbench/api/assetUploadApi.ts']

const testPaths = ['src/platform/platformClient.contract.test.ts', 'src/platform/platformClient.boundary.test.ts']

function quote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

const readSpecTask = defineTask('read-platform-client-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.beadId} specification verbatim`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && bd show ${quote(args.beadId)} && printf '\\n--- PARENT ---\\n' && bd show evmedia-r20.2 && printf '\\n--- RFC STATE ---\\n' && bd show evmedia-r20.4`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['beads', 'runtime-read', 'spec'],
}))

const preflightTask = defineTask('platform-client-preflight', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace live desktop bridge call paths and check planned paths',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      "printf '%s\\n' '--- EXACT PATH COLLISION CHECK ---'",
      'for path in src/platform/client.ts src/platform/electronPlatformClient.ts src/platform/browserPlatformClient.ts src/platform/platformClient.contract.test.ts src/platform/platformClient.boundary.test.ts docs/architecture/platform-client-runtime-boundary.md; do if [ -e "$path" ]; then echo "EXISTS $path"; else echo "NEW $path"; fi; done',
      "printf '%s\\n' '--- LIVE BRIDGE REFERENCES ---'",
      "rg -n 'getDesktopBridge|window\\.nomiDesktop' src electron --glob '*.{ts,tsx}'",
      "printf '%s\\n' '--- SELECTED CALL PATHS ---'",
      `for path in ${selectedPaths.map(quote).join(' ')}; do echo "--- $path ---"; sed -n '1,260p' "$path"; done`,
      "printf '%s\\n' '--- BRIDGE TYPES ---'",
      "sed -n '1,760p' src/desktop/bridge.ts",
      "printf '%s\\n' '--- TEST CONVENTIONS ---'",
      "sed -n '1,220p' src/workbench/export/exportApi.test.ts",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['brownfield', 'runtime-call-path', 'reuse-audit', 'shell'],
}))

const runtimeAnalysisTask = defineTask('analyze-platform-runtime-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document the reversible PlatformClient boundary',
  agent: {
    name: 'brownfield-runtime-architect',
    prompt: {
      role: 'principal TypeScript and Electron brownfield architect',
      task: 'Trace the selected live runtime paths and write docs/architecture/platform-client-runtime-boundary.md.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        preflightVerbatim: args.preflight,
      },
      instructions: [
        'Treat the Beads spec as authoritative and the cloud RFC as explicitly unapproved.',
        'Document current entry points, selected call paths, bridge methods used, error behavior, and compatibility constraints with exact file and line references.',
        'Define the smallest vendor-neutral capability boundary needed by conversations and asset import. Keep the contract extensible for later project, export, generation, and full Higgsfield capabilities without defining a cloud topology now.',
        'Record which files are confirmed live and which direct bridge call sites are intentionally out of scope for this reversible slice.',
        'Do not edit source or tests. Write only the runtime-boundary document.',
      ],
      outputFormat: 'JSON with filesModified, runtimeCallPaths, constraints, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'runtimeCallPaths', 'constraints', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'brownfield', 'runtime-call-path'],
}))

const authorTestsTask = defineTask('author-platform-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author PlatformClient contract tests before implementation',
  agent: {
    name: 'contract-test-author',
    prompt: {
      role: 'senior contract-testing engineer',
      task: `Author ${testPaths.join(' and ')} strictly from the specification below.`,
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
      },
      instructions: [
        'Do not read files under src/, electron/, or other implementation directories. Author tests strictly from the spec text above.',
        'Import the public API from ./client, ./electronPlatformClient, and ./browserPlatformClient; these modules intentionally do not exist yet.',
        'Freeze conformance behavior for capability discovery, typed unsupported-capability failures, browser safety when window.nomiDesktop is absent, and Electron delegation for conversations and asset import.',
        'Add boundary assertions that the two selected live call paths import PlatformClient accessors and do not import getDesktopBridge.',
        'Use Vitest and deterministic in-memory fakes. Do not use snapshots, network access, timers, or cloud vendor names as implementation dependencies.',
        'Do not create or edit implementation files. Return the exact test files written.',
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
  labels: ['agent', 'contract-tests', 'test-first'],
}))

const redGateTask = defineTask('verify-platform-tests-red', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prove the frozen contract tests fail before implementation',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `test -s ${quote(testPaths[0])} && test -s ${quote(testPaths[1])}`,
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

const hashTestsTask = defineTask('freeze-platform-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze contract-test checksums',
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

const implementTask = defineTask('implement-platform-client', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement vendor-neutral PlatformClient adapters',
  agent: {
    name: 'platform-client-implementer',
    prompt: {
      role: 'staff TypeScript and Electron engineer',
      task: 'Implement the frozen PlatformClient contract and migrate only the selected live call paths.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        runtimeBoundaryVerbatim: args.runtimeBoundary,
        frozenTestsVerbatim: args.tests,
      },
      instructions: [
        'Read the existing files before editing and preserve their behavior, public signatures, and error semantics.',
        'Do not edit the two frozen test files or the runtime-boundary document.',
        'Implement src/platform/client.ts, src/platform/electronPlatformClient.ts, and src/platform/browserPlatformClient.ts, plus narrowly-scoped helper files only when justified.',
        `Migrate only ${selectedPaths.join(' and ')} behind the PlatformClient accessor in this slice.`,
        'The browser adapter must be import-safe without window or window.nomiDesktop and return typed unsupported-capability errors.',
        'The Electron adapter must delegate to the existing DesktopBridge rather than duplicate IPC or alter preload/main-process contracts.',
        'Do not add cloud SDKs, migrations, production secrets, provider-specific types, Vercel assumptions, or Supabase assumptions.',
        'Keep extension points capable of representing later local Higgsfield CLI and remote generation capabilities without implementing either in this milestone.',
        'Run focused tests while working, but never weaken or rewrite a failing frozen test.',
      ],
      outputFormat: 'JSON with filesModified, behaviorPreserved, decisions, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'behaviorPreserved', 'decisions', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        behaviorPreserved: { type: 'array', items: { type: 'string' } },
        decisions: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'implementation', 'platform-client'],
}))

const verifyFrozenTestsTask = defineTask('verify-platform-tests-frozen', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify implementation did not rewrite frozen tests',
  shell: {
    command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${testPaths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())}`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['evidence', 'frozen-input', 'shell'],
}))

const focusedGateTask = defineTask('run-platform-focused-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run PlatformClient focused gates',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `pnpm exec vitest run ${testPaths.map(quote).join(' ')} src/workbench/ai/conversationPersistence.test.ts src/workbench/api/assetUploadApi.test.ts`,
      'pnpm run typecheck',
      `for path in ${selectedPaths.map(quote).join(' ')}; do if rg -n "getDesktopBridge|window\\.nomiDesktop" "$path"; then echo "Direct desktop coupling remains in $path"; exit 1; fi; done`,
      'if rg -n "from [\'\\"](@supabase|@vercel|firebase|aws-sdk)|process\\.env\\.(SUPABASE|VERCEL|AWS)" src/platform; then echo \'Unapproved cloud coupling found\'; exit 1; fi',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['contract-tests', 'gate', 'shell', 'typecheck'],
}))

const readReviewEvidenceTask = defineTask('read-platform-review-evidence', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read PlatformClient artifacts and diff verbatim',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'for file in docs/architecture/platform-client-runtime-boundary.md src/platform/client.ts src/platform/electronPlatformClient.ts src/platform/browserPlatformClient.ts src/platform/platformClient.contract.test.ts src/platform/platformClient.boundary.test.ts src/workbench/ai/conversationPersistence.ts src/workbench/api/assetUploadApi.ts; do printf \'\\n--- %s ---\\n\' "$file"; cat "$file"; done',
      "printf '\\n--- DIFF ---\\n'",
      'git diff -- src/platform src/workbench/ai/conversationPersistence.ts src/workbench/api/assetUploadApi.ts docs/architecture/platform-client-runtime-boundary.md',
      "printf '\\n--- STATUS ---\\n'",
      'git status --short',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['artifacts', 'review', 'runtime-read', 'shell'],
}))

const reviewTask = defineTask('review-platform-client', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independently review PlatformClient against the frozen spec',
  agent: {
    name: 'independent-platform-reviewer',
    prompt: {
      role: 'independent staff engineer and security reviewer',
      task: 'Review the implementation requirement by requirement. Do not edit files.',
      context: {
        artifactsVerbatim: args.artifacts,
        specVerbatim: args.spec,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Fail on hidden scope reduction, tests changed after RED, browser import hazards, untyped unsupported behavior, Electron behavior drift, direct bridge access in selected paths, cloud-vendor coupling, or unproven claims.',
        'Distinguish blockers from later parent-scope work that is intentionally still waiting for architecture approval.',
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
  labels: ['agent', 'independent-review', 'quality-gate'],
}))

const remediateTask = defineTask('remediate-platform-client', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate independent PlatformClient review blockers',
  agent: {
    name: 'platform-client-remediator',
    prompt: {
      role: 'staff TypeScript maintainer',
      task: 'Fix every independent-review blocker without changing scope or frozen evidence.',
      context: {
        projectRoot: args.projectRoot,
        reviewVerbatim: args.review,
        artifactsVerbatim: args.artifacts,
        specVerbatim: args.spec,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly before editing.',
        'Do not edit the frozen tests, Beads acceptance criteria, unapproved RFC files, or runtime-boundary document.',
        'Change only files on the confirmed PlatformClient implementation paths.',
        'Do not add cloud-vendor coupling or broaden the milestone.',
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
  labels: ['agent', 'refinement', 'remediation'],
}))

const fullGatesTask = defineTask('run-platform-full-gates', (args, taskCtx) => ({
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

const versionTask = defineTask('version-platform-client', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit the reviewed reversible PlatformClient milestone',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'git add src/platform docs/architecture/platform-client-runtime-boundary.md src/workbench/ai/conversationPersistence.ts src/workbench/api/assetUploadApi.ts',
      'git diff --cached --check',
      "git diff --cached --quiet && { echo 'No PlatformClient changes to commit'; exit 1; } || true",
      "git commit -m 'feat: introduce runtime-neutral PlatformClient contracts'",
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

const closeBeadTask = defineTask('close-platform-client-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record reversible milestone evidence in Beads',
  shell: {
    command: `cd ${quote(args.projectRoot)} && sha=$(git rev-parse HEAD) && bd update ${quote(args.beadId)} --append-notes "Reversible PlatformClient slice passed frozen contract tests, full repository gates, and independent review score ${args.score}. Versioned at local commit $sha. evmedia-r20.2 and evmedia-r20.4 remain open; no cloud architecture was approved or implemented." --status closed && bd show ${quote(args.beadId)}`,
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
  const beadId = inputs.beadId || 'evmedia-r20.2.1'

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId })
  const preflight = await ctx.task(preflightTask, { projectRoot })
  const runtimeBoundary = await ctx.task(runtimeAnalysisTask, {
    projectRoot,
    spec: spec.stdout,
    preflight: preflight.stdout,
  })

  await ctx.task(authorTestsTask, { projectRoot, spec: spec.stdout })
  await ctx.task(redGateTask, { projectRoot })
  const frozenTestHashes = await ctx.task(hashTestsTask, { projectRoot })
  const frozenTests = await ctx.task(readReviewEvidenceTask, { projectRoot })

  await ctx.task(implementTask, {
    projectRoot,
    spec: spec.stdout,
    runtimeBoundary: JSON.stringify(runtimeBoundary),
    tests: frozenTests.stdout,
  })
  await ctx.task(verifyFrozenTestsTask, { projectRoot, expected: frozenTestHashes.stdout })
  await ctx.task(focusedGateTask, { projectRoot })

  let review = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const artifacts = await ctx.task(readReviewEvidenceTask, { projectRoot })
    review = await ctx.task(reviewTask, {
      spec: spec.stdout,
      artifacts: artifacts.stdout,
    })
    if (review.passed) break
    await ctx.task(remediateTask, {
      projectRoot,
      review: JSON.stringify(review),
      artifacts: artifacts.stdout,
      spec: spec.stdout,
    })
    await ctx.task(verifyFrozenTestsTask, { projectRoot, expected: frozenTestHashes.stdout })
    await ctx.task(focusedGateTask, { projectRoot })
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
    parentStillPending: ['evmedia-r20.2', 'evmedia-r20.4'],
  }
}
