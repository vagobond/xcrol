/**
 * NOSTR Key Storage using IndexedDB + Web Crypto API
 *
 * The raw secret key bytes are AES-GCM encrypted with a non-extractable
 * CryptoKey that lives inside IndexedDB (structured-clone preserves the
 * non-extractable flag). This keeps the private key material opaque to
 * any JS running on the page — it can only be decrypted through the
 * browser's crypto engine.
 *
 * ⚠️  Clearing browser data / IndexedDB will permanently destroy the key.
 */

const DB_NAME = "xcrol_nostr";
const STORE_NAME = "keys";
const WRAPPING_KEY_ID = "wrapping_key";
const ENCRYPTED_NSEC_ID = "encrypted_nsec";

// Legacy localStorage key – used for one-time migration
const LEGACY_STORAGE_KEY = "xcrol_nostr_nsec_encrypted";

/* ---------- IndexedDB helpers ---------- */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Web Crypto helpers ---------- */

async function getOrCreateWrappingKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(WRAPPING_KEY_ID);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
  await idbPut(WRAPPING_KEY_ID, key);
  return key;
}

interface EncryptedPayload {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext as unknown as BufferSource
  );
  return { iv, ciphertext };
}

async function decryptBytes(
  key: CryptoKey,
  payload: EncryptedPayload
): Promise<Uint8Array> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: payload.iv as unknown as BufferSource },
    key,
    payload.ciphertext
  );
  return new Uint8Array(plain);
}

/* ---------- Public API ---------- */

/**
 * Store a NOSTR secret key (raw 32-byte Uint8Array) in IndexedDB,
 * encrypted with a non-extractable AES-GCM key.
 */
export async function storeSecretKey(sk: Uint8Array): Promise<void> {
  const wrappingKey = await getOrCreateWrappingKey();
  const encrypted = await encryptBytes(wrappingKey, sk);
  await idbPut(ENCRYPTED_NSEC_ID, encrypted);
  // Clean up legacy localStorage entry if present
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/**
 * Retrieve the raw 32-byte NOSTR secret key from IndexedDB.
 * Returns null if no key is stored or decryption fails.
 */
export async function getSecretKey(): Promise<Uint8Array | null> {
  try {
    // Try IndexedDB first
    const wrappingKey = await idbGet<CryptoKey>(WRAPPING_KEY_ID);
    const encrypted = await idbGet<EncryptedPayload>(ENCRYPTED_NSEC_ID);

    if (wrappingKey && encrypted) {
      return await decryptBytes(wrappingKey, encrypted);
    }

    // Fallback: migrate from legacy localStorage
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const nsec = atob(legacy);
      if (nsec.startsWith("nsec")) {
      const nip19 = await import("nostr-tools/nip19");
        const decoded = nip19.decode(nsec);
        if (decoded.type === "nsec") {
          const sk = decoded.data as Uint8Array;
          await storeSecretKey(sk); // migrate to IndexedDB
          return sk;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a local private key exists (quick check without decryption).
 */
export async function hasLocalKey(): Promise<boolean> {
  try {
    const encrypted = await idbGet<EncryptedPayload>(ENCRYPTED_NSEC_ID);
    if (encrypted) return true;
    // Check legacy
    return !!localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return false;
  }
}

/**
 * Delete the stored secret key from IndexedDB and legacy localStorage.
 */
export async function deleteSecretKey(): Promise<void> {
  await idbDelete(ENCRYPTED_NSEC_ID);
  await idbDelete(WRAPPING_KEY_ID);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
