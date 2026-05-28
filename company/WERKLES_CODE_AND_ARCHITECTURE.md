# Werkles Code And Architecture

Status: v0.2 review draft

## Article IX - Code And Architecture Standards

`lib/design-tokens.ts` is the source of truth. Build tooling emits or feeds Tailwind and web CSS variables. Components must not hard-code hex values.

Server-derived state must stay server-derived:

- trust weight
- membership tier
- verification status
- payment status
- admin status

Provider webhooks must verify signatures and be idempotent before updating sensitive state.

Secrets never belong in browser code, repo files, chat, screenshots, or logs.

High-risk code paths require explicit gates:

- auth
- RLS
- SQL migrations
- payments
- verification
- webhooks
- service role usage
- deployment
- image generation workers
