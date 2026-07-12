"use client";

import { useCallback, useEffect, useState } from "react";
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
 * Midway play escrow keyed by active profile wallet (or DEMO_GUEST).
 * Connecting Phantom/Solflare attaches that address into the profile hub (max 5).
 * Soft-switching active hub wallet swaps which local ledger is shown.
 * DEMO only: local pot + ledger. Never signs spend txs.
 */
export function useMidwayWallet() {
  const { publicKey, connected: walletConnected } = useWallet();
  const { demoGuest, clearDemoGuest } = useDemoGuest();
  const [hub, setHub] = useState<ProfileWalletHub>(() =>
    typeof window === "undefined" ? { primaryPubkey: null, activePubkey: null, slots: [], updatedAt: 0 } : loadWalletHub(),
  );

  const adapterPubkey = walletConnected ? (publicKey?.toBase58() ?? null) : null;

  // Real wallet wins — drop guest flag, attach into hub, stamp session.
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
   * Identity for play pot / stats:
   * - Demo guest when no extension wallet
   * - Linked active slot when the adapter address is in the hub (or soft-switch)
   * - Else the currently connected adapter pubkey (even if hub is full)
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

  const refresh = useCallback(() => {
    if (!pubkey) {
      setPlay(EMPTY_PLAY_BALANCE());
      setLedger([]);
      return;
    }
    setPlay(loadPlayBalance(pubkey));
    setLedger(loadLedger(pubkey));
  }, [pubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
          balance: next,
          entry: { ...entry, at: Date.now() },
        }),
      }).catch(() => undefined);
    },
    [pubkey],
  );

  const deposit = useCallback(
    async (asset: MidwayAsset, amount: number): Promise<TxResult> => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Connect Phantom or Solflare first." };
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
        const cur = loadPlayBalance(pubkey);
        if (asset === "SOL") {
          const room = remainingDemoDepositCap(cur.sol);
          if (room <= 0) {
            return {
              ok: false,
              error: `Demo pot is capped at ${DEMO_PLAY_SOL} SOL. Reset or withdraw first.`,
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
            note: "demo ledger top-up (no chain transfer)",
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
          note: "demo ledger top-up (no chain transfer)",
        });
        return { ok: true, balance: next };
      } finally {
        setBusy(false);
      }
    },
    [connected, mint, persist, pubkey],
  );

  const withdraw = useCallback(
    async (asset: MidwayAsset, amount: number): Promise<TxResult> => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Connect Phantom or Solflare first." };
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
        const cur = loadPlayBalance(pubkey);
        const available = asset === "SOL" ? cur.sol : cur.midway;
        if (amt > available) {
          return { ok: false, error: "Not enough Midway play balance." };
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
          note: "demo ledger debit only (no chain transfer)",
        });
        return { ok: true, balance: next };
      } finally {
        setBusy(false);
      }
    },
    [connected, mint, persist, pubkey],
  );

  const resetDemo = useCallback((): TxResult => {
    if (!connected || !pubkey) {
      return { ok: false, error: "Connect Phantom or Solflare first." };
    }
    const next = resetPlayBalance(pubkey);
    persist(next, {
      kind: "reset",
      asset: "SOL",
      amount: DEMO_PLAY_SOL,
      note: `demo pot reset to ${DEMO_PLAY_SOL} SOL`,
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
          error: "Not enough Midway play SOL. Reset demo pot in MIDWAY.WALLET.",
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

  /** Log a losing round (stake already debited) for PROFILE transaction history. */
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

  /** Credit play pot + log claim for believers share. */
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
    pubkey,
    adapterPubkey,
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
