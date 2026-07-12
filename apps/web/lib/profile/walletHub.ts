/**
 * Multi-wallet profile hub — up to 5 linked pubkeys, primary + active slot.
 * Per-wallet play data still lives under existing pubkey-keyed stores.
 */

/** Matches DemoGuestContext — guest is never a linked hub slot. */
const DEMO_GUEST = "DEMO_GUEST";

export const MAX_LINKED_WALLETS = 5;

export type WalletSlot = {
  /** Normalized base58 pubkey (never DEMO_GUEST). */
  pubkey: string;
  /** Optional short label for the slot. */
  label: string;
  linkedAt: number;
  lastConnectedAt: number;
  lastActivityAt: number;
};

export type ProfileWalletHub = {
  primaryPubkey: string | null;
  activePubkey: string | null;
  slots: WalletSlot[];
  updatedAt: number;
};

const HUB_KEY = "midway-profile-hub:v1";
export const WALLET_HUB_EVENT = "midway-wallet-hub";

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
    /* quota / private mode */
  }
}

function notify(hub: ProfileWalletHub) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WALLET_HUB_EVENT, { detail: hub }));
}

/** Normalize pubkey identity keys — trim, reject empty / guest sentinel. */
export function normalizePubkey(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const pk = raw.trim();
  if (!pk || pk === DEMO_GUEST) return null;
  // Solana base58 pubkeys are 32–44 chars; allow slightly wider for future.
  if (pk.length < 32 || pk.length > 64) return null;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(pk)) return null;
  return pk;
}

function emptyHub(): ProfileWalletHub {
  return {
    primaryPubkey: null,
    activePubkey: null,
    slots: [],
    updatedAt: Date.now(),
  };
}

function sanitizeHub(raw: ProfileWalletHub | null): ProfileWalletHub {
  if (!raw || !Array.isArray(raw.slots)) return emptyHub();
  const seen = new Set<string>();
  const slots: WalletSlot[] = [];
  for (const s of raw.slots) {
    const pk = normalizePubkey(s?.pubkey);
    if (!pk || seen.has(pk)) continue;
    seen.add(pk);
    slots.push({
      pubkey: pk,
      label: typeof s.label === "string" ? s.label.slice(0, 24) : "",
      linkedAt: typeof s.linkedAt === "number" ? s.linkedAt : Date.now(),
      lastConnectedAt:
        typeof s.lastConnectedAt === "number" ? s.lastConnectedAt : Date.now(),
      lastActivityAt:
        typeof s.lastActivityAt === "number" ? s.lastActivityAt : Date.now(),
    });
    if (slots.length >= MAX_LINKED_WALLETS) break;
  }
  const primary =
    normalizePubkey(raw.primaryPubkey) &&
    slots.some((s) => s.pubkey === raw.primaryPubkey)
      ? raw.primaryPubkey
      : (slots[0]?.pubkey ?? null);
  const active =
    normalizePubkey(raw.activePubkey) &&
    slots.some((s) => s.pubkey === raw.activePubkey)
      ? raw.activePubkey
      : primary;
  return {
    primaryPubkey: primary,
    activePubkey: active,
    slots,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
  };
}

export function loadWalletHub(): ProfileWalletHub {
  return sanitizeHub(readJson<ProfileWalletHub | null>(HUB_KEY, null));
}

function saveHub(hub: ProfileWalletHub): ProfileWalletHub {
  const next = { ...sanitizeHub(hub), updatedAt: Date.now() };
  writeJson(HUB_KEY, next);
  notify(next);
  return next;
}

export type AttachResult =
  | { ok: true; hub: ProfileWalletHub; created: boolean }
  | { ok: false; error: string; hub: ProfileWalletHub };

/**
 * Link a connected wallet into the hub (max 5).
 * Reconnecting an existing address refreshes lastConnected / activity.
 */
