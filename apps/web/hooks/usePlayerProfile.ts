"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import {
  loadProfile,
  saveAvatar,
  saveProfile,
  PROFILE_EVENT,
  type MidwayProfile,
} from "@/lib/profile/localProfile";
import {
  DEFAULT_AVATAR,
  type ProfileAvatar,
} from "@/lib/profile/avatar";
import {
  loadPlayerStats,
  netPnlFromStats,
  SCORES_EVENT,
  winRatePct,
  type PlayerStats,
} from "@/lib/leaderboard/localScores";
import { deriveLedgerPnL, loadLedger } from "@/lib/midway-wallet/localLedger";
import type { MidwayWalletLedgerEntry } from "@/lib/midway-wallet/types";
import { loadBelieversShare, SHARE_EVENT } from "@/lib/profile/believersShare";
import {
  attachWallet,
  loadWalletHub,
  MAX_LINKED_WALLETS,
  removeWallet,
  setActiveWallet,
  setPrimaryWallet,
  setWalletLabel,
  WALLET_HUB_EVENT,
  type ProfileWalletHub,
} from "@/lib/profile/walletHub";

/**
 * Username + local Colors stats + multi-wallet hub for the active identity.
 */
export function usePlayerProfile() {
  const {
    pubkey,
    connected,
    demoGuest,
    play,
    midwayPlayBalance,
    midwayWalletAddress,
    mainWalletPubkey,
    ledger,
    adapterPubkey,
    hub: liveHub,
    walletConnected,
  } = useMidwayWallet();
  const [profile, setProfile] = useState<MidwayProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [hub, setHub] = useState<ProfileWalletHub>(liveHub);
  const [claimableShare, setClaimableShare] = useState(0);
  const [txLog, setTxLog] = useState<MidwayWalletLedgerEntry[]>([]);

  const refresh = useCallback(() => {
    setHub(loadWalletHub());
    if (!pubkey) {
      setProfile(null);
      setStats(null);
      setClaimableShare(0);
      setTxLog([]);
      return;
    }
    setProfile(loadProfile(pubkey));
    setStats(loadPlayerStats(pubkey));
    setClaimableShare(loadBelieversShare(pubkey));
    setTxLog(loadLedger(pubkey));
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh, liveHub, ledger]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(PROFILE_EVENT, onChange);
    window.addEventListener(SCORES_EVENT, onChange);
    window.addEventListener(WALLET_HUB_EVENT, onChange);
    window.addEventListener(SHARE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROFILE_EVENT, onChange);
      window.removeEventListener(SCORES_EVENT, onChange);
      window.removeEventListener(WALLET_HUB_EVENT, onChange);
      window.removeEventListener(SHARE_EVENT, onChange);
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

  const setAvatar = useCallback(
    (avatar: ProfileAvatar) => {
      if (!pubkey) return { ok: false as const, error: "Connect or play demo first." };
      const res = saveAvatar(pubkey, avatar);
      if (res.ok) setProfile(res.profile);
      return res;
    },
    [pubkey],
  );

  const pnl = useMemo(() => {
    if (!pubkey) {
      return { betSpent: 0, winsReturned: 0, losses: 0, claims: 0, net: 0 };
    }
    const fromLedger = deriveLedgerPnL(pubkey);
    // Prefer ledger when it has activity; else fall back to stats.
    if (
      fromLedger.betSpent > 0 ||
      fromLedger.winsReturned > 0 ||
      fromLedger.claims > 0
    ) {
      return fromLedger;
    }
    if (stats) {
      return {
        betSpent: stats.solStaked,
        winsReturned: stats.solWon,
        losses: Math.max(0, stats.solStaked - stats.solWon),
        claims: stats.sharesClaimed,
        net: netPnlFromStats(stats),
      };
    }
    return fromLedger;
  }, [pubkey, stats, txLog]);

  const winRate = stats ? winRatePct(stats) : 0;

  return {
    pubkey,
    connected,
    demoGuest,
    walletConnected,
    adapterPubkey,
    mainWalletPubkey,
    midwayWalletAddress: midwayWalletAddress ?? profile?.midwayWalletAddress ?? null,
    midwayPlayBalance,
    play,
    username: profile?.username || null,
    profile,
    avatar: profile?.avatar ?? DEFAULT_AVATAR,
    stats,
    hub,
    maxWallets: MAX_LINKED_WALLETS,
    claimableShare,
    txLog,
    pnl,
    winRate,
    refresh,
    setUsername,
    setAvatar,
    linkWallet: attachWallet,
    unlinkWallet: removeWallet,
    makePrimary: setPrimaryWallet,
    switchActive: setActiveWallet,
    renameSlot: setWalletLabel,
  };
}
