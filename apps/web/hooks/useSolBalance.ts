"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/** Read SOL balance for the connected wallet (lamports → SOL). */
export function useSolBalance(pollMs = 20_000) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      setError(null);
      return null;
    }
    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalance(sol);
      setError(null);
      return sol;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Balance fetch failed";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void refresh();
    if (!publicKey || pollMs <= 0) return;
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [publicKey, pollMs, refresh]);

  return { balance, loading, error, refresh };
}
