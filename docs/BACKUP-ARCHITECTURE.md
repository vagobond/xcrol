# Xcrol Backup Architecture (Tier 1 — Cold Backup)

## Goal
If Lovable, Supabase, or the current operator disappears, a competent stranger
holding the backup bundle + the GitHub mirror can revive Xcrol on a fresh
stack within a day, losing at most ~24 hours of data.

## What gets backed up
| Item                 | Source                          | Format                | Frequency |
| -------------------- | ------------------------------- | --------------------- | --------- |
| Public table data    | Supabase Postgres (service role) | `.ndjson.gz` per table | Daily    |
| Auth users (+hashes) | `auth.admin.listUsers`          | `.ndjson.gz`          | Daily     |
| Storage object catalog | Supabase Storage list API     | `catalog.json.gz`     | Daily     |
| Schema (DDL)         | `supabase/migrations/`          | Git (GitHub mirror)   | On commit |
| Edge function source | `supabase/functions/`           | Git (GitHub mirror)   | On commit |
| Frontend source      | `src/`                          | Git (GitHub mirror)   | On commit |
| Secret-name inventory| edge function env scan          | inside manifest       | Daily     |

Storage object *bytes* are **not** copied in Tier 1 — only the catalog. Most
storage content (avatars, OG images) is regeneratable. To upgrade to full
object copy, see "Tier 1.5" below.

## Where backups live
Primary: **Backblaze B2** bucket `xcrol-backups`, owned by the operator's
personal B2 account (not Lovable, not Supabase). Layout:

```
xcrol/YYYY-MM-DD/<run-timestamp>/
  manifest.json.gz
  db/<table>.ndjson.gz
  auth/users.ndjson.gz
  storage/catalog.json.gz
```

Secondary (recommended): the repo itself is mirrored to a private GitHub repo
via Lovable's GitHub sync. Schema, RLS policies, functions, triggers, and all
app code live there.

## How backups run
A scheduled Supabase Edge Function `nightly-backup`:
1. Authorizes against B2 (`b2_authorize_account`).
2. Pages every public table at 1000 rows/page, gzips NDJSON, uploads.
3. Pages `auth.users` (with `encrypted_password`), gzips, uploads.
4. Walks every storage bucket, writes a catalog (name + size + mtime), uploads.
5. Writes a manifest with row counts, byte sizes, errors, and the names of
   secrets that were set at run time (values are never recorded).
6. Records the run in `public.backup_runs`.
7. Optionally POSTs a one-line status to `BACKUP_ALERT_WEBHOOK`.

## Scheduling
Run this once (replace placeholders) using `supabase--insert` SQL, not a
migration — the URL + secret are project-specific and shouldn't ship to forks:

```sql
select cron.schedule(
  'xcrol-nightly-backup',
  '0 4 * * *',
  $$
  select net.http_post(
    url:='https://<project-ref>.functions.supabase.co/nightly-backup',
    headers:='{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

select cron.schedule(
  'xcrol-weekly-heartbeat',
  '0 5 * * 0',
  $$
  select net.http_post(
    url:='https://<project-ref>.functions.supabase.co/heartbeat-check',
    headers:='{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

Cron requires the `pg_cron` and `pg_net` extensions to be enabled in the
project.

## Retention (apply via B2 Lifecycle Rules)
- `xcrol/` keep all uploads for 14 days
- Move to "hide after 14 days, delete after 90 days" for daily folders
- Pin the 1st of every month folder ("monthlies forever") manually or with a
  separate rule prefix

## Dead-man's switch
`heartbeat-check` runs weekly. When `DEADMAN_ENABLED=1` and `TRUSTEE_EMAIL` is
set, it checks the most recent admin sign-in and emails the trustee with a
revival packet if no admin has signed in for `DEADMAN_DAYS` (default 90).
Off by default.

## Required secrets
| Secret                  | Required | Purpose                          |
| ----------------------- | -------- | -------------------------------- |
| `B2_KEY_ID`             | yes      | Backblaze application key id     |
| `B2_APPLICATION_KEY`    | yes      | Backblaze application key secret |
| `B2_BUCKET_NAME`        | yes      | Target bucket (e.g. `xcrol-backups`) |
| `CRON_SECRET`           | yes      | Shared secret for scheduled invocations |
| `BACKUP_ALERT_WEBHOOK`  | optional | Discord/Slack webhook URL        |
| `RESEND_API_KEY`        | already set | Used by deadman to email trustee |
| `TRUSTEE_EMAIL`         | optional | Recipient for deadman alerts     |
| `DEADMAN_ENABLED`       | optional | Set to `1` to arm the switch     |
| `DEADMAN_DAYS`          | optional | Days of silence before alerting (default 90) |

## Tier 1.5 (later, when wanted)
Add a second function `nightly-storage-sync` that performs incremental copy of
storage object **bytes** to B2 under `storage/<bucket>/<path>`, skipping any
object whose `updated_at` is older than the last successful sync.

## Tier 2 (later)
Move frontend hosting off Lovable (Cloudflare Pages / Vercel), self-host
Supabase on Hetzner, replace AI Gateway with BYOK (already implemented for
Scrolls). See `RUNBOOK.md`.
