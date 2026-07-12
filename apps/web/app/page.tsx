"use client";

import { useMemo, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { BootScreen } from "@/components/os/BootScreen";
import { Taskbar } from "@/components/os/Taskbar";
import { Win } from "@/components/os/Win";
import { DesktopIcons } from "@/components/os/DesktopIcons";
import { KineticHero } from "@/components/os/KineticHero";
import { WebringFooter } from "@/components/os/WebringFooter";
import { TheLoop } from "@/components/TheLoop";
import { ColorsGame } from "@/components/colors/ColorsGame";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { HonestStrip } from "@/components/HonestStrip";
import { applyHouseCut, type TreasuryState } from "@/lib/treasury/split";

function Desktop() {
  const { openWin, booted } = useOs();
  const [treasury, setTreasury] = useState<TreasuryState>({
    total: 0,
    burn: 0,
    believers: 0,
    build: 0,
    burnedTokens: 0,
  });
  const [yourShare, setYourShare] = useState(0);
  const [fairnessNote] = useState(
    "Open COLORS.EXE, play a round, then expand VERIFY FAIRNESS for seeds + dice derivation.",
  );

  const winDefaults = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        colors: { x: 220, y: 120, width: 720, height: 560 },
        loop: { x: 40, y: 100, width: 420, height: 360 },
        treasury: { x: 280, y: 320, width: 520, height: 320 },
        readme: { x: 120, y: 160, width: 420, height: 360 },
        fairness: { x: 200, y: 180, width: 440, height: 280 },
      };
    }
    const w = window.innerWidth;
    if (w < 768) {
      return {
        colors: { x: 8, y: 56, width: w - 16, height: Math.min(640, window.innerHeight - 120) },
        loop: { x: 8, y: 56, width: w - 16, height: 420 },
        treasury: { x: 8, y: 56, width: w - 16, height: 380 },
        readme: { x: 8, y: 56, width: w - 16, height: 400 },
        fairness: { x: 8, y: 56, width: w - 16, height: 320 },
      };
    }
    return {
      colors: { x: 240, y: 100, width: 740, height: 580 },
      loop: { x: 36, y: 90, width: 440, height: 380 },
      treasury: { x: 300, y: 340, width: 540, height: 340 },
      readme: { x: 140, y: 150, width: 440, height: 380 },
      fairness: { x: 220, y: 200, width: 460, height: 300 },
    };
  }, [booted]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <BootScreen />
      <div className="desktop-wallpaper" />
      <KineticHero />
      <DesktopIcons />

      <div className="absolute inset-0 bottom-10 z-[8] md:bottom-11">
        <Win id="loop" title="LOOP.EXE" default={winDefaults.loop} minWidth={300} minHeight={260}>
          <TheLoop />
        </Win>

        <Win
          id="colors"
          title="COLORS.EXE"
          default={winDefaults.colors}
          minWidth={320}
          minHeight={400}
        >
          <ColorsGame
            onHouseCut={(cut) => {
              setTreasury((t) => applyHouseCut(t, cut));
              setYourShare((s) => s + cut * 0.4 * 0.02);
            }}
          />
        </Win>

        <Win
          id="treasury"
          title="TREASURY.MON — SYSTEM MONITOR"
          default={winDefaults.treasury}
          minWidth={300}
          minHeight={260}
        >
          <TreasuryPanel
            {...treasury}
            yourShare={yourShare}
            onClaim={() => {
              if (yourShare <= 0) {
                alert("Nothing to claim yet — play a few rounds.");
                return;
              }
              alert(`⭐ Claimed ◎ ${yourShare.toFixed(4)} from Believers' Pool (Fun Mode).`);
              setYourShare(0);
            }}
          />
        </Win>

        <Win id="readme" title="README.TXT" default={winDefaults.readme} minWidth={280} minHeight={240}>
          <HonestStrip />
          <button
            type="button"
            className="bevel-btn bevel-btn-hot mt-4 px-3 py-2"
            onClick={() => openWin("fairness")}
          >
            OPEN FAIRNESS.LOG
          </button>
        </Win>

        <Win
          id="fairness"
          title="FAIRNESS.LOG"
          default={winDefaults.fairness}
          minWidth={280}
          minHeight={200}
        >
          <pre className="whitespace-pre-wrap font-mono text-[13px] text-ink-dim">
            {fairnessNote}
            {"\n\n"}
            Play COLORS.EXE → expand &quot;seeds (inline)&quot; after a roll for
            serverSeedHash, serverSeed, clientSeed, nonce, and dice.
          </pre>
        </Win>
      </div>

      <WebringFooter />
      <Taskbar
        treasuryTotal={treasury.total}
        burnedTokens={treasury.burnedTokens}
        believers={treasury.believers}
      />
    </div>
  );
}

export default function HomePage() {
  return <Desktop />;
}
