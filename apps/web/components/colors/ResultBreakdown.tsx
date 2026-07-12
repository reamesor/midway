"use client";

import {
  JACKPOT_PROFIT,
  MATCH1_PROFIT,
  MATCH2_PROFIT,
  splitCut,
} from "@/lib/colors/engine";

type ResultBreakdownProps = {
  matches: number;
  winnings: number;
  stake: number;
  houseCut: number;
  unit?: string;
};

export function ResultBreakdown({
  matches,
  winnings,
  stake,
  houseCut,
  unit = "DEMO SOL",
}: ResultBreakdownProps) {
  const parts = splitCut(houseCut);
  const net = winnings - stake;
  const won = matches > 0;
  const formula = formulaHint(matches);

  return (
    <div className="space-y-3 font-sans text-[13px] normal-case tracking-normal text-ink">
      <div className="bevel-inset space-y-1.5 p-3">
        <div className="font-heading text-[10px] tracking-wide text-ink-dim">
          MIDWAY PLAY · THIS ROUND
        </div>
        <Row label="Bet cost" value={`−${fmt(stake)} ${unit}`} tone="dim" />
        <Row
          label="Returned to you"
          value={won ? `+${fmt(winnings)} ${unit}` : `+0 ${unit}`}
          tone={won ? "win" : "dim"}
        />
        <div className="border-t border-line/50 pt-1.5">
          <Row
            label={net >= 0 ? "Your profit" : "You lost"}
            value={`${net >= 0 ? "+" : "−"}${fmt(Math.abs(net))} ${unit}`}
            tone={net > 0 ? "win" : net < 0 ? "lose" : "dim"}
            strong
          />
        </div>
      </div>

      <div className="bevel-inset space-y-1.5 p-3">
        <div className="font-heading text-[10px] tracking-wide text-acid">
          HOUSE CUT → TREASURY · 5%
        </div>
        <p className="text-[11px] text-ink-dim">
          Not your winnings — routed from the edge every roll (win or lose).
        </p>
        <Row
          label="Cut this round"
          value={`+${fmt(houseCut)} SOL`}
          tone="acid"
          strong
        />
        <div className="mt-1 grid grid-cols-3 gap-1.5 font-heading text-[10px]">
          <SplitCell label="BURN 40%" amount={parts.burn} tone="burn" />
          <SplitCell label="BELIEVERS 40%" amount={parts.believers} tone="acid" />
          <SplitCell label="BUILD 20%" amount={parts.build} tone="cyber" />
        </div>
        <p className="pt-1 text-[11px] text-ink-dim">
          Believers slice feeds TREASURY.MON claim — separate from play payout.
        </p>
      </div>

      {formula && (
        <p className="num text-[11px] text-ink-dim">
          {formula}
        </p>
      )}
    </div>
  );
}

function formulaHint(matches: number): string | null {
  if (matches === 1) {
    return `1 match · Bet + (Bet × ${MATCH1_PROFIT}) → ${(1 + MATCH1_PROFIT).toFixed(2)}× unit bet`;
  }
  if (matches === 2) {
    return `2 matches · Bet + (Bet × ${MATCH2_PROFIT}) → ${(1 + MATCH2_PROFIT).toFixed(2)}× unit bet`;
  }
  if (matches === 3) {
    return `Jackpot · Bet + (Bet × ${JACKPOT_PROFIT}) → ${(1 + JACKPOT_PROFIT).toFixed(2)}× unit bet`;
  }
  if (matches === 0) {
    return "0 matches · no payout · bet lost · 5% cut still routes home";
  }
  return null;
}

function Row({
  label,
  value,
  tone = "dim",
  hint,
  strong,
}: {
  label: string;
  value: string;
  tone?: "win" | "lose" | "acid" | "dim";
  hint?: string;
  strong?: boolean;
}) {
  const valueClass =
    tone === "win"
      ? "text-win"
      : tone === "lose"
        ? "text-burn"
        : tone === "acid"
          ? "text-acid"
          : "text-ink";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className={strong ? "text-ink" : "text-ink-dim"}>{label}</div>
        {hint && <div className="text-[11px] text-ink-dim/80">{hint}</div>}
      </div>
      <div
        className={`num shrink-0 text-right ${strong ? "font-heading text-[12px]" : "text-[12px]"} ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function SplitCell({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "burn" | "acid" | "cyber";
}) {
  const color =
    tone === "burn" ? "text-burn" : tone === "acid" ? "text-acid" : "text-cyber";
  return (
    <div className="bevel px-1.5 py-1.5 text-center">
      <div className={color}>{label}</div>
      <div className="num mt-0.5 text-[11px] text-ink">{fmt(amount)}</div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
