"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  DEMO_GUEST_PUBKEY,
  useDemoGuest,
} from "@/components/wallet/DemoGuestContext";
import {
  DEMO_PLAY_SOL,
  getMidwayMint,
  getWalletEscrowMode,
  isLiveEscrowEnabled,
} from "@/lib/solana/escrow";
import {
  appendLedger,
  loadLedger,
  loadPlayBalance,
  remainingDemoDepositCap,
  resetPlayBalance,
  roundPlay,
  savePlayBalance,
} from "@/lib/midway-wallet/localLedger";
import {
  ensureMidwayWallet,
  loadMidwayWalletIdentity,
  MIDWAY_WALLET_EVENT,
} from "@/lib/midway-wallet/midwayIdentity";
import {
  EMPTY_PLAY_BALANCE,
  type MidwayAsset,
  type MidwayPlayBalance,
  type MidwayWalletLedgerEntry,
} from "@/lib/midway-wallet/types";
import {
  attachWallet,
  loadWalletHub,
  touchWalletActivity,
  WALLET_HUB_EVENT,
  type ProfileWalletHub,
} from "@/lib/profile/walletHub";
import { touchProfileSession } from "@/lib/profile/localProfile";

type TxResult =
  | { ok: true; balance: MidwayPlayBalance }
  | { ok: false; error: string };

/**
 * Midway wallet: play purse keyed by active profile (main wallet or DEMO_GUEST).
 *
 * - Connecting Phantom/Solflare attaches main wallet + creates Midway wallet address.
 * - Play balance is a local DEMO ledger (not real custody).
 * - Deposit / withdraw simulate Main ↔ Midway moves; main SOL is read via RPC only.
 */
