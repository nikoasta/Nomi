/**
 * @process everville-media-platform-rfc
 * @description Brownfield architecture milestone for the Everville Media Platform Alpha.
 * @inputs { projectRoot: string, beadId: string, rfcPath: string }
 * @outputs { success: boolean, beadId: string, rfcPath: string, review: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readSpecTask = defineTask('read-beads-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.beadId} specification`,
  shell: {
    command: `cd '${args.projectRoot}' && bd show '${args.beadId}'`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['beads', 'spec', 'runtime-read'],
}));

const readProductContextTask = defineTask('read-product-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read product and orchestration context',
  shell: {
    command: [
      `cd '${args.projectRoot}'`,
      "printf '%s\\n' '--- WORKFLOW ---'",
      "cat docs/product/2026-07-16-everville-media-portal-workflow-draft.md",
      "printf '%s\\n' '--- HANDOFF ---'",
      "cat .codex/handoff.md",
      "printf '%s\\n' '--- PROJECT INDEX ---'",
      "cat .codex/project-index.md",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['context', 'runtime-read'],
}));

const reuseAuditTask = defineTask('reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Audit reusable Nomi infrastructure',
  shell: {
    command: [
      `cd '${args.projectRoot}'`,
      "printf '%s\\n' '--- PACKAGE CAPABILITIES ---'",
      "node -e \"const p=require('./package.json'); console.log(JSON.stringify({dependencies:p.dependencies,scripts:p.scripts},null,2))\"",
      "printf '%s\\n' '--- RUNTIME BOUNDARIES ---'",
      "rg -n 'nomiDesktop|desktopBridge|PlatformClient|workspaceProject|projectStorage|assetUpload|eventLog|capabilityCore' src electron --glob '*.{ts,tsx}' | head -500",
      "printf '%s\\n' '--- CLOUD BACKEND SURFACES ---'",
      "(rg --files | rg '(^|/)(supabase|migrations|server|workers?|api)(/|$)|vercel\\.json|Dockerfile' || true)",
      "printf '%s\\n' '--- CLOUD SDK AND ENV USAGE ---'",
      "(rg -n 'Supabase|Postgres|Drizzle|Prisma|process\\.env|import\\.meta\\.env' src electron package.json --glob '*.{ts,tsx,json}' || true) | head -400",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['architecture', 'brownfield', 'reuse-audit'],
}));

const acceptanceMatrixTask = defineTask('author-acceptance-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Freeze RFC acceptance matrix before architecture drafting',
  agent: {
    name: 'spec-verifier',
    prompt: {
      role: 'principal QA architect',
      task: `Create ${args.outputPath} as a test-first acceptance matrix for the RFC milestone.`,
      context: {
        projectRoot: args.projectRoot,
        outputPath: args.outputPath,
        specVerbatim: args.spec,
        productContextVerbatim: args.productContext,
      },
      instructions: [
        'Do not read src/, electron/, or any implementation directory.',
        'Derive every requirement only from the verbatim Beads spec and product context.',
        'For each requirement record required RFC evidence, deterministic check where possible, and reviewer decision rule.',
        'Include explicit rows for runtime paths, boundaries, data, tenancy, auth, assets, jobs, Higgsfield, collaboration, knowledge, deployment, migration, rollback, security, observability, costs, verification, pilot readiness, and upstream pullability.',
        'Write the Markdown file directly and return its path and row count.',
      ],
      outputFormat: 'JSON with filesModified, rowCount, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'rowCount', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        rowCount: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['acceptance', 'agent', 'test-first'],
}));

function researchTask(id, title, role, outputPath, instructions) {
  return defineTask(id, (args, taskCtx) => ({
    kind: 'agent',
    title,
    agent: {
      name: id,
      prompt: {
        role,
        task: `Research the live repository and write ${outputPath}.`,
        context: {
          projectRoot: args.projectRoot,
          specVerbatim: args.spec,
          reuseAuditVerbatim: args.reuseAudit,
          productContextVerbatim: args.productContext,
        },
        instructions: [
          ...instructions,
          'Cite exact repository paths and line numbers for code claims.',
          'Separate confirmed evidence, inference, recommendation, and unresolved owner decision.',
          'Write the Markdown artifact directly and return the modified path plus a concise summary.',
        ],
        outputFormat: 'JSON with filesModified, summary, decisions, risks',
      },
      outputSchema: {
        type: 'object',
        required: ['filesModified', 'summary', 'decisions', 'risks'],
        properties: {
          filesModified: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
          decisions: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['agent', 'architecture', 'research'],
  }));
}

const runtimeResearchTask = researchTask(
  'runtime-path-audit',
  'Trace live Nomi runtime and persistence paths',
  'principal brownfield software architect',
  'docs/architecture/everville-media-platform-runtime-audit.md',
  [
    'Trace browser entry points through renderer state, desktop bridge, Electron IPC, workspace repositories, assets, generation, events, and export.',
    'Identify direct Electron coupling that blocks browser operation and reusable seams that should become PlatformClient contracts.',
    'Do not propose changing files that are not on a confirmed live call path.',
  ],
);

const cloudResearchTask = researchTask(
  'cloud-stack-analysis',
  'Compare cloud architecture candidates',
  'principal cloud and SaaS architect',
  'docs/architecture/everville-media-platform-cloud-options.md',
  [
    'Compare at minimum Vercel+Supabase, a self-hosted TypeScript/Postgres stack, and one credible managed alternative.',
    'Use current primary vendor documentation for claims that may have changed.',
    'Evaluate auth/RLS, Postgres, object storage, realtime collaboration, queues/workers, signed media, FFmpeg, Higgsfield secrets, regional constraints, cost, lock-in, backups, observability, and Electron compatibility.',
    'Recommend one Alpha stack and one exit strategy, but keep the choice explicitly unapproved.',
  ],
);

const securityResearchTask = researchTask(
  'security-data-analysis',
  'Design tenancy, provenance, and knowledge security boundaries',
  'principal application security and data architect',
  'docs/architecture/everville-media-platform-security-data.md',
  [
    'Threat-model browser, API, worker, provider, object-storage, Electron, Dropbox/Atlas, and everville-core trust boundaries.',
    'Define organization/project authorization invariants, server-only secret handling, content classifications, audit/provenance records, retention, backup, and rollback requirements.',
    'Make publication blocking and confirmed-versus-candidate knowledge rules enforceable in the data model.',
  ],
);

const decisionBriefTask = defineTask('architecture-decision-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare architecture decision brief',
  agent: {
    name: 'architecture-chair',
    prompt: {
      role: 'staff-plus architecture review chair',
      task: `Write ${args.outputPath} for owner review without treating any option as approved.`,
      context: {
        specVerbatim: args.spec,
        acceptanceMatrixVerbatim: args.acceptanceMatrix,
        researchArtifactsVerbatim: args.researchArtifacts,
      },
      instructions: [
        'Compare evidence against the frozen acceptance matrix.',
        'Recommend the smallest architecture that reaches the full Alpha outcome without replacing the Nomi workbench.',
        'List consequential decisions, alternatives, costs, failure modes, migration path, rollback, and exact unresolved owner questions.',
        'Write the Markdown artifact directly.',
      ],
      outputFormat: 'JSON with filesModified, recommendation, unresolvedDecisions, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'recommendation', 'unresolvedDecisions', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        unresolvedDecisions: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'architecture', 'decision'],
}));

const authorRfcTask = defineTask('author-rfc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author Everville Media Platform RFC',
  agent: {
    name: 'rfc-author',
    prompt: {
      role: 'principal software architect and RFC author',
      task: `Write or refine ${args.rfcPath}.`,
      context: {
        ownerDecisionVerbatim: args.ownerDecision,
        specVerbatim: args.spec,
        acceptanceMatrixVerbatim: args.acceptanceMatrix,
        researchArtifactsVerbatim: args.researchArtifacts,
        currentRfcVerbatim: args.currentRfc || '',
        reviewFeedbackVerbatim: args.reviewFeedback || '',
      },
      instructions: [
        'Honor the owner decision exactly; do not silently approve or replace it.',
        'Cover every row in the frozen acceptance matrix and map decisions to downstream Beads issues.',
        'Include current runtime call paths, target component diagram in Mermaid, repository boundaries, data model, API/PlatformClient contracts, security, storage, jobs, collaboration, knowledge, deployment, migration stages, rollback, observability, cost guardrails, verification, pilot, and upstream-sync strategy.',
        'Mark unresolved items explicitly and never present an inference as confirmed repository evidence.',
        'Write the RFC directly and return the modified path.',
      ],
      outputFormat: 'JSON with filesModified, decisionsRecorded, unresolvedItems, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'decisionsRecorded', 'unresolvedItems', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        decisionsRecorded: { type: 'array', items: { type: 'string' } },
        unresolvedItems: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'architecture', 'rfc'],
}));

const verifyRfcTask = defineTask('verify-rfc', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run deterministic RFC gates',
  shell: {
    command: [
      `cd '${args.projectRoot}'`,
      `test -s '${args.rfcPath}'`,
      `for heading in 'Runtime Call Paths' 'Target Architecture' 'Repository Boundaries' 'Data Model' 'Security' 'Asset Storage' 'Generation Jobs' 'Higgsfield' 'Collaboration' 'Knowledge Packs' 'Deployment' 'Migration' 'Rollback' 'Observability' 'Cost' 'Verification' 'Pilot' 'Upstream'; do rg -qi "$heading" '${args.rfcPath}' || { echo "Missing RFC coverage: $heading"; exit 1; }; done`,
      "scripts/orchestration/run_process_verification.sh",
      "git diff --check",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['documentation', 'gate', 'shell'],
}));

const reviewRfcTask = defineTask('review-rfc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independently review RFC against frozen acceptance',
  agent: {
    name: 'independent-rfc-reviewer',
    prompt: {
      role: 'independent principal architecture reviewer',
      task: 'Review the RFC requirement by requirement. Do not edit it.',
      context: {
        specVerbatim: args.spec,
        acceptanceMatrixVerbatim: args.acceptanceMatrix,
        artifactsVerbatim: args.artifacts,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Fail on missing evidence, hidden scope reduction, unapproved decisions, unsafe secret handling, unverifiable migration/rollback, or broken upstream pullability.',
        'Return blockers with exact RFC sections and acceptance rows.',
      ],
      outputFormat: 'JSON with passed, score, blockers, gaps, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'blockers', 'gaps', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number' },
        blockers: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'independent-review', 'quality-gate'],
}));

const readArtifactsTask = defineTask('read-rfc-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read architecture artifacts verbatim',
  shell: {
    command: `cd '${args.projectRoot}' && for file in docs/architecture/everville-media-platform-acceptance-matrix.md docs/architecture/everville-media-platform-runtime-audit.md docs/architecture/everville-media-platform-cloud-options.md docs/architecture/everville-media-platform-security-data.md docs/architecture/everville-media-platform-decision-brief.md '${args.rfcPath}'; do if [ -f "$file" ]; then printf '\\n--- %s ---\\n' "$file"; cat "$file"; fi; done`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['artifacts', 'runtime-read'],
}));

export async function process(inputs, ctx) {
  const projectRoot = inputs.projectRoot;
  const beadId = inputs.beadId || 'evmedia-r20.4';
  const rfcPath = inputs.rfcPath || 'docs/architecture/everville-media-platform-rfc.md';
  const acceptancePath = 'docs/architecture/everville-media-platform-acceptance-matrix.md';

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId });
  const productContext = await ctx.task(readProductContextTask, { projectRoot });
  const reuseAudit = await ctx.task(reuseAuditTask, { projectRoot });

  await ctx.task(acceptanceMatrixTask, {
    projectRoot,
    outputPath: acceptancePath,
    spec: spec.stdout,
    productContext: productContext.stdout,
  });

  const [runtimeResearch, cloudResearch, securityResearch] = await ctx.parallel.all([
    () => ctx.task(runtimeResearchTask, { projectRoot, spec: spec.stdout, reuseAudit: reuseAudit.stdout, productContext: productContext.stdout }),
    () => ctx.task(cloudResearchTask, { projectRoot, spec: spec.stdout, reuseAudit: reuseAudit.stdout, productContext: productContext.stdout }),
    () => ctx.task(securityResearchTask, { projectRoot, spec: spec.stdout, reuseAudit: reuseAudit.stdout, productContext: productContext.stdout }),
  ]);

  const researchArtifacts = await ctx.task(readArtifactsTask, { projectRoot, rfcPath: '/dev/null' });
  const decision = await ctx.task(decisionBriefTask, {
    outputPath: 'docs/architecture/everville-media-platform-decision-brief.md',
    spec: spec.stdout,
    acceptanceMatrix: researchArtifacts.stdout,
    researchArtifacts: researchArtifacts.stdout,
    runtimeResearch,
    cloudResearch,
    securityResearch,
  });

  const architectureApproval = await ctx.breakpoint({
    title: 'Everville Alpha architecture decision',
    question: 'Review the evidence and explicitly approve the architecture for the RFC. The recommendation is not accepted by default.',
    context: {
      runId: ctx.runId,
      recommendation: decision.recommendation,
      unresolvedDecisions: decision.unresolvedDecisions,
      files: [
        { path: 'docs/architecture/everville-media-platform-decision-brief.md', format: 'markdown' },
        { path: 'docs/architecture/everville-media-platform-cloud-options.md', format: 'markdown' },
        { path: 'docs/architecture/everville-media-platform-security-data.md', format: 'markdown' },
      ],
    },
    expert: 'owner',
    tags: ['architecture', 'approval-gate'],
  });

  if (!architectureApproval.approved) {
    return { success: false, beadId, rfcPath, reason: 'Architecture was not approved', feedback: architectureApproval.response };
  }

  let currentRfc = '';
  let review = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const artifactsBeforeAuthor = await ctx.task(readArtifactsTask, { projectRoot, rfcPath: currentRfc ? rfcPath : '/dev/null' });
    await ctx.task(authorRfcTask, {
      rfcPath,
      ownerDecision: architectureApproval.response || decision.recommendation,
      spec: spec.stdout,
      acceptanceMatrix: artifactsBeforeAuthor.stdout,
      researchArtifacts: artifactsBeforeAuthor.stdout,
      currentRfc,
      reviewFeedback: review ? JSON.stringify(review) : '',
    });

    await ctx.task(verifyRfcTask, { projectRoot, rfcPath });
    const reviewArtifacts = await ctx.task(readArtifactsTask, { projectRoot, rfcPath });
    currentRfc = reviewArtifacts.stdout;
    review = await ctx.task(reviewRfcTask, {
      spec: spec.stdout,
      acceptanceMatrix: reviewArtifacts.stdout,
      artifacts: reviewArtifacts.stdout,
    });
    if (review.passed) break;
  }

  if (!review || !review.passed) {
    return { success: false, beadId, rfcPath, review, reason: 'RFC did not pass independent review' };
  }

  const finalApproval = await ctx.breakpoint({
    title: 'Approve Everville Media Platform RFC',
    question: `RFC passed deterministic gates and independent review with score ${review.score}. Approve it as the implementation contract for downstream Beads milestones?`,
    context: {
      runId: ctx.runId,
      review,
      files: [
        { path: rfcPath, format: 'markdown' },
        { path: acceptancePath, format: 'markdown' },
      ],
    },
    expert: 'owner',
    tags: ['architecture', 'final-approval'],
  });

  return {
    success: finalApproval.approved === true,
    beadId,
    rfcPath,
    review,
    ownerApproval: finalApproval.response,
  };
}
