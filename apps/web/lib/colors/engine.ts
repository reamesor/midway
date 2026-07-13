export const COLOR_KEYS = [
  "yellow",
  "orange",
  "pink",
  "blue",
  "green",
  "red",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_LABEL: Record<ColorKey, string> = {
  yellow: "YEL",
  orange: "ORG",
  pink: "PNK",
  blue: "BLU",
  green: "GRN",
  red: "RED",
};

/** Light pastels with enough chroma to pop on dark Midway paper. */
export const COLOR_HEX: Record<ColorKey, string> = {
  yellow: "#f2dc6e",
  orange: "#f4b478",
  pink: "#f09ec8",
  blue: "#7ec4f2",
  green: "#8ee0a0",
  red: "#f28e98",
};

/** Documented house edge (~5%). Cut = stake × this, every round. */
export const HOUSE_EDGE = 0.05;

/**
 * Each correct / matched color pays 2× the bet base:
 *   1 match → bet × 2
 *   2 matches → bet × 2 × 2 = bet × 4
 *   3 matches → bet × 2 × 3 = bet × 6
 *
 * Worked examples (LITERAL, bet = 0.10 SOL, one color → stake = 0.10):
 *   1 match → returned 0.20, profit +0.10, houseCut 0.005
 *   2 match → returned 0.40, profit +0.30
 *   3 match → returned 0.60, profit +0.50
 *
 * House cut is routed to burn / believers / build from the published edge and
 * does NOT silently reduce "Returned to you".
 *
 * Multi-color: stake = bet × colorsSelected. LITERAL still pays on the
 * unit bet — e.g. unit 0.01 × 3 colors = 0.03 cost; 1 match → 0.02 returned.
 */
export const MATCH_PAYOUT = 2;

/** Return multiplier for a match count (0 → 0). */
export function payoutMultiplier(matches: number): number {
  if (matches <= 0) return 0;
  return MATCH_PAYOUT * matches;
}

/** Treasury split of every house cut. */
export const CUT_BURN = 0.4;
export const CUT_BELIEVERS = 0.4;
export const CUT_BUILD = 0.2;

/**
 * LITERAL = multipliers on unit bet.
 * STAKE_BASED = multipliers on total stake (bet × colors).
 * PER_COLOR = each picked color settled alone vs its own dice hits.
 *
 * Default is LITERAL so displayed rules match settlement.
 */
export type PayoutMode = "LITERAL" | "STAKE_BASED" | "PER_COLOR";

export const PAYOUT_MODE: PayoutMode =
  (process.env.NEXT_PUBLIC_PAYOUT_MODE as PayoutMode) || "LITERAL";

export type SettleResult = {
  matches: number;
  winnings: number;
  stake: number;
  houseCut: number;
  net: number;
};

/** Gross amount returned to the player for `matches` on a bet base. */
export function matchWinnings(base: number, matches: number): number {
  return base * payoutMultiplier(matches);
}

export function settleRoll(
  bet: number,
  picked: Set<ColorKey> | ColorKey[],
  dice: ColorKey[],
  mode: PayoutMode = PAYOUT_MODE,
): SettleResult {
  const pickedSet = picked instanceof Set ? picked : new Set(picked);
  const stake = bet * pickedSet.size;
  // Every round: 5% of total cost → treasury (win or lose). Display / routing only —
  // does not reduce the player return below matchWinnings.
  const houseCut = stake * HOUSE_EDGE;
  const matches = dice.filter((d) => pickedSet.has(d)).length;

  let winnings = 0;

  if (mode === "LITERAL") {
    winnings = matchWinnings(bet, matches);
  } else if (mode === "STAKE_BASED") {
    winnings = matchWinnings(stake, matches);
  } else {
    // PER_COLOR: each picked color pays independently vs dice presence
    for (const color of pickedSet) {
      const hits = dice.filter((d) => d === color).length;
      winnings += matchWinnings(bet, hits);
    }
  }

  return { matches, winnings, stake, houseCut, net: winnings - stake };
}

export function splitCut(houseCut: number) {
  return {
    burn: houseCut * CUT_BURN,
    believers: houseCut * CUT_BELIEVERS,
    build: houseCut * CUT_BUILD,
  };
}
