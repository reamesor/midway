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
        colors: { x: 300, y: 48, width: 780, height: 620 },
        loop: { x: 48, y: 48, width: 460, height: 420 },
        treasury: { x: 340, y: 280, width: 560, height: 360 },
        readme: { x: 120, y: 120, width: 440, height: 380 },
        fairness: { x: 200, y: 160, width: 460, height: 300 },
      };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const task = 48;
    const footer = 52;
    const usableH = h - task - footer;

    if (w < 768) {
      return {
        colors: { x: 6, y: 44, width: w - 12, height: Math.min(usableH - 8, h - 100) },
        loop: { x: 6, y: 44, width: w - 12, height: Math.min(440, usableH - 8) },
        treasury: { x: 6, y: 44, width: w - 12, height: Math.min(400, usableH - 8) },
        readme: { x: 6, y: 44, width: w - 12, height: Math.min(420, usableH - 8) },
        fairness: { x: 6, y: 44, width: w - 12, height: Math.min(340, usableH - 8) },
      };
    }

    // Dense tiling: icons occupy left ~300px; windows fill the rest
    const left = Math.min(300, Math.round(w * 0.22));
    const pad = 12;
    const colorsW = Math.min(820, w - left - pad * 2);
    const colorsH = Math.min(640, usableH - pad * 2);
    return {
      colors: {
        x: left + pad,
        y: pad + 8,
        width: colorsW,
        height: colorsH,
      },
      loop: {
        x: left + pad,
        y: Math.min(colorsH + 20, usableH - 380),
        width: Math.min(480, colorsW * 0.58),
        height: Math.min(400, usableH * 0.42),
      },
      treasury: {
        x: left + pad + Math.min(480, colorsW * 0.58) + 12,
        y: Math.min(colorsH + 20, usableH - 340),
        width: Math.min(520, colorsW * 0.42),
        height: Math.min(360, usableH * 0.4),
      },
      readme: { x: left + 40, y: 80, width: 460, height: 400 },
      fairness: { x: left + 80, y: 120, width: 480, height: 320 },
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
              alert(`Claimed ◎ ${yourShare.toFixed(4)} from Believers' Pool (Fun Mode).`);
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
