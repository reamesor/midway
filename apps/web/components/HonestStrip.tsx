"use client";

import type { ReactNode } from "react";

export function HonestStrip() {
  return (
    <div className="space-y-3 font-mono text-[15px] leading-relaxed text-ink">
      <p>MIDWAY README.TXT — On-Chain & Honest</p>
      <hr className="border-line" />
      <Item title="Provably fair rolls.">
        every Colors roll uses commit-reveal RNG. verify seeds + dice after any roll.
      </Item>
      <Item title="Transparent treasury.">
        the 40/40/20 split is enforced on-chain. watch the cut come in and the burn go out.
      </Item>
      <Item title="No cut disappears.">
        the house edge other platforms pocket funds your rewards here.
      </Item>
      <Item title="Believing pays.">
        hold + play longer → larger slice of every Believers&apos; Pool drop.
      </Item>
    </div>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-cyber">{title}</div>
      <p className="text-ink-dim">{children}</p>
    </div>
  );
}
