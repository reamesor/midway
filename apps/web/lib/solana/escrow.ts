/** Demo = client/session escrow. LIVE = on-chain vault (not wired yet). */
export type WalletEscrowMode = "DEMO" | "LIVE";

export function getWalletEscrowMode(): WalletEscrowMode {
  const raw = (process.env.NEXT_PUBLIC_WALLET_ESCROW || "DEMO")
    .trim()
    .toUpperCase();
  return raw === "LIVE" ? "LIVE" : "DEMO";
}

export function isEscrowDemo(): boolean {
  return getWalletEscrowMode() === "DEMO";
}

export function getMidwayMint(): string | null {
  const mint = process.env.NEXT_PUBLIC_MIDWAY_MINT?.trim();
  return mint || null;
}
