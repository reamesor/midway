/**
 * Off-chain buyback crank.
 * When burn vault SOL crosses threshold, quote via Jupiter → swap → burn mint,
 * then call on-chain `execute_buyback(tokensBurned)` so the Burned event is public.
 */
export type BuybackResult = {
  solIn: number;
  tokensBurned: number;
  signature?: string;
};

export async function executeBuybackCrank(_opts: {
  rpcUrl: string;
  mint: string;
  thresholdLamports: number;
}): Promise<BuybackResult | null> {
  // Wired in Phase 4 deploy scripts / Vercel cron.
  // 1. Read treasury.burn_balance
  // 2. If below threshold, return null
  // 3. Jupiter quote SOL → mint, swap
  // 4. Burn received tokens
  // 5. Call program.execute_buyback(tokensBurned)
  return null;
}
