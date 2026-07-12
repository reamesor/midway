"use client";

import { PixelIcon, GLYPHS, inkPalette, type GlyphId } from "@/lib/pixel";
import { useOs, type WinId } from "./OsContext";

const ICONS: {
  id: WinId | "external";
  label: string;
  glyph: GlyphId;
  badge?: string;
  href?: string;
}[] = [
  { id: "colors", label: "Colors", glyph: "palette", badge: "LIVE" },
  { id: "loop", label: "The Loop", glyph: "loop" },
  { id: "treasury", label: "Treasury", glyph: "treasury", badge: "LIVE" },
  {
    id: "external",
    label: "Glitch Pits",
    glyph: "glitch",
    badge: "LIVE",
    href: "https://glitchpits.com",
  },
  { id: "readme", label: "README", glyph: "readme" },
];

export function DesktopIcons() {
  const { openWin, theme } = useOs();
  const palette = inkPalette(theme);

  const activate = (icon: (typeof ICONS)[number] | { href?: string; id: string }) => {
    if ("href" in icon && icon.href) {
      window.open(icon.href, "_blank", "noreferrer");
      return;
    }
    if (icon.id !== "external") openWin(icon.id as WinId);
  };

  return (
    <div className="desk-icons">
      {ICONS.map((icon) => (
        <button
          key={icon.label}
          type="button"
          className="desk-icon"
          onDoubleClick={() => activate(icon)}
          onClick={() => {
            if (window.matchMedia("(max-width: 768px)").matches) activate(icon);
          }}
        >
          <span className="glyph relative">
            <PixelIcon grid={[...GLYPHS[icon.glyph]]} palette={palette} px={3} />
            {icon.badge && (
              <span className="absolute -right-2 -top-2 bg-win px-1 text-[8px] text-[var(--btn)] blink">
                {icon.badge}
              </span>
            )}
          </span>
          <span>{icon.label}</span>
        </button>
      ))}
      <div className="desk-icon pointer-events-none opacity-55">
        <span className="glyph">
          <PixelIcon grid={[...GLYPHS.frame]} palette={palette} px={3} />
        </span>
        <span>NFT Soon</span>
      </div>
      <div className="desk-icon pointer-events-none opacity-55">
        <span className="glyph">
          <PixelIcon grid={[...GLYPHS.coin]} palette={palette} px={3} />
        </span>
        <span>Tokens Soon</span>
      </div>
    </div>
  );
}
