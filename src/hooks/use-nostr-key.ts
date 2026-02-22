import { useState, useEffect } from "react";
import { getSecretKey, hasLocalKey } from "@/lib/nostr-keystore";

/**
 * React hook that exposes the NOSTR secret key from IndexedDB.
 * Returns { privateKey, hasKey, loading }.
 * `privateKey` is the raw 32-byte Uint8Array or null.
 */
export function useNostrKey() {
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const exists = await hasLocalKey();
      if (cancelled) return;
      setHasKey(exists);
      if (exists) {
        const sk = await getSecretKey();
        if (!cancelled) setPrivateKey(sk);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /** Re-check the key (call after generate/import/delete) */
  const refresh = async () => {
    setLoading(true);
    const exists = await hasLocalKey();
    setHasKey(exists);
    if (exists) {
      const sk = await getSecretKey();
      setPrivateKey(sk);
    } else {
      setPrivateKey(null);
    }
    setLoading(false);
  };

  return { privateKey, hasKey, loading, refresh };
}
