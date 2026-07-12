/**
 * Planned NFT holder benefits — design placeholders only.
 * Numbers are editable demo constants for UI copy; mint / claims are not live.
 */

export const NFT_HOLDER_BENEFITS_STATUS = "planned" as const;

export type HolderMultiplierTierId = "base" | "holder" | "jackpot";

export type HolderMultiplierTier = {
  id: HolderMultiplierTierId;
  /** Short UI label */
  label: string;
  /** Ride / Colors payout flavor multiplier (1 = no boost) */
  multiplier: number;
  /** One-line flavor for the NFT booth */
  flavor: string;
};

/**
 * Planned Colors / attraction multipliers for NFT holders.
 * Wire later against wallet holdings — do not treat as live.
 */
export const HOLDER_MULTIPLIERS: readonly HolderMultiplierTier[] = [
  {
    id: "base",
    label: "No NFT",
    multiplier: 1,
    flavor: "base ride math",
  },
  {
    id: "holder",
    label: "Holder",
    multiplier: 1.05,
    flavor: "Colors / attractions boost",
  },
  {
    id: "jackpot",
    label: "Jackpot tier",
    multiplier: 1.1,
    flavor: "premium / jackpot flavor boost",
  },
] as const;

/**
 * Extra believers-claim share for NFT holders vs non-holders, in basis points.
 * 500 = +5% of claimable believers / fee share (designed, not live).
 */
export const HOLDER_CLAIM_BONUS_BPS = 500;

export function formatMultiplier(multiplier: number): string {
  const rounded = Number.isInteger(multiplier)
    ? String(multiplier)
    : multiplier.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded}×`;
}

/** Claim bonus as a whole percent (e.g. 500 bps → 5). */
export function holderClaimBonusPercent(
  bps: number = HOLDER_CLAIM_BONUS_BPS,
): number {
  return bps / 100;
}

export function formatClaimBonusBps(bps: number = HOLDER_CLAIM_BONUS_BPS): string {
  const pct = holderClaimBonusPercent(bps);
  const label = Number.isInteger(pct) ? String(pct) : pct.toFixed(2);
  return `+${label}%`;
}
