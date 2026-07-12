import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/** Char-grid → rect SVG pixel engine (matches midway-intro.html). */
export function pixelRects(
  grid: string[],
  palette: Record<string, string>,
  px: number,
): string {
  let s = "";
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c++) {
      const col = palette[row[c]!];
      if (col) {
        s += `<rect x="${c * px}" y="${r * px}" width="${px}" height="${px}" fill="${col}"/>`;
      }
    }
  }
  return s;
}

export function pixelSvgMarkup(
  grid: string[],
  palette: Record<string, string>,
  px: number,
): string {
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * px} ${rows * px}" width="100%" height="100%" shape-rendering="crispEdges">${pixelRects(grid, palette, px)}</svg>`;
}

type PixelIconProps = {
  grid: string[];
  palette?: Record<string, string>;
  px?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** Renders a crisp pixel glyph from a char grid. */
export function PixelIcon({
  grid,
  palette = { K: "currentColor", X: "currentColor" },
  px = 3,
  className,
  style,
  title,
  ...rest
}: PixelIconProps) {
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c++) {
      const fill = palette[row[c]!];
      if (!fill) continue;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * px}
          y={r * px}
          width={px}
          height={px}
          fill={fill}
        />,
      );
    }
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-grid",
        placeItems: "center",
        lineHeight: 0,
        imageRendering: "pixelated",
        ...style,
      }}
      title={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${cols * px} ${rows * px}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        {cells}
      </svg>
    </span>
  );
}

/** Intro tent jewelry palette (light). */
export const P_TENT = {
  K: "#2f5a38",
  R: "#7fae74",
  W: "#eef4e6",
  Y: "#c08a2e",
  D: "#254a2d",
} as const;

export const TENT = [
  "........KYYY....",
  "........KYY.....",
  "........KY......",
  ".......KYK......",
  "......KRWRK.....",
  ".....KRWRWRK....",
  "....KRWRWRWRK...",
  "...KRWRWRWRWRK..",
  "..KRWRWRWRWRWRK.",
  "..KYKYKYKYKYKYK.",
  "...KRWRWRWRWK...",
  "...KRWRDDRWRK...",
  "...KRWRDDRWRK...",
  "...KRWRDDRWRK...",
  "...KRWRDDRWRK...",
  "...KKKKDDKKKK...",
];

/** Single-color ink glyphs (K = ink). */
export const GLYPHS = {
  play: ["K...", "KK..", "KKK.", "KKKK", "KKK.", "KK..", "K..."],
  palette: [
    "..KKKK..",
    ".KYYYYK.",
    "KYYKKYYK",
    "KYK..KYK",
    "KYK..KYK",
    "KYYKKYYK",
    ".KYYYYK.",
    "..K..K..",
    "...KK...",
  ],
  loop: [
    ".KKKKKK.",
    "KK....KK",
    "KK.KK.KK",
    "KK.KK.KK",
    "KK....KK",
    ".KKKKKK.",
    "..K..K..",
    ".KK..KK.",
  ],
  treasury: [
    "..KKKK..",
    ".KYYYYK.",
    "KKKKKKKK",
    "K.K..K.K",
    "K.K..K.K",
    "K.K..K.K",
    "K.KKKK.K",
    "KKKKKKKK",
  ],
  glitch: [
    "KK....KK",
    "KKK..KKK",
    ".KKKKKK.",
    "..KKKK..",
    ".KKKKKK.",
    "KK.KK.KK",
    "K......K",
    "KK....KK",
  ],
  nft: [
    ".KKKKKK.",
    "KYYYYYYK",
    "KY.KK.YK",
    "KYKYYKYK",
    "KY.YY.YK",
    "KY....YK",
    "KYYYYYYK",
    ".KKKKKK.",
  ],
  readme: [
    ".KKKKKK.",
    "KYYYYYYK",
    "KYKKKKYK",
    "KY....YK",
    "KY.KK.YK",
    "KY....YK",
    "KY.KK.YK",
    "KYYYYYYK",
    ".KKKKKK.",
  ],
  frame: [
    "KKKKKKKK",
    "KYYYYYYK",
    "KY.KK.YK",
    "KYKYYKYK",
    "KY.YY.YK",
    "KY....YK",
    "KYYYYYYK",
    "KKKKKKKK",
  ],
  coin: [
    "..KKKK..",
    ".KYYYYK.",
    "KYKYYKYK",
    "KYYKKYYK",
    "KYYKKYYK",
    "KYKYYKYK",
    ".KYYYYK.",
    "..KKKK..",
  ],
  wallet: [
    ".KKKKKK.",
    "KYYYYYYK",
    "KY....YK",
    "KY.KKKYK",
    "KY.KYYYK",
    "KY....YK",
    "KYYYYYYK",
    ".KKKKKK.",
  ],
  lever: [
    "....KK..",
    "...KYK..",
    "...KYK..",
    "...KYK..",
    "..KKKKK.",
    ".KKKKKKK",
    "KKKKKKKK",
    ".KKKKKK.",
  ],
  burn: [
    "...KK...",
    "..KYYK..",
    ".KYYYYK.",
    ".KYYKYK.",
    "KYYYYYYK",
    "KYKYYKYK",
    ".KKKKKK.",
    "..KKKK..",
  ],
  star: [
    "...K....",
    "..KYK...",
    "KKYYYYKK",
    ".KYYYYK.",
    "..KYYK..",
    ".KY..YK.",
    "KY....YK",
    "K......K",
  ],
  gear: [
    "..K..K..",
    ".KKKKKK.",
    "KYKYYKYK",
    "KYYYYYYK",
    "KYKYYKYK",
    ".KKKKKK.",
    "..K..K..",
    "........",
  ],
  sun: [
    "...K....",
    "K..K..K.",
    ".KKKKKK.",
    "KKYYYYKK",
    ".KKKKKK.",
    "K..K..K.",
    "...K....",
    "........",
  ],
  moon: [
    "...KKK..",
    "..KYYYK.",
    ".KY..YYK",
    "KY...YYK",
    "KY...YYK",
    ".KY..YYK",
    "..KYYYK.",
    "...KKK..",
  ],
  tentMini: TENT,
  arrow: ["..K.", ".KK.", "KKKK", ".KK.", "..K."],
  check: ["......K", ".....K.", "K...K..", ".K.K...", "..K...."],
  box: ["KKKKKK", "K....K", "K....K", "K....K", "K....K", "KKKKKK"],
  boxOn: ["KKKKKK", "KYYYYK", "KYYYYK", "KYYYYK", "KYYYYK", "KKKKKK"],
} as const;

export type GlyphId = keyof typeof GLYPHS;

/** Theme-aware ink/sage/gold palette for OS glyphs. */
export function inkPalette(mode: "light" | "dark" = "light") {
  if (mode === "dark") {
    return {
      K: "#e9e6df",
      Y: "#c08a2e",
      R: "#a9c6a0",
      W: "#2f5a38",
      D: "#1a241c",
      X: "#e9e6df",
    };
  }
  return {
    K: "#2f5a38",
    Y: "#c08a2e",
    R: "#7fae74",
    W: "#eef4e6",
    D: "#254a2d",
    X: "#2f5a38",
  };
}
