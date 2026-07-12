"use client";

import { useMemo, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { BootScreen } from "@/components/os/BootScreen";
import { Taskbar } from "@/components/os/Taskbar";
import { Win } from "@/components/os/Win";
import { DesktopIcons } from "@/components/os/DesktopIcons";
import { KineticHero } from "@/components/os/KineticHero";
import { TheLoop } from "@/components/TheLoop";
import { ColorsGame } from "@/components/colors/ColorsGame";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { InfoPanel } from "@/components/os/InfoPanel";
import { ComingSoonStub } from "@/components/os/ComingSoonStub";
import { applyHouseCut, type TreasuryState } from "@/lib/treasury/split";

type Rect = { x: number; y: number; width: number; height: number };

function tileLayout(
  w: number,
  h: number,
): Record<"colors" | "loop" | "treasury" | "info" | "fairness" | "soon", Rect> {
  const task = 44;
  const usableH = Math.max(280, h - task);
  const pad = 8;
  const gap = 8;

  if (w < 768) {
    // Near full-bleed stack under the icon dock — taskbar tabs switch focus
    const dock = 58;
    const full: Rect = {
      x: pad,
      y: pad + dock,
      width: Math.max(280, w - pad * 2),
      height: Math.max(280, usableH - pad * 2 - dock),
    };
    return {
      colors: full,
      loop: { ...full, x: pad + 8, y: pad + dock + 8 },
      treasury: { ...full, x: pad + 16, y: pad + dock + 16 },
      info: { ...full, x: pad + 12, y: pad + dock + 12 },
      fairness: { ...full, x: pad + 20, y: pad + dock + 20 },
      soon: { ...full, x: pad + 24, y: pad + dock + 24 },
    };
  }

  // Slim icon rail on the left; windows fill the rest
  const rail = w >= 1100 ? 92 : 84;
  const workX = rail + pad;
  const workY = pad;
  const workW = Math.max(480, w - workX - pad);
  const workH = Math.max(360, usableH - pad * 2);

  const colGap = gap;
  const mainW = Math.floor(workW * 0.62);
  const sideW = workW - mainW - colGap;
  const sideH = Math.floor((workH - gap) / 2);

  return {
    colors: {
      x: workX,
      y: workY,
      width: mainW,
      height: workH,
    },
    loop: {
      x: workX + mainW + colGap,
      y: workY,
      width: sideW,
      height: sideH,
    },
    treasury: {
      x: workX + mainW + colGap,
      y: workY + sideH + gap,
      width: sideW,
      height: workH - sideH - gap,
    },
    info: {
      x: workX + Math.round(workW * 0.1),
      y: workY + Math.round(workH * 0.06),
      width: Math.min(520, Math.round(workW * 0.58)),
      height: Math.min(520, Math.round(workH * 0.82)),
    },
    fairness: {
      x: workX + Math.round(workW * 0.18),
      y: workY + Math.round(workH * 0.14),
      width: Math.min(500, Math.round(workW * 0.5)),
      height: Math.min(360, Math.round(workH * 0.55)),
    },
    soon: {
      x: workX + Math.round(workW * 0.22),
      y: workY + Math.round(workH * 0.22),
      width: Math.min(380, Math.round(workW * 0.42)),
      height: Math.min(280, Math.round(workH * 0.42)),
    },
  };
}

function Desktop() {
  const { booted, soonTitle } = useOs();
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
        colors: { x: 100, y: 8, width: 780, height: 640 },
        loop: { x: 900, y: 8, width: 420, height: 310 },
        treasury: { x: 900, y: 326, width: 420, height: 310 },
        info: { x: 180, y: 40, width: 500, height: 520 },
        fairness: { x: 240, y: 120, width: 480, height: 320 },
        soon: { x: 280, y: 160, width: 360, height: 260 },
      };
    }
    return tileLayout(window.innerWidth, window.innerHeight);
  }, [booted]);

  // Remount windows after boot so Rnd picks up measured viewport tiles
  const layoutKey = booted ? "live" : "boot";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <BootScreen />
      <div className="desktop-wallpaper" />
      <KineticHero />
      <DesktopIcons />

      <div className="absolute inset-0 bottom-10 z-[8] md:bottom-11">
        <Win
          key={`loop-${layoutKey}`}
          id="loop"
          title="LOOP.EXE"
          default={winDefaults.loop}
          minWidth={280}
          minHeight={220}
        >
          <TheLoop />
        </Win>

        <Win
          key={`colors-${layoutKey}`}
          id="colors"
          title="COLORS.EXE"
          default={winDefaults.colors}
          minWidth={300}
          minHeight={360}
        >
          <ColorsGame
            onHouseCut={(cut) => {
              setTreasury((t) => applyHouseCut(t, cut));
              setYourShare((s) => s + cut * 0.4 * 0.02);
            }}
          />
        </Win>

        <Win
          key={`treasury-${layoutKey}`}
          id="treasury"
          title="TREASURY.MON — SYSTEM MONITOR"
          default={winDefaults.treasury}
          minWidth={280}
          minHeight={220}
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

        <Win
          key={`info-${layoutKey}`}
          id="info"
          title="INFO.TXT — WHAT IS MIDWAY"
          default={winDefaults.info}
          minWidth={300}
          minHeight={280}
        >
          <InfoPanel />
        </Win>

        <Win
          key={`fairness-${layoutKey}`}
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

        <Win
          key={`soon-${layoutKey}`}
          id="soon"
          title={soonTitle || "COMING.SOON"}
          default={winDefaults.soon}
          minWidth={260}
          minHeight={200}
        >
          <ComingSoonStub />
        </Win>
      </div>

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
