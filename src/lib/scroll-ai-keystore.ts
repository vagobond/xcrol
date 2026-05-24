/**
 * BYOK key storage for Scroll AI Assistance.
 *
 * The user's third-party AI provider key is AES-GCM encrypted with a
 * non-extractable CryptoKey kept in IndexedDB. It NEVER leaves the
 * browser — Xcrol servers do not see it.
 *
 * Clearing browser data destroys the key.
 */

const DB_NAME = "xcrol_scroll_ai";
const STORE_NAME = "byok";
const WRAPPING_KEY_ID = "wrapping_key";
const ENCRYPTED_KEY_ID = "encrypted_provider_key";
const CONFIG_ID = "provider_config";

export type ByokProvider = "openai" | "google" | "anthropic" | "openrouter";

export interface ByokConfig {
  provider: ByokProvider;
  model: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
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

async function getOrCreateWrappingKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(WRAPPING_KEY_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await idbPut(WRAPPING_KEY_ID, key);
  return key;
}

interface EncryptedPayload {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

export async function storeByokKey(apiKey: string, config: ByokConfig): Promise<void> {
  const wrappingKey = await getOrCreateWrappingKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    new TextEncoder().encode(apiKey),
  );
  await idbPut(ENCRYPTED_KEY_ID, { iv, ciphertext } satisfies EncryptedPayload);
  await idbPut(CONFIG_ID, config);
}

export async function getByokKey(): Promise<string | null> {
  try {
    const wrappingKey = await idbGet<CryptoKey>(WRAPPING_KEY_ID);
    const encrypted = await idbGet<EncryptedPayload>(ENCRYPTED_KEY_ID);
    if (!wrappingKey || !encrypted) return null;
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: encrypted.iv as unknown as BufferSource },
      wrappingKey,
      encrypted.ciphertext,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function getByokConfig(): Promise<ByokConfig | null> {
  return (await idbGet<ByokConfig>(CONFIG_ID)) ?? null;
}

export async function hasByokKey(): Promise<boolean> {
  return !!(await idbGet<EncryptedPayload>(ENCRYPTED_KEY_ID));
}

export async function deleteByokKey(): Promise<void> {
  await idbDelete(ENCRYPTED_KEY_ID);
  await idbDelete(CONFIG_ID);
}

export const PROVIDER_LABELS: Record<ByokProvider, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  anthropic: "Anthropic Claude",
  openrouter: "OpenRouter",
};

export const PROVIDER_DEFAULT_MODELS: Record<ByokProvider, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  anthropic: "claude-3-5-haiku-latest",
  openrouter: "openai/gpt-4o-mini",
};
