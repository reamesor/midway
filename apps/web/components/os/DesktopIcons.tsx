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
  { id: "treasury", label: "Treasury", glyph: "treasury", badge: "LIVE" },
  {
    id: "external",
    label: "Glitch",
    glyph: "glitch",
    badge: "LIVE",
    href: "https://glitchpits.com",
  },
];

export function DesktopIcons() {
  const { openWin, theme, open, focused } = useOs();
  const palette = inkPalette(theme);

  const activate = (icon: (typeof ICONS)[number]) => {
    if (icon.href) {
      window.open(icon.href, "_blank", "noreferrer");
      return;
    }
    if (icon.id !== "external") openWin(icon.id as WinId);
  };

  return (
    <div className="desk-icons" role="toolbar" aria-label="Desktop apps">
      {ICONS.map((icon) => {
        const isOpen = icon.id !== "external" && open[icon.id as WinId];
        const isFocused = icon.id !== "external" && focused === icon.id;
        return (
          <button
            key={icon.label}
            type="button"
            className={`desk-icon${isFocused ? " selected" : ""}${isOpen ? " is-open" : ""}`}
            title={icon.href ? "Open Glitch Pits" : `Open ${icon.label}`}
            onClick={() => activate(icon)}
            onDoubleClick={() => activate(icon)}
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
        );
      })}
    </div>
  );
}
