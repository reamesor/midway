# THE MIDWAY

> every cut comes home

Solana ecosystem hub — Colors game, shared 40/40/20 treasury, believers pool.

## Structure

```
apps/web/                  Next.js 15 (App Router) · Tailwind v4 · shadcn
programs/midway-treasury/  Anchor 0.30.x treasury program
midway-ecosystem.html      Design / behavior source of truth
MIDWAY_BUILD_PROMPT.md     Full build spec (phases 1–7)
```

## Look

Art direction: **haunted 8-bit bootleg OS** (`MIDWAY_DESIGN_PROMPT.md`).
CRT desktop, draggable `*.EXE` windows, taskbar marquee, boot BIOS, CALM / 1-BIT modes.
Mechanics unchanged — Colors + 40/40/20 treasury still rule.

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm anchor:build         # → programs/midway-treasury/target/deploy/midway_treasury.so
```

Copy `.env.example` → `apps/web/.env.local` as you wire Phase 3+.

## Toolchain

| Tool | Version |
|------|---------|
| Node | ≥20 |
| pnpm | 10.x |
| Anchor CLI | 0.30.1 (`avm use 0.30.1`) |
| Agave / Solana | **4.1.x** (platform-tools v1.54) for SBF builds |

`pnpm anchor:build` runs `programs/midway-treasury/build.sh`, which calls Agave 4.1.1’s `cargo-build-sbf` directly. Anchor 0.30’s default Solana 1.18 toolchain cannot resolve current crates.io (edition2024). Program crate remains `anchor-lang = "0.30.1"`.

## Phases

1. Scaffold ← **you are here**
2. Hub + neon-noir aesthetic
3. Colors (Fun Mode, 3D dice, fairness)
4. Treasury Anchor program (devnet)
5. Live treasury UI + believers
6. Attractions + wallet + social
7. Fairness polish, `/burn`, deploy

See `MIDWAY_BUILD_PROMPT.md`.
