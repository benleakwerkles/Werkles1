# Werkles Trust And Compliance

Status: v0.2 review draft

## Article VI - Trust, Data, And Compliance

Werkles verifies users. Users do not verify each other.

Verification claims must be scoped honestly:

- identity can be checked through an identity provider
- phone ownership can be checked through a phone provider
- funds can be checked through a funds provider
- licenses can be checked against available records
- background checks require proper consent and legal review
- references and work history can be partially checked but remain gameable

## Zero-Knowledge Posture

Werkles should store receipts and statuses, not raw sensitive material.

Do not store:

- raw SSNs
- full bank account numbers
- full ID documents
- unnecessary pay stubs
- unnecessary tax documents
- unnecessary background report contents

Store only what is needed to prove a workflow happened, expire it, and audit access.

## RLS And Server Boundaries

All user data tables need row-level security or server-only isolation.

Service role keys stay server-side only.

User trust state, membership state, verification state, and payment state are server-derived. Users cannot write their own trust tier.

## Deletion And Anonymization

Deletion/anonymization must preserve lawful user deletion rights while keeping non-identifying Blueprint structure where legally allowed.

Implementation details remain open in `WERKLES_OPEN_QUESTIONS.md`.

## Webhook Gospel

Provider callbacks are truth only after signature verification.

Subscription status, verification status, payment status, and image-generation worker status must not be granted by the frontend success page alone.

Webhook handlers must:

- verify raw-body signatures when supported
- fail closed
- be idempotent
- avoid logging secrets
- update server-side state only after trust checks pass

## Momentum And Lock The Joints

The old "co-sign" vocabulary is not law. "Lock the Joints" or another non-lending term should be used.

Momentum automation must not auto-add users to Blueprints merely because everyone was silent. The preferred open direction is 48-hour escalation and 96-hour expiry, not silent auto-approval.
