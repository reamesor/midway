export type MidwayAsset = "SOL" | "MIDWAY";

export type MidwayPlayBalance = {
  /** Midway play escrow in SOL units (Colors bets debit this). */
  sol: number;
  /** Midway token play balance (placeholder until mint + vault are live). */
  midway: number;
  updatedAt: number;
};

export type MidwayWalletLedgerEntry = {
  id: string;
  at: number;
  kind: "deposit" | "withdraw" | "bet_debit" | "bet_credit";
  asset: MidwayAsset;
  amount: number;
  note?: string;
};

export const EMPTY_PLAY_BALANCE = (): MidwayPlayBalance => ({
  sol: 0,
  midway: 0,
  updatedAt: Date.now(),
});
