/** Demo play ledger only. LIVE on-chain vault transfers are disabled. */
export type WalletEscrowMode = "DEMO" | "LIVE";

/** Fixed Midway play pot for DEMO (SOL units). */
export const DEMO_PLAY_SOL = 10;

/**
 * Escrow mode is forced to DEMO — no real SOL/SPL spend txs.
 * `NEXT_PUBLIC_WALLET_ESCROW=LIVE` is ignored until vault wiring ships.
 */
export function getWalletEscrowMode(): WalletEscrowMode {
  void process.env.NEXT_PUBLIC_WALLET_ESCROW;
  return "DEMO";
}

export function isEscrowDemo(): boolean {
  return true;
}

/** Hard guard: never allow live spend / transfer paths. */
export function isLiveEscrowEnabled(): boolean {
  return false;
}

export function getMidwayMint(): string | null {
  const mint = process.env.NEXT_PUBLIC_MIDWAY_MINT?.trim();
  return mint || null;
}
