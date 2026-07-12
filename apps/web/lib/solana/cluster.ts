import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

/** Default: mainnet-beta. Override with NEXT_PUBLIC_SOLANA_NETWORK. */
export function getSolanaNetwork(): WalletAdapterNetwork {
  const raw = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta")
    .trim()
    .toLowerCase();
  if (raw === "devnet") return WalletAdapterNetwork.Devnet;
  if (raw === "testnet") return WalletAdapterNetwork.Testnet;
  return WalletAdapterNetwork.Mainnet;
}

/**
 * Public RPC endpoint for browser wallet + balance reads.
 * Prefer NEXT_PUBLIC_SOLANA_RPC; fall back to clusterApiUrl for the selected network.
 */
export function getSolanaEndpoint(): string {
  const rpc =
    process.env.NEXT_PUBLIC_SOLANA_RPC?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (rpc) return rpc;
  return clusterApiUrl(getSolanaNetwork());
}

export function getSolanaNetworkLabel(): string {
  const n = getSolanaNetwork();
  if (n === WalletAdapterNetwork.Devnet) return "devnet";
  if (n === WalletAdapterNetwork.Testnet) return "testnet";
  return "mainnet-beta";
}
