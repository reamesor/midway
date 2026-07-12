"use client";

import type { ReactNode } from "react";
import { useOs } from "@/components/os/OsContext";
import {
  HOLDER_CLAIM_BONUS_BPS,
  HOLDER_MULTIPLIERS,
  formatClaimBonusBps,
  formatMultiplier,
} from "@/lib/nft/holders";

export function InfoPanel() {
  const { openWin, openSoon } = useOs();
  const multiplierLine = HOLDER_MULTIPLIERS.map(
    (t) => `${formatMultiplier(t.multiplier)} ${t.label.toLowerCase()}`,
  ).join(" · ");
  const claimBonus = formatClaimBonusBps(HOLDER_CLAIM_BONUS_BPS);

  return (
    <div className="info-panel space-y-5 text-[14px] leading-relaxed text-ink">
      <div className="info-tldr bevel-inset sticky top-0 z-10 -mx-1 mb-1 space-y-2 bg-panel px-3 py-3">
        <div className="font-heading text-[11px] tracking-wide text-ink">
          TL;DR — skim in ~20s
        </div>
        <ul className="list-disc space-y-1.5 pl-4 font-sans text-[13px] text-ink-dim">
          <li>
            On <span className="text-ink">pump.fun</span> and most trading/token rails,
            fees and claimable value flow back to <span className="text-ink">deployers</span>.
          </li>
          <li>
            On <span className="text-ink">Midway</span>, the house cut comes home to who
            runs it — CTOs / operators — <span className="text-ink">and</span> gamblers,
            holders, and builders. Everyone gains something.
          </li>
          <li>
            Tagline: <span className="text-ink">every cut comes home</span>. Loop:{" "}
            <span className="text-ink">5% house cut</span> →{" "}
            <span className="text-ink">40% burn</span> ·{" "}
            <span className="text-ink">40% believers</span> ·{" "}
            <span className="text-ink">20% build</span>.
          </li>
          <li>
            Live now: <span className="text-ink">Colors</span> (demo / Fun Mode). NFT
            holders (when mint ships) get planned ride multipliers + an extra believers
            claim cut — see NFT.LAUNCH.
          </li>
          <li>
            Rolls are <span className="text-ink">provably fair</span>. Alpha booth —
            expect rough edges.
          </li>
        </ul>
      </div>

      <Header>What MIDWAY is</Header>
      <p className="font-sans text-ink-dim">
        MIDWAY is a Solana ecosystem dressed as a haunted 8-bit boardwalk arcade running
        inside a bootleg operating system. Under the wallpaper and windows, the product is
        simple: <strong className="font-semibold text-ink">one shared treasury</strong>{" "}
        that captures the house cut from play (and later mint/trade) and gives that value
        back to the people who keep the boardwalk alive — not a private deployer purse.
      </p>
      <p className="font-sans text-ink-dim">
        Elsewhere, casinos and platforms keep the edge. Here the edge is the product —
        captured, split, and shown in the open so you can watch the cut come home.
      </p>

      <Header>Not deployer-only fees — who gets the cut</Header>
      <p className="font-sans text-ink-dim">
        On pump.fun and a lot of trading / token platforms, the fee story is simple: value
        accrues to whoever deployed the coin. Midway&apos;s model is different by design.
        The house cut is meant to flow back to{" "}
        <strong className="font-semibold text-ink">who runs it</strong> — CTOs and
        operators who keep the booths open —{" "}
        <strong className="font-semibold text-ink">and</strong> to the crowd that makes
        the boardwalk worth running.
      </p>
      <ul className="list-disc space-y-1.5 pl-4 font-sans text-[13px] text-ink-dim">
        <li>
          <span className="text-ink">Gamblers / players</span> — play the rides; the
          edge funds the shared loop instead of vanishing into a black box.
        </li>
        <li>
          <span className="text-ink">Believers (holders)</span> — the 40% believers slice
          is the holder / loyalty share of every cut that comes home.
        </li>
        <li>
          <span className="text-ink">Builders</span> — the 20% build slice keeps audits,
          new attractions, and the OS itself lit.
        </li>
        <li>
          <span className="text-ink">Operators / CTOs</span> — the people running Midway
          sit inside that same ecosystem, not above it as the sole fee sink.
        </li>
      </ul>
      <p className="font-sans text-ink-dim">
        That&apos;s the philosophy behind{" "}
        <span className="text-ink">every cut comes home</span>: one 5% house cut on
        Colors, then <span className="text-ink">40% burn / 40% believers / 20% build</span>.
        Live Colors is still demo / Fun Mode treasury math — the split you see in
        TREASURY.MON is the Midway design made visible, with full on-chain payouts still
        landing.
      </p>

      <Header>The boardwalk metaphor</Header>
      <p className="font-sans text-ink-dim">
        Think carnival midway: tents, tickets, rides, and a loop that keeps the lights
        on. Each attraction is a window on the desktop. The taskbar is the ticket booth.
        The treasury monitor is the cash house. You wander the OS, open a game, play a
        round — and the rake does not vanish into a black box. It walks the same path
        every time: into the treasury, then out as burn, believer pay, and build fund.
      </p>
      <p className="font-sans text-ink-dim">
        The warm paper, sage ink, and pixel chrome are not decoration for decoration&apos;s
        sake — they signal that this is a place you hang out in, not a sterile dashboard
        you visit once.
      </p>

      <Header>Colors — the first ride</Header>
      <p className="font-sans text-ink-dim">
        <strong className="font-semibold text-ink">Colors</strong> is a pick-up-to-3-of-6
        dice game with published ~5% house edge. Match and you are paid in full on the
        unit bet: 1 match → Bet+(Bet×1.04), 2 → Bet+(Bet×1.04×2), jackpot →
        Bet+(Bet×4.5). Every roll still takes a 5% cut of total bet cost into the treasury
        — win or lose — so you can open TREASURY.MON and watch meters move.
      </p>
      <p className="font-sans text-ink-dim">
        Demo uses a local 10 SOL play pot (no real transfers). Fairness details (seeds,
        hashes, dice derivation) live in FAIRNESS.LOG and inline after a roll.
      </p>

      <Header>House cut → treasury loop</Header>
      <p className="font-sans text-ink-dim">
        The core mechanic: take the edge other houses keep, route it on-chain into one
        treasury, then split it three ways:
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <SplitCard
          file="BURN.SYS"
          pct="40%"
          body="Buyback & burn. Supply drops; holders benefit as the bag gets scarcer."
        />
        <SplitCard
          file="BELIEVERS.DAT"
          pct="40%"
          body="Paid to holders & players. Believing and playing longer earns a larger slice."
        />
        <SplitCard
          file="BUILD.BIN"
          pct="20%"
          body="Devs, audits, new attractions. Keeps the boardwalk lit."
        />
      </div>
      <p className="font-sans text-ink-dim">
        LOOP.EXE on the desktop is the same story as a diagram. TREASURY.MON is the live
        readout. Same engine for every ride that plugs in later.
      </p>

      <Header>&ldquo;Every cut comes home&rdquo;</Header>
      <p className="font-sans text-ink-dim">
        That line is the trust story — and the contrast with deployer-only fee models.
        No silent rake. No mystery fee that evaporates into a private purse. When you
        play, mint, or trade through Midway rails, the cut is meant to be visible,
        countable, and destined for burn / believers / build so operators, gamblers,
        believers, and builders all get a piece of the boardwalk.
      </p>

      <Header>Play · mint · trade</Header>
      <p className="font-sans text-ink-dim">
        Colors is the first live attraction. Open{" "}
        <strong className="font-semibold text-ink">TOKEN.INFO</strong> for mint,
        buy links, and socials. Dock icons marked SOON — Glitch, NFT — are
        placeholders for booths that will plug into the same treasury loop: NFT
        drops (mint fees + royalties), more games, and trade rails. One engine,
        many booths — each feeds the same three-way split so the ecosystem
        compounds instead of fragmenting into unrelated silos.
      </p>
      <p className="font-sans text-ink-dim">
        <strong className="font-semibold text-ink">NFT.LAUNCH</strong> (not live yet)
        spells the holder promise in numbers: planned Colors / attraction multipliers
        ({multiplierLine}) plus {claimBonus} believers / claimable-fee share for
        holders vs non-holders. Economics are designed — mint and claims are not
        wired.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bevel-btn px-3 py-2 font-heading text-[11px]"
          onClick={() => openWin("token")}
        >
          OPEN TOKEN.INFO
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2 font-heading text-[11px]"
          onClick={() =>
            openSoon(
              "NFT.LAUNCH",
              "When live: holders get planned ride multipliers + an extra cut of claimable believers fees. Mint not open yet.",
            )
          }
        >
          OPEN NFT.LAUNCH
        </button>
      </div>

      <Header>Honest &amp; fair</Header>
      <p className="font-sans text-ink-dim">
        Colors rolls use commit-reveal RNG so you can verify seeds and dice after a
        round. The 40/40/20 split is the public contract of the treasury story —
        watch cuts come in and burns go out. Holding and playing longer is meant to
        grow your slice of the Believers&apos; Pool, not punish loyalty with opaque odds.
      </p>
      <button
        type="button"
        className="bevel-btn bevel-btn-hot px-3 py-2 font-heading text-[11px]"
        onClick={() => openWin("fairness")}
      >
        OPEN FAIRNESS.LOG
      </button>

      <Header>Alpha status</Header>
      <p className="font-sans text-ink-dim">
        You are looking at an early arcade shell: Fun Mode treasury math, UI polish in
        flight, and chain wiring still landing. Expect missing rides, rough copy, and
        numbers that are illustrative until mainnet programs and wallets are fully
        hooked up. Feedback helps — treat this as a living booth, not a finished fair.
      </p>

      <p className="border-t border-line pt-3 font-heading text-[10px] tracking-wide text-ink-dim">
        MIDWAY OS · INFO.TXT · every cut comes home
      </p>
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-heading text-[12px] tracking-wide text-ink border-b border-line pb-1">
      {children}
    </h3>
  );
}

function SplitCard({
  file,
  pct,
  body,
}: {
  file: string;
  pct: string;
  body: string;
}) {
  return (
    <div className="bevel-inset p-2.5">
      <div className="font-heading text-[10px] text-ink-dim">{file}</div>
      <div className="num my-0.5 text-lg text-ink">{pct}</div>
      <p className="font-sans text-[12px] leading-snug text-ink-dim">{body}</p>
    </div>
  );
}
