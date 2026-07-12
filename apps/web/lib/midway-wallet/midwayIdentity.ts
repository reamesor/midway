/**
 * Midway wallet identity (DEMO).
 *
 * Each profile (main wallet pubkey or DEMO_GUEST) gets a one-time Solana
 * keypair whose **public key** is the Midway wallet address — the play purse
 * shown in PROFILE / WALLET / Colors.
 *
 * Approach:
 * - Generate with `@solana/web3.js` Keypair once per profile key.
 * - Persist only the **public address** in localStorage (and on MidwayProfile).
 * - Do **not** store the secret key. Balance is an app ledger keyed by the
 *   profile identity, not a real funded on-chain account. Future custody can
 *   mint/assign a real PDA or custodial account behind the same address field.
 */

import { Keypair } from "@solana/web3.js";

export type MidwayWalletIdentity = {
  /** Midway wallet public address (base58). */
  address: string;
  createdAt: number;
  /** Profile key this address belongs to (main wallet pubkey or DEMO_GUEST). */
  profileKey: string;
};

const KEY = (profileKey: string) => `midway-wallet-id:v1:${profileKey}`;

export const MIDWAY_WALLET_EVENT = "midway-wallet-id";

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

function isBase58Pubkey(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

/** Load existing Midway wallet identity, or null. */
export function loadMidwayWalletIdentity(
  profileKey: string,
): MidwayWalletIdentity | null {
  if (!profileKey) return null;
  const stored = readJson<Partial<MidwayWalletIdentity> | null>(KEY(profileKey), null);
  if (!stored?.address || !isBase58Pubkey(stored.address)) return null;
  return {
    address: stored.address,
    createdAt:
      typeof stored.createdAt === "number" ? stored.createdAt : Date.now(),
    profileKey,
  };
}

/**
 * Ensure a Midway wallet address exists for this profile.
 * Idempotent — returns the same address on subsequent calls.
 */
export function ensureMidwayWallet(profileKey: string): MidwayWalletIdentity {
  const existing = loadMidwayWalletIdentity(profileKey);
  if (existing) return existing;

  const kp = Keypair.generate();
  const identity: MidwayWalletIdentity = {
    address: kp.publicKey.toBase58(),
    createdAt: Date.now(),
    profileKey,
  };
  // Intentionally discard secret key — DEMO uses address as identity only.
  writeJson(KEY(profileKey), {
    address: identity.address,
    createdAt: identity.createdAt,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MIDWAY_WALLET_EVENT, {
        detail: { profileKey, address: identity.address },
      }),
    );
  }
  return identity;
}

/** Clear Midway wallet identity (rare — demo reset / unlink). */
export function clearMidwayWalletIdentity(profileKey: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(profileKey));
    window.dispatchEvent(
      new CustomEvent(MIDWAY_WALLET_EVENT, {
        detail: { profileKey, address: null },
      }),
    );
  } catch {
    /* ignore */
  }
}
