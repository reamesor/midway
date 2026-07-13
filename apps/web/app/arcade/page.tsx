"use client";

import { useEffect, useMemo, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { BootScreen } from "@/components/os/BootScreen";
import { Taskbar } from "@/components/os/Taskbar";
import { Win } from "@/components/os/Win";
import { DesktopIcons } from "@/components/os/DesktopIcons";
import { KineticHero } from "@/components/os/KineticHero";
import { IdleDesktop } from "@/components/os/IdleDesktop";
import { TheLoop } from "@/components/TheLoop";
import { ColorsGame } from "@/components/colors/ColorsGame";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { MidwayWalletPanel } from "@/components/wallet/MidwayWalletPanel";
import { InfoPanel } from "@/components/os/InfoPanel";
import { TokenInfoPanel } from "@/components/os/TokenInfoPanel";
import { ComingSoonStub } from "@/components/os/ComingSoonStub";
import { NftLaunchPanel } from "@/components/os/NftLaunchPanel";
import { FairnessPanel } from "@/components/os/FairnessPanel";
import { DashboardPanel } from "@/components/os/DashboardPanel";
import { LeaderboardPanel } from "@/components/os/LeaderboardPanel";
import { applyHouseCut, type TreasuryState } from "@/lib/treasury/split";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import {
  addBelieversShare,
  claimBelieversShare,
  loadBelieversShare,
  SHARE_EVENT,
} from "@/lib/profile/believersShare";
import { recordSharesClaimed } from "@/lib/leaderboard/localScores";

type Rect = { x: number; y: number; width: number; height: number };

type WinLayoutId =
  | "colors"
  | "loop"
  | "treasury"
  | "wallet"
  | "info"
  | "token"
  | "fairness"
  | "dashboard"
  | "leaderboard"
  | "soon";

function tileLayout(w: number, h: number): Record<WinLayoutId, Rect> {
  // Match --taskbar-h / --dock-w / --shell-pad-bottom / --dock-mobile-h in globals.css.
  // desktop-wins is already inset by dock + chrome-bottom, so coords are relative to that pane.
  const task = 40;
  const shellPadBottom = 56; // --shell-pad-bottom (macOS dock / safe-area clearance)
  const chromeBottom = task + shellPadBottom;
  const usableH = Math.max(280, h - chromeBottom);
  const pad = 6;
  const gap = 6;

  if (w < 768) {
    // Parent already clears the top dock — stack near full-bleed in the pane
    const full: Rect = {
      x: pad,
      y: pad,
      width: Math.max(280, w - pad * 2),
      height: Math.max(280, usableH - pad * 2 - 58),
    };
    return {
      colors: full,
      loop: { ...full, x: pad + 8, y: pad + 8 },
      treasury: { ...full, x: pad + 16, y: pad + 16 },
      wallet: { ...full, x: pad + 10, y: pad + 10 },
      info: { ...full, x: pad + 12, y: pad + 12 },
      token: { ...full, x: pad + 14, y: pad + 14 },
      fairness: { ...full, x: pad + 20, y: pad + 20 },
      dashboard: { ...full, x: pad + 18, y: pad + 18 },
      leaderboard: { ...full, x: pad + 22, y: pad + 22 },
      soon: { ...full, x: pad + 24, y: pad + 24 },
    };
  }

  // Parent left inset = dock width; windows fill the remaining pane
  const dock = w >= 1100 ? 76 : 70;
  const workX = pad;
  const workY = pad;
  const workW = Math.max(480, w - dock - pad * 2);
  const workH = Math.max(360, usableH - pad * 2);

  const colGap = gap;
  const mainW = Math.floor(workW * 0.62);
  const sideW = workW - mainW - colGap;
  const loopH = Math.floor(workH * 0.54);
  const treasuryH = workH - loopH - gap;

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
      height: loopH,
    },
    treasury: {
      x: workX + mainW + colGap,
      y: workY + loopH + gap,
      width: sideW,
      height: treasuryH,
    },
    wallet: {
      x: workX + Math.round(workW * 0.16),
      y: workY + Math.round(workH * 0.08),
      width: Math.min(440, Math.round(workW * 0.48)),
      height: Math.min(520, Math.round(workH * 0.78)),
    },
    info: {
      x: workX + Math.round(workW * 0.1),
      y: workY + Math.round(workH * 0.06),
      width: Math.min(520, Math.round(workW * 0.58)),
      height: Math.min(520, Math.round(workH * 0.82)),
    },
    token: {
      x: workX + Math.round(workW * 0.12),
      y: workY + Math.round(workH * 0.08),
      width: Math.min(500, Math.round(workW * 0.55)),
      height: Math.min(540, Math.round(workH * 0.84)),
    },
    fairness: {
      x: workX + Math.round(workW * 0.18),
      y: workY + Math.round(workH * 0.14),
      width: Math.min(500, Math.round(workW * 0.5)),
      height: Math.min(360, Math.round(workH * 0.55)),
    },
    dashboard: {
      x: workX + Math.round(workW * 0.14),
      y: workY + Math.round(workH * 0.1),
      width: Math.min(460, Math.round(workW * 0.5)),
      height: Math.min(480, Math.round(workH * 0.72)),
    },
    leaderboard: {
      x: workX + Math.round(workW * 0.2),
      y: workY + Math.round(workH * 0.12),
      width: Math.min(480, Math.round(workW * 0.52)),
      height: Math.min(440, Math.round(workH * 0.68)),
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
  const isNftLaunch = soonTitle === "NFT.LAUNCH";
  const { pubkey, claimShare } = useMidwayWallet();
  const [treasury, setTreasury] = useState<TreasuryState>({
    total: 0,
    burn: 0,
    believers: 0,
    build: 0,
    burnedTokens: 0,
  });
  const [yourShare, setYourShare] = useState(0);
  const [layoutSize, setLayoutSize] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const apply = () =>
      setLayoutSize({ w: window.innerWidth, h: window.innerHeight });
    apply();
    window.addEventListener("resize", apply);
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", apply);
    return () => {
      window.removeEventListener("resize", apply);
      mq.removeEventListener("change", apply);
    };
  }, [booted]);

  const narrow = layoutSize.w < 768;

  useEffect(() => {
    if (!pubkey) {
      setYourShare(0);
      return;
    }
    setYourShare(loadBelieversShare(pubkey));
  }, [pubkey]);

  useEffect(() => {
    const onShare = () => {
      if (pubkey) setYourShare(loadBelieversShare(pubkey));
    };
    window.addEventListener(SHARE_EVENT, onShare);
    return () => window.removeEventListener(SHARE_EVENT, onShare);
  }, [pubkey]);

  const winDefaults = useMemo(
    () => tileLayout(layoutSize.w, layoutSize.h),
    [layoutSize.h, layoutSize.w],
  );

  // Remount when boot finishes or phone/desktop breakpoint flips so tiles fit
  const layoutKey = `${booted ? "live" : "boot"}-${narrow ? "m" : "d"}`;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <BootScreen />
      <div className="desktop-wallpaper" />
      <IdleDesktop />
      <KineticHero />
      <DesktopIcons />

      <div className="desktop-wins pointer-events-none">
        <Win
          key={`loop-${layoutKey}`}
          id="loop"
          title="LOOP.EXE"
          default={winDefaults.loop}
          minWidth={narrow ? 260 : 280}
          minHeight={300}
        >
          <TheLoop />
        </Win>

        <Win
          key={`colors-${layoutKey}`}
          id="colors"
          title="COLORS.EXE"
          default={winDefaults.colors}
          minWidth={narrow ? 260 : 300}
          minHeight={narrow ? 320 : 360}
        >
          <ColorsGame
            onHouseCut={(cut) => {
              setTreasury((t) => applyHouseCut(t, cut));
              if (pubkey) {
                const next = addBelieversShare(pubkey, cut * 0.4 * 0.02);
                setYourShare(next);
              }
            }}
          />
        </Win>

        <Win
          key={`treasury-${layoutKey}`}
          id="treasury"
          title="TREASURY.MON — SYSTEM MONITOR"
          default={winDefaults.treasury}
          minWidth={narrow ? 260 : 280}
          minHeight={220}
        >
          <TreasuryPanel
            {...treasury}
            yourShare={yourShare}
            onClaim={() => {
              if (!pubkey) {
                setYourShare(0);
                return;
              }
              const amount = claimBelieversShare(pubkey);
              if (amount > 0) {
                claimShare(amount, "believers share claimed");
                recordSharesClaimed(pubkey, amount);
              }
              setYourShare(0);
            }}
          />
        </Win>

        <Win
          key={`wallet-${layoutKey}`}
          id="wallet"
          title="WALLET.EXE — MIDWAY WALLET"
          default={winDefaults.wallet}
          minWidth={narrow ? 260 : 300}
          minHeight={360}
        >
          <MidwayWalletPanel />
        </Win>

        <Win
          key={`info-${layoutKey}`}
          id="info"
          title="INFO.TXT — WHAT IS MIDWAY"
          default={winDefaults.info}
          minWidth={narrow ? 260 : 300}
          minHeight={280}
        >
          <InfoPanel />
        </Win>

        <Win
          key={`token-${layoutKey}`}
          id="token"
          title="TOKEN.INFO — MIDWAY TOKEN"
          default={winDefaults.token}
          minWidth={narrow ? 260 : 300}
          minHeight={280}
        >
          <TokenInfoPanel />
        </Win>

        <Win
          key={`fairness-${layoutKey}`}
          id="fairness"
          title="FAIRNESS.LOG"
          default={winDefaults.fairness}
          minWidth={narrow ? 260 : 280}
          minHeight={200}
        >
          <FairnessPanel />
        </Win>

        <Win
          key={`dashboard-${layoutKey}`}
          id="dashboard"
          title="PROFILE.EXE — IDENTITY"
          default={winDefaults.dashboard}
          minWidth={narrow ? 260 : 300}
          minHeight={320}
        >
          <DashboardPanel />
        </Win>

        <Win
          key={`leaderboard-${layoutKey}`}
          id="leaderboard"
          title="BOARD.EXE — LEADERBOARD"
          default={winDefaults.leaderboard}
          minWidth={narrow ? 260 : 300}
          minHeight={280}
        >
          <LeaderboardPanel />
        </Win>

        <Win
          key={`soon-${layoutKey}`}
          id="soon"
          title={soonTitle || "COMING.SOON"}
          default={winDefaults.soon}
          minWidth={narrow ? 260 : 280}
          minHeight={isNftLaunch ? 360 : 200}
        >
          {isNftLaunch ? <NftLaunchPanel /> : <ComingSoonStub />}
        </Win>
      </div>

      <Taskbar
        treasuryTotal={treasury.total}
        burnedTokens={treasury.burnedTokens}
        believers={treasury.believers}
      />
      <div className="arcade-desktop-clearance" aria-hidden />
    </div>
  );
}

export default function HomePage() {
  return <Desktop />;
}
