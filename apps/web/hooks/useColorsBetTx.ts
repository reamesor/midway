"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { ColorKey } from "@/lib/colors/engine";

export type ColorsBetArgs = {
  bet: number;
  picked: ColorKey[];
};

/**
 * Stub only — Colors never signs or sends spend txs in DEMO.
 * Wallet connect is identity/address display; settlement is local play ledger.
 */
export function useColorsBetTx() {
  const { publicKey, connected } = useWallet();

  const placeBetOnChain = useCallback(
    async (_args: ColorsBetArgs) => {
      if (!connected || !publicKey) {
        return { ok: false as const, reason: "wallet_required" as const };
      }
      return {
        ok: false as const,
        reason: "demo_only" as const,
        message:
          "DEMO mode: no on-chain bet escrow. Play balance is a local 10 SOL pot.",
      };
    },
    [connected, publicKey],
  );

  return {
    walletReady: Boolean(connected && publicKey),
    publicKey,
    /** On-chain bet escrow is disabled while DEMO is forced. */
    onChainEnabled: false as const,
    placeBetOnChain,
  };
}
