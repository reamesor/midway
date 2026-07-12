/**
 * Per-wallet believers share claimable balance (local DEMO accrual).
 */

const KEY = (pubkey: string) => `midway-believers-share:v1:${pubkey}`;
export const SHARE_EVENT = "midway-believers-share";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function notify(pubkey: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHARE_EVENT, { detail: { pubkey } }));
}

export function loadBelieversShare(pubkey: string): number {
  const stored = readJson<{ claimable?: number } | number | null>(KEY(pubkey), null);
  if (typeof stored === "number") return Math.max(0, stored);
  if (stored && typeof stored.claimable === "number") {
    return Math.max(0, stored.claimable);
  }
  return 0;
}

export function saveBelieversShare(pubkey: string, claimable: number) {
  const next = Math.max(0, Math.round(claimable * 1e6) / 1e6);
  writeJson(KEY(pubkey), { claimable: next, updatedAt: Date.now() });
  notify(pubkey);
}

export function addBelieversShare(pubkey: string, delta: number): number {
  const next = loadBelieversShare(pubkey) + Math.max(0, delta);
  saveBelieversShare(pubkey, next);
  return next;
}

export function claimBelieversShare(pubkey: string): number {
  const amount = loadBelieversShare(pubkey);
  saveBelieversShare(pubkey, 0);
  return amount;
}
