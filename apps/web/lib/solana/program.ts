import { PublicKey } from "@solana/web3.js";

export const TREASURY_SEED = Buffer.from("treasury");
export const VAULT_SEED = Buffer.from("vault");

export function getTreasuryPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

export function getVaultPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([VAULT_SEED], programId);
}

/** Immutable split: burn / believers / build */
export const SPLIT_BPS = [4000, 4000, 2000] as const;
