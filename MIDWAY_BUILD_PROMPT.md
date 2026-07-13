# MIDWAY_BUILD_PROMPT.md
## paste this whole file into Cursor. attach `midway-ecosystem.html` in the same message.

> **how to use:** paste this entire document into Cursor's chat, attach `midway-ecosystem.html` as a file, then say "read both, then build phase by phase starting at Phase 1." Don't skip phases. Verify each phase's acceptance criteria before moving on.

---

# 0. WHAT YOU'RE BUILDING

**THE MIDWAY** — a Solana ecosystem where every game, token, and NFT action runs through **one shared treasury** that gives the value back to the project and the people who believe in it. The tagline: **"every cut comes home."**

The core mechanic (do not lose this): everywhere else, the house keeps the 5% edge and the player gets nothing. On The Midway, that edge is **captured and routed on-chain** into a treasury that splits three ways:

- **40% → Buyback & Burn** (buys the ecosystem token, burns it, supply drops → every holder's bag goes up)
- **40% → Believers' Pool** (distributed back to holders + players — "believing pays")
- **20% → Build Fund** (funds devs, new attractions, audits)

The **first playable attraction is Colors** — a pick-3-of-6 dice game. Every roll's house cut feeds the treasury live. More attractions (Glitch Pits, NFT Launchpad, Token Tools) plug into the same loop later. **One engine, works for all.**

**Your design source of truth is `midway-ecosystem.html`.** It contains the full working Colors game, the treasury loop UI, the attractions grid, and the aesthetic. Read it completely. Match its behavior and layout, then upgrade the styling per the aesthetic spec below.

---

# 1. AESTHETIC — dark, futuristic, cool (non-negotiable)

The look is **neon-noir crypto-arcade**: near-black backgrounds, electric neon accents, glass panels, subtle glow, motion that feels expensive.

**Palette (CSS variables — use exactly):**
```css
--bg:        #0a0612;   /* near-black violet base */
--bg-2:      #120a20;   /* raised surface */
--panel:     #17102a;   /* glass panel */
--panel-2:   #1f1636;
--line:      #2e2150;   /* hairline borders */
--txt:       #ece4ff;
--dim:       #9d86c4;
--magenta:   #e23bc8;   /* primary neon */
--violet:    #a855f7;   /* secondary neon */
--cyan:      #38d6e8;   /* tertiary neon */
--gold:      #f5c542;   /* treasury / value */
--green:     #3ce84a;   /* win */
--red:       #e83b50;   /* lose / burn */
/* the 6 game colors */
--c-yellow:#e9d839; --c-orange:#e8722c; --c-pink:#d93ba8;
--c-blue:#3b9fe8;   --c-green:#3ce84a;  --c-red:#e83b50;
```

**Rules:**
- **Glassmorphism panels:** `background: rgba(23,16,42,0.6); backdrop-filter: blur(16px); border: 1px solid var(--line);` with a faint inner highlight.
- **Neon glow on key elements:** buttons, the COLORS logo, treasury numbers, active states → `box-shadow: 0 0 24px rgba(226,59,200,0.35)` and `text-shadow` glows. Use sparingly so it stays premium, not gaudy.
- **Ambient background:** layered radial gradients (magenta top-right, violet mid-left, cyan bottom) + a very subtle animated grain/scanline overlay at ~0.8% opacity. Optional: a slow-drifting particle or grid-perspective floor behind the hero.
- **Type:** a geometric/techy sans for UI (e.g. `Space Grotesk` or `Sora` for headings, `Inter` for body), and a mono (`JetBrains Mono` / `SF Mono`) for all numbers, balances, treasury figures, and the dice labels. Load from Google Fonts / next/font.
- **Motion:** framer-motion. Dice roll = physical shake + settle. Treasury meters = smooth eased fills. Numbers = count-up animation when they change. Winning states = a quick neon pulse/confetti burst (keep it tasteful). Page sections = fade/slide up on scroll.
- **3D dice:** upgrade the flat dice from the HTML to real CSS 3D cubes (`transform-style: preserve-3d`) or lightweight `three.js` cubes that tumble and land on a color face. The reference HTML uses flat colored tiles — make them dimensional.
- **Rounded, tactile:** 14–22px radii, layered shadows, buttons that depress on click.
- Dark mode only. No light theme.

**Feel target:** think a high-end on-chain casino UI crossed with a synthwave arcade — clean, glowing, confident, fast.

---

# 2. TECH STACK (exact)

- **Framework:** Next.js 15 (App Router), TypeScript, Tailwind v4
- **UI:** shadcn/ui + framer-motion + lucide-react
- **3D (dice):** three.js (or @react-three/fiber) — optional but preferred for the dice
- **Wallet:** `@solana/wallet-adapter-react` + `@solana/wallet-adapter-wallets` (Phantom, Solflare, Backpack)
- **Chain:** `@solana/web3.js`, `@solana/spl-token`
- **On-chain program:** Anchor 0.30.x — the `midway-treasury` program
- **Swaps (buyback):** `@jup-ag/api` (Jupiter v6) for the treasury's token buyback
- **RNG / fairness:** server-seed + client-seed commit-reveal (provably fair) for Fun Mode; on-chain randomness (e.g. a VRF or slot-hash based reveal) for Solana Mode
- **Backend:** Next.js route handlers + Supabase (postgres) for off-chain state (fun-mode balances, leaderboard, chat, believers accounting), Upstash Redis for realtime counters
- **Realtime:** Supabase Realtime (or Pusher) for the live treasury feed, chat, leaderboard
- **Deploy:** Vercel (web) + devnet→mainnet for the Anchor program

---

# 3. FILE STRUCTURE

```
midway/
├── apps/web/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # ecosystem hub (port midway-ecosystem.html)
│   │   ├── colors/page.tsx               # dedicated full-screen Colors
│   │   └── api/
│   │       ├── colors/
│   │       │   ├── roll/route.ts         # provably-fair roll + settle
│   │       │   └── verify/route.ts       # fairness verification
│   │       ├── treasury/
│   │       │   ├── state/route.ts        # live treasury totals + split
│   │       │   └── stream/route.ts       # SSE/websocket feed
│   │       ├── believers/
│   │       │   ├── pool/route.ts         # current pool + your share
│   │       │   └── claim/route.ts        # claim distribution
│   │       └── wallet/route.ts
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── TheLoop.tsx                    # the 40/40/20 engine diagram
│   │   ├── colors/
│   │   │   ├── ColorsGame.tsx            # the whole game
│   │   │   ├── DiceStage.tsx             # 3D dice
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── BetPanel.tsx
│   │   │   └── ResultBanner.tsx
│   │   ├── treasury/
│   │   │   ├── TreasuryPanel.tsx         # live meters
│   │   │   ├── SplitMeter.tsx
│   │   │   └── BelieversDrop.tsx
│   │   ├── AttractionsGrid.tsx
│   │   └── ui/                            # shadcn
│   ├── lib/
│   │   ├── colors/
│   │   │   ├── engine.ts                 # roll logic, payout math
│   │   │   └── fairness.ts               # commit-reveal
│   │   ├── treasury/
│   │   │   ├── split.ts                  # 40/40/20 routing
│   │   │   └── buyback.ts                # Jupiter buyback + burn
│   │   ├── believers/distribute.ts
│   │   ├── solana/{connection,program,token}.ts
│   │   └── db.ts
│   └── package.json
├── programs/midway-treasury/             # Anchor
│   ├── Anchor.toml
│   └── programs/midway-treasury/src/lib.rs
└── .env.example
```

---

# 4. PHASE 1 — SCAFFOLD

```bash
mkdir midway && cd midway && pnpm init
mkdir -p apps/web programs
cd apps/web
pnpm dlx create-next-app@15 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*"
pnpm add framer-motion lucide-react three @react-three/fiber @react-three/drei
pnpm add @solana/web3.js @solana/spl-token @jup-ag/api
pnpm add @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
pnpm add @supabase/supabase-js @upstash/redis zod
pnpm dlx shadcn@latest init -y -d
pnpm dlx shadcn@latest add button card dialog input slider
cd ../../programs
pnpm dlx @coral-xyz/anchor-cli init midway-treasury
```

**Acceptance:** `pnpm dev` runs, `anchor build` compiles, `.env.example` created (see Section 11).

---

# 5. PHASE 2 — PORT THE HUB + AESTHETIC

Port `midway-ecosystem.html` into React components, then upgrade to the aesthetic spec in Section 1.

- Set up the Tailwind theme + CSS variables from Section 1.
- Load fonts (Space Grotesk/Sora + Inter + JetBrains Mono).
- Build: `Hero`, `TheLoop` (the 40/40/20 diagram), `AttractionsGrid`, glass panels, ambient gradient background + subtle scanline overlay.
- Wire framer-motion: scroll reveals, count-up numbers, hover glows.

**Acceptance:** the hub renders, matches the HTML's structure, and looks distinctly darker/more futuristic — glass panels, neon glow, animated background, mono numerals.

---

# 6. PHASE 3 — COLORS GAME (exact mechanics)

Port `ColorsGame` from the HTML. **The mechanics must match exactly:**

- 6 colors: **Yellow, Orange, Pink, Blue, Green, Red**. Player picks **up to 3**.
- Bet amount (points in Fun Mode, SOL in Solana Mode). **Each selected color costs the full bet** → `stake = bet × colorsPicked`.
- Flow: pick colors → **PLACE BET** (deduct stake, lock round) → **ROLL** → 3 dice tumble and settle → count matches → settle payout.
- **Matches** = number of the 3 dice whose color is in the picked set (0–3).
- **Payouts (2× per matched color; 5% cut separate):**
  - `returned = bet × 2 × matchCount` where `bet` is the **unit bet**, not total stake
  - 1 match → `bet × 2`
  - 2 matches → `bet × 4`
  - 3 matches (JACKPOT) → `bet × 6`
  - 0 matches → lose stake
  - House cut = `stake × 0.05` every roll (win or lose) → treasury; does **not** reduce Returned to you
- **Autobet:** off / 5 / 10 / 20 / 50 / 100 / unlimited, reusing current color selection + bet.
- **Provably fair:** each roll = commit-reveal. Show a "Verify Fairness" panel after any roll with server seed, client seed, nonce, and the exact dice derivation.

Payout logic in `lib/colors/engine.ts` (LITERAL default):
```ts
export function settleRoll(bet: number, picked: Set<ColorKey>, dice: ColorKey[]) {
  const matches = dice.filter(d => picked.has(d)).length;
  const stake = bet * picked.size;
  const houseCut = stake * 0.05; // treasury routing only
  const winnings = matches > 0 ? bet * 2 * matches : 0;
  return { matches, winnings, stake, houseCut, net: winnings - stake };
}
```

**Dice:** upgrade to 3D (three.js cubes with 6 colored faces) that tumble on roll and land showing the rolled color. Winning dice get a gold ring + pulse.

> **PAYOUT MODE** (`NEXT_PUBLIC_PAYOUT_MODE`): `LITERAL` (default) pays on unit bet; `STAKE_BASED` applies multipliers to total stake; `PER_COLOR` settles each pick alone. Product default is LITERAL: multi-color raises hit chance and stake, but returned still = unit × 2 × matches.

**Acceptance:** Colors is fully playable in Fun Mode. Dice roll in 3D, matches + payouts are correct, autobet works, fairness is verifiable.

---

# 7. PHASE 4 — THE TREASURY LOOP (on-chain)

This is the whole point. Every roll's `houseCut` routes into the treasury and splits **40 / 40 / 20**.

### Anchor program `midway-treasury` — instructions:
- `initialize(authority, token_mint, split_bps: [4000, 4000, 2000])` — creates the treasury PDA + three sub-vaults (burn, believers, build).
- `deposit_cut(amount)` — called on settle; splits `amount` into the three vaults by bps. Emits `CutDeposited` event.
- `execute_buyback()` — takes the burn vault's accumulated SOL, swaps to the ecosystem token via Jupiter (CPI or crank), then `burn`s it. Emits `Burned { sol_in, tokens_burned }`.
- `snapshot_believers()` — snapshots holder balances for the current distribution round.
- `claim_believers(user)` — lets a holder claim their pro-rata share of the believers vault based on their snapshot weight (holding size × time held).
- `withdraw_build(authority, amount)` — multisig-gated withdrawal from the build vault.

Guard rails: split bps are fixed at init and immutable; build withdrawals require a Squads multisig; all deposits and burns emit events for a public dashboard.

### Off-chain routing (`lib/treasury/split.ts`):
On each settled roll in Solana Mode, submit `deposit_cut(houseCut)`. In Fun Mode, mirror the same math off-chain (Supabase) so the loop UI behaves identically without real funds.

### Buyback + burn (`lib/treasury/buyback.ts`):
A cron/crank calls `execute_buyback()` when the burn vault crosses a threshold: Jupiter-swap SOL → ecosystem token → burn. Log to a `burns` table for the public `/burn` dashboard.

**Acceptance:** a roll in Solana Mode (devnet) deposits the cut on-chain, the three vaults grow by 40/40/20, and a manual `execute_buyback()` swaps + burns and emits an event.

---

# 8. PHASE 5 — LIVE TREASURY UI + BELIEVERS

Port `TreasuryPanel` + `BelieversDrop` from the HTML and make them real-time.

- `TreasuryPanel`: total + three `SplitMeter`s (burn/believers/build) that animate as cuts arrive. Subscribe to the on-chain `CutDeposited` / `Burned` events (or Supabase Realtime mirror) so it updates live for everyone, not just the current player.
- Show **tokens burned** count and **supply ↓** ticker from `Burned` events.
- `BelieversDrop`: shows the current pool + **your share** (from `snapshot_believers` weight). `CLAIM SHARE` calls `claim_believers`. In Fun Mode, simulate.
- Count-up animation on every figure. Gold neon accents.

**Acceptance:** treasury meters update live from chain events; a second browser sees the same numbers move; claiming pulls the believer's share to their wallet (devnet).

---

# 9. PHASE 6 — ATTRACTIONS GRID + WALLET

- `AttractionsGrid`: Colors (LIVE), Glitch Pits (LIVE, link out for now), NFT Launchpad (SOON), Token Tools (SOON) — each card states what fee it feeds into the treasury. This sells the "one engine, works for all" story.
- Wallet: connect Phantom/Solflare/Backpack. Fun Mode needs no wallet; Solana Mode requires connect. Show balance in the header, treasury total in the top bar.
- Leaderboard + realtime chat (Supabase Realtime), "Share Win on X" from the result screen — mirror the reference game's social features.

**Acceptance:** wallet connects, Solana Mode gated behind it, attractions grid renders, leaderboard + share work.

---

# 10. PHASE 7 — FAIRNESS, POLISH, DEPLOY

- Fairness verification modal (server seed hash shown pre-roll, revealed post-roll, dice derivation reproducible).
- Public `/burn` dashboard: total burned, recent burn txs, live buyback feed. This is marketing — make it look sharp.
- Responsive pass (mobile-first for the game), reduced-motion support, error/empty states.
- Deploy web to Vercel; deploy `midway-treasury` to devnet, then mainnet only after an audit.

**Acceptance:** everything works on mobile + desktop, `/burn` is public and live, devnet end-to-end passes.

---

# 11. ENVIRONMENT VARIABLES (`.env.example`)

```bash
# public
NEXT_PUBLIC_APP_URL=https://themidway.app
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_MIDWAY_MINT=                 # ecosystem token mint
NEXT_PUBLIC_TREASURY_PROGRAM_ID=

# server
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# solana
SOLANA_RPC_URL=
TREASURY_AUTHORITY_KEYPAIR=              # use Squads multisig in prod, never raw key
JUPITER_API_URL=https://quote-api.jup.ag/v6

# fairness
SERVER_SEED_SECRET=
```

---

# 12. BUILD ORDER

1. Phase 1 — scaffold
2. Phase 2 — hub + aesthetic (**investors can see it here**)
3. Phase 3 — Colors playable (Fun Mode)
4. Phase 4 — treasury Anchor program (devnet)
5. Phase 5 — live treasury UI + believers
6. Phase 6 — attractions + wallet + social
7. Phase 7 — fairness, /burn dashboard, deploy

**Don't:**
- Don't ship the Anchor program to mainnet without an audit.
- Don't expose the treasury authority as a raw private key — use a Squads multisig.
- Don't let the 40/40/20 split be mutable after init — that's the trust guarantee.
- Don't skip the payout-fairness decision in Phase 3 (default `STAKE_BASED`).
- Don't fake the burn — every burn must be a real on-chain tx with a public signature.

---

# 13. ACCEPTANCE — "v1 ships when"

- [ ] Hub looks dark/futuristic/premium — glass, neon, mono numerals, motion
- [ ] Colors fully playable, 3D dice, correct payouts, autobet, provably fair
- [ ] Every roll routes its 5% cut into the treasury (on-chain in Solana Mode, mirrored in Fun Mode)
- [ ] Treasury splits 40/40/20 and the meters update live for all viewers
- [ ] Buyback + burn executes on-chain and is publicly verifiable at `/burn`
- [ ] Believers can claim their pro-rata share to their wallet
- [ ] Wallet connect + Solana Mode gating works
- [ ] Attractions grid tells the "one engine, works for all" story
- [ ] Split bps are immutable; build vault is multisig-gated

---

# 14. WHEN IN DOUBT

Re-read **`midway-ecosystem.html`** for behavior and layout, then make it darker, glassier, and more alive than the reference. The reference is the skeleton; the aesthetic spec in Section 1 is the skin.

**The one idea that must survive:** the house edge doesn't vanish — it comes home. Burn the supply, pay the believers, fund the build. Every attraction, one loop, honest and on-chain. **Every cut comes home.**

— end of MIDWAY_BUILD_PROMPT.md
