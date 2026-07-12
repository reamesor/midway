import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";

export type MidwayAsset = "SOL" | "MIDWAY";

/**
 * Midway wallet play balance (local DEMO ledger).
 * Debited/credited by Colors bets; Deposit/Withdraw move numbers between
 * main wallet UX and this Midway purse — no real chain transfer in DEMO.
 */
export type MidwayPlayBalance = {
  /** Midway wallet play SOL (Colors bets use this). */
  sol: number;
  /** Midway token play balance (placeholder until mint + vault are live). */
  midway: number;
  updatedAt: number;
};

/** Alias for product naming — Midway wallet play funds. */
export type MidwayPlayBalanceState = MidwayPlayBalance;

export type MidwayLedgerKind =
  | "deposit"
  | "withdraw"
  | "bet_debit"
  | "bet_credit"
  | "bet_loss"
  | "claim"
  | "reset";

export type MidwayWalletLedgerEntry = {
  id: string;
  at: number;
  kind: MidwayLedgerKind;
  asset: MidwayAsset;
  amount: number;
  note?: string;
};

/** Empty / disconnected — no Midway play balance until identity is keyed. */
export const EMPTY_PLAY_BALANCE = (): MidwayPlayBalance => ({
  sol: 0,
  midway: 0,
  updatedAt: Date.now(),
});

/** Fresh DEMO Midway wallet balance — seeded play SOL, no chain funds. */
export const DEMO_PLAY_BALANCE = (): MidwayPlayBalance => ({
  sol: DEMO_PLAY_SOL,
  midway: 0,
  updatedAt: Date.now(),
});
