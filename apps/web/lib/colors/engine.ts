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

export const COLOR_HEX: Record<ColorKey, string> = {
  yellow: "#e9d839",
  orange: "#e8722c",
  pink: "#d93ba8",
  blue: "#3b9fe8",
  green: "#3ce84a",
  red: "#e83b50",
};

/** Documented house edge (~5%). Cut = stake × this, every round. */
export const HOUSE_EDGE = 0.05;

/**
 * LITERAL payout profit multipliers on the unit bet (screenshot / RULES.TXT):
 *   1 match:           Bet + (Bet × MATCH1_PROFIT)     → 2.04× return
 *   2 matches:         Bet + (Bet × MATCH2_PROFIT)     → 3.08× return
 *   3 matches (JP):    Bet + (Bet × JACKPOT_PROFIT)    → 5.50× return
 *
 * Worked examples (LITERAL, bet = 1 SOL, one color → stake = 1):
 *   1 match → winnings 2.04, houseCut 0.05 → burn 0.02 / believers 0.02 / build 0.01
 *   2 match → winnings 3.08, houseCut 0.05 → same 40/40/20 split of the cut
 *   3 match → winnings 5.50, houseCut 0.05
 *
 * Single-color EV ≈ 94.8% RTP (≈5.2% edge) — sustainable for the house,
 * fair published odds for players. Multi-color stakes `bet × colors`;
 * LITERAL still pays on the unit bet (as documented).
 */
export const MATCH1_PROFIT = 1.04;
export const MATCH2_PROFIT = 1.04 * 2; // 2.08
export const JACKPOT_PROFIT = 4.5;

/** Treasury split of every house cut. */
export const CUT_BURN = 0.4;
export const CUT_BELIEVERS = 0.4;
export const CUT_BUILD = 0.2;

/**
 * LITERAL = screenshot / HTML rules (multipliers on unit bet).
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

function literalWinnings(bet: number, matches: number): number {
  if (matches === 1) return bet + bet * MATCH1_PROFIT;
  if (matches === 2) return bet + bet * MATCH2_PROFIT;
  if (matches === 3) return bet + bet * JACKPOT_PROFIT;
  return 0;
}

export function settleRoll(
  bet: number,
  picked: Set<ColorKey> | ColorKey[],
  dice: ColorKey[],
  mode: PayoutMode = PAYOUT_MODE,
): SettleResult {
  const pickedSet = picked instanceof Set ? picked : new Set(picked);
  const stake = bet * pickedSet.size;
  // Every round: 5% of total cost → treasury (win or lose).
  const houseCut = stake * HOUSE_EDGE;
  const matches = dice.filter((d) => pickedSet.has(d)).length;

  let winnings = 0;

  if (mode === "LITERAL") {
    winnings = literalWinnings(bet, matches);
  } else if (mode === "STAKE_BASED") {
    winnings = literalWinnings(stake, matches);
  } else {
    // PER_COLOR: each picked color pays independently vs dice presence
    for (const color of pickedSet) {
      const hits = dice.filter((d) => d === color).length;
      winnings += literalWinnings(bet, hits);
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
