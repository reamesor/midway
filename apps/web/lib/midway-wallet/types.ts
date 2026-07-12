import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";

export type MidwayAsset = "SOL" | "MIDWAY";

export type MidwayPlayBalance = {
  /** Midway play escrow in SOL units (Colors bets debit this). Demo only. */
  sol: number;
  /** Midway token play balance (placeholder until mint + vault are live). */
  midway: number;
  updatedAt: number;
};

export type MidwayWalletLedgerEntry = {
  id: string;
  at: number;
  kind: "deposit" | "withdraw" | "bet_debit" | "bet_credit" | "reset";
  asset: MidwayAsset;
  amount: number;
  note?: string;
};

/** Empty / disconnected — no play pot until a wallet pubkey is keyed. */
export const EMPTY_PLAY_BALANCE = (): MidwayPlayBalance => ({
  sol: 0,
  midway: 0,
  updatedAt: Date.now(),
});

/** Fresh DEMO pot — fixed 10 SOL, no chain funds. */
export const DEMO_PLAY_BALANCE = (): MidwayPlayBalance => ({
  sol: DEMO_PLAY_SOL,
  midway: 0,
  updatedAt: Date.now(),
});
