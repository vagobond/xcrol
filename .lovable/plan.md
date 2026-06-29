## Goal
Eliminate every code path in Xcrol that calls the Lovable AI Gateway or reads `LOVABLE_API_KEY`. Scroll AI stays available to users via the existing BYOK (bring-your-own-key) browser path, which never touches Lovable AI.

## Current Lovable AI surface
1. `supabase/functions/adventure-game/index.ts` — calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`. **Orphaned**: nothing in `src/` invokes it.
2. `supabase/functions/dream-trip/index.ts` — same pattern. **Orphaned**: no caller in `src/`.
3. `supabase/functions/scroll-ai/index.ts` — already returns 402 for everyone (Wayfarer+ gate stub). Contains a commented-out Lovable AI snippet for the future paid tier.
4. `supabase/functions/nightly-backup/index.ts` — only lists `LOVABLE_API_KEY` in a secret-name inventory (names, not values).

No other files in `src/` or `supabase/functions/` reference the gateway.

## Changes

### 1. Delete the two orphaned AI edge functions
- Remove `supabase/functions/adventure-game/` (entire directory).
- Remove `supabase/functions/dream-trip/` (entire directory).
- Remove their `[functions.adventure-game]` and `[functions.dream-trip]` blocks from `supabase/config.toml`.

### 2. Strip the Lovable AI paid path from `scroll-ai`
- Edit `supabase/functions/scroll-ai/index.ts` to:
  - Remove the commented-out Lovable AI Gateway snippet entirely.
  - Replace `hasWayfarerPlus` and the gated branch with a permanent 410 / 404 response explaining Scroll AI runs only via BYOK in the browser.
- Edit `src/lib/scroll-ai.ts`:
  - Remove `userHasPaidTier()` and the `invokeEdge` function.
  - Remove the `supabase.functions.invoke("scroll-ai", …)` call and the `supabase` import.
  - `runScrollAi` always uses the BYOK path; if no key, throws `no_byok_key` as today.
- Remove the `[functions.scroll-ai]` block from `supabase/config.toml` (function no longer needed).
- Delete `supabase/functions/scroll-ai/` directory.

### 3. Remove `LOVABLE_API_KEY` from the backup inventory
- Edit `supabase/functions/nightly-backup/index.ts` line 199: drop `"LOVABLE_API_KEY"` from the `secretInventory` array.

### 4. After deploy
- The `LOVABLE_API_KEY` secret in Lovable Cloud becomes unused. It can stay (harmless) or the user can delete it from project secrets later. No code change required.

## Out of scope
- BYOK Scroll AI (calls OpenAI / OpenRouter / Anthropic / Google directly from the browser) is preserved untouched — it does not use Lovable AI.
- No UI changes; nothing in the app currently surfaces the orphaned Adventure / Dream Trip endpoints.

## Verification
- `rg "LOVABLE_API_KEY|ai\.gateway\.lovable|Lovable-API-Key"` returns no hits in `src/` or `supabase/functions/`.
- Scroll editor's AI button still works when a BYOK key is configured; shows the existing "Add your AI provider key" message otherwise.
- Nightly backup runs without referencing the key.
