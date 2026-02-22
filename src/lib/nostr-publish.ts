import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import * as nip19 from "nostr-tools/nip19";
import { Relay } from "nostr-tools/relay";

const STORAGE_KEY = "xcrol_nostr_nsec_encrypted";
const PUBLISH_KEY = "xcrol_nostr_publish";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

function decryptNsec(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return "";
  }
}

export function isNostrPublishEnabled(): boolean {
  return localStorage.getItem(PUBLISH_KEY) === "true";
}

export function setNostrPublishEnabled(val: boolean) {
  localStorage.setItem(PUBLISH_KEY, val ? "true" : "false");
}

export async function publishToNostr(content: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  const nsec = decryptNsec(stored);
  if (!nsec || !nsec.startsWith("nsec")) return false;

  let sk: Uint8Array;
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== "nsec") return false;
    sk = decoded.data as Uint8Array;
  } catch {
    return false;
  }

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
  const results = await Promise.allSettled(
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
