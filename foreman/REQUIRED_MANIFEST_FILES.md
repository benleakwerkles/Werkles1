# Required Manifest Files

Foreman handoff packets must list required files in the machine-checkable `Manifest JSON` block. It is not enough for a file to exist on disk; the manifest must name it so a new AI thread can reconstruct what was used.

`verify-manifest.mjs` reads the JSON mapping below.

```json
{
  "always": [
    "docs/ai/00_SOURCE_OF_TRUTH.md",
    "docs/ai/01_WHO_RUNS_WHAT.md",
    "docs/ai/07_BUILD_ORDER.md"
  ],
  "byTargetAI": {
    "Builder": [
      "docs/ai/02_BUILDER.md"
    ],
    "Bean": [
      "docs/ai/02_BEAN_AUDIT.md"
    ],
    "Comptroller": [
      "docs/ai/03_COMPTROLLER_GATE.md"
    ]
  }
}
```
