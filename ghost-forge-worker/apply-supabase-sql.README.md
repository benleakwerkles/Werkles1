# Ghost Forge Supabase SQL Application

Purpose: apply the Ghost Forge SQL with as little copy/paste as possible, without exposing secrets to Codex or chat.

Codex must not apply this SQL unless the Operator explicitly approves a safe connection path. The default path is manual dashboard action.

## Path A - Dashboard Path

Use this when you want the least tooling.

1. Open Supabase Dashboard.
2. Open the correct Werkles project.
3. Go to SQL Editor.
4. Create a new query.
5. Use the local SQL file:

```text
C:\Users\benle\Desktop\github\Werkles\ghost-forge-worker\supabase-ghost-forge.sql
```

6. Paste or open/import that file in the editor.
7. Click Run.
8. Confirm:
   - `ghost_forge_batches` exists.
   - `ghost_forge_outputs` exists.
   - `ghost_forge_spend` exists.
   - `ghost_forge_claude_spend` exists.
   - storage bucket `ghost-forge` exists.
   - bucket `ghost-forge` is private.
   - RLS is enabled on all Ghost Forge tables.
   - no anon/authenticated policies were added.

Do not paste secrets into Codex or chat.

## Path B - Private CLI Path

Use this only if you privately set `SUPABASE_DB_URL` on your machine and PostgreSQL `psql` is installed.

This script:

- reads `SUPABASE_DB_URL` from your local environment
- refuses if missing
- refuses if `psql` is missing
- runs `supabase-ghost-forge.sql`
- never prints the connection string
- never stores the connection string

Run:

```powershell
cd C:\Users\benle\Desktop\github\Werkles\ghost-forge-worker
$env:SUPABASE_DB_URL = "set-this-privately-do-not-paste-into-chat"
.\apply-supabase-sql.ps1
```

If the script reports `psql not installed`, use Path A or install PostgreSQL tools later with explicit approval.
