"use client";

import { useCallback, useEffect, useState } from "react";
import { useOs } from "@/components/os/OsContext";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import {
  getLeaderboard,
  SCORES_EVENT,
  type LeaderboardEntry,
} from "@/lib/leaderboard/localScores";
import { PROFILE_EVENT } from "@/lib/profile/localProfile";

export function LeaderboardPanel() {
  const { openWin } = useOs();
  const { pubkey } = useMidwayWallet();
  const { username } = usePlayerProfile();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);

  const refresh = useCallback(() => {
    setRows(getLeaderboard(pubkey));
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh, username]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(SCORES_EVENT, onChange);
    window.addEventListener(PROFILE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SCORES_EVENT, onChange);
      window.removeEventListener(PROFILE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return (
    <div className="font-heading text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div>
          <div className="chroma text-sm text-hot">BOARD.EXE</div>
          <div className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
            Colors leaderboard · demo / local
          </div>
        </div>
        <span className="bevel-inset px-2 py-1 text-[10px] text-acid">DEMO</span>
      </div>

      <div className="bevel-inset border border-acid/40 bg-acid/10 px-3 py-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        Seeded booth names plus your local wins. Sorted by wins, then play SOL
        won.
      </div>

      <div className="bevel-inset overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-line text-[10px] text-ink-dim">
              <th className="px-2 py-1.5 font-normal">#</th>
              <th className="px-2 py-1.5 font-normal">NAME</th>
              <th className="px-2 py-1.5 font-normal">WINS</th>
              <th className="px-2 py-1.5 font-normal">SOL WON</th>
              <th className="px-2 py-1.5 font-normal">WALLET</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.pubkey}
                className={`border-b border-line/60 ${
                  row.isYou ? "bg-ink/10 text-hot" : "text-ink"
                }`}
              >
                <td className="num px-2 py-1.5 text-[12px]">{row.rank}</td>
                <td className="px-2 py-1.5 text-[12px]">
                  {row.username}
                  {row.isYou ? (
                    <span className="ml-1 text-[9px] text-acid">YOU</span>
                  ) : null}
                </td>
                <td className="num px-2 py-1.5 text-[12px]">{row.wins}</td>
                <td className="num px-2 py-1.5 text-[12px]">
                  {row.solWon.toFixed(2)}
                </td>
                <td className="num px-2 py-1.5 text-[10px] text-ink-dim">
                  {row.walletLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("dashboard")}
        >
          ▶ DASHBOARD
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("colors")}
        >
          ▶ PLAY COLORS
        </button>
      </div>
    </div>
  );
}
