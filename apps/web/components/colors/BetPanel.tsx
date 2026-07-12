"use client";

import { PixelIcon, GLYPHS } from "@/lib/pixel";

type BetPanelProps = {
  balance: number;
  unit: string;
  bet: number;
  stakePreview: string;
  canPlace: boolean;
  canRoll: boolean;
  placingDisabled: boolean;
  leverArmed: boolean;
  onBetChange: (v: number) => void;
  onPlace: () => void;
  onPullLever: () => void;
  onMax: () => void;
};

export function BetPanel({
  balance,
  unit,
  bet,
  stakePreview,
  canPlace,
  canRoll,
  placingDisabled,
  leverArmed,
  onBetChange,
  onPlace,
  onPullLever,
  onMax,
}: BetPanelProps) {
  return (
    <div className="space-y-3 font-heading text-[11px]">
      <div className="bevel-inset p-3">
        <div className="text-ink-dim">BALANCE</div>
        <div className="num text-2xl text-acid">
          {balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          <span className="text-sm text-ink-dim">{unit}</span>
        </div>
      </div>

      <div className="bevel p-3">
        <div className="mb-1 text-ink-dim">BET AMOUNT</div>
        <div className="flex items-center gap-1">
          <button type="button" className="bevel-btn size-10" onClick={() => onBetChange(Math.max(1, bet - 10))}>
            −
          </button>
          <input
            className="num bevel-inset h-10 flex-1 bg-[var(--void)] text-center text-lg text-ink outline-none"
            type="number"
            min={1}
            value={bet}
            onChange={(e) => onBetChange(Math.max(1, Number(e.target.value) || 1))}
          />
          <button type="button" className="bevel-btn size-10" onClick={() => onBetChange(bet + 10)}>
            +
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          {[50, 100, 250].map((v) => (
            <button key={v} type="button" className="bevel-btn flex-1 py-1" onClick={() => onBetChange(v)}>
              {v}
            </button>
          ))}
          <button type="button" className="bevel-btn flex-1 py-1" onClick={onMax}>
            MAX
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canPlace || placingDisabled}
        onClick={onPlace}
        className="bevel-btn bevel-btn-hot w-full py-3 text-sm"
      >
        PLACE BET
      </button>

      <button
        type="button"
        disabled={!canRoll}
        onClick={onPullLever}
        className={`bevel-btn bevel-btn-acid relative w-full overflow-hidden py-5 text-sm ${
          leverArmed ? "glitch-pulse" : ""
        }`}
      >
        <span className="relative z-10">
          {canRoll ? "▼ PULL LEVER TO ROLL ▼" : "LEVER LOCKED"}
        </span>
        <span
          className="absolute right-3 top-1/2 transition-transform"
          style={{ transform: canRoll ? "translateY(-40%) rotate(12deg)" : "translateY(-50%)" }}
          aria-hidden
        >
          <PixelIcon
            grid={[...GLYPHS.lever]}
            palette={{ K: "currentColor", Y: "currentColor" }}
            px={3}
            style={{ width: 28, height: 28 }}
          />
        </span>
      </button>

      <div className="bevel-inset p-3">
        <div className="text-ink-dim">STAKE THIS ROUND</div>
        <div className="num text-base text-ink">{stakePreview}</div>
        <div className="mt-1 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
          each color costs your full bet
        </div>
      </div>
    </div>
  );
}
