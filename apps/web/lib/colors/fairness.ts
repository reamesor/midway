import { createHash, randomBytes } from "crypto";
import { COLOR_KEYS, type ColorKey } from "./engine";

export type FairnessCommit = {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
};

export type FairnessReveal = FairnessCommit & {
  serverSeed: string;
  dice: ColorKey[];
};

export function hashServerSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function generateClientSeed(): string {
  return randomBytes(16).toString("hex");
}

/** Deterministic dice from commit-reveal seeds. */
export function deriveDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): ColorKey[] {
  return [0, 1, 2].map((i) => {
    const material = `${serverSeed}:${clientSeed}:${nonce}:${i}`;
    const digest = createHash("sha256").update(material).digest();
    const idx = digest[0]! % COLOR_KEYS.length;
    return COLOR_KEYS[idx]!;
  });
}

export function verifyFairness(reveal: FairnessReveal): boolean {
  if (hashServerSeed(reveal.serverSeed) !== reveal.serverSeedHash) return false;
  const expected = deriveDice(
    reveal.serverSeed,
    reveal.clientSeed,
    reveal.nonce,
  );
  return (
    expected.length === reveal.dice.length &&
    expected.every((c, i) => c === reveal.dice[i])
  );
}
