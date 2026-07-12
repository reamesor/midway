"use client";

import { PixelIcon, GLYPHS, inkPalette, type GlyphId } from "@/lib/pixel";
import { useOs, type WinId } from "./OsContext";

type DockIcon =
  | {
      kind: "app";
      id: WinId;
      label: string;
      glyph: GlyphId;
      badge?: "LIVE" | "DEMO" | "SOON";
    }
  | {
      kind: "soon";
      soonId: string;
      label: string;
      glyph: GlyphId;
      title: string;
      blurb: string;
    };

const ICONS: DockIcon[] = [
  { kind: "app", id: "colors", label: "Colors", glyph: "palette", badge: "DEMO" },
  { kind: "app", id: "wallet", label: "Wallet", glyph: "wallet", badge: "DEMO" },
  { kind: "app", id: "dashboard", label: "Profile", glyph: "frame", badge: "DEMO" },
  { kind: "app", id: "leaderboard", label: "Board", glyph: "star", badge: "DEMO" },
  { kind: "app", id: "loop", label: "Loop", glyph: "loop" },
  { kind: "app", id: "treasury", label: "Treasury", glyph: "treasury", badge: "LIVE" },
  { kind: "app", id: "info", label: "Info", glyph: "readme" },
  { kind: "app", id: "token", label: "Token", glyph: "coin" },
  {
    kind: "soon",
    soonId: "glitch",
    label: "Glitch",
    glyph: "glitch",
    title: "GLITCH.EXE",
    blurb: "8-bit rumble pits — fighters, pots, and rake into the same treasury loop. Not wired yet.",
  },
  {
    kind: "soon",
    soonId: "nft",
    label: "NFT",
    glyph: "nft",
    title: "NFT.LAUNCH",
    blurb:
      "When live: holders get planned ride multipliers + an extra cut of claimable believers fees. Mint not open yet.",
  },
];

export function DesktopIcons() {
  const { openWin, openSoon, theme, open, focused, soonTitle } = useOs();
  const palette = inkPalette(theme);

  const activate = (icon: DockIcon) => {
    if (icon.kind === "soon") {
      openSoon(icon.title, icon.blurb);
      return;
    }
    openWin(icon.id);
  };

  return (
    <div className="desk-icons" role="toolbar" aria-label="Desktop apps">
      {ICONS.map((icon) => {
        const isApp = icon.kind === "app";
        const isOpen = isApp
          ? open[icon.id]
          : open.soon && soonTitle === icon.title;
        const isFocused = isApp
          ? focused === icon.id
          : focused === "soon" && soonTitle === icon.title;
        const badge = icon.kind === "app" ? icon.badge : "SOON";

        return (
          <button
            key={icon.kind === "app" ? icon.id : icon.soonId}
            type="button"
            className={`desk-icon${isFocused ? " selected" : ""}${isOpen ? " is-open" : ""}`}
            title={
              badge === "SOON"
                ? `${icon.label} — coming soon`
                : `Open ${icon.label}`
            }
            onClick={() => activate(icon)}
            onDoubleClick={() => activate(icon)}
          >
            <span className="glyph relative">
              <PixelIcon grid={[...GLYPHS[icon.glyph]]} palette={palette} px={3} />
              {badge && (
                <span
                  className={`desk-icon-badge ${
                    badge === "LIVE"
                      ? "is-live blink"
                      : badge === "DEMO"
                        ? "is-demo"
                        : "is-soon"
                  }`}
                >
                  {badge}
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
