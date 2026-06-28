# SPEAKER ASSIMILATION PROTOCOL

## Purpose
Convert receipts into inheritance.

A receipt that is stored but not assimilated is forgotten by another name.

## Input
Any mission receipt, branch audit, validation report, build result, failure report, human correction, or doctrine change.

## Required Questions
For every incoming receipt, Speaker must answer:

1. What changed?
2. What proof exists?
3. Is the change proven, assumed, or unverified?
4. Does this change doctrine?
5. Does this change routing?
6. Does this change permissions?
7. Does this change ownership?
8. Does this change the current frontier?
9. Does this reveal a failure pattern?
10. Should this become reflex, remain note, or be archived?

## Output Types

### Receipt Only
Proof exists, but no doctrine or behavior changes.

### Change Capsule
A fact, decision, topology change, blocker, or correction must be repeated.

Format:

- what_changed
- why_it_changed
- who_is_affected
- what_is_next
- source_receipt
- timestamp
- owner

### Doctrine Pearl
A durable lesson that should shape future behavior.

Required fields:

- title
- doctrine
- reason
- source receipt
- scope
- supersedes
- review trigger
- owner

### Reflex Candidate
A repeated lesson that should become automatic behavior after validation.

Required fields:

- trigger
- action
- proof threshold
- reversal method
- swateyes classification
- human gate status

### Ender Review
A doctrine, artifact, branch, or rule may be obsolete and requires selection / forgetting review.

## Assimilation Standard
A lesson is not learned until it changes future behavior.
