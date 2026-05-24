/**
 * Scroll AI router.
 *
 * Free users -> direct call to their BYOK provider (browser only).
 * Paid users -> Xcrol AI edge function (gated "coming soon" for now).
 */

import { supabase } from "@/integrations/supabase/client";
import { callByok, ByokError } from "./scroll-ai-byok";
import {
  getByokConfig,
  getByokKey,
  hasByokKey,
} from "./scroll-ai-keystore";
import {
  buildPrompt,
  type ScrollAiAction,
  type ScrollContextForAi,
} from "./scroll-ai-prompts";

export type ScrollAiResult =
  | { kind: "title"; candidates: string[] }
  | { kind: "blurb"; candidates: string[] }
  | { kind: "chapters"; assignments: { item_id: string; chapter_label: string }[] }
  | { kind: "interlude"; polished: string };

export class ScrollAiError extends Error {
  constructor(
    public code:
      | "no_byok_key"
      | "paid_coming_soon"
      | "provider_error"
      | "rate_limited"
      | "credits_exhausted"
      | "invalid_response",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Tier detection. Wayfarer+ is not yet sold, so this always returns false
 * today. The edge function is the real source of truth.
 */
export function userHasPaidTier(): boolean {
  return false;
}

export async function runScrollAi(
  scrollId: string,
  action: ScrollAiAction,
  ctx: ScrollContextForAi,
  payload?: { interludeText?: string },
): Promise<ScrollAiResult> {
  const spec = buildPrompt(action, ctx, payload);

  if (userHasPaidTier()) {
    // Future: invoke edge function. For now this branch is unreachable.
    return invokeEdge(scrollId, action, payload);
  }

  if (!(await hasByokKey())) {
    throw new ScrollAiError("no_byok_key", "Add your AI provider key to use this feature.");
  }
  const apiKey = await getByokKey();
  const config = await getByokConfig();
  if (!apiKey || !config) {
    throw new ScrollAiError("no_byok_key", "Add your AI provider key to use this feature.");
  }

  let raw: unknown;
  try {
    raw = await callByok(apiKey, config, spec);
  } catch (e) {
    if (e instanceof ByokError) {
      if (e.status === 429) throw new ScrollAiError("rate_limited", "Your provider is rate-limiting you. Try again shortly.");
      if (e.status === 402) throw new ScrollAiError("credits_exhausted", "Your provider account is out of credit.");
      throw new ScrollAiError("provider_error", e.message);
    }
    throw new ScrollAiError("provider_error", e instanceof Error ? e.message : String(e));
  }

  return parseResult(action, raw);
}

async function invokeEdge(
  scrollId: string,
  action: ScrollAiAction,
  payload?: { interludeText?: string },
): Promise<ScrollAiResult> {
  const { data, error } = await supabase.functions.invoke("scroll-ai", {
    body: { scroll_id: scrollId, action, payload },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const status = ctx?.status;
    if (status === 402) throw new ScrollAiError("paid_coming_soon", "Xcrol AI is coming soon.");
    if (status === 429) throw new ScrollAiError("rate_limited", "Daily limit reached.");
    throw new ScrollAiError("provider_error", error.message);
  }
  return parseResult(action, data);
}

function parseResult(action: ScrollAiAction, raw: unknown): ScrollAiResult {
  const r = raw as Record<string, unknown>;
  switch (action) {
    case "suggest_title":
      if (!Array.isArray(r?.candidates)) throw new ScrollAiError("invalid_response", "Bad AI response.");
      return { kind: "title", candidates: r.candidates as string[] };
    case "suggest_blurb":
      if (!Array.isArray(r?.candidates)) throw new ScrollAiError("invalid_response", "Bad AI response.");
      return { kind: "blurb", candidates: r.candidates as string[] };
    case "suggest_chapters":
      if (!Array.isArray(r?.assignments)) throw new ScrollAiError("invalid_response", "Bad AI response.");
      return {
        kind: "chapters",
        assignments: r.assignments as { item_id: string; chapter_label: string }[],
      };
    case "polish_interlude":
      if (typeof r?.polished !== "string") throw new ScrollAiError("invalid_response", "Bad AI response.");
      return { kind: "interlude", polished: r.polished };
  }
}
