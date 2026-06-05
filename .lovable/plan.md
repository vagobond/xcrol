
# Xcrol Survivability — Tier 1 Plan + Tier 2 Costs

## Tier 2 — Estimated monthly costs (USD)

These are the realistic numbers if you replaced Lovable-managed pieces with neutral, portable equivalents. Ranges reflect "small Xcrol" vs "Xcrol with a few thousand active users".

| Item | Provider options | Cost / month |
|---|---|---|
| Frontend hosting (static + edge) | Cloudflare Pages (free tier), Vercel Hobby (free) / Pro ($20) | **$0–$20** |
| Database + Auth + Storage + Edge Functions | Self-hosted Supabase on Hetzner CX22 ($4) or CPX21 ($8); or Supabase Pro ($25) | **$4–$25** |
| Object storage (avatars, exports, backups) | Backblaze B2 (~$6/TB), Cloudflare R2 (free egress, $15/TB stored) | **$1–$15** |
| Transactional email (Resend replacement option) | Resend ($20 for 50k), Postmark ($15 for 10k), AWS SES (~$0.10/1k) | **$0–$20** |
| Map tiles (Mapbox replacement option) | MapTiler ($0 up to 100k loads), Protomaps self-hosted (~$1) | **$0–$25** |
| AI for Scrolls | Already BYOK — $0 platform cost; users pay their own OpenAI/Anthropic/Google bill | **$0** |
| Domain registration (xcrol.com) | Cloudflare / Porkbun, pre-paid up to 10 yrs | **~$1/mo amortized** |
| DNS | Cloudflare free | **$0** |
| Off-site backup storage | Backblaze B2 / S3 Glacier (~10 GB) | **$0.05–$1** |
| **Total realistic floor** | minimal self-hosted | **~$6–$10/mo** |
| **Total comfortable** | managed everything | **~$60–$90/mo** |

Notes:
- AI Gateway is the only piece with no drop-in equivalent — but BYOK already exists in `src/lib/scroll-ai-byok.ts`, so users self-fund AI and Xcrol owes nothing.
- "If you die" scenario: a trustee paying ~$10/mo + domain renewal keeps Xcrol alive indefinitely on Hetzner + self-hosted Supabase.

---

## Tier 1 Plan — Cold Backup + Revival Runbook

Goal: if Lovable disappears tomorrow (or you do), a technically competent person with the backup bundle can have Xcrol running again on a fresh stack within a day, with no data loss beyond the last backup window.

### What gets backed up

1. **Database** — full `pg_dump` of the Supabase Postgres (schema + data + RLS policies + functions + triggers).
2. **Storage buckets** — every object in every bucket (avatars, scroll exports, etc.).
3. **Source code** — the repo is already mirrored to GitHub via Lovable's GitHub sync; we'll document how to verify it and add a weekly tarball as belt-and-suspenders.
4. **Edge function source** — included with the repo, but we'll also snapshot deployed versions.
5. **Secrets inventory** — names only (never values), so the trustee knows what to re-provision.
6. **Auth users export** — `auth.users` rows so accounts survive (passwords are hashed and re-importable into any Supabase/GoTrue).

### Where backups go

Two destinations for redundancy, neither owned by Lovable:

- **Primary:** Backblaze B2 bucket `xcrol-backups` (cheap, ~$0.005/GB/mo). User-owned account.
- **Secondary:** A private GitHub repo `xcrol-backups` (last 30 days of metadata + small dumps; storage objects skipped here because of size).

You'll need to create the Backblaze account and provide:
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`

### How backups run

A scheduled Supabase Edge Function `nightly-backup` runs daily at 04:00 UTC and:

1. Calls `pg_dump` via Supabase's pooler → uploads `db-YYYY-MM-DD.sql.gz` to B2.
2. Lists every storage bucket, streams each object to B2 under `storage/<bucket>/<path>`.
3. Writes a `manifest-YYYY-MM-DD.json` (counts, sizes, checksums, secret-name inventory).
4. Posts a one-line success/failure to a webhook (your email via Resend, or a Slack/Discord webhook).
5. Retention: keeps daily backups for 14 days, weekly for 12 weeks, monthly forever.

A second function `weekly-source-snapshot` (Sundays) tarballs the deployed edge function source and pushes the manifest to the GitHub backup repo.

### Dead-man's switch (optional add-on you mentioned)

A third function `heartbeat-check` runs weekly. If you haven't logged in or pinged a `/alive` endpoint for **90 days**, it emails a pre-designated trustee with:
- Link to the backup bucket
- Link to `RUNBOOK.md`
- Link to the GitHub mirror
- A short letter you write once and store encrypted

Configurable threshold and trustee email; off by default until you turn it on.

### The RUNBOOK.md (committed to the repo at `/docs/RUNBOOK.md`)

A step-by-step revival guide written for a stranger:

1. Provision a fresh Supabase project (or self-hosted Supabase on Hetzner — both paths documented).
2. `psql < db-latest.sql.gz` to restore schema + data + auth users.
3. `b2 sync` storage objects back into the new project's buckets.
4. Re-provision secrets from the inventory (list of names + where to get each value).
5. Point DNS (`xcrol.com`) at the new frontend host.
6. Deploy the repo to Cloudflare Pages / Vercel (one-command instructions for each).
7. Smoke-test checklist (login, post to River, send message, view profile).

### What this plan will create

- `supabase/functions/nightly-backup/index.ts` — the backup job
- `supabase/functions/weekly-source-snapshot/index.ts` — source/manifest snapshot
- `supabase/functions/heartbeat-check/index.ts` — dead-man's switch (disabled by default)
- A `pg_cron` migration that schedules the three functions
- `docs/RUNBOOK.md` — full revival guide
- `docs/BACKUP-ARCHITECTURE.md` — what's backed up, where, retention, how to test a restore
- A one-time admin page `/admin/backups` showing last run, size, status, and a "Run now" button
- Secrets to be added (by you, after approval): `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, optional `BACKUP_ALERT_WEBHOOK`, optional `TRUSTEE_EMAIL`

### What this plan does NOT change

- No changes to existing tables, RLS, auth, or any user-facing feature.
- No changes to the hosting setup — still Lovable Cloud as the live system.
- AI / BYOK code untouched.

### Open questions before I build

1. Are you OK with **Backblaze B2** as the primary off-site (cheapest, S3-compatible), or do you prefer AWS S3 / Cloudflare R2?
2. Do you want the **dead-man's switch** scaffolded now (off by default) or skipped entirely for Tier 1?
3. For backup alert notifications, prefer **email via Resend** (already wired) or a **Discord/Slack webhook**?
4. Should restored backups also include **`auth.users` password hashes** (yes = users keep their passwords; no = everyone must reset)? Default: yes.

Answer those four and I'll implement Tier 1 end-to-end in the next turn.
