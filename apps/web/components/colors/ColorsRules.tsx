"use client";

import type { ReactNode } from "react";

type ColorsRulesProps = {
  open: boolean;
  onClose: () => void;
};

export function ColorsRules({ open, onClose }: ColorsRulesProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bevel hard-shadow-lg max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="win-titlebar focused">
          <span>COLORS · RULES.TXT</span>
          <div className="win-controls">
            <button type="button" onClick={onClose} aria-label="Close rules">
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-3 font-sans text-[14px] normal-case tracking-normal text-ink sm:p-4">
          <header className="border-b-2 border-line pb-3">
            <div className="font-heading text-sm text-hot">COLORS GAME RULES</div>
            <p className="mt-1 text-[12px] text-ink-dim">
              Fair published odds · ~5% house edge · transparent cut. Match and
              you get paid the formulas below. The edge is not pocketed — it
              routes home as burn / believers / build.
            </p>
          </header>

          <Section title="HOW TO PLAY">
            <p>
              Bet on up to <strong className="text-hot">3 of 6 colors</strong>:
              Yellow, Orange, Pink, Blue, Green, Red.
            </p>
            <p className="mt-2">
              Three dice roll at once. You win when your selected colors appear on
              the dice.
            </p>
            <p className="mt-2 rounded border border-line/60 bg-paper-2/80 px-3 py-2 text-[13px] text-ink-dim">
              Example: bet Blue + Green; dice show Blue, Blue, Red → you win on
              Blue (2 matches). PLACE BET arms the lever (no debit); PULL LEVER
              takes the bet cost. CANCEL BET undoes a placed bet for free.
            </p>
          </Section>

          <Section title="PAYOUTS">
            <div className="rounded border-2 border-line bg-paper-2/90 p-3">
              <p className="mb-2 font-heading text-[11px] text-acid">
                5% HOUSE EDGE · LITERAL (UNIT BET)
              </p>
              <ul className="space-y-1.5 font-mono text-[13px]">
                <li>
                  <span className="text-hot">1 match:</span> Bet + (Bet × 1.04)
                  <span className="text-ink-dim"> → 2.04×</span>
                </li>
                <li>
                  <span className="text-hot">2 matches:</span> Bet + (Bet × 1.04 × 2)
                  <span className="text-ink-dim"> → 3.08×</span>
                </li>
                <li>
                  <span className="text-hot">3 matches (Jackpot):</span> Bet + (Bet × 4.5)
                  <span className="text-ink-dim"> → 5.5×</span>
                </li>
              </ul>
              <div className="mt-3 space-y-1 border-t border-line/50 pt-2 text-[12px] text-ink-dim">
                <p>
                  Example at <strong className="text-ink">1 SOL</strong> unit bet
                  (1 color → bet cost 1 SOL):
                </p>
                <ul className="font-mono text-[12px] space-y-0.5">
                  <li>1 match → <span className="text-ink">2.04</span> SOL returned</li>
                  <li>2 matches → <span className="text-ink">3.08</span> SOL returned</li>
                  <li>3 matches → <span className="text-ink">5.50</span> SOL returned</li>
                  <li>0 matches → lose bet; cut still comes home</li>
                </ul>
                <p className="pt-1">
                  Each selected color costs the full bet (3 × 0.01 = 0.03 SOL).
                  Payouts use the unit bet. Single-color RTP ≈ 95% — fair odds,
                  sustainable edge.
                </p>
              </div>
            </div>
          </Section>

          <Section title="THE CUT → TREASURY">
            <p>
              Every roll — win or lose — takes a{" "}
              <strong className="text-hot">5% house cut</strong> of your total
              cost into the Midway treasury, then splits:
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-1.5 font-heading text-[10px] sm:gap-2 sm:text-[11px]">
              <li className="bevel px-1.5 py-2.5 text-center leading-tight text-burn sm:px-2 sm:py-3">
                40% BURN
              </li>
              <li className="bevel px-1.5 py-2.5 text-center leading-tight text-hot sm:px-2 sm:py-3">
                40% BELIEVERS
              </li>
              <li className="bevel px-1.5 py-2.5 text-center leading-tight text-acid sm:px-2 sm:py-3">
                20% BUILD
              </li>
            </ul>
            <p className="mt-2 text-[12px] text-ink-dim">
              Example cut on 1 SOL bet:{" "}
              <span className="font-mono text-ink">0.05</span> → burn{" "}
              <span className="font-mono text-ink">0.02</span> · believers{" "}
              <span className="font-mono text-ink">0.02</span> · build{" "}
              <span className="font-mono text-ink">0.01</span>.
            </p>
          </Section>

          <Section title="SOLANA · DEMO">
            <div className="space-y-2 rounded border border-line/60 bg-paper-2/80 p-3">
              <p>
                Colors uses your{" "}
                <strong className="text-cyber">Midway wallet</strong> play balance
                (DEMO · 10 SOL seed). Connect{" "}
                <strong className="text-ink">Phantom</strong> or{" "}
                <strong className="text-ink">Solflare</strong> as your main wallet to
                create a Midway wallet + username — no real funds move for bets.
              </p>
              <p className="text-[13px] text-ink-dim">
                Bets debit Midway play funds (local ledger). Deposit / withdraw / reset
                anytime in <strong className="text-hot">WALLET.EXE</strong>. LIVE
                custody transfers are disabled.
              </p>
            </div>
          </Section>

          <Section title="AUTOBET">
            <p>
              Auto-play with your current color picks and bet size. Choose{" "}
              <strong className="text-hot">5 / 10 / 20 / 50 / 100 / ∞</strong>{" "}
              rounds, or OFF to stop.
            </p>
          </Section>

          <Section title="SOCIAL">
            <ul className="space-y-1.5 text-[13px]">
              <li>
                <strong className="text-cyber">Chat</strong> — table talk when the
                chat rail is online.
              </li>
              <li>
                <strong className="text-cyber">Leaderboard</strong> — top winners
                across sessions.
              </li>
              <li>
                <strong className="text-cyber">Share wins</strong> — blast a jackpot
                to X from the result screen.
              </li>
            </ul>
          </Section>

          <Section title="FAIRNESS">
            <p>
              Rolls use cryptographically secure RNG. After each roll, open{" "}
              <strong className="text-cyber">VERIFY FAIRNESS.LOG</strong> for seeds,
              hash, nonce, and dice.
            </p>
          </Section>

          <Section title="TIPS">
            <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-ink-dim">
              <li>
                More colors raise hit chance, but each color costs the full SOL bet.
              </li>
              <li>Use Autobet to stress-test a color set without clicking every roll.</li>
              <li>If a result feels off, verify fairness before the next bet.</li>
            </ul>
          </Section>

          <button
            type="button"
            className="bevel-btn bevel-btn-hot min-h-11 w-full py-3"
            onClick={onClose}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 font-heading text-[12px] text-hot">{title}</h3>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
