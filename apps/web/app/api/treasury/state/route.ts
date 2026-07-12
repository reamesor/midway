import { NextResponse } from "next/server";

/** Fun-mode / mirrored treasury state. On-chain reads land in Phase 5. */
let memory = {
  total: 0,
  burn: 0,
  believers: 0,
  build: 0,
  burnedTokens: 0,
  splitBps: [4000, 4000, 2000] as const,
};

export async function GET() {
  return NextResponse.json(memory);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.houseCut !== "number") {
    return NextResponse.json({ error: "houseCut required" }, { status: 400 });
  }
  const cut = body.houseCut as number;
  const burn = cut * 0.4;
  const believers = cut * 0.4;
  const build = cut * 0.2;
  memory = {
    ...memory,
    total: memory.total + cut,
    burn: memory.burn + burn,
    believers: memory.believers + believers,
    build: memory.build + build,
    burnedTokens: memory.burnedTokens + Math.round(burn * 1200),
  };
  return NextResponse.json(memory);
}
