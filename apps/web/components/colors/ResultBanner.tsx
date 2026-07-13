"use client";

import type { CSSProperties } from "react";
import type { ColorKey } from "@/lib/colors/engine";
import { COLOR_HEX, COLOR_LABEL } from "@/lib/colors/engine";

export type StageResult = {
  matches: number;
  winnings: number;
  stake: number;
};

type ResultBannerProps = {
  rolling: boolean;
  dice: ColorKey[] | null;
  hits: boolean[];
  result: StageResult | null;
  unit?: string;
};

/**
 * Top-of-stage status strip for COLORS.EXE:
 * ROLLING… while tumbling, then landed faces + win/loss + profit line.
 */
export function ResultBanner({
  rolling,
  dice,
  hits,
  result,
  unit = "DEMO SOL",
}: ResultBannerProps) {
  if (rolling) {
    return (
      <div className="colors-stage-banner colors-stage-banner--rolling" role="status">
        <p className="colors-stage-banner__title blink">ROLLING…</p>
      </div>
    );
  }

  if (!dice || !result) return null;

  const kind =
    result.matches === 3 ? "jackpot" : result.matches > 0 ? "win" : "lose";
  const net = result.winnings - result.stake;
  const title =
    result.matches === 3
      ? "★ JACKPOT · 3 MATCHES"
      : result.matches > 0
        ? `★ WIN · ${result.matches} MATCH${result.matches > 1 ? "ES" : ""}`
        : "✕ NO MATCH · YOU LOST";

  return (
    <div
      className={`colors-stage-banner colors-stage-banner--${kind}`}
      role="status"
      aria-live="polite"
    >
      <p className="colors-stage-banner__title">{title}</p>
      <div className="colors-stage-banner__faces">
        {dice.map((color, i) => (
          <span
            key={`${color}-${i}`}
            className={`colors-stage-face${hits[i] ? " is-hit" : ""}`}
            style={{ "--face": COLOR_HEX[color] } as CSSProperties}
            title={color}
          >
            <span className="colors-stage-face__swatch" aria-hidden />
            <span className="colors-stage-face__label">{COLOR_LABEL[color]}</span>
          </span>
        ))}
      </div>
      <p className="colors-stage-banner__money num">
        <span>Bet cost −{fmt(result.stake)}</span>
        <span aria-hidden>·</span>
        <span>Returned +{fmt(result.winnings)}</span>
        <span aria-hidden>·</span>
        <span className={net >= 0 ? "is-profit" : "is-loss"}>
          {net >= 0 ? "Your profit +" : "You lost −"}
          {fmt(Math.abs(net))} {unit}
        </span>
      </p>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
