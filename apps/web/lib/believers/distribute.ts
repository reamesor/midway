/**
 * Pro-rata believers distribution helpers (off-chain weighting).
 * On-chain claim uses weight_bps against the snapshotted pool.
 */
export function weightBps(userWeight: number, totalWeight: number): number {
  if (totalWeight <= 0 || userWeight <= 0) return 0;
  return Math.min(10_000, Math.floor((userWeight / totalWeight) * 10_000));
}

export function claimAmount(pool: number, weightBps: number): number {
  return (pool * weightBps) / 10_000;
}
