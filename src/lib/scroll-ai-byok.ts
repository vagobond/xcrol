/**
 * Browser-side adapters for "Bring Your Own Key" AI providers.
 * Calls go directly browser -> provider. Xcrol servers are not involved.
 */

import type { ByokConfig, ByokProvider } from "./scroll-ai-keystore";
import type { PromptSpec } from "./scroll-ai-prompts";

export class ByokError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function callOpenAiCompatible(
  endpoint: string,
  headers: Record<string, string>,
  model: string,
  spec: PromptSpec,
): Promise<unknown> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: spec.system },
        { role: "user", content: spec.user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: spec.schemaName,
            description: "Return the requested structured result.",
            parameters: spec.schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: spec.schemaName } },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ByokError(res.status, text || `Provider error ${res.status}`);
  }
  const data = await res.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new ByokError(500, "Provider returned no structured output.");
  try {
    return JSON.parse(args);
  } catch {
    throw new ByokError(500, "Could not parse provider response.");
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  spec: PromptSpec,
): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: spec.system,
      messages: [{ role: "user", content: spec.user }],
      tools: [
        {
          name: spec.schemaName,
          description: "Return the requested structured result.",
          input_schema: spec.schema,
        },
      ],
      tool_choice: { type: "tool", name: spec.schemaName },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ByokError(res.status, text || `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  const toolUse = data?.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse?.input) throw new ByokError(500, "Anthropic returned no structured output.");
  return toolUse.input;
}

async function callGoogle(
  apiKey: string,
  model: string,
  spec: PromptSpec,
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: spec.system }] },
      contents: [{ role: "user", parts: [{ text: spec.user }] }],
      tools: [
        {
          functionDeclarations: [
            {
              name: spec.schemaName,
              description: "Return the requested structured result.",
              parameters: spec.schema,
            },
          ],
        },
      ],
      toolConfig: {
        functionCallingConfig: { mode: "ANY", allowedFunctionNames: [spec.schemaName] },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ByokError(res.status, text || `Google error ${res.status}`);
  }
  const data = await res.json();
  const call = data?.candidates?.[0]?.content?.parts?.find(
    (p: { functionCall?: unknown }) => p.functionCall,
  )?.functionCall;
  if (!call?.args) throw new ByokError(500, "Google returned no structured output.");
  return call.args;
}

export async function callByok(
  apiKey: string,
  config: ByokConfig,
  spec: PromptSpec,
): Promise<unknown> {
  switch (config.provider) {
    case "openai":
      return callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        { Authorization: `Bearer ${apiKey}` },
        config.model,
        spec,
      );
    case "openrouter":
      return callOpenAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "Xcrol Scrolls",
        },
        config.model,
        spec,
      );
    case "anthropic":
      return callAnthropic(apiKey, config.model, spec);
    case "google":
      return callGoogle(apiKey, config.model, spec);
  }
}

/** Lightweight connection test for the Settings UI. */
export async function testByokKey(provider: ByokProvider, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case "openai": {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return r.ok;
      }
      case "openrouter": {
        const r = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return r.ok;
      }
      case "anthropic": {
        const r = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
        });
        return r.ok;
      }
      case "google": {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        );
        return r.ok;
      }
    }
  } catch {
    return false;
  }
}