export function useMidwayWallet() {
  const { publicKey, connected: walletConnected } = useWallet();
  const { demoGuest, clearDemoGuest } = useDemoGuest();
  const [hub, setHub] = useState<ProfileWalletHub>(() =>
    typeof window === "undefined"
      ? { primaryPubkey: null, activePubkey: null, slots: [], updatedAt: 0 }
      : loadWalletHub(),
  );

  const adapterPubkey = walletConnected ? (publicKey?.toBase58() ?? null) : null;

  // Real wallet wins — drop guest flag, attach into hub, create Midway wallet, stamp session.
  useEffect(() => {
    if (!walletConnected || !publicKey) return;
    clearDemoGuest();
    const pk = publicKey.toBase58();
    attachWallet(pk);
    touchProfileSession(pk, { connected: true });
    setHub(loadWalletHub());
  }, [walletConnected, publicKey, clearDemoGuest]);

  useEffect(() => {
    if (!demoGuest || walletConnected) return;
    // Guest path: ephemeral Midway wallet under DEMO_GUEST (no main wallet).
    touchProfileSession(DEMO_GUEST_PUBKEY, { connected: true });
  }, [demoGuest, walletConnected]);

  useEffect(() => {
    const onHub = () => setHub(loadWalletHub());
    window.addEventListener(WALLET_HUB_EVENT, onHub);
    window.addEventListener("storage", onHub);
    return () => {
      window.removeEventListener(WALLET_HUB_EVENT, onHub);
      window.removeEventListener("storage", onHub);
    };
  }, []);

  /**
   * Profile identity key (main wallet / guest) for ledger + Midway wallet.
   */
  const pubkey = (() => {
    if (walletConnected && adapterPubkey) {
      const linked = hub.slots.some((s) => s.pubkey === adapterPubkey);
      if (linked) return hub.activePubkey ?? adapterPubkey;
      return adapterPubkey;
    }
    if (demoGuest) return DEMO_GUEST_PUBKEY;
    if (hub.activePubkey) return hub.activePubkey;
    return null;
  })();

  /** Wallet extension OR local demo-guest OR linked soft-view identity. */
  const connected = Boolean(pubkey);
  const mode = getWalletEscrowMode();
  const mint = getMidwayMint();
  const [play, setPlay] = useState<MidwayPlayBalance>(EMPTY_PLAY_BALANCE());
  const [ledger, setLedger] = useState<MidwayWalletLedgerEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [midwayWalletAddress, setMidwayWalletAddress] = useState<string | null>(
    null,
  );

  const refresh = useCallback(() => {
    if (!pubkey) {
      setPlay(EMPTY_PLAY_BALANCE());
      setLedger([]);
      setMidwayWalletAddress(null);
      return;
    }
    const identity = ensureMidwayWallet(pubkey);
    setMidwayWalletAddress(identity.address);
    setPlay(loadPlayBalance(pubkey));
    setLedger(loadLedger(pubkey));
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onId = () => {
      if (!pubkey) return;
      setMidwayWalletAddress(
        loadMidwayWalletIdentity(pubkey)?.address ??
          ensureMidwayWallet(pubkey).address,
      );
    };
    window.addEventListener(MIDWAY_WALLET_EVENT, onId);
    window.addEventListener("storage", onId);
    return () => {
      window.removeEventListener(MIDWAY_WALLET_EVENT, onId);
      window.removeEventListener("storage", onId);
    };
  }, [pubkey]);

  const mainWalletPubkey = useMemo(() => {
    if (pubkey === DEMO_GUEST_PUBKEY) return adapterPubkey;
    return pubkey;
  }, [pubkey, adapterPubkey]);

  const persist = useCallback(
    (next: MidwayPlayBalance, entry: Parameters<typeof appendLedger>[1]) => {
      if (!pubkey) return;
      savePlayBalance(pubkey, next);
      appendLedger(pubkey, entry);
      if (pubkey !== DEMO_GUEST_PUBKEY) {
        touchWalletActivity(pubkey);
        touchProfileSession(pubkey);
      } else {
        touchProfileSession(DEMO_GUEST_PUBKEY);
      }
      setPlay(next);
      setLedger(loadLedger(pubkey));
      void fetch("/api/wallet/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pubkey,
          midwayWalletAddress:
            loadMidwayWalletIdentity(pubkey)?.address ?? null,
          balance: next,
          entry: { ...entry, at: Date.now() },
        }),
      }).catch(() => undefined);
    },
    [pubkey],
  );

  /** Deposit: Main wallet → Midway wallet (DEMO: local ledger credit only). */
  const deposit = useCallback(
    async (asset: MidwayAsset, amount: number): Promise<TxResult> => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Connect a main wallet or play demo first." };
      }
      if (isLiveEscrowEnabled()) {
        return { ok: false, error: "Live escrow is disabled. Demo ledger only." };
      }
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };
      if (asset === "MIDWAY" && !mint) {
        return { ok: false, error: "MIDWAY mint not configured yet." };
      }
      setBusy(true);
      try {
        ensureMidwayWallet(pubkey);
        const cur = loadPlayBalance(pubkey);
        if (asset === "SOL") {
          const room = remainingDemoDepositCap(cur.sol);
          if (room <= 0) {
            return {
              ok: false,
              error: `Midway wallet DEMO cap is ${DEMO_PLAY_SOL} SOL. Withdraw or reset first.`,
            };
          }
          const credit = Math.min(amt, room);
          const next: MidwayPlayBalance = {
            sol: roundPlay(cur.sol + credit),
            midway: cur.midway,
            updatedAt: Date.now(),
          };
          persist(next, {
            kind: "deposit",
            asset,
            amount: credit,
            note: walletConnected
              ? "DEMO deposit Main → Midway (no chain transfer)"
              : "DEMO deposit into Midway wallet (no chain transfer)",
          });
          return { ok: true, balance: next };
        }
        const next: MidwayPlayBalance = {
          sol: cur.sol,
          midway: roundPlay(cur.midway + amt),
          updatedAt: Date.now(),
        };
        persist(next, {
          kind: "deposit",
          asset,
          amount: amt,
          note: "DEMO deposit Main → Midway (no chain transfer)",
        });
        return { ok: true, balance: next };
      } finally {
        setBusy(false);
      }
    },
    [connected, mint, persist, pubkey, walletConnected],
  );

  /** Withdraw: Midway wallet → Main connected wallet (DEMO: local ledger debit only). */
  const withdraw = useCallback(
    async (asset: MidwayAsset, amount: number): Promise<TxResult> => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Connect a main wallet or play demo first." };
      }
      if (isLiveEscrowEnabled()) {
        return { ok: false, error: "Live escrow is disabled. Demo ledger only." };
      }
      if (!walletConnected || !adapterPubkey) {
        return {
          ok: false,
          error: "Connect your main wallet (Phantom / Solflare) to withdraw.",
        };
      }
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };
      if (asset === "MIDWAY" && !mint) {
        return { ok: false, error: "MIDWAY mint not configured yet." };
      }
      setBusy(true);
      try {
        const cur = loadPlayBalance(pubkey);
        const available = asset === "SOL" ? cur.sol : cur.midway;
        if (amt > available) {
          return { ok: false, error: "Not enough Midway wallet play balance." };
        }
        const next: MidwayPlayBalance = {
          sol: asset === "SOL" ? roundPlay(cur.sol - amt) : cur.sol,
          midway: asset === "MIDWAY" ? roundPlay(cur.midway - amt) : cur.midway,
          updatedAt: Date.now(),
        };
        persist(next, {
          kind: "withdraw",
          asset,
          amount: amt,
          note: `DEMO withdraw Midway → Main ${adapterPubkey.slice(0, 4)}… (no chain transfer)`,
        });
        return { ok: true, balance: next };
      } finally {
        setBusy(false);
      }
    },
    [adapterPubkey, connected, mint, persist, pubkey, walletConnected],
  );

  const resetDemo = useCallback((): TxResult => {
    if (!connected || !pubkey) {
      return { ok: false, error: "Connect a main wallet or play demo first." };
    }
    ensureMidwayWallet(pubkey);
    const next = resetPlayBalance(pubkey);
    persist(next, {
      kind: "reset",
      asset: "SOL",
      amount: DEMO_PLAY_SOL,
      note: `Midway wallet DEMO reset to ${DEMO_PLAY_SOL} SOL`,
    });
    return { ok: true, balance: next };
  }, [connected, persist, pubkey]);

  const debitPlaySol = useCallback(
    (amount: number, note?: string): TxResult => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Wallet required." };
      }
      const amt = roundPlay(amount);
      const cur = loadPlayBalance(pubkey);
      if (amt > cur.sol) {
        return {
          ok: false,
          error: "Not enough Midway wallet balance. Deposit or reset in WALLET.",
        };
      }
      const next: MidwayPlayBalance = {
        ...cur,
        sol: roundPlay(cur.sol - amt),
        updatedAt: Date.now(),
      };
      persist(next, { kind: "bet_debit", asset: "SOL", amount: amt, note });
      return { ok: true, balance: next };
    },
    [connected, persist, pubkey],
  );

  const creditPlaySol = useCallback(
    (amount: number, note?: string): TxResult => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Wallet required." };
      }
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: true, balance: loadPlayBalance(pubkey) };
      const cur = loadPlayBalance(pubkey);
      const next: MidwayPlayBalance = {
        ...cur,
        sol: roundPlay(cur.sol + amt),
        updatedAt: Date.now(),
      };
      persist(next, { kind: "bet_credit", asset: "SOL", amount: amt, note });
      return { ok: true, balance: next };
    },
    [connected, persist, pubkey],
  );

  /** Log a losing round (bet already debited) for PROFILE transaction history. */
  const logBetLoss = useCallback(
    (amount: number, note?: string) => {
      if (!pubkey) return;
      appendLedger(pubkey, {
        kind: "bet_loss",
        asset: "SOL",
        amount: roundPlay(amount),
        note: note ?? "colors loss",
      });
      touchWalletActivity(pubkey);
      setLedger(loadLedger(pubkey));
    },
    [pubkey],
  );

  /** Credit Midway wallet + log claim for believers share. */
  const claimShare = useCallback(
    (amount: number, note?: string): TxResult => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Wallet required." };
      }
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: true, balance: loadPlayBalance(pubkey) };
      const cur = loadPlayBalance(pubkey);
      const next: MidwayPlayBalance = {
        ...cur,
        sol: roundPlay(cur.sol + amt),
        updatedAt: Date.now(),
      };
      persist(next, {
        kind: "claim",
        asset: "SOL",
        amount: amt,
        note: note ?? "believers share claimed",
      });
      return { ok: true, balance: next };
    },
    [connected, persist, pubkey],
  );

  return {
    connected,
    walletConnected,
    demoGuest,
    /** Profile / ledger key (main wallet pubkey or DEMO_GUEST). */
    pubkey,
    /** Main external wallet (Phantom/Solflare) when connected. */
    adapterPubkey,
    mainWalletPubkey,
    /** Midway wallet public address (play purse identity). */
    midwayWalletAddress,
    /** Midway wallet play balance (local DEMO ledger). */
    midwayPlayBalance: play,
    hub,
    mode,
    demoPlaySol: DEMO_PLAY_SOL,
    mint,
    midwayTokenReady: Boolean(mint),
    play,
    ledger,
    busy,
    refresh,
    deposit,
    withdraw,
    resetDemo,
    debitPlaySol,
    creditPlaySol,
    logBetLoss,
    claimShare,
    clearDemoGuest,
  };
}
