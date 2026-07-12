"use client";

const NODES = [
  { title: "PLAY / MINT / TRADE", body: "Colors · Glitch · NFTs · swaps", icon: "🎲" },
  { title: "HOUSE CUT 5%", body: "the edge that vanishes elsewhere", icon: "💰" },
  { title: "TREASURY", body: "on-chain · honest · three ways", icon: "🏛️" },
];

const SPLITS = [
  { file: "BURN.SYS", pct: "40%", body: "buyback & burn · supply ↓", color: "var(--burn)" },
  { file: "BELIEVERS.DAT", pct: "40%", body: "paid to holders & players", color: "var(--acid)" },
  { file: "BUILD.BIN", pct: "20%", body: "devs · audits · new rides", color: "var(--cyber)" },
];

export function TheLoop() {
  return (
    <div className="space-y-4 font-heading text-xs">
      <p className="text-ink-dim">
        every action across the ecosystem runs through the same engine
      </p>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {NODES.map((n, i) => (
          <div key={n.title} className="contents">
            <div className="bevel hard-shadow-sm p-3 text-center">
              <div className="mb-1 text-2xl">{n.icon}</div>
              <div className="text-ink">{n.title}</div>
              <div className="mt-1 font-sans text-[14px] normal-case tracking-normal text-ink-dim">
                {n.body}
              </div>
            </div>
            {i < NODES.length - 1 && (
              <div className="hidden text-center text-acid md:block" aria-hidden>
                ▶▶
                <div className="mt-1 animate-pulse text-[10px]">◎</div>
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
            <div className="num text-xl" style={{ color: s.color }}>
              {s.pct}
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
