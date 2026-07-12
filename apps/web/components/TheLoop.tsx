"use client";

import { PixelIcon, GLYPHS, inkPalette } from "@/lib/pixel";
import { useOs } from "@/components/os/OsContext";

const NODES: {
  title: string;
  body: string;
  glyph: keyof typeof GLYPHS;
}[] = [
  { title: "PLAY / MINT / TRADE", body: "Colors · Glitch · NFTs · swaps", glyph: "palette" },
  { title: "HOUSE CUT 5%", body: "the edge that vanishes elsewhere", glyph: "coin" },
  { title: "TREASURY", body: "on-chain · honest · three ways", glyph: "treasury" },
];

const SPLITS = [
  { file: "BURN.SYS", pct: "40%", body: "buyback & burn · supply ↓", color: "var(--burn)", glyph: "burn" as const },
  { file: "BELIEVERS.DAT", pct: "40%", body: "paid to holders & players", color: "var(--acid)", glyph: "star" as const },
  { file: "BUILD.BIN", pct: "20%", body: "devs · audits · new rides", color: "var(--cyber)", glyph: "gear" as const },
];

export function TheLoop() {
  const { theme } = useOs();
  const palette = inkPalette(theme);

  return (
    <div className="space-y-4 font-heading text-xs">
      <p className="text-ink-dim">
        every action across the ecosystem runs through the same engine
      </p>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {NODES.map((n, i) => (
          <div key={n.title} className="contents">
            <div className="bevel hard-shadow-sm p-3 text-center">
              <div className="mb-2 flex justify-center">
                <PixelIcon
                  grid={[...GLYPHS[n.glyph]]}
                  palette={palette}
                  px={3}
                  style={{ width: 28, height: 28 }}
                />
              </div>
              <div className="text-ink">{n.title}</div>
              <div className="mt-1 font-sans text-[14px] normal-case tracking-normal text-ink-dim">
                {n.body}
              </div>
            </div>
            {i < NODES.length - 1 && (
              <div className="hidden text-center text-ink md:flex md:justify-center" aria-hidden>
                <PixelIcon
                  grid={[...GLYPHS.arrow]}
                  palette={{ K: "currentColor" }}
                  px={3}
                  style={{ width: 14, height: 14 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {SPLITS.map((s) => (
          <div
            key={s.file}
            className="bevel-inset p-3"
            style={{ boxShadow: `inset 0 0 0 1px ${s.color}` }}
          >
            <div className="mb-1 flex items-center gap-2">
              <PixelIcon
                grid={[...GLYPHS[s.glyph]]}
                palette={{ K: s.color, Y: s.color }}
                px={2}
                style={{ width: 14, height: 14 }}
              />
              <div className="num text-xl" style={{ color: s.color }}>
                {s.pct}
              </div>
            </div>
            <div className="mt-1 text-ink">{s.file}</div>
            <p className="mt-1 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
