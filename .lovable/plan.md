# Xcrol Continuity Audit — Without Lovable, Without You

A full status check across three dimensions: (1) self-hosting the frontend off Lovable, (2) migrating off Lovable Cloud, and (3) a stranger or your trustee being able to keep Xcrol running if you disappear.

## Overall verdict

You are in good shape — better than most Lovable projects. A documented cold-backup pipeline exists, runs to Backblaze B2, and a `RUNBOOK.md` describes revival. The main gaps are: (a) backup pipeline shows only **manual** runs in `backup_runs` since June 10 — the nightly cron may not actually be firing despite being scheduled, (b) no one but you currently holds the recovery credentials, and (c) a few hard ties to Lovable's hosted services remain (AI gateway, auth SDK, lovable-tagger).

```text
                Ready        Partial       Gap
Frontend        [####------]                          (Vite app portable; needs build tweaks)
Backend         [######----]                          (Schema in git, data in B2, secrets undocumented)
Personal        [###-------]                          (Docs exist, but no trustee, no dry-run)
```

---

## 1. Frontend — running off Lovable hosting

**What works today**
- Standard Vite + React + Tailwind app. Builds with `vite build`, deploys anywhere static (Cloudflare Pages, Netlify, Vercel, S3+CloudFront).
- Custom domain `xcrol.com` already live — DNS is yours, not Lovable's.
- Code is in a real `.git` repo; GitHub sync presumed active.

**What needs change to leave Lovable**
- `vite.config.ts` imports `lovable-tagger` — dev-only plugin, harmless but should be removed or guarded.
- `package.json` depends on `@lovable.dev/cloud-auth-js` — this is the auth wrapper. Either swap to plain `@supabase/supabase-js` auth (already imported) or vendor it.
- `.env` uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — already standard Supabase, portable as-is.
- `src/integrations/lovable/index.ts` — audit and replace any Lovable-specific calls.

**Effort to migrate hosting**: ~1 hour. Mostly removing `lovable-tagger`, replacing the auth wrapper, repointing DNS.

---

## 2. Backend — running off Lovable Cloud

**What works today**
- All 170 migrations are committed to git → schema, RLS, functions, triggers, grants all reproducible on any Supabase project (managed or self-hosted).
- Edge functions (29 of them) all live in `supabase/functions/` and deploy with `supabase functions deploy`.
- Nightly backup function `nightly-backup` dumps every public table + `auth.users` (with password hashes) + storage catalog to **Backblaze B2** under a bucket you own.
- Cron job `nightly-backup-0400-utc` is **scheduled and active** in `cron.job`.
- Secrets are listed in `fetch_secrets`; `nightly-backup` records secret names (not values) in the manifest for revival reference.
- `RUNBOOK.md` covers two revival paths (managed Supabase + Cloudflare Pages, or self-hosted Supabase on Hetzner) with concrete commands.

**Gaps**
- `public.backup_runs` only shows `kind = 'manual'` runs; the most recent is **2026-06-10**. Either the nightly cron isn't actually invoking the function, or the run rows are being filtered. Needs verification.
- Storage object **bytes** are not copied (avatars, OG images would be lost on revival — only the catalog survives). Doc calls this "Tier 1.5", not yet built.
- Lovable AI Gateway (`LOVABLE_API_KEY`) powers `adventure-game`, `dream-trip`, and the paid `scroll-ai` path. On revival, these break until you rewire to OpenAI/Gemini directly. Scroll-AI BYOK already works for free users.
- No documented `service_role_key` rotation drill — if Lovable revokes/loses it, you have no copy on Lovable Cloud (per platform constraint).

**Effort to migrate backend**: ~3–4 hours per the runbook; loss is "last 24h of data + storage bytes".

---

## 3. Personal continuity — Xcrol surviving you

**What works today**
- `RUNBOOK.md` is written for "a competent stranger" — clear, executable steps.
- `BACKUP-ARCHITECTURE.md` documents what's backed up, retention, and the dead-man's switch design.
- Dead-man's switch (`heartbeat-check` weekly, off by default) — wired up in code, ready to arm.

**Gaps**
- **No trustee.** `TRUSTEE_EMAIL`, `DEADMAN_ENABLED`, `DEADMAN_DAYS` secrets are not set → if you disappear, no one gets notified, no one receives B2 credentials.
- **B2 credentials only exist in your head + the secrets store.** No sealed envelope, no password-manager share, no lawyer letter.
- **Domain registrar access** for `xcrol.com` is not part of any continuity plan — without it, the revived app cannot be reached at the canonical URL.
- **No dry-run.** The runbook has never been executed end-to-end. Estimated 3-hour revival is unverified.
- **GitHub mirror ownership** — currently tied to your GitHub account. If GitHub locks the account, the source vanishes (B2 doesn't have source code).

---

## Proposed next steps (in priority order)

1. **Verify nightly cron is actually running.** Inspect cron job logs and confirm `backup_runs` gets a `kind='nightly'` row tonight; fix the invocation if not.
2. **Pick and notify a trustee** (one person + one backup person). Set `TRUSTEE_EMAIL`, set `DEADMAN_ENABLED=1`, `DEADMAN_DAYS=90`.
3. **Hand off credentials out-of-band.** Sealed envelope, 1Password emergency kit, or a lawyer's escrow containing: B2 key id + secret, domain registrar login, GitHub recovery codes, link to `RUNBOOK.md`.
4. **One dry-run revival to a throwaway Supabase project.** Time it. Fix any runbook steps that don't work. Delete the throwaway after.
5. **Move source mirror to a second GitHub account or GitLab** so loss of one account doesn't kill source recovery.
6. **Optional, later:** Build Tier 1.5 storage byte sync so avatars and OG images survive. Build BYOK fallbacks for `adventure-game` and `dream-trip` so AI features don't break post-Lovable.

## Technical details (what I would implement when you greenlight)

- For step 1, run `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname='nightly-backup-0400-utc') ORDER BY start_time DESC LIMIT 10;` to see actual cron execution history; if the function is being called but failing, check `edge_function_logs` for `nightly-backup`. If it's not being invoked at all, recreate the schedule.
- For step 2, use `add_secret` to add `TRUSTEE_EMAIL`, `DEADMAN_ENABLED`, `DEADMAN_DAYS`, then confirm `heartbeat-check` reads them.
- For step 5, set up a second remote on the same repo (`git remote add mirror …`) and a GitHub Action that pushes to both on every commit.

This plan does not change any application code — it's a continuity/ops audit and a list of decisions for you to make.
