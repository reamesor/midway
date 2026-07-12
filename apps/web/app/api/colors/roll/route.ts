import { NextResponse } from "next/server";
import { z } from "zod";
import {
  COLOR_KEYS,
  settleRoll,
  type ColorKey,
  type PayoutMode,
} from "@/lib/colors/engine";
import {
  deriveDice,
  generateClientSeed,
  generateServerSeed,
  hashServerSeed,
} from "@/lib/colors/fairness";

const bodySchema = z.object({
  bet: z.number().positive(),
  picked: z.array(z.enum(COLOR_KEYS)).min(1).max(3),
  clientSeed: z.string().min(1).optional(),
  nonce: z.number().int().nonnegative(),
  mode: z.enum(["LITERAL", "STAKE_BASED", "PER_COLOR"]).optional(),
});

// In-memory commit store for Fun Mode (Phase 3). Redis/Supabase in later phases.
const commits = new Map<
  string,
  { serverSeed: string; serverSeedHash: string; createdAt: number }
>();

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid roll request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bet, picked, nonce, mode } = parsed.data;
  const clientSeed = parsed.data.clientSeed ?? generateClientSeed();
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const dice = deriveDice(serverSeed, clientSeed, nonce);
  const settlement = settleRoll(
    bet,
    new Set(picked as ColorKey[]),
    dice,
    (mode as PayoutMode | undefined) ?? undefined,
  );

  const id = `${serverSeedHash}:${clientSeed}:${nonce}`;
  commits.set(id, { serverSeed, serverSeedHash, createdAt: Date.now() });

  return NextResponse.json({
    dice,
    settlement,
    fairness: {
      serverSeedHash,
      serverSeed,
      clientSeed,
      nonce,
      dice,
    },
  });
}

export async function GET() {
  // Pre-commit: return a hash before roll so client can show commitment
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  commits.set(serverSeedHash, {
    serverSeed,
    serverSeedHash,
    createdAt: Date.now(),
  });
  return NextResponse.json({ serverSeedHash });
}
