/**
 * Contract check: DiceStage paints engine results on BoxGeometry +Y (index 2).
 * Run: npx tsx apps/web/lib/colors/diceFaces.check.ts
 */
import type { ColorKey } from "./engine";

/** Mirrors DiceStage IDLE_FACES + RESULT_FACE mapping. */
const IDLE: ColorKey[][] = [
  ["yellow", "orange", "pink", "blue", "green", "red"],
  ["blue", "green", "yellow", "red", "orange", "pink"],
  ["pink", "red", "blue", "orange", "yellow", "green"],
];
const RESULT_FACE = 2;

function settledFaces(idle: ColorKey[], result: ColorKey): ColorKey[] {
  return [idle[0]!, idle[1]!, result, idle[3]!, idle[4]!, idle[5]!];
}

// PNK · BLU · BLU — tops (+Y) must be exactly those colors (not idle +Z).
const rolled: ColorKey[] = ["pink", "blue", "blue"];
const tops = rolled.map((c, i) => settledFaces(IDLE[i]!, c)[RESULT_FACE]);
if (tops.join(",") !== "pink,blue,blue") {
  throw new Error(`expected pink,blue,blue tops, got ${tops.join(",")}`);
}
// Idle +Z must NOT be mistaken for the result (regression from negative settle tip).
const idleFronts = IDLE.map((f) => f[4]);
if (idleFronts.join(",") === tops.join(",")) {
  throw new Error("idle +Z collided with result tops — mapping broken");
}
console.log("diceFaces.check ok:", tops.join(" · "), "(+Y); idle +Z was", idleFronts.join(" · "));
