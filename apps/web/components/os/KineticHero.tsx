"use client";

import { PixelIcon, TENT, P_TENT } from "@/lib/pixel";
import { useOs } from "./OsContext";

/** Subtle corner brand — hidden when the idle empty-desktop scene owns the mark. */
export function KineticHero() {
  const { open } = useOs();
  const empty = Object.values(open).every((v) => !v);
  if (empty) return null;

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[2] flex items-center gap-2 md:right-5 md:top-4">
      <PixelIcon
        grid={[...TENT]}
        palette={{ ...P_TENT }}
        px={2}
        style={{ width: 36, height: 36, opacity: 0.85 }}
      />
      <div className="hidden text-right sm:block">
        <div className="font-heading text-[10px] tracking-[0.2em] text-ink-dim">
          MIDWAY
        </div>
        <div className="font-heading text-[8px] tracking-[0.18em] text-ink-dim/80">
          EVERY CUT COMES HOME
        </div>
      </div>
    </div>
  );
}
