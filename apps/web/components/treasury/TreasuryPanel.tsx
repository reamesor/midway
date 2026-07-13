"use client";

import { useState, type ReactNode } from "react";
import { CountUp } from "@/components/CountUp";

export function TreasuryPanel({
  total = 0,
  burn = 0,
  believers = 0,
  build = 0,
  burnedTokens = 0,
  yourShare = 0,
  onClaim,
}: {
  total?: number;
  burn?: number;
  believers?: number;
  build?: number;
  burnedTokens?: number;
  yourShare?: number;
  onClaim?: () => void;
}) {
  const max = Math.max(total, 0.0001);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const handleClaim = () => {
    setClaimMsg(null);
    if (yourShare <= 0) {
      setClaimMsg(
        "Nothing to claim yet — play Colors so the Believers slice of the house cut can accrue.",
      );
      return;
    }
    const amount = yourShare;
    onClaim?.();
    setClaimMsg(
      `Claimed ◎ ${amount.toFixed(4)} from Believers pool (DEMO). Not a Colors win payout.`,
    );
  };

  return (
    <div className="space-y-5 px-1 py-0.5 font-heading text-xs sm:px-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-0.5">
          <div className="text-ink-dim">SYSTEM MONITOR · LIVE</div>
          <div className="font-sans text-[13px] leading-snug normal-case tracking-normal text-ink-dim">
            every Colors roll routes its 5% house cut here — then 40/40/20
          </div>
        </div>
        <CountUp
          value={total}
          prefix="◎ "
          decimals={4}
          className="num shrink-0 text-2xl leading-none text-acid chroma"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <Vu
          label="BURN.SYS"
          value={burn}
          pct={(burn / max) * 100}
          note={
            <>
              SUPPLY ↓{" "}
              <span className="num text-burn">{burnedTokens.toLocaleString()}</span>
            </>
          }
          tone="burn"
        />
        <Vu
          label="BELIEVERS.DAT"
          value={believers}
          pct={(believers / max) * 100}
          note="40% pool · claim below"
          tone="acid"
        />
        <Vu
          label="BUILD.BIN"
          value={build}
          pct={(build / max) * 100}
          note="next attraction fund"
          tone="cyber"
        />
      </div>

      <div className="bevel-inset space-y-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="space-y-1.5">
          <div className="font-heading text-[10px] tracking-wide text-acid">
            YOUR BELIEVERS SHARE · DEMO
          </div>
          <p className="font-sans text-[12px] leading-snug normal-case tracking-normal text-ink-dim">
            Accrues from the <span className="text-ink">Believers</span> slice of the house
            cut — not the same as Colors win payouts (those credit Midway Play).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="font-sans text-[14px] leading-none normal-case tracking-normal">
            <span className="text-ink-dim">claimable:</span>{" "}
            <CountUp
              value={yourShare}
              prefix="◎ "
              decimals={4}
              className="num font-heading text-base text-acid"
            />
          </div>
          <button
            type="button"
            className="bevel-btn bevel-btn-acid w-full px-4 py-2.5 sm:w-auto sm:shrink-0"
            onClick={handleClaim}
          >
            CLAIM BELIEVERS
          </button>
        </div>
      </div>
      {claimMsg && (
        <p className="font-sans text-[12px] normal-case tracking-normal text-cyber" role="status">
          {claimMsg}
        </p>
      )}
    </div>
  );
}

function Vu({
  label,
  value,
  pct,
  note,
  tone,
}: {
  label: string;
  value: number;
  pct: number;
  note: ReactNode;
  tone: "burn" | "acid" | "cyber";
}) {
  const color =
    tone === "burn" ? "var(--burn)" : tone === "acid" ? "var(--acid)" : "var(--cyber)";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="truncate tracking-wide" style={{ color }} title={label}>
        {label}
      </div>
      <CountUp
        value={value}
        prefix="◎ "
        decimals={4}
        className="num text-base leading-none text-ink"
      />
      <div className="vu-track">
        <div
          className="vu-fill"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 8px)`,
          }}
        />
      </div>
      <div className="font-sans text-[12px] leading-snug normal-case tracking-normal text-ink-dim">
        {note}
      </div>
    </div>
  );
}
