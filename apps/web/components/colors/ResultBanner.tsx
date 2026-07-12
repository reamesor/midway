"use client";

import { ResultBreakdown } from "./ResultBreakdown";

type ResultBannerProps = {
  show: boolean;
  matches: number;
  winnings: number;
  stake: number;
  houseCut: number;
  unit?: string;
};

/** Inline result strip — same numbers as the WIN.EXE / ERROR.EXE dialog. */
export function ResultBanner({
  show,
  matches,
  winnings,
  stake,
  houseCut,
  unit = "DEMO SOL",
}: ResultBannerProps) {
  if (!show) return null;

  const kind =
    matches === 3 ? "jackpot" : matches > 0 ? "win" : "lose";

  const styles = {
    win: "border-green bg-[rgba(60,232,74,0.1)]",
    jackpot: "border-gold bg-[rgba(245,197,66,0.12)]",
    lose: "border-[rgba(232,59,80,0.4)] bg-[rgba(232,59,80,0.08)]",
  }[kind];

  const titleColor = {
    win: "text-green",
    jackpot: "text-gold neon-text",
    lose: "text-red",
  }[kind];

  const title =
    matches === 3
      ? "★ JACKPOT · 3 MATCHES!"
      : matches > 0
        ? `★ WIN · ${matches} MATCH${matches > 1 ? "ES" : ""}`
        : "✕ NO MATCH";

  return (
    <div className={`mt-4 rounded-xl border p-4 ${styles}`}>
      <div className={`mb-3 text-center text-[22px] font-extrabold ${titleColor}`}>
        {title}
      </div>
      <ResultBreakdown
        matches={matches}
        winnings={winnings}
        stake={stake}
        houseCut={houseCut}
        unit={unit}
      />
    </div>
  );
}
