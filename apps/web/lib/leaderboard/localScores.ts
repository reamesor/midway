/**
 * Demo / local Colors leaderboard.
 * Player stats keyed by pubkey; board merges seeded demo rows + live local players.
 * Shape is ready to swap for a future API.
 */

import { loadProfile } from "@/lib/profile/localProfile";
import { truncateAddress } from "@/lib/solana/address";

export type PlayerStats = {
  pubkey: string;
  rounds: number;
  wins: number;
  /** Cumulative play SOL returned on winning rounds (gross payouts). */
  solWon: number;
  updatedAt: number;
};

export type LeaderboardEntry = {
  rank: number;
  pubkey: string;
  username: string;
  walletLabel: string;
  wins: number;
  solWon: number;
  rounds: number;
  /** Seeded demo row (not a real local player). */
  seeded: boolean;
  /** Current session identity. */
  isYou: boolean;
};

const STATS_KEY = (pubkey: string) => `midway-player-stats:v1:${pubkey}`;
const INDEX_KEY = "midway-player-stats-index:v1";

export const SCORES_EVENT = "midway-scores";

/** Plausible booth names for a seeded DEMO board. */
const SEED_ROWS: Omit<PlayerStats, "updatedAt"> & { username: string }[] = [
  { pubkey: "SEED_NEONFOX", username: "NeonFox", rounds: 42, wins: 18, solWon: 3.42 },
  { pubkey: "SEED_PIXELPIT", username: "PixelPit", rounds: 37, wins: 14, solWon: 2.81 },
  { pubkey: "SEED_TENTCAT", username: "TentCat", rounds: 55, wins: 12, solWon: 2.15 },
  { pubkey: "SEED_ACIDROLL", username: "AcidRoll", rounds: 28, wins: 11, solWon: 1.94 },
  { pubkey: "SEED_LOOPDOG", username: "LoopDog", rounds: 33, wins: 9, solWon: 1.52 },
  { pubkey: "SEED_BURNBYTE", username: "BurnByte", rounds: 21, wins: 8, solWon: 1.28 },
  { pubkey: "SEED_CRTQUEEN", username: "CrtQueen", rounds: 19, wins: 7, solWon: 0.97 },
  { pubkey: "SEED_MIDWAYKID", username: "MidwayKid", rounds: 14, wins: 5, solWon: 0.64 },
];

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

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SCORES_EVENT));
}

function loadIndex(): string[] {
  const idx = readJson<string[]>(INDEX_KEY, []);
  return Array.isArray(idx) ? idx.filter((p) => typeof p === "string") : [];
}

function rememberPubkey(pubkey: string) {
  const idx = loadIndex();
  if (!idx.includes(pubkey)) {
    writeJson(INDEX_KEY, [...idx, pubkey].slice(-80));
  }
}

export function loadPlayerStats(pubkey: string): PlayerStats {
  const stored = readJson<PlayerStats | null>(STATS_KEY(pubkey), null);
  if (!stored || typeof stored.rounds !== "number") {
    return {
      pubkey,
      rounds: 0,
      wins: 0,
      solWon: 0,
      updatedAt: 0,
    };
  }
  return {
    pubkey,
    rounds: Math.max(0, Math.floor(stored.rounds)),
    wins: Math.max(0, Math.floor(stored.wins)),
    solWon: Math.max(0, Number(stored.solWon) || 0),
    updatedAt: typeof stored.updatedAt === "number" ? stored.updatedAt : 0,
  };
}

function savePlayerStats(stats: PlayerStats) {
  writeJson(STATS_KEY(stats.pubkey), stats);
  rememberPubkey(stats.pubkey);
  notify();
}

/**
 * After a Colors round settles — bump rounds; count a win when matches > 0;
 * add gross winnings to solWon.
 */
export function recordColorsRound(
  pubkey: string,
  opts: { matches: number; winnings: number },
): PlayerStats {
  const cur = loadPlayerStats(pubkey);
  const won = opts.matches > 0;
  const next: PlayerStats = {
    pubkey,
    rounds: cur.rounds + 1,
    wins: cur.wins + (won ? 1 : 0),
    solWon: Math.round((cur.solWon + Math.max(0, opts.winnings)) * 1e6) / 1e6,
    updatedAt: Date.now(),
  };
  savePlayerStats(next);
  return next;
}

function displayName(pubkey: string, seededUsername?: string): string {
  if (seededUsername) return seededUsername;
  const profile = loadProfile(pubkey);
  if (profile?.username) return profile.username;
  if (pubkey === "DEMO_GUEST") return "DEMO GUEST";
  return truncateAddress(pubkey, 4, 4);
}

function walletLabel(pubkey: string): string {
  if (pubkey.startsWith("SEED_")) return "demo";
  if (pubkey === "DEMO_GUEST") return "GUEST";
  return truncateAddress(pubkey, 4, 4);
}

/**
 * Ranked board: seeded demos + any local players with rounds > 0.
 * Sort by wins desc, then solWon desc.
 */
export function getLeaderboard(currentPubkey: string | null): LeaderboardEntry[] {
  const byKey = new Map<
    string,
    { stats: PlayerStats; username: string; seeded: boolean }
  >();

  for (const seed of SEED_ROWS) {
    byKey.set(seed.pubkey, {
      stats: {
        pubkey: seed.pubkey,
        rounds: seed.rounds,
        wins: seed.wins,
        solWon: seed.solWon,
        updatedAt: 0,
      },
      username: seed.username,
      seeded: true,
    });
  }

  for (const pubkey of loadIndex()) {
    const stats = loadPlayerStats(pubkey);
    if (stats.rounds <= 0) continue;
    byKey.set(pubkey, {
      stats,
      username: displayName(pubkey),
      seeded: false,
    });
  }

  // Always include current user row if they have an identity (even 0 rounds).
  if (currentPubkey && !byKey.has(currentPubkey)) {
    const stats = loadPlayerStats(currentPubkey);
    byKey.set(currentPubkey, {
      stats,
      username: displayName(currentPubkey),
      seeded: false,
    });
  } else if (currentPubkey && byKey.has(currentPubkey)) {
    const row = byKey.get(currentPubkey)!;
    row.username = displayName(currentPubkey);
    row.seeded = false;
    row.stats = loadPlayerStats(currentPubkey);
  }

  const sorted = [...byKey.values()].sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
    if (b.stats.solWon !== a.stats.solWon) return b.stats.solWon - a.stats.solWon;
    return b.stats.rounds - a.stats.rounds;
  });

  return sorted.map((row, i) => ({
    rank: i + 1,
    pubkey: row.stats.pubkey,
    username: row.username,
    walletLabel: walletLabel(row.stats.pubkey),
    wins: row.stats.wins,
    solWon: row.stats.solWon,
    rounds: row.stats.rounds,
    seeded: row.seeded,
    isYou: Boolean(currentPubkey && row.stats.pubkey === currentPubkey),
  }));
}
