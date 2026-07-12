import type { ColorKey } from "@/lib/colors/engine";
import { COLOR_HEX } from "@/lib/colors/engine";

/** Pixel mascot grids — 12×12 (K outline, B body, H hi, E eye, D dark, W white). */
export const IDLE_CUBE_CHARS: Record<ColorKey, string[]> = {
  yellow: [
    "....KKKK....",
    "...KBBBBK...",
    "..KBBHHBBK..",
    ".KBHEEEHBK..",
    "KBHEW.WEHBK.",
    "KBHE....HBK.",
    "KBHEW.WEHBK.",
    ".KBHEEEHBK..",
    "..KBBHHBBK..",
    "...KBBBBK...",
    "....K..K....",
    "...KK..KK...",
  ],
  orange: [
    "...KK..KK...",
    "..KBBKKBBK..",
    ".KBBHHBBBK..",
    "KBBHEEHBBBK.",
    "KBHEW.WEHBBK",
    "KBHE....HBBK",
    ".KBHEEEHBBK.",
    "..KBBHHBBK..",
    "...KBBBBK...",
    "...KB..BK...",
    "..KK....KK..",
    "............",
  ],
  pink: [
    "..KK....KK..",
    ".KBBK..KBBK.",
    "KBBHBKKBHBBK",
    "KBHEEEEEHBK.",
    "KBHEW.WEHBK.",
    ".KBH....HBK.",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "...KBBBK....",
    "...KB.BK....",
    "..KK...KK...",
    "............",
  ],
  blue: [
    ".....KK.....",
    "....KBBK....",
    "...KBBHBK...",
    "..KBHEEHBK..",
    ".KBHEW.WEBK.",
    "KBHE....EHBK",
    "KBHEW..WEHBK",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "...KBBBK....",
    "....K.K.....",
    "...KK.KK....",
  ],
  green: [
    ".....KK.....",
    "....KDDK....",
    ".....KK.....",
    "....KBBK....",
    "...KBHHBK...",
    "..KBHEEHBK..",
    ".KBHEW.WEBK.",
    "KBHE....EHBK",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "...KB..BK...",
    "..KK....KK..",
  ],
  red: [
    "..KK....KK..",
    ".KBBK..KBBK.",
    "KBBHBKKBHBBK",
    "KBHEEEEEHBK.",
    "KBHEW.WEHBK.",
    ".KBH....HBK.",
    "..KBHEEHBK..",
    "...KBBHBK...",
    "....KBBK....",
    ".....KK.....",
    "....K..K....",
    "...KK..KK...",
  ],
};

/** Alternate foot / pose frames for walk loops. */
export const IDLE_CUBE_CHARS_WALK: Record<ColorKey, string[]> = {
  yellow: [
    "....KKKK....",
    "...KBBBBK...",
    "..KBBHHBBK..",
    ".KBHEEEHBK..",
    "KBHEW.WEHBK.",
    "KBHE....HBK.",
    "KBHEW.WEHBK.",
    ".KBHEEEHBK..",
    "..KBBHHBBK..",
    "...KBBBBK...",
    "...K....K...",
    "..KK....KK..",
  ],
  orange: [
    "...KK..KK...",
    "..KBBKKBBK..",
    ".KBBHHBBBK..",
    "KBBHEEHBBBK.",
    "KBHEW.WEHBBK",
    "KBHE....HBBK",
    ".KBHEEEHBBK.",
    "..KBBHHBBK..",
    "...KBBBBK...",
    "....KB.BK...",
    "....KK..KK..",
    "............",
  ],
  pink: [
    "..KK....KK..",
    ".KBBK..KBBK.",
    "KBBHBKKBHBBK",
    "KBHEEEEEHBK.",
    "KBHEW.WEHBK.",
    ".KBH....HBK.",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "...KBBBK....",
    "..KB...BK...",
    ".KK.....KK..",
    "............",
  ],
  blue: [
    ".....KK.....",
    "....KBBK....",
    "...KBBHBK...",
    "..KBHEEHBK..",
    ".KBHEW.WEBK.",
    "KBHE....EHBK",
    "KBHEW..WEHBK",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "...KBBBK....",
    "...K...K....",
    "..KK...KK...",
  ],
  green: [
    ".....KK.....",
    "....KDDK....",
    ".....KK.....",
    "....KBBK....",
    "...KBHHBK...",
    "..KBHEEHBK..",
    ".KBHEW.WEBK.",
    "KBHE....EHBK",
    ".KBHEEEHBK..",
    "..KBBHHBK...",
    "..KB....BK..",
    ".KK......KK.",
  ],
  red: [
    "..KK....KK..",
    ".KBBK..KBBK.",
    "KBBHBKKBHBBK",
    "KBHEEEEEHBK.",
    "KBHEW.WEHBK.",
    ".KBH....HBK.",
    "..KBHEEHBK..",
    "...KBBHBK...",
    "....KBBK....",
    ".....KK.....",
    "...K....K...",
    "..KK....KK..",
  ],
};

/** Distinct idle-loop style per Colors palette entry. */
export const IDLE_CHAR_MOTION: Record<
  ColorKey,
  "bob" | "walk" | "sway" | "hop" | "bounce" | "strut"
> = {
  yellow: "bob",
  orange: "walk",
  pink: "sway",
  blue: "hop",
  green: "bounce",
  red: "strut",
};

function mixHex(a: string, b: string, t: number) {
  const parse = (h: string) => {
    const n = h.replace("#", "");
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ] as const;
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const to = (v: number) =>
    Math.round(v)
      .toString(16)
      .padStart(2, "0");
  return `#${to(ar + (br - ar) * t)}${to(ag + (bg - ag) * t)}${to(ab + (bb - ab) * t)}`;
}

export function idleCharPalette(id: ColorKey, ink = "#2f5a38") {
  const body = COLOR_HEX[id];
  return {
    K: ink,
    B: body,
    H: mixHex(body, "#ffffff", 0.35),
    D: mixHex(body, ink, 0.4),
    E: "#1a241c",
    W: "#eef4e6",
  };
}

/** Dice-style face colors (+X -X +Y -Y +Z -Z), front (+Z) is the cube's color. */
export function dieFaceColors(front: ColorKey): ColorKey[] {
  const rest = (
    ["blue", "orange", "yellow", "red", "pink", "green"] as ColorKey[]
  ).filter((c) => c !== front);
  return [rest[0]!, rest[1]!, rest[2]!, rest[3]!, front, rest[4]!];
}
