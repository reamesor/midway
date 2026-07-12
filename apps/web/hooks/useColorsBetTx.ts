"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { ColorKey } from "@/lib/colors/engine";

export type ColorsBetArgs = {
  bet: number;
  picked: ColorKey[];
};

/**
 * Hook stub for future on-chain Colors escrow / settle txs.
 * Connect + balance are live; program instructions land later.
 */
export function useColorsBetTx() {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction } = useWallet();

  const placeBetOnChain = useCallback(
    async (_args: ColorsBetArgs) => {
      if (!connected || !publicKey) {
        return { ok: false as const, reason: "wallet_required" as const };
      }
      // connection + signTransaction reserved for escrow program wiring
      void connection;
      void signTransaction;
      return {
        ok: false as const,
        reason: "escrow_not_live" as const,
        message:
          "On-chain bet escrow is not live yet. Demo settlement uses your wallet identity.",
      };
    },
    [connected, connection, publicKey, signTransaction],
  );

  return {
    /** True when a real wallet is connected and ready to sign later. */
    walletReady: Boolean(connected && publicKey),
    publicKey,
    /** Flip when the Colors program instructions ship. */
    onChainEnabled: false as const,
    placeBetOnChain,
  };
}
