/**
 * Shared prompt definitions for Scroll AI Assistance.
 *
 * Used by both the BYOK browser path and the Xcrol AI edge function so
 * output quality stays consistent across tiers.
 *
 * HARD RULE — repeated in every system prompt:
 *   AI MUST NEVER rewrite, summarise, or paraphrase content marked
 *   ORIGINAL_POST. It is immutable. AI may only return author-facing
 *   metadata (titles, blurbs, chapter labels) or rewrite text marked
 *   INTERLUDE.
 */

export type ScrollAiAction =
  | "suggest_title"
  | "suggest_blurb"
  | "suggest_chapters"
  | "polish_interlude";

export interface ScrollItemForAi {
  item_id: string;
  item_type: "xcrol" | "group_post" | "interlude";
  item_date: string | null;
  group_name: string | null;
  content: string | null;
  custom_title: string | null;
  chapter_label: string | null;
}

export interface ScrollContextForAi {
  title: string;
  subtitle: string | null;
  blurb: string | null;
  items: ScrollItemForAi[];
}

const IMMUTABILITY_RULE = `
CRITICAL RULE: You must NEVER rewrite, summarise, paraphrase, translate or
shorten any item marked ORIGINAL_POST. Treat ORIGINAL_POST text as immutable
source material written by the human author at a specific point in their life.
You may only:
- Return new author-facing metadata (titles, blurbs, chapter labels)
- Rewrite text explicitly marked INTERLUDE
Never include ORIGINAL_POST text in your response.`.trim();

function renderItems(items: ScrollItemForAi[]): string {
  return items
    .map((it, i) => {
      const tag = it.item_type === "interlude" ? "INTERLUDE" : "ORIGINAL_POST";
      const date = it.item_date ? ` date=${it.item_date}` : "";
      const group = it.group_name ? ` group="${it.group_name}"` : "";
      const chapter = it.chapter_label ? ` chapter="${it.chapter_label}"` : "";
      const body = (it.content ?? "").slice(0, 800);
      return `[${i + 1}] <${tag} id="${it.item_id}"${date}${group}${chapter}>\n${body}\n</${tag}>`;
    })
    .join("\n\n");
}

export interface PromptSpec {
  system: string;
  user: string;
  /** JSON schema describing exact output shape. */
  schema: Record<string, unknown>;
  /** Name passed to tool/function calling. */
  schemaName: string;
}

export function buildPrompt(
  action: ScrollAiAction,
  ctx: ScrollContextForAi,
  payload?: { interludeText?: string },
): PromptSpec {
  const itemsBlock = renderItems(ctx.items);
  const header = `Scroll title: ${ctx.title}
Scroll subtitle: ${ctx.subtitle ?? "(none)"}
Scroll blurb: ${ctx.blurb ?? "(none)"}

Items in order:
${itemsBlock}`;

  switch (action) {
    case "suggest_title":
      return {
        schemaName: "return_title_candidates",
        system: `You are a thoughtful book editor helping an author title a personal Scroll — a curated, chronological record of their own posts and reflections. Suggest titles that feel literary, specific to the content, and not generic. Avoid clickbait, emojis, and colons unless natural.\n\n${IMMUTABILITY_RULE}`,
        user: `${header}\n\nSuggest 3 candidate titles for this Scroll. Each must be at most 60 characters.`,
        schema: {
          type: "object",
          properties: {
            candidates: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string", maxLength: 80 },
            },
          },
          required: ["candidates"],
          additionalProperties: false,
        },
      };

    case "suggest_blurb":
      return {
        schemaName: "return_blurb_candidates",
        system: `You are a thoughtful book editor writing back-cover blurbs for a personal Scroll. Blurbs must be warm, specific, and grounded in what's actually in the Scroll — no generic praise, no emojis.\n\n${IMMUTABILITY_RULE}`,
        user: `${header}\n\nWrite 2 candidate blurbs. Each at most 280 characters.`,
        schema: {
          type: "object",
          properties: {
            candidates: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string", maxLength: 320 },
            },
          },
          required: ["candidates"],
          additionalProperties: false,
        },
      };

    case "suggest_chapters":
      return {
        schemaName: "return_chapter_labels",
        system: `You are organising a personal Scroll into chapters. Group consecutive items by natural date clusters and shared themes you actually see. Give each cluster a short, evocative chapter label (2–5 words). Return one chapter_label per item. Items in the same cluster share the same label. Do not invent themes that aren't supported by the items.\n\n${IMMUTABILITY_RULE}`,
        user: `${header}\n\nReturn a chapter_label for every item, in order. Use the item id from the tag.`,
        schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item_id: { type: "string" },
                  chapter_label: { type: "string", maxLength: 60 },
                },
                required: ["item_id", "chapter_label"],
                additionalProperties: false,
              },
            },
          },
          required: ["assignments"],
          additionalProperties: false,
        },
      };

    case "polish_interlude":
      return {
        schemaName: "return_polished_interlude",
        system: `You are a gentle line editor. Tighten the author's INTERLUDE for clarity and rhythm. Preserve their voice, tense and meaning exactly. Do not add new facts, claims, or sentiment. Do not exceed the original length by more than 10%. Return only the rewritten interlude text.\n\n${IMMUTABILITY_RULE}`,
        user: `Context (for tone only — do not copy from it):\n${header}\n\nINTERLUDE to polish:\n"""\n${payload?.interludeText ?? ""}\n"""`,
        schema: {
          type: "object",
          properties: { polished: { type: "string" } },
          required: ["polished"],
          additionalProperties: false,
        },
      };
  }
}
