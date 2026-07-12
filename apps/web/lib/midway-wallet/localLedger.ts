import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import {
  DEMO_PLAY_BALANCE,
  EMPTY_PLAY_BALANCE,
  type MidwayPlayBalance,
  type MidwayWalletLedgerEntry,
} from "./types";

/** v2 = seed / migrate to fixed DEMO Midway wallet play balance. */
const KEY = (pubkey: string) => `midway-play-wallet:v2:${pubkey}`;
const LOG_KEY = (pubkey: string) => `midway-play-wallet-log:v2:${pubkey}`;

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

export function loadPlayBalance(pubkey: string): MidwayPlayBalance {
  const stored = readJson<MidwayPlayBalance | null>(KEY(pubkey), null);
  if (!stored || typeof stored.sol !== "number") {
    const seeded = DEMO_PLAY_BALANCE();
    writeJson(KEY(pubkey), seeded);
    return seeded;
  }
  return {
    sol: Math.max(0, stored.sol),
    midway: Math.max(0, stored.midway ?? 0),
    updatedAt: stored.updatedAt || Date.now(),
  };
}

export function savePlayBalance(pubkey: string, balance: MidwayPlayBalance) {
  writeJson(KEY(pubkey), { ...balance, updatedAt: Date.now() });
}

export function resetPlayBalance(pubkey: string): MidwayPlayBalance {
  const next = DEMO_PLAY_BALANCE();
  writeJson(KEY(pubkey), next);
  return next;
}

export function appendLedger(
  pubkey: string,
  entry: Omit<MidwayWalletLedgerEntry, "id" | "at"> & { at?: number },
) {
  const log = readJson<MidwayWalletLedgerEntry[]>(LOG_KEY(pubkey), []);
  const next: MidwayWalletLedgerEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at ?? Date.now(),
    kind: entry.kind,
    asset: entry.asset,
    amount: entry.amount,
    note: entry.note,
  };
  writeJson(LOG_KEY(pubkey), [next, ...log].slice(0, 100));
  return next;
}

/** Derive DEMO net P/L from ledger (wins − bets + claims − losses logged). */
export function deriveLedgerPnL(pubkey: string): {
  betSpent: number;
  winsReturned: number;
  losses: number;
  claims: number;
  net: number;
} {
  const log = loadLedger(pubkey);
  let betSpent = 0;
  let winsReturned = 0;
  let losses = 0;
  let claims = 0;
  for (const e of log) {
    if (e.asset !== "SOL") continue;
    switch (e.kind) {
      case "bet_debit":
        betSpent += e.amount;
        break;
      case "bet_credit":
        winsReturned += e.amount;
        break;
      case "bet_loss":
        losses += e.amount;
        break;
      case "claim":
        claims += e.amount;
        break;
      default:
        break;
    }
  }
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  const net = round(winsReturned + claims - betSpent);
  return {
    betSpent: round(betSpent),
    winsReturned: round(winsReturned),
    losses: round(losses),
    claims: round(claims),
    net,
  };
}

export function loadLedger(pubkey: string): MidwayWalletLedgerEntry[] {
  return readJson<MidwayWalletLedgerEntry[]>(LOG_KEY(pubkey), []);
}

export function roundPlay(n: number) {
  return Math.round(Math.max(0, n) * 1e6) / 1e6;
}

/** Cap demo SOL deposits so Midway wallet stays at DEMO_PLAY_SOL max from top-ups. */
export function remainingDemoDepositCap(currentSol: number): number {
  return roundPlay(Math.max(0, DEMO_PLAY_SOL - currentSol));
}

export function clearDisconnectedBalance(): MidwayPlayBalance {
  return EMPTY_PLAY_BALANCE();
}
