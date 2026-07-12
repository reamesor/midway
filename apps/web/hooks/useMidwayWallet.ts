"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getMidwayMint,
  getWalletEscrowMode,
  isEscrowDemo,
} from "@/lib/solana/escrow";
import {
  appendLedger,
  loadLedger,
  loadPlayBalance,
  roundPlay,
  savePlayBalance,
} from "@/lib/midway-wallet/localLedger";
import {
  EMPTY_PLAY_BALANCE,
  type MidwayAsset,
  type MidwayPlayBalance,
  type MidwayWalletLedgerEntry,
} from "@/lib/midway-wallet/types";

type TxResult =
  | { ok: true; balance: MidwayPlayBalance }
  | { ok: false; error: string };

/**
 * Midway play escrow keyed by connected wallet pubkey.
 * DEMO: local ledger (+ optional API mirror). LIVE: transfer prep stubs.
 */
export function useMidwayWallet() {
  const { publicKey, connected } = useWallet();
  const pubkey = publicKey?.toBase58() ?? null;
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
      setPlay(next);
      setLedger(loadLedger(pubkey));
      // Fire-and-forget API-shaped mirror (serverless memory; local is source of truth in DEMO)
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
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };
      if (asset === "MIDWAY" && !mint) {
        return { ok: false, error: "MIDWAY mint not configured yet." };
      }
      if (!isEscrowDemo()) {
        return {
          ok: false,
          error: "LIVE vault transfers are not wired yet. Set NEXT_PUBLIC_WALLET_ESCROW=DEMO.",
        };
      }
      setBusy(true);
      try {
        const cur = loadPlayBalance(pubkey);
        const next: MidwayPlayBalance = {
          sol: asset === "SOL" ? roundPlay(cur.sol + amt) : cur.sol,
          midway: asset === "MIDWAY" ? roundPlay(cur.midway + amt) : cur.midway,
          updatedAt: Date.now(),
        };
        persist(next, {
          kind: "deposit",
          asset,
          amount: amt,
          note: "demo escrow deposit",
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
      const amt = roundPlay(amount);
      if (amt <= 0) return { ok: false, error: "Enter an amount greater than 0." };
      if (asset === "MIDWAY" && !mint) {
        return { ok: false, error: "MIDWAY mint not configured yet." };
      }
      if (!isEscrowDemo()) {
        return {
          ok: false,
          error: "LIVE vault transfers are not wired yet. Set NEXT_PUBLIC_WALLET_ESCROW=DEMO.",
        };
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
          note: "demo escrow withdraw → main wallet",
        });
        return { ok: true, balance: next };
      } finally {
        setBusy(false);
      }
    },
    [connected, mint, persist, pubkey],
  );

  /** Debit play SOL for a Colors (or future) bet stake. */
  const debitPlaySol = useCallback(
    (amount: number, note?: string): TxResult => {
      if (!connected || !pubkey) {
        return { ok: false, error: "Wallet required." };
      }
      const amt = roundPlay(amount);
      const cur = loadPlayBalance(pubkey);
      if (amt > cur.sol) {
        return { ok: false, error: "Not enough Midway play SOL. Deposit in MIDWAY.WALLET." };
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

  /** Credit play SOL after a win (demo settlement). */
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

  return {
    connected,
    pubkey,
    mode,
    mint,
    midwayTokenReady: Boolean(mint),
    play,
    ledger,
    busy,
    refresh,
    deposit,
    withdraw,
    debitPlaySol,
    creditPlaySol,
  };
}
