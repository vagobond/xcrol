import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import { Relay } from "nostr-tools/relay";
import { getSecretKey } from "@/lib/nostr-keystore";

const PUBLISH_KEY = "xcrol_nostr_publish";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

export function isNostrPublishEnabled(): boolean {
  return localStorage.getItem(PUBLISH_KEY) === "true";
}

export function setNostrPublishEnabled(val: boolean) {
  localStorage.setItem(PUBLISH_KEY, val ? "true" : "false");
}

export async function publishToNostr(content: string): Promise<boolean> {
  const sk = await getSecretKey();
  if (!sk) return false;

  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
    },
    sk
  );

  if (!verifyEvent(event)) return false;

  let published = false;
  await Promise.allSettled(
    DEFAULT_RELAYS.map(async (url) => {
      const relay = await Relay.connect(url);
      try {
        await relay.publish(event);
        published = true;
      } finally {
        relay.close();
      }
    })
  );

  return published;
}
