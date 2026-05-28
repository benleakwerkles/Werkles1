# Foreman GO / NO-GO Log

No gate decisions recorded yet.


## 2026-05-23T14:41:37.348Z
- phase: DRY-RUN
- step: faq-static-page
- Bean verdict: missing
- Comptroller verdict: missing
- tests required:
  - strict apply gate
- tests passed:
  - none
- tests failed:
  - 1 failed: output file missing at /handoffs/received/DRY-RUN-faq-static-page-output.md
  - 2 failed: Bean audit missing at /handoffs/gates/DRY-RUN-faq-static-page-bean-audit.md
  - 4 failed: Comptroller gate missing at /handoffs/gates/DRY-RUN-faq-static-page-comptroller-gate.md
- push allowed: no
- reason: Apply gate failed.


## 2026-05-23T18:46:53.266Z
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- Bean verdict: missing
- Comptroller verdict: missing
- tests required:
  - strict apply gate
- tests passed:
  - none
- tests failed:
  - 1 failed: output file missing at /handoffs/received/DRY-RUN-0.1-foreman-pipeline-copy-output.md
  - 2 failed: Bean audit missing at /handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md
  - 4 failed: Comptroller gate missing at /handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-comptroller-gate.md
- push allowed: no
- reason: Apply gate failed.


## 2026-05-24T04:08:54.513Z
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- Bean verdict: GO
- Comptroller verdict: GO
- tests required:
  - strict apply gate
- tests passed:
  - strict apply gate
- tests failed:
  - none
- push allowed: no
- reason: Comptroller gate saved. Push requires separate push gate and explicit PUSH PHASE command.


## 2026-05-24T04:09:33.920Z
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- Bean verdict: GO
- Comptroller verdict: GO
- tests required:
  - strict apply gate
- tests passed:
  - strict apply gate
- tests failed:
  - none
- push allowed: no
- reason: Apply gate passes. Push still requires push gate and explicit command.


## 2026-05-24T04:21:45.178Z
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- Bean verdict: GO
- Comptroller verdict: GO
- tests required:
  - npm run lint
  - npm run build
- tests passed:
  - none
- tests failed:
  - npm run lint
  - npm run build
  - npm run lint failed with status null
  - npm run build failed with status null
  - working tree is not clean: M lib/copy.ts, M next-env.d.ts, docs/ai/, foreman/, handoffs/, scripts/
- push allowed: no
- reason: npm run lint failed with status null; npm run build failed with status null; working tree is not clean: M lib/copy.ts, M next-env.d.ts, docs/ai/, foreman/, handoffs/, scripts/
