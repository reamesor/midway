"use client";

import { useCallback, useEffect, useState } from "react";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import {
  loadProfile,
  saveProfile,
  PROFILE_EVENT,
  type MidwayProfile,
} from "@/lib/profile/localProfile";
import {
  loadPlayerStats,
  SCORES_EVENT,
  type PlayerStats,
} from "@/lib/leaderboard/localScores";

/**
 * Username + local Colors stats for the connected wallet / demo guest.
 */
export function usePlayerProfile() {
  const { pubkey, connected, demoGuest, play } = useMidwayWallet();
  const [profile, setProfile] = useState<MidwayProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const refresh = useCallback(() => {
    if (!pubkey) {
      setProfile(null);
      setStats(null);
      return;
    }
    setProfile(loadProfile(pubkey));
    setStats(loadPlayerStats(pubkey));
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(PROFILE_EVENT, onChange);
    window.addEventListener(SCORES_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROFILE_EVENT, onChange);
      window.removeEventListener(SCORES_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const setUsername = useCallback(
    (raw: string) => {
      if (!pubkey) return { ok: false as const, error: "Connect or play demo first." };
      const res = saveProfile(pubkey, raw);
      if (res.ok) setProfile(res.profile);
      return res;
    },
    [pubkey],
  );

  return {
    pubkey,
    connected,
    demoGuest,
    play,
    username: profile?.username ?? null,
    profile,
    stats,
    refresh,
    setUsername,
  };
}
