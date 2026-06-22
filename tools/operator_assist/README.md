# Operator Assist V0

Local helper for two explicit operator actions:

1. Workspace Snapshot Builder
   - Captures a screenshot.
   - Sends it to Gemini or OpenAI vision when a key is present.
   - Generates workspace/FancyZones notes.
   - Saves a receipt under `out/receipts/`.

2. AI Assisted Auto-Paste
   - Takes a prompt plus `Aeye@Machine` destination.
   - Generates a compact packet.
   - Copies it to the clipboard.
   - Saves a receipt under `out/receipts/`.

## Setup

```powershell
cd C:\Users\Ben Leak\Desktop\github\Werkles\tools\operator_assist
npm install
Copy-Item .env.example .env
```

Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to `.env` if you want vision analysis. Without a key, snapshot still captures the screen and writes a clean blocked receipt.

## SETUP HUMAN GATE

Ben must add `GEMINI_API_KEY` or `OPENAI_API_KEY` to local `.env`.
Do not commit `.env`.

## Commands

```powershell
npm run snapshot
npm run packet -- Dink@Betsy "mission text"
```

## Boundaries

- No secrets are committed.
- No auto-send.
- No auto-paste without the explicit `npm run packet` command.
- Clipboard write is local only.
- Receipts are saved under `tools/operator_assist/out/`.