export function attachWallet(rawPubkey: string): AttachResult {
  const pubkey = normalizePubkey(rawPubkey);
  const hub = loadWalletHub();
  if (!pubkey) {
    return { ok: false, error: "Invalid wallet address.", hub };
  }
  const now = Date.now();
  const existing = hub.slots.find((s) => s.pubkey === pubkey);
  if (existing) {
    const slots = hub.slots.map((s) =>
      s.pubkey === pubkey
        ? { ...s, lastConnectedAt: now, lastActivityAt: now }
        : s,
    );
    const next = saveHub({
      ...hub,
      slots,
      activePubkey: pubkey,
      primaryPubkey: hub.primaryPubkey ?? pubkey,
    });
    return { ok: true, hub: next, created: false };
  }
  if (hub.slots.length >= MAX_LINKED_WALLETS) {
    return {
      ok: false,
      error: `Profile is full (${MAX_LINKED_WALLETS} wallets). Remove one first.`,
      hub,
    };
  }
  const slot: WalletSlot = {
    pubkey,
    label: "",
    linkedAt: now,
    lastConnectedAt: now,
    lastActivityAt: now,
  };
  const slots = [...hub.slots, slot];
  const next = saveHub({
    ...hub,
    slots,
    activePubkey: pubkey,
    primaryPubkey: hub.primaryPubkey ?? pubkey,
  });
  return { ok: true, hub: next, created: true };
}

export function removeWallet(rawPubkey: string): ProfileWalletHub {
  const pubkey = normalizePubkey(rawPubkey);
  const hub = loadWalletHub();
  if (!pubkey) return hub;
  const slots = hub.slots.filter((s) => s.pubkey !== pubkey);
  const primary =
    hub.primaryPubkey === pubkey ? (slots[0]?.pubkey ?? null) : hub.primaryPubkey;
  const active =
    hub.activePubkey === pubkey ? (primary ?? slots[0]?.pubkey ?? null) : hub.activePubkey;
  return saveHub({ ...hub, slots, primaryPubkey: primary, activePubkey: active });
}

export function setPrimaryWallet(rawPubkey: string): AttachResult {
  const pubkey = normalizePubkey(rawPubkey);
  const hub = loadWalletHub();
  if (!pubkey || !hub.slots.some((s) => s.pubkey === pubkey)) {
    return { ok: false, error: "Wallet not linked to this profile.", hub };
  }
  return {
    ok: true,
    hub: saveHub({ ...hub, primaryPubkey: pubkey }),
    created: false,
  };
}

/** Soft-switch which wallet's ledger / stats the PROFILE and play pot show. */
export function setActiveWallet(rawPubkey: string): AttachResult {
  const pubkey = normalizePubkey(rawPubkey);
  const hub = loadWalletHub();
  if (!pubkey || !hub.slots.some((s) => s.pubkey === pubkey)) {
    return { ok: false, error: "Wallet not linked to this profile.", hub };
  }
  const now = Date.now();
  const slots = hub.slots.map((s) =>
    s.pubkey === pubkey ? { ...s, lastActivityAt: now } : s,
  );
  return {
    ok: true,
    hub: saveHub({ ...hub, slots, activePubkey: pubkey }),
    created: false,
  };
}

export function setWalletLabel(rawPubkey: string, label: string): AttachResult {
  const pubkey = normalizePubkey(rawPubkey);
  const hub = loadWalletHub();
  if (!pubkey || !hub.slots.some((s) => s.pubkey === pubkey)) {
    return { ok: false, error: "Wallet not linked to this profile.", hub };
  }
  const clean = label.trim().slice(0, 24);
  const slots = hub.slots.map((s) =>
    s.pubkey === pubkey ? { ...s, label: clean } : s,
  );
  return {
    ok: true,
    hub: saveHub({ ...hub, slots }),
    created: false,
  };
}

export function touchWalletActivity(rawPubkey: string) {
  const pubkey = normalizePubkey(rawPubkey);
  if (!pubkey) return;
  const hub = loadWalletHub();
  if (!hub.slots.some((s) => s.pubkey === pubkey)) return;
  const now = Date.now();
  const slots = hub.slots.map((s) =>
    s.pubkey === pubkey ? { ...s, lastActivityAt: now } : s,
  );
  saveHub({ ...hub, slots });
}
