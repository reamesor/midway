import { NextResponse } from "next/server";
import type { MidwayPlayBalance, MidwayWalletLedgerEntry } from "@/lib/midway-wallet/types";

/**
 * API-shaped Midway play wallet mirror.
 * DEMO: ephemeral process memory (client localStorage is source of truth).
 * LIVE: replace with vault PDA / durable store.
 */
type Row = {
  balance: MidwayPlayBalance;
  log: MidwayWalletLedgerEntry[];
};

const memory = new Map<string, Row>();

export async function GET(req: Request) {
  const pubkey = new URL(req.url).searchParams.get("pubkey");
  if (!pubkey) {
    return NextResponse.json({ error: "pubkey required" }, { status: 400 });
  }
  const row = memory.get(pubkey);
  return NextResponse.json({
    mode: process.env.NEXT_PUBLIC_WALLET_ESCROW || "DEMO",
    pubkey,
    balance: row?.balance ?? { sol: 0, midway: 0, updatedAt: 0 },
    log: row?.log ?? [],
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.pubkey !== "string" || !body.balance) {
    return NextResponse.json(
      { error: "pubkey + balance required" },
      { status: 400 },
    );
  }
  const pubkey = body.pubkey as string;
  const balance = body.balance as MidwayPlayBalance;
  const prev = memory.get(pubkey);
  const log = [...(prev?.log ?? [])];
  if (body.entry) {
    log.unshift({
      id: `${Date.now()}`,
      at: Number(body.entry.at) || Date.now(),
      kind: body.entry.kind,
      asset: body.entry.asset,
      amount: Number(body.entry.amount) || 0,
      note: body.entry.note,
    } as MidwayWalletLedgerEntry);
  }
  memory.set(pubkey, { balance, log: log.slice(0, 40) });
  return NextResponse.json({ ok: true, balance, mode: process.env.NEXT_PUBLIC_WALLET_ESCROW || "DEMO" });
}
