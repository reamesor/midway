/**
 * Sanity check for Colors 2×-per-match payouts + 40/40/20 cut split.
 * Run: pnpm --filter web check:colors
 */
import assert from "node:assert/strict";
import {
  HOUSE_EDGE,
  MATCH_PAYOUT,
  matchWinnings,
  payoutMultiplier,
  settleRoll,
  splitCut,
  type ColorKey,
} from "./engine";

const BET = 1;
const ONE: ColorKey[] = ["blue"];
const dice1: ColorKey[] = ["blue", "red", "green"];
const dice2: ColorKey[] = ["blue", "blue", "red"];
const dice3: ColorKey[] = ["blue", "blue", "blue"];
const dice0: ColorKey[] = ["red", "green", "yellow"];

assert.equal(MATCH_PAYOUT, 2);
assert.equal(payoutMultiplier(1), 2);
assert.equal(payoutMultiplier(2), 4);
assert.equal(payoutMultiplier(3), 6);
assert.equal(matchWinnings(0.1, 1), 0.2);

const m1 = settleRoll(BET, ONE, dice1, "LITERAL");
assert.equal(m1.matches, 1);
assert.equal(m1.winnings, BET * 2); // 2.0
assert.equal(m1.stake, 1);
assert.equal(m1.houseCut, BET * HOUSE_EDGE); // 0.05
assert.equal(m1.net, m1.winnings - m1.stake); // +1.0

const m2 = settleRoll(BET, ONE, dice2, "LITERAL");
assert.equal(m2.matches, 2);
assert.equal(m2.winnings, BET * 4); // 4.0
assert.equal(m2.net, 3);

const m3 = settleRoll(BET, ONE, dice3, "LITERAL");
assert.equal(m3.matches, 3);
assert.equal(m3.winnings, BET * 6); // 6.0
assert.equal(m3.net, 5);

const lose = settleRoll(BET, ONE, dice0, "LITERAL");
assert.equal(lose.matches, 0);
assert.equal(lose.winnings, 0);
assert.equal(lose.houseCut, 0.05); // cut still taken on a loss

// Product verify: bet 0.10, 1 match → Returned 0.20, profit +0.10
const verify = settleRoll(0.1, ONE, dice1, "LITERAL");
assert.equal(verify.matches, 1);
assert.ok(Math.abs(verify.winnings - 0.2) < 1e-12);
assert.ok(Math.abs(verify.stake - 0.1) < 1e-12);
assert.ok(Math.abs(verify.net - 0.1) < 1e-12);
assert.ok(Math.abs(verify.houseCut - 0.005) < 1e-12);

// Multi-color: stake scales, LITERAL payout still on unit bet; cut on full stake
// One hit among three picks (only blue lands; orange/yellow are misses).
const three = settleRoll(
  BET,
  ["blue", "green", "red"],
  ["blue", "orange", "yellow"],
  "LITERAL",
);
assert.equal(three.matches, 1);
assert.equal(three.stake, 3);
assert.equal(three.winnings, 2); // unit bet × 2 × 1
assert.equal(three.houseCut, 3 * HOUSE_EDGE); // 0.15

const cut = splitCut(0.05);
assert.ok(Math.abs(cut.burn - 0.02) < 1e-12);
assert.ok(Math.abs(cut.believers - 0.02) < 1e-12);
assert.ok(Math.abs(cut.build - 0.01) < 1e-12);
assert.ok(Math.abs(cut.burn + cut.believers + cut.build - 0.05) < 1e-12);

// Single-color EV: E[2 × matches] = 2 × (3/6) = 1 → ~100% RTP on unit bet.
// Published 5% house cut is treasury routing, not a silent haircut on return.
const p = 1 / 6;
const q = 5 / 6;
const p0 = q ** 3;
const p1 = 3 * p * q ** 2;
const p2 = 3 * p ** 2 * q;
const p3 = p ** 3;
const rtp = p1 * 2 + p2 * 4 + p3 * 6;
assert.ok(Math.abs(p0 + p1 + p2 + p3 - 1) < 1e-12);
assert.ok(Math.abs(rtp - 1) < 1e-12, `expected 100% RTP, got ${rtp}`);

console.log("colors engine check OK");
console.log({
  examples: {
    "0.10 · 1 match": {
      winnings: verify.winnings,
      net: verify.net,
      houseCut: verify.houseCut,
      split: splitCut(verify.houseCut),
    },
    "1 match": { winnings: m1.winnings, houseCut: m1.houseCut, split: splitCut(m1.houseCut) },
    "2 matches": { winnings: m2.winnings, houseCut: m2.houseCut, split: splitCut(m2.houseCut) },
    "3 matches": { winnings: m3.winnings, houseCut: m3.houseCut, split: splitCut(m3.houseCut) },
  },
  singleColorRtp: Number(rtp.toFixed(4)),
});
