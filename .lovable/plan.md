## Tier 2 — Cheapest Viable Warm Standby

Goal: if Lovable (or any single vendor) goes down, Xcrol can be revived on infrastructure you control within hours, not days — without doubling your monthly bill.

Estimated total cost: **~$0–7/month** + domain renewal (~$10–15/yr you already pay).

---

### What we add (in priority order)

**1. Frontend mirror on Cloudflare Pages — Free**
- Connect the existing GitHub repo (already auto-synced from Lovable) to Cloudflare Pages.
- Every push builds a static mirror at `mirror.xcrol.com` (or a `.pages.dev` URL).
- If Lovable hosting ever fails, flip the `xcrol.com` DNS CNAME from Lovable → Cloudflare Pages. Site is back in minutes.
- Cost: $0. Bandwidth: unlimited on free tier.

**2. BYOK AI fallback — Free (user pays their own key)**
- Add a settings toggle: "Use my own OpenAI / Anthropic / OpenRouter key".
- If set, AI calls route through the user's key instead of Lovable AI Gateway.
- Protects against Lovable AI outages or pricing changes; zero infra cost to you.
- Pure frontend + edge-function change, no new services.

**3. Domain insurance — ~$10–15/yr (already paying)**
- Pre-pay `xcrol.com` for 5–10 years at next renewal so the domain can never lapse during an incident.
- Set auto-renew + a backup payment method.
- No new cost beyond what you'd pay anyway.

**4. Backup verification cron — Free**
- Weekly automated "test restore" job: pull latest B2 backup → restore one table to a scratch Postgres → row-count check → alert if mismatch.
- Runs on GitHub Actions (free tier, 2000 min/month).
- Confirms backups actually work without manual quarterly drills.

**5. Status page + uptime alerts — Free**
- UptimeRobot or BetterStack free tier: ping `xcrol.com`, edge functions, and the B2 backup endpoint every 5 min.
- Alerts via email/Discord webhook if anything goes down.
- Public status page at `status.xcrol.com` (optional, builds user trust).

---

### What we explicitly do NOT do (and why)

- **No self-hosted Supabase mirror.** Real-time DB replication to a second Postgres = $20–50/mo VPS + ops complexity. Tier 1 backups already cover the "Lovable disappears" scenario at recovery-time cost of hours, not minutes. Not worth it yet.
- **No dual-write edge functions.** Same reasoning — complexity explosion for marginal RTO improvement.
- **No paid CDN / WAF.** Cloudflare's free tier already includes both.

---

### Implementation order

1. Cloudflare Pages mirror (1 evening) — biggest payoff, zero ongoing work.
2. Uptime monitoring + Discord/email alerts (30 min).
3. BYOK AI fallback (half day — UI + edge function branch).
4. Weekly restore-verification GitHub Action (2 hours).
5. Domain pre-pay (one click at next renewal).

---

### What this gets you

| Scenario | Recovery time | Cost |
|---|---|---|
| Lovable frontend down | ~5 min (DNS flip) | $0 |
| Lovable AI Gateway down | Instant (users with own key) | $0 |
| Lovable Cloud / DB down | ~4–8 hrs (restore from B2) | $0 |
| Domain registrar issue | N/A (pre-paid 10yr) | $10/yr |
| Backup silently broken | Caught within 7 days | $0 |

Total new monthly spend: **$0**. Total new yearly spend: **~$0–15** (just the domain you already buy).

Tier 3 (NOSTR/ActivityPub federation) remains the long-term answer for true sovereignty; this Tier 2 setup buys you operational resilience cheaply while that work continues.

---

**Ready to start with #1 (Cloudflare Pages mirror)?** It's the biggest win and unblocks the rest.
