"use client";

import type { ReactNode } from "react";
import { PixelIcon, GLYPHS, inkPalette } from "@/lib/pixel";
import { useOs } from "@/components/os/OsContext";

const STEPS: {
  title: string;
  glyph: keyof typeof GLYPHS;
  lead: string;
  detail: ReactNode;
}[] = [
  {
    title: "1 · ACTION",
    glyph: "palette",
    lead: "Play · mint · trade",
    detail: (
      <>
        <span className="text-ink">Live:</span> Colors.{" "}
        <span className="text-ink">Soon:</span> Glitch · NFTs · swaps.
      </>
    ),
  },
  {
    title: "2 · HOUSE CUT",
    glyph: "coin",
    lead: "≈5% edge captured",
    detail:
      "Other houses pocket it. Midway routes the cut into the shared treasury.",
  },
  {
    title: "3 · TREASURY",
    glyph: "treasury",
    lead: "One on-chain pot",
    detail: "Splits three ways — burn, believers, build. Visible in TREASURY.MON.",
  },
];

const SPLITS = [
  {
    file: "BURN.SYS",
    label: "Burn",
    pct: "40%",
    body: "Buyback & burn. Supply shrinks; holders benefit.",
    color: "var(--burn)",
    glyph: "burn" as const,
  },
  {
    file: "BELIEVERS.DAT",
    label: "Believers",
    pct: "40%",
    body: "Paid to holders & players. Believing longer pays more.",
    color: "var(--acid)",
    glyph: "star" as const,
  },
  {
    file: "BUILD.BIN",
    label: "Build",
    pct: "20%",
    body: "Devs, audits, new rides. Keeps the boardwalk lit.",
    color: "var(--cyber)",
    glyph: "gear" as const,
  },
];

export function TheLoop() {
  const { theme } = useOs();
  const palette = inkPalette(theme);

  return (
    <div className="flex flex-col gap-3 font-heading text-xs">
      <header className="space-y-1 border-b border-line pb-2.5">
        <p className="text-[11px] tracking-wide text-ink">EVERY CUT COMES HOME</p>
        <p className="font-sans text-[13px] font-normal normal-case tracking-normal leading-snug text-ink-dim">
          One engine for the boardwalk: action feeds a house cut into one treasury,
          then out as burn · believers · build.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-stretch">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative flex">
            <div className="bevel hard-shadow-sm flex w-full flex-col gap-1.5 p-2.5 text-left">
              <div className="flex items-center gap-2">
                <PixelIcon
                  grid={[...GLYPHS[step.glyph]]}
                  palette={palette}
                  px={2}
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                />
                <div className="text-[10px] tracking-wide text-ink">{step.title}</div>
              </div>
              <div className="min-h-[2.5rem] font-sans text-[13px] font-semibold normal-case tracking-normal leading-snug text-ink">
                {step.lead}
              </div>
              <p className="min-h-[2.75rem] font-sans text-[12px] font-normal normal-case tracking-normal leading-snug text-ink-dim">
                {step.detail}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="pointer-events-none absolute -right-1.5 top-1/2 z-[1] hidden -translate-y-1/2 text-ink sm:block"
                aria-hidden
              >
                <PixelIcon
                  grid={[...GLYPHS.arrow]}
                  palette={{ K: "currentColor" }}
                  px={2}
                  style={{ width: 10, height: 10 }}
                />
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="space-y-2">
        <p className="font-sans text-[12px] font-normal normal-case tracking-normal text-ink-dim">
          Treasury split — where the cut goes:
        </p>
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-stretch">
          {SPLITS.map((s) => (
            <div
              key={s.file}
              className="bevel-inset flex flex-col gap-1 p-2.5"
              style={{ boxShadow: `inset 0 0 0 1px ${s.color}` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <PixelIcon
                    grid={[...GLYPHS[s.glyph]]}
                    palette={{ K: s.color, Y: s.color }}
                    px={2}
                    style={{ width: 12, height: 12 }}
                  />
                  <span className="text-[10px] tracking-wide text-ink">{s.label}</span>
                </div>
                <span className="num text-lg leading-none" style={{ color: s.color }}>
                  {s.pct}
                </span>
              </div>
              <div className="text-[9px] tracking-wide text-ink-dim">{s.file}</div>
              <p className="min-h-[2.5rem] font-sans text-[12px] font-normal normal-case tracking-normal leading-snug text-ink-dim">
                {s.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
