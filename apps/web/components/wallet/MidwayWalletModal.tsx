"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  WalletReadyState,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useWalletModal,
  WalletIcon,
  WalletModalContext,
} from "@solana/wallet-adapter-react-ui";
import type { ReactNode } from "react";

/** Only these appear in the Midway connect modal (Wallet Standard injects many more). */
const ALLOWED_WALLETS = ["Phantom", "Solflare"] as const;

type MidwayWalletModalProviderProps = {
  children: ReactNode;
  /** Called when user chooses demo play without a wallet. */
  onDemoGuest?: () => void;
};

/**
 * Replaces the default WalletModalProvider so we can:
 * - Filter to Phantom + Solflare (hide MetaMask / Backpack / OKX / etc.)
 * - Explicitly retry connect when the same wallet is already selected
 * - Offer a DEMO guest path when extensions fail
 */
export function MidwayWalletModalProvider({
  children,
  onDemoGuest,
}: MidwayWalletModalProviderProps) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(() => ({ visible, setVisible }), [visible]);

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      {visible ? (
        <MidwayWalletModal onDemoGuest={onDemoGuest} />
      ) : null}
    </WalletModalContext.Provider>
  );
}

function MidwayWalletModal({ onDemoGuest }: { onDemoGuest?: () => void }) {
  const { wallets, select, connect, connecting, connected, wallet } =
    useWallet();
  const { setVisible } = useWalletModal();
  const [error, setError] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { overflow } = window.getComputedStyle(document.body);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const listed = useMemo(() => {
    const allowed = new Set<string>(ALLOWED_WALLETS);
    const matches = wallets.filter((w) => allowed.has(w.adapter.name));
    return [...matches].sort((a, b) => {
      const ai = ALLOWED_WALLETS.indexOf(
        a.adapter.name as (typeof ALLOWED_WALLETS)[number],
      );
      const bi = ALLOWED_WALLETS.indexOf(
        b.adapter.name as (typeof ALLOWED_WALLETS)[number],
      );
      const aInst =
        a.readyState === WalletReadyState.Installed ||
        a.readyState === WalletReadyState.Loadable
          ? 0
          : 1;
      const bInst =
        b.readyState === WalletReadyState.Installed ||
        b.readyState === WalletReadyState.Loadable
          ? 0
          : 1;
      if (aInst !== bInst) return aInst - bInst;
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [wallets]);

  const close = useCallback(() => setVisible(false), [setVisible]);

  // After select() swaps the adapter, connect once the matching wallet is ready.
  useEffect(() => {
    if (!pendingName) return;
    if (!wallet || wallet.adapter.name !== pendingName) return;
    if (connected) {
      setPendingName(null);
      close();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await connect();
        if (!cancelled) {
          setPendingName(null);
          close();
        }
      } catch (err) {
        console.error("[midway] wallet connect failed", err);
        if (!cancelled) {
          setPendingName(null);
          setError(
            err instanceof Error
              ? err.message
              : "Connection failed — try again or play demo without a wallet.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingName, wallet, connected, connect, close]);

  const handleWalletClick = async (name: WalletName) => {
    setError(null);
    try {
      // Same wallet already selected but not connected — retry connect directly
      // (adapter select() is a no-op when the name matches, so autoConnect won't re-fire).
      if (wallet?.adapter.name === name) {
        if (connected) {
          close();
          return;
        }
        await connect();
        close();
        return;
      }
      setPendingName(name);
      select(name);
    } catch (err) {
      console.error("[midway] wallet select/connect failed", err);
      setPendingName(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not open wallet — try Phantom/Solflare or play demo.",
      );
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="midway-wallet-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="midway-wallet-modal-title"
    >
      <button
        type="button"
        className="midway-wallet-modal__backdrop"
        aria-label="Close wallet modal"
        onClick={close}
      />
      <div className="midway-wallet-modal__card">
        <button
          type="button"
          className="midway-wallet-modal__close"
          aria-label="Close"
          onClick={close}
        >
          ×
        </button>
        <h1 id="midway-wallet-modal-title" className="midway-wallet-modal__title">
          Connect Phantom or Solflare
        </h1>
        <p className="midway-wallet-modal__sub">
          Connect main wallet → Midway wallet for play funds. Colors bets use a local
          DEMO balance — no real funds move.
        </p>
        <ul className="midway-wallet-modal__list">
          {listed.map((w) => {
            const installed =
              w.readyState === WalletReadyState.Installed ||
              w.readyState === WalletReadyState.Loadable;
            const busy =
              connecting ||
              pendingName === w.adapter.name;
            return (
              <li key={w.adapter.name}>
                <button
                  type="button"
                  className="midway-wallet-modal__btn"
                  disabled={busy}
                  onClick={() =>
                    void handleWalletClick(w.adapter.name as WalletName)
                  }
                >
                  <WalletIcon wallet={w} />
                  <span className="midway-wallet-modal__name">
                    {w.adapter.name}
                  </span>
                  <span className="midway-wallet-modal__status">
                    {busy ? "…" : installed ? "Detected" : "Install"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {listed.length === 0 && (
          <p className="midway-wallet-modal__empty">
            Install{" "}
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Phantom
            </a>{" "}
            or{" "}
            <a
              href="https://solflare.com/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Solflare
            </a>
            , then refresh — or play demo below.
          </p>
        )}
        {error && (
          <p className="midway-wallet-modal__error" role="alert">
            {error}
          </p>
        )}
        {onDemoGuest && (
          <button
            type="button"
            className="midway-wallet-modal__demo"
            onClick={() => {
              onDemoGuest();
              close();
            }}
          >
            Play demo without wallet · 10 SOL
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
