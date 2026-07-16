# Everville Media Portal Workflow

Status: Draft

Date: 2026-07-16

## Purpose

Turn Nomi into a shared Everville media-production workspace where the team
creates content under consistent brand, information-security, review, and
publishing standards.

This document captures the product workflow only. Technical architecture,
storage, collaboration, deployment, and migration decisions remain open.

## System Boundaries

- Nomi is the production workspace for campaigns, briefs, media, versions,
  review, approval, and export.
- `everville-core` is the reviewed, provenance-backed knowledge source. Nomi
  reads approved project context but does not promote new facts automatically.
- Dropbox originals and Atlas outputs remain source evidence. Generated OCR or
  candidate facts are not treated as canonical content.
- Investor, unit, and payment operations remain in their operational systems.

## Primary Roles

### Standards Owner

Owns Brand Kits, tone of voice, visual rules, templates, restricted language,
and final brand approval.

### Producer

Receives requests, creates structured briefs, selects workflows and knowledge
packs, assigns creators, manages deadlines and budgets, and routes approvals.

### Creator

Generates, edits, versions, and submits images, video, audio, copy, and final
deliverables. Creators cannot change organization standards or publish without
the required approvals.

Executive, commercial, legal, and managing-partner reviewers are conditional
approvers rather than everyday production roles.

## Content Classification

Every campaign must have one classification:

- Public
- Partner
- Investor
- Internal
- Restricted

The classification controls available knowledge, models, collaborators,
approval gates, export, and publication permissions.

## Core Workflow

1. A Producer creates a campaign with project, audience, objective, channels,
   languages, budget, deadline, and classification.
2. Nomi assembles a project-scoped Knowledge Pack from approved sources.
3. The Producer selects a Brand Kit, content template, and deliverables.
4. Creators produce and version media in the Nomi workspace.
5. Automated QA checks format, brand rules, language, provenance, model policy,
   restricted terms, and expected generation cost.
6. The Producer reviews completeness and alignment with the brief.
7. The Standards Owner performs brand approval.
8. Legal, commercial, executive, or managing-partner approval is added when the
   campaign classification or template requires it.
9. Approved deliverables are exported or published.
10. The portal archives the final asset, prompt, model, references, author,
    generation cost, versions, and approval history.

## Core Objects

```text
Organization
  Brand
    Campaign
      Brief
      Knowledge Pack
      Storyboard
      Deliverable
        Asset
          Version
      Review
      Approval
      Publication
```

## Non-Negotiable Rules

- Only approved canonical facts may enter public or investor-facing materials.
- Candidate or extracted facts must remain visibly unconfirmed until reviewed.
- Sensitive knowledge is retrieved by project and role, never by loading the
  entire company knowledge base into a model prompt.
- Every generated asset keeps model, prompt, source, author, cost, and approval
  provenance.
- Publication is blocked until all required approvals are complete.

## Candidate Pilot

Use one real estate campaign as the first end-to-end pilot, from structured
brief through a reviewed short-form video and its channel adaptations.

## Open Product Questions

- Which campaign should be the first pilot?
- Who has final business approval for each project family?
- Which channels require direct publishing in the first release?
- Which Brand Kits and production templates are needed on day one?
- Which content classes require legal review without exception?
