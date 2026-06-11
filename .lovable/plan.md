
# BYOK AI Fallback — Implementation Plan

## Goal
Today, every Scroll AI action returns `402 wayfarer_plus_required`. After this round: users can paste their own AI key (OpenRouter recommended, OpenAI/Anthropic/Google still supported), get all four Scroll AI actions working end-to-end, and the `scroll-ai` edge function is restructured around a real entitlement check that's ready to flip on the day Wayfarer+ ships.

The keystore, BYOK adapters, router, Settings card, ScrollAiButton, and tutorial page already exist. This is an audit, polish, and gate-restructure pass — not a rebuild.

---

## 1. Audit & fix wiring (must-be-correct before anything else)

- Verify `<AiAssistanceSection />` is mounted in `src/pages/Settings.tsx` and visible without scrolling past unrelated sections.
- Verify `src/pages/ScrollEditor.tsx` uses `<ScrollAiButton />` for all four actions (title, blurb, chapters, polish_interlude), passes a fresh `getContext()` closure, and the `onAccept` handlers actually write back into editor state and persist on save.
- Verify the `/scrolls/ai-setup` route in `src/App.tsx` resolves to `ScrollAiTutorial.tsx` and the page contains accurate "where to get a key" steps for each provider, with OpenRouter listed first.
- Run a smoke pass: paste an OpenRouter key in Settings → Test connection → Save → open a scroll → trigger each of the four actions → confirm each result type renders and accept-flow updates the editor.

Fix anything broken in place. No new features yet.

## 2. UX polish

- **OpenRouter-first Settings UI.** In `AiAssistanceSection.tsx`, reorder the provider dropdown to `OpenRouter, OpenAI, Anthropic, Google`, set OpenRouter as the default when no key is saved, and add a one-line recommendation chip: "Recommended — one key, hundreds of models, pay-as-you-go." Keep all four providers available.
- **Deep-link from missing-key toast.** In `ScrollAiButton.tsx`, when neither paid tier nor BYOK key is present, replace the plain toast with a toast that includes an action button linking to `/settings#ai-assistance` (add `id="ai-assistance"` anchor on the card).
- **"BYOK active" pill on the editor.** In `ScrollEditor.tsx`, show a small `BYOK active` (or `Xcrol AI` once paid lands) badge next to the AI buttons so users know their key is being used. Read state via `hasByokKey()` on mount.
- **Cost reassurance on the tutorial page.** Add a short table to `ScrollAiTutorial.tsx`: rough per-call cost for the recommended cheap model on each provider (OpenRouter `openai/gpt-4o-mini`, OpenAI `gpt-4o-mini`, Anthropic `claude-3-5-haiku-latest`, Google `gemini-2.0-flash`). Frame as "typically fractions of a cent per suggestion."
- **Friendlier empty state.** When a user opens the Settings card without a key, surface a one-click "Get an OpenRouter key" external link button alongside the existing "Where do I get a key?" link.
- **Error mapping.** Confirm `runScrollAi`'s typed errors (`rate_limited`, `credits_exhausted`, `provider_error`) each render a distinct, human-readable toast — not the raw provider blob.

## 3. Open the gate (restructure the paid path)

Today `supabase/functions/scroll-ai/index.ts` returns 402 unconditionally. Restructure so the hard-coded gate is replaced by a real entitlement check function — which, for now, simply returns `false` for everyone (no membership table yet), preserving today's behavior but with code ready to flip:

```ts
async function hasWayfarerPlus(_supabase, _userId) {
  // TODO: when Wayfarer+ ships, query the membership/entitlement source.
  return false;
}

if (!(await hasWayfarerPlus(supabase, userData.user.id))) {
  return json({ error: "wayfarer_plus_required", message: "..." }, 402);
}
// Below this line: future Lovable AI Gateway call via @ai-sdk/openai-compatible.
// Stubbed but not wired — leaves a clear single insertion point.
```

Also leave a commented `streamText` / `generateText` skeleton using `createLovableAiGatewayProvider` (per the `ai-sdk-lovable-gateway` knowledge file) so the day Wayfarer+ ships, the only work is implementing `hasWayfarerPlus` and uncommenting the call. **No `LOVABLE_API_KEY` consumption happens in this round** — the function still returns 402 to every user.

`src/lib/scroll-ai.ts`'s `userHasPaidTier()` keeps returning `false`. No client-visible behavior change from this step today; it's purely structural debt-clearing.

## 4. Memory updates

Add one new project memory entry under `mem://features/scroll-ai-byok`:
- Scroll AI uses BYOK (OpenRouter recommended, OpenAI/Anthropic/Google supported). Keys are AES-GCM encrypted in IndexedDB, never sent to Xcrol servers. The `scroll-ai` edge function is gated behind `hasWayfarerPlus()` which returns `false` until memberships ship.

---

## Files touched

| File | Change |
| --- | --- |
| `src/components/settings/AiAssistanceSection.tsx` | OpenRouter-first ordering + recommendation chip + anchor id + "Get an OpenRouter key" button |
| `src/components/ScrollAiButton.tsx` | Missing-key toast becomes actionable deep-link to settings |
| `src/pages/ScrollEditor.tsx` | "BYOK active" pill; audit existing ScrollAiButton usages |
| `src/pages/ScrollAiTutorial.tsx` | Add cost table; reorder providers; reinforce privacy |
| `src/pages/Settings.tsx` | Verify section mount/order; add anchor target |
| `src/lib/scroll-ai-keystore.ts` | Change `PROVIDER_DEFAULT_MODELS` ordering presentation only if needed (no behavior change) |
| `supabase/functions/scroll-ai/index.ts` | Replace hard-402 with `hasWayfarerPlus()` stub; add commented gateway-call skeleton |
| `mem://features/scroll-ai-byok` + `mem://index.md` | New memory entry |

## Files NOT touched
- Database schema (no migrations)
- RLS policies
- Any non-Scroll AI feature
- Nightly backup, restore-verify, health endpoint (the three previous tasks are stable)

## Out of scope (explicit non-goals)
- Building Wayfarer+ membership/billing
- Actually calling Lovable AI Gateway from `scroll-ai` (skeleton only)
- Server-side rate limiting on BYOK calls (browser→provider direct; provider handles it)
- Migrating any existing Lovable AI edge functions

## Verification checklist
1. Settings → AI Assistance card visible; OpenRouter selected by default; Test connection succeeds with a real key.
2. From any scroll, clicking an AI action with **no key** shows a toast with a working "Open settings" button.
3. With a key set: each of the four actions returns a result and accept-flow writes back to the editor.
4. `scroll-ai` edge function still returns 402 for everyone (current behavior preserved), but the code now routes through `hasWayfarerPlus()`.
5. `/scrolls/ai-setup` lists OpenRouter first with cost guidance.
