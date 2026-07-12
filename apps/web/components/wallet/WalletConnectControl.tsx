"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useDemoGuest } from "@/components/wallet/DemoGuestContext";
import { truncateAddress } from "@/lib/solana/address";
import { useOs } from "@/components/os/OsContext";

type WalletConnectControlProps = {
  /** Compact taskbar styling vs Colors panel. */
  size?: "taskbar" | "panel";
  className?: string;
};

/**
 * Shared Connect control for taskbar + Colors.
 * Opens Midway wallet modal (Phantom / Solflare); shows truncated address or DEMO.
 */
export function WalletConnectControl({
  size = "taskbar",
  className = "",
}: WalletConnectControlProps) {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { demoGuest, clearDemoGuest } = useDemoGuest();
  const { setVisible } = useWalletModal();
  const { openWin } = useOs();
  const [menu, setMenu] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const btnClass =
    size === "taskbar"
      ? "bevel-btn px-2 py-1 text-[10px] whitespace-nowrap"
      : "bevel-btn px-2 py-0.5 text-[10px] text-hot";

  const identified = (connected && publicKey) || demoGuest;

  if (!identified) {
    return (
      <button
        type="button"
        className={`${btnClass} ${className}`}
        disabled={connecting}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setVisible(true);
        }}
      >
        {connecting ? "…" : "CONNECT"}
      </button>
    );
  }

  const label =
    connected && publicKey
      ? truncateAddress(publicKey.toBase58())
      : "DEMO · GUEST";

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        className={`${btnClass} num`}
        title={
          connected && publicKey ? publicKey.toBase58() : "Demo guest · 10 SOL pot"
        }
        onClick={() => setMenu((m) => !m)}
        aria-expanded={menu}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {menu && (
        <div
          role="menu"
          className={`absolute z-[130] min-w-[180px] bevel hard-shadow bg-panel p-1 font-heading text-[11px] ${
            size === "taskbar" ? "bottom-9 right-0" : "top-full right-0 mt-1"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => {
              openWin("wallet");
              setMenu(false);
            }}
          >
            MIDWAY.WALLET
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => {
              setVisible(true);
              setMenu(false);
            }}
          >
            {demoGuest && !connected ? "CONNECT WALLET" : "CHANGE WALLET"}
          </button>
          <hr className="my-1 border-line" />
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-burn hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => {
              if (connected) void disconnect();
              if (demoGuest) clearDemoGuest();
              setMenu(false);
            }}
          >
            {demoGuest && !connected ? "EXIT DEMO" : "DISCONNECT"}
          </button>
        </div>
      )}
    </div>
  );
}
