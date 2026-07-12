/**
 * Sanity check for Colors LITERAL payouts + 40/40/20 cut split.
 * Run: pnpm --filter web check:colors
 */
import assert from "node:assert/strict";
import {
  HOUSE_EDGE,
  JACKPOT_PROFIT,
  MATCH1_PROFIT,
  MATCH2_PROFIT,
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

const m1 = settleRoll(BET, ONE, dice1, "LITERAL");
assert.equal(m1.matches, 1);
assert.equal(m1.winnings, BET + BET * MATCH1_PROFIT); // 2.04
assert.equal(m1.stake, 1);
assert.equal(m1.houseCut, BET * HOUSE_EDGE); // 0.05
assert.equal(m1.net, m1.winnings - m1.stake);

const m2 = settleRoll(BET, ONE, dice2, "LITERAL");
assert.equal(m2.matches, 2);
assert.equal(m2.winnings, BET + BET * MATCH2_PROFIT); // 3.08

const m3 = settleRoll(BET, ONE, dice3, "LITERAL");
assert.equal(m3.matches, 3);
assert.equal(m3.winnings, BET + BET * JACKPOT_PROFIT); // 5.5

const lose = settleRoll(BET, ONE, dice0, "LITERAL");
assert.equal(lose.matches, 0);
assert.equal(lose.winnings, 0);
assert.equal(lose.houseCut, 0.05); // cut still taken on a loss

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
assert.equal(three.winnings, 2.04);
assert.equal(three.houseCut, 3 * HOUSE_EDGE); // 0.15

const cut = splitCut(0.05);
assert.ok(Math.abs(cut.burn - 0.02) < 1e-12);
assert.ok(Math.abs(cut.believers - 0.02) < 1e-12);
assert.ok(Math.abs(cut.build - 0.01) < 1e-12);
assert.ok(Math.abs(cut.burn + cut.believers + cut.build - 0.05) < 1e-12);

// ~5% edge sanity: single-color RTP from exact binomial probabilities
const p = 1 / 6;
const q = 5 / 6;
const p0 = q ** 3;
const p1 = 3 * p * q ** 2;
const p2 = 3 * p ** 2 * q;
const p3 = p ** 3;
const rtp = p1 * 2.04 + p2 * 3.08 + p3 * 5.5;
assert.ok(Math.abs(p0 + p1 + p2 + p3 - 1) < 1e-12);
assert.ok(rtp > 0.94 && rtp < 0.96, `expected ~95% RTP, got ${rtp}`);
assert.ok(1 - rtp > 0.04 && 1 - rtp < 0.06, `expected ~5% edge, got ${1 - rtp}`);

console.log("colors engine check OK");
console.log({
  examples: {
    "1 match": { winnings: m1.winnings, houseCut: m1.houseCut, split: splitCut(m1.houseCut) },
    "2 matches": { winnings: m2.winnings, houseCut: m2.houseCut, split: splitCut(m2.houseCut) },
    "3 matches": { winnings: m3.winnings, houseCut: m3.houseCut, split: splitCut(m3.houseCut) },
  },
  singleColorRtp: Number(rtp.toFixed(4)),
  houseEdgeApprox: Number((1 - rtp).toFixed(4)),
});
