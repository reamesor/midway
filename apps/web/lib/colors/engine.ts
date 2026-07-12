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

/** LITERAL = HTML rules (multipliers on base bet). STAKE_BASED = multipliers on total stake. PER_COLOR = each color settled alone. */
export type PayoutMode = "LITERAL" | "STAKE_BASED" | "PER_COLOR";

export const PAYOUT_MODE: PayoutMode =
  (process.env.NEXT_PUBLIC_PAYOUT_MODE as PayoutMode) || "STAKE_BASED";

export type SettleResult = {
  matches: number;
  winnings: number;
  stake: number;
  houseCut: number;
  net: number;
};

export function settleRoll(
  bet: number,
  picked: Set<ColorKey> | ColorKey[],
  dice: ColorKey[],
  mode: PayoutMode = PAYOUT_MODE,
): SettleResult {
  const pickedSet = picked instanceof Set ? picked : new Set(picked);
  const stake = bet * pickedSet.size;
  const houseCut = stake * 0.05;
  const matches = dice.filter((d) => pickedSet.has(d)).length;

  let winnings = 0;

  if (mode === "LITERAL") {
    if (matches === 1) winnings = bet + bet * 1.04;
    else if (matches === 2) winnings = bet + bet * 1.04 * 2;
    else if (matches === 3) winnings = bet + bet * 4.5;
  } else if (mode === "STAKE_BASED") {
    if (matches === 1) winnings = stake + stake * 1.04;
    else if (matches === 2) winnings = stake + stake * 1.04 * 2;
    else if (matches === 3) winnings = stake + stake * 4.5;
  } else {
    // PER_COLOR: each picked color pays independently vs dice presence
    for (const color of pickedSet) {
      const hits = dice.filter((d) => d === color).length;
      if (hits === 1) winnings += bet + bet * 1.04;
      else if (hits === 2) winnings += bet + bet * 1.04 * 2;
      else if (hits === 3) winnings += bet + bet * 4.5;
    }
  }

  return { matches, winnings, stake, houseCut, net: winnings - stake };
}

export function splitCut(houseCut: number) {
  return {
    burn: houseCut * 0.4,
    believers: houseCut * 0.4,
    build: houseCut * 0.2,
  };
}
