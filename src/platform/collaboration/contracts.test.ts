import { describe, expect, it } from 'vitest'

import {
  PORTAL_CAPABILITIES,
  assertNoPortalSecretOrLocator,
  parseApprovalGateRecord,
  parsePortalAuditEventRecord,
  parsePortalProjectRecord,
  parsePortalProjectRevisionRecord,
  requiredApprovalGateKinds,
} from './contracts'

const CREATED_AT = '2026-07-19T13:30:00.000Z'
const DIGEST = 'a'.repeat(64)
const SCOPE = {
  organizationId: 'org-everville',
  workspaceId: 'workspace-content',
} as const

function portalProject(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'portal-project.v1',
    id: 'project-cash-on-rails',
    ...SCOPE,
    title: 'Cash on Rails',
    slug: 'cash-on-rails',
    classification: 'investor',
    status: 'draft',
    brandKitId: 'brand-everville',
    knowledgePackId: 'knowledge-pack-cash-on-rails',
    currentRevisionId: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    createdByPrincipalId: 'principal-niko',
    ...overrides,
  }
}

function projectRevision(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'portal-project-revision.v1',
    id: 'revision-001',
    ...SCOPE,
    projectId: 'project-cash-on-rails',
    revisionNumber: 1,
    snapshotDigest: DIGEST,
    parentRevisionId: null,
    createdAt: CREATED_AT,
    createdByPrincipalId: 'principal-niko',
    ...overrides,
  }
}

function approvalGate(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'approval-gate.v1',
    id: 'approval-brand-001',
    ...SCOPE,
    projectId: 'project-cash-on-rails',
    kind: 'brand-approval',
    requiredRole: 'standards-owner',
    required: true,
    decidedByPrincipalId: null,
    decision: null,
    decidedAt: null,
    assetVersionId: null,
    policySnapshotDigest: DIGEST,
    ...overrides,
  }
}

function auditEvent(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'portal-audit-event.v1',
    id: 'audit-001',
    ...SCOPE,
    projectId: 'project-cash-on-rails',
    actorPrincipalId: 'principal-niko',
    action: 'project.create',
    targetType: 'project',
    targetId: 'project-cash-on-rails',
    createdAt: CREATED_AT,
    metadata: { classification: 'investor', source: 'web-shell' },
    ...overrides,
  }
}

describe('portal collaboration contracts', () => {
  it('declares stable portal capabilities for the first corporate collaboration slice', () => {
    expect(PORTAL_CAPABILITIES).toEqual([
      'portal.projects.list',
      'portal.projects.create',
      'portal.project-revisions.save',
      'portal.project-revisions.read-current',
      'portal.review-queue.list',
      'portal.approvals.decide',
      'portal.audit-events.append',
    ])
    expect(new Set(PORTAL_CAPABILITIES).size).toBe(PORTAL_CAPABILITIES.length)
  })

  it('accepts canonical project, revision, approval, and audit records', () => {
    expect(parsePortalProjectRecord(portalProject())).toEqual(portalProject())
    expect(parsePortalProjectRevisionRecord(projectRevision())).toEqual(projectRevision())
    expect(parseApprovalGateRecord(approvalGate())).toEqual(approvalGate())
    expect(parsePortalAuditEventRecord(auditEvent())).toEqual(auditEvent())
  })

  it('keeps persisted portal records free of runtime locators and secrets', () => {
    const hostileValues = [
      { objectKey: 'campaigns/private/frame.png' },
      { url: 'https://cdn.example.test/frame.png' },
      { nested: { token: 'secret-token' } },
      { nested: ['nomi-local://asset/project/frame.png'] },
      { nested: { path: '/Users/niko.dev/secrets.json' } },
      { nested: { authorization: 'Bearer secret-token' } },
    ]

    for (const value of hostileValues) {
      expect(() => assertNoPortalSecretOrLocator(value)).toThrow(/secrets|locators/)
      expect(() => parsePortalAuditEventRecord(auditEvent({ metadata: value }))).toThrow(/secrets|locators/)
    }
  })

  it('rejects non-canonical IDs, slugs, digests, and unsafe unknown fields', () => {
    expect(() => parsePortalProjectRecord(portalProject({ id: 'https://example.test/project' }))).toThrow()
    expect(() => parsePortalProjectRecord(portalProject({ slug: 'Cash On Rails' }))).toThrow()
    expect(() => parsePortalProjectRecord(portalProject({ status: 'published' }))).toThrow()
    expect(() => parsePortalProjectRevisionRecord(projectRevision({ snapshotDigest: 'A'.repeat(64) }))).toThrow()
    expect(() => parsePortalProjectRevisionRecord(projectRevision({ revisionNumber: 0 }))).toThrow()
    expect(() => parsePortalProjectRevisionRecord(projectRevision({ extra: true }))).toThrow()
  })

  it('requires approval decisions to be recorded atomically', () => {
    expect(() =>
      parseApprovalGateRecord(
        approvalGate({
          decision: 'approved',
          decidedByPrincipalId: 'principal-standards-owner',
          decidedAt: CREATED_AT,
        }),
      ),
    ).not.toThrow()
    expect(() => parseApprovalGateRecord(approvalGate({ required: 'true' }))).toThrow(/boolean/)
    expect(() => parseApprovalGateRecord(approvalGate({ decision: 'approved' }))).toThrow(/atomic/)
    expect(() =>
      parseApprovalGateRecord(
        approvalGate({
          decision: 'approved',
          decidedByPrincipalId: 'principal-standards-owner',
          decidedAt: null,
        }),
      ),
    ).toThrow(/atomic/)
  })

  it('maps classifications to required approval gates', () => {
    expect(requiredApprovalGateKinds('internal')).toEqual(['producer-review'])
    expect(requiredApprovalGateKinds('public')).toEqual(['producer-review', 'brand-approval'])
    expect(requiredApprovalGateKinds('investor')).toEqual([
      'producer-review',
      'brand-approval',
      'legal-approval',
      'executive-approval',
    ])
    expect(requiredApprovalGateKinds('restricted')).toEqual(['producer-review', 'brand-approval', 'legal-approval'])
  })
})
