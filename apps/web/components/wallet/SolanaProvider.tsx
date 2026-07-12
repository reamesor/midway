"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { getSolanaEndpoint, getSolanaNetwork } from "@/lib/solana/cluster";
import { DemoGuestProvider, useDemoGuest } from "./DemoGuestContext";
import { MidwayWalletModalProvider } from "./MidwayWalletModal";

import "@solana/wallet-adapter-react-ui/styles.css";

type SolanaProviderProps = {
  children: ReactNode;
};

/**
 * Phantom + Solflare adapters (Wallet Standard still registers others;
 * MidwayWalletModal filters the UI to these two only).
 */
export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = useMemo(() => getSolanaEndpoint(), []);
  const network = useMemo(() => getSolanaNetwork(), []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network],
  );

  const onError = useCallback((error: Error) => {
    // Surface adapter errors in console; modal shows user-facing copy.
    console.error("[midway] wallet adapter error", error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <DemoGuestProvider>
          <ModalShell>{children}</ModalShell>
        </DemoGuestProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  const { enableDemoGuest } = useDemoGuest();
  return (
    <MidwayWalletModalProvider onDemoGuest={enableDemoGuest}>
      {children}
    </MidwayWalletModalProvider>
  );
}
