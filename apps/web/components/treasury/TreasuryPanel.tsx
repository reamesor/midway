"use client";

import type { ReactNode } from "react";
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

  return (
    <div className="space-y-4 font-heading text-xs">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-ink-dim">SYSTEM MONITOR · LIVE</div>
          <div className="font-sans text-[13px] normal-case tracking-normal text-ink-dim">
            every Colors roll routes its house cut here — 40/40/20
          </div>
        </div>
        <CountUp
          value={total}
          prefix="◎ "
          decimals={4}
          className="num text-2xl text-acid chroma"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Vu
          label="🔥 BURN.SYS"
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
          label="⭐ BELIEVERS.DAT"
          value={believers}
          pct={(believers / max) * 100}
          note="waiting to drop"
          tone="acid"
        />
        <Vu
          label="🔧 BUILD.BIN"
          value={build}
          pct={(build / max) * 100}
          note="next attraction fund"
          tone="cyber"
        />
      </div>

      <div className="bevel-inset flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="font-sans text-[14px] normal-case tracking-normal">
          your share:{" "}
          <CountUp
            value={yourShare}
            prefix="◎ "
            decimals={4}
            className="num font-heading text-acid"
          />
        </div>
        <button
          type="button"
          className="bevel-btn bevel-btn-acid px-4 py-2"
          onClick={onClaim}
        >
          CLAIM SHARE
        </button>
      </div>
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
    <div>
      <div className="mb-1 flex justify-between gap-2">
        <span style={{ color }}>{label}</span>
        <CountUp value={value} prefix="◎ " decimals={4} className="num text-ink" />
      </div>
      <div className="vu-track">
        <div
          className="vu-fill"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 8px)`,
          }}
        />
      </div>
      <div className="mt-1 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        {note}
      </div>
    </div>
  );
}
