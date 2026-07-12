/**
 * Public MIDWAY token links — driven by NEXT_PUBLIC_* env vars.
 * When unset, UI still renders with clear TBA placeholders.
 */

export function getMidwayMint(): string | null {
  const mint = process.env.NEXT_PUBLIC_MIDWAY_MINT?.trim();
  return mint || null;
}

export function getBuyUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_BUY_URL?.trim();
  return url || null;
}

export function getTwitterUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_TWITTER_URL?.trim();
  return url || null;
}

export function getDiscordUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DISCORD_URL?.trim();
  return url || null;
}

export function explorerTokenUrl(mint: string): string {
  return `https://explorer.solana.com/address/${mint}`;
}

export function solscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${mint}`;
}

/** Jupiter swap deep-link when mint is known (fallback if BUY_URL unset). */
export function jupiterSwapUrl(mint: string): string {
  return `https://jup.ag/swap/SOL-${mint}`;
}

/** Raydium swap deep-link when mint is known. */
export function raydiumSwapUrl(mint: string): string {
  return `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}`;
}

export type BuyLink = {
  id: string;
  label: string;
  href: string | null;
  hint: string;
};

/**
 * Structured buy destinations — fill via env or auto-derive from mint.
 * Easy to extend: add more entries or env keys without reshaping the panel.
 */
export function getBuyLinks(mint: string | null): BuyLink[] {
  const buy = getBuyUrl();
  return [
    {
      id: "primary",
      label: "BUY MIDWAY",
      href: buy,
      hint: buy ? "NEXT_PUBLIC_BUY_URL" : "Set NEXT_PUBLIC_BUY_URL",
    },
    {
      id: "jupiter",
      label: "JUPITER",
      href: mint ? jupiterSwapUrl(mint) : null,
      hint: mint ? "swap SOL → MIDWAY" : "needs mint",
    },
    {
      id: "raydium",
      label: "RAYDIUM",
      href: mint ? raydiumSwapUrl(mint) : null,
      hint: mint ? "swap SOL → MIDWAY" : "needs mint",
    },
  ];
}
