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
  onPullLever,
  onMax,
  onOpenWallet,
}: BetPanelProps) {
  const step = bet >= 0.1 ? 0.05 : 0.01;
  const placeLabel = !walletConnected
    ? "WALLET REQUIRED"
    : needsDeposit
      ? "DEPOSIT TO PLAY"
      : "PLACE BET";

  const canClickPlace =
    canPlace &&
    (Boolean(!walletConnected || needsDeposit) || !placingDisabled);

  return (
    <div className="space-y-3 font-heading text-[11px]">
      <div className="bevel-inset p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-ink-dim">MIDWAY PLAY</div>
          <WalletConnectControl size="panel" />
        </div>
        <div className="num text-2xl text-acid">
          {fmtSol(balance)}{" "}
          <span className="text-sm text-ink-dim">SOL</span>
        </div>
        {!walletConnected ? (
          <p className="mt-1 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Connect Phantom / Solflare, then deposit into MIDWAY.WALLET to play.
          </p>
        ) : needsDeposit ? (
          <p className="mt-1 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Play balance empty —{" "}
            <button type="button" className="text-hot underline" onClick={onOpenWallet}>
              deposit SOL
            </button>{" "}
            in EXCHANGE.EXE.
          </p>
        ) : (
          <p className="mt-1 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Bets debit Midway play SOL (not your main wallet directly).
          </p>
        )}
      </div>

      <div className="bevel p-3">
        <div className="mb-1 text-ink-dim">BET AMOUNT (SOL)</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="bevel-btn size-10"
            onClick={() => onBetChange(roundSol(Math.max(0.01, bet - step)))}
          >
            −
          </button>
          <input
            className="num bevel-inset h-10 flex-1 bg-[var(--void)] text-center text-lg text-ink outline-none"
            type="number"
            min={0.01}
            step={0.01}
            value={bet}
            onChange={(e) =>
              onBetChange(roundSol(Math.max(0.01, Number(e.target.value) || 0.01)))
            }
          />
          <button
            type="button"
            className="bevel-btn size-10"
            onClick={() => onBetChange(roundSol(bet + step))}
          >
            +
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          {BET_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className="bevel-btn flex-1 py-1"
              onClick={() => onBetChange(v)}
            >
              {v}
            </button>
          ))}
          <button type="button" className="bevel-btn flex-1 py-1" onClick={onMax}>
            MAX
          </button>
        </div>
        <p className="mt-2 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
          Each selected color costs the full bet in SOL.
        </p>
      </div>

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
        className="bevel-btn bevel-btn-hot w-full py-3 text-sm"
      >
        {placeLabel}
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
            style={{ width: 28, height: 28 }}
          />
        </span>
      </button>
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
