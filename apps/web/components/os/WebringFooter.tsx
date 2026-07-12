export function WebringFooter() {
  return (
    <div className="fixed bottom-10 left-0 right-0 z-[6] border-t-2 border-line bg-chrome/90 px-3 py-1.5 text-center font-heading text-[10px] tracking-wide text-ink-dim md:bottom-11">
      <div className="mb-0.5 text-ink">{"<<"} NEIGHBORS + COOL SITES {">>"}</div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge label="COLORS" color="var(--hot)" />
        <Badge label="GLITCH" color="var(--cyber)" />
        <Badge label="BURN" color="var(--burn)" />
        <Badge label="X/TWITTER" color="var(--acid)" />
        <span className="num text-amber">HITS: 00,198,998</span>
      </div>
      <div className="mt-0.5">best viewed in MIDWAY OS · not financial advice</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block border border-[var(--bevel-lo)] px-2 py-0.5 text-[9px] text-[var(--btn)] hard-shadow-sm"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
