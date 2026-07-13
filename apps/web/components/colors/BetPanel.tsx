"use client";

import { PixelIcon, GLYPHS } from "@/lib/pixel";
import { WalletConnectControl } from "@/components/wallet/WalletConnectControl";

const BET_PRESETS = [0.01, 0.05, 0.1, 0.25] as const;

type BetPanelProps = {
  balance: number;
  bet: number;
  canPlace: boolean;
  canRoll: boolean;
  placingDisabled: boolean;
  leverArmed: boolean;
  walletConnected: boolean;
  /** When connected but play balance is empty. */
  needsDeposit: boolean;
  onBetChange: (v: number) => void;
  onPlace: () => void;
  onCancelPlace: () => void;
  onPullLever: () => void;
  onMax: () => void;
  onOpenWallet: () => void;
};

export function BetPanel({
  balance,
  bet,
  canPlace,
  canRoll,
  placingDisabled,
  leverArmed,
  walletConnected,
  needsDeposit,
  onBetChange,
  onPlace,
  onCancelPlace,
  onPullLever,
  onMax,
  onOpenWallet,
}: BetPanelProps) {
  const step = bet >= 0.1 ? 0.05 : 0.01;
  const placeLabel = !walletConnected
    ? "CONNECT / DEMO"
    : needsDeposit
      ? "RESET DEMO POT"
      : "PLACE BET";

  const canClickPlace =
    canPlace &&
    (Boolean(!walletConnected || needsDeposit) || !placingDisabled);

  return (
    <div className="flex h-full min-w-0 flex-col gap-2 font-heading text-[11px] md:gap-1.5">
      <div className="bevel-inset shrink-0 p-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="text-ink-dim">MIDWAY WALLET · DEMO</div>
          <WalletConnectControl size="panel" />
        </div>
        <div className="num text-xl text-acid md:text-lg">
          {walletConnected ? fmtSol(balance) : "—"}{" "}
          <span className="text-sm text-ink-dim">SOL</span>
        </div>
        {!walletConnected ? (
          <p className="mt-0.5 font-sans text-[10px] leading-snug normal-case tracking-normal text-ink-dim md:text-[11px]">
            Connect Phantom / Solflare, or play demo — unlocks a local 10 SOL pot.
          </p>
        ) : needsDeposit ? (
          <p className="mt-0.5 font-sans text-[10px] leading-snug normal-case tracking-normal text-ink-dim md:text-[11px]">
            Midway wallet empty —{" "}
            <button
              type="button"
              className="min-h-11 px-1 text-hot underline md:min-h-0"
              onClick={onOpenWallet}
            >
              deposit or reset
            </button>{" "}
            in WALLET.
          </p>
        ) : (
          <p className="mt-0.5 hidden font-sans text-[10px] leading-snug normal-case tracking-normal text-ink-dim sm:block md:text-[11px]">
            DEMO bets debit Midway wallet on lever pull — no real SOL leaves your main wallet.
          </p>
        )}
      </div>

      <div className="bevel flex min-h-0 flex-col justify-center gap-1.5 p-2 lg:flex-1">
        <div>
          <div className="mb-1 text-ink-dim">BET AMOUNT (SOL)</div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="bevel-btn size-11 shrink-0 text-base md:size-9"
              disabled={leverArmed}
              aria-label="Decrease bet"
              onClick={() => onBetChange(roundSol(Math.max(0.01, bet - step)))}
            >
              −
            </button>
            <input
              className="num bevel-inset h-11 min-w-0 flex-1 bg-[var(--void)] text-center text-lg text-ink outline-none disabled:opacity-50 md:h-9 md:text-base"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              value={bet}
              disabled={leverArmed}
              onChange={(e) =>
                onBetChange(roundSol(Math.max(0.01, Number(e.target.value) || 0.01)))
              }
            />
            <button
              type="button"
              className="bevel-btn size-11 shrink-0 text-base md:size-9"
              disabled={leverArmed}
              aria-label="Increase bet"
              onClick={() => onBetChange(roundSol(bet + step))}
            >
              +
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {BET_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className="bevel-btn min-h-11 min-w-0 px-1 py-1.5 md:min-h-8 md:py-1"
              disabled={leverArmed}
              onClick={() => onBetChange(v)}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className="bevel-btn min-h-11 min-w-0 px-1 py-1.5 md:min-h-8 md:py-1"
            disabled={leverArmed || !walletConnected}
            onClick={onMax}
          >
            MAX
          </button>
        </div>
        <p className="font-sans text-[10px] leading-snug normal-case tracking-normal text-ink-dim">
          Each color costs the full bet. Taken when you pull the lever.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 md:gap-1.5">
        {leverArmed ? (
          <button
            type="button"
            onClick={onCancelPlace}
            className="bevel-btn min-h-11 w-full py-2.5 text-burn md:min-h-9 md:py-2"
          >
            CANCEL BET
          </button>
        ) : (
          <button
            type="button"
            disabled={!canClickPlace}
            onClick={() => {
              if (!walletConnected || needsDeposit) {
                onOpenWallet();
                return;
              }
              onPlace();
            }}
            className="bevel-btn bevel-btn-hot min-h-11 w-full py-2.5 text-sm md:min-h-9 md:py-2"
          >
            {placeLabel}
          </button>
        )}

        <button
          type="button"
          disabled={!canRoll}
          onClick={onPullLever}
          className={`bevel-btn bevel-btn-acid relative min-h-12 w-full overflow-hidden py-3 text-sm md:min-h-10 md:py-2.5 ${
            leverArmed ? "glitch-pulse" : ""
          }`}
        >
          <span className="relative z-10">
            {canRoll ? "▼ PULL LEVER TO ROLL ▼" : "LEVER LOCKED"}
          </span>
          <span
            className="absolute right-3 top-1/2 transition-transform"
            style={{
              transform: canRoll
                ? "translateY(-40%) rotate(12deg)"
                : "translateY(-50%)",
            }}
            aria-hidden
          >
            <PixelIcon
              grid={[...GLYPHS.lever]}
              palette={{ K: "currentColor", Y: "currentColor" }}
              px={3}
              style={{ width: 24, height: 24 }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

function fmtSol(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function roundSol(n: number) {
  return Math.round(n * 10000) / 10000;
}
