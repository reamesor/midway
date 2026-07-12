"use client";

import { useOs, type WinId } from "./OsContext";

const ICONS: { id: WinId | "external"; label: string; glyph: string; badge?: string; href?: string }[] = [
  { id: "colors", label: "Colors", glyph: "🎨", badge: "LIVE" },
  { id: "loop", label: "The Loop", glyph: "♾️" },
  { id: "treasury", label: "Treasury", glyph: "🏛️", badge: "LIVE" },
  { id: "external", label: "Glitch Pits", glyph: "🥊", badge: "LIVE", href: "https://glitchpits.com" },
  { id: "readme", label: "README", glyph: "📄" },
];

export function DesktopIcons() {
  const { openWin } = useOs();

  return (
    <div className="absolute left-3 top-3 z-[5] flex flex-col gap-3 md:left-4 md:top-4">
      {ICONS.map((icon) => (
        <button
          key={icon.label}
          type="button"
          className="desk-icon"
          onDoubleClick={() => {
            if (icon.href) {
              window.open(icon.href, "_blank", "noreferrer");
              return;
            }
            if (icon.id !== "external") openWin(icon.id);
          }}
          onClick={() => {
            // single click select — mobile opens
            if (window.matchMedia("(max-width: 768px)").matches) {
              if (icon.href) window.open(icon.href, "_blank", "noreferrer");
              else if (icon.id !== "external") openWin(icon.id);
            }
          }}
        >
          <span className="glyph relative">
            {icon.glyph}
            {icon.badge && (
              <span className="absolute -right-2 -top-2 bg-win px-1 text-[8px] text-black blink">
                {icon.badge}
              </span>
            )}
          </span>
          <span>{icon.label}</span>
        </button>
      ))}
      <div className="desk-icon pointer-events-none opacity-60">
        <span className="glyph">🖼️</span>
        <span>NFT Soon</span>
      </div>
      <div className="desk-icon pointer-events-none opacity-60">
        <span className="glyph">🪙</span>
        <span>Tokens Soon</span>
      </div>
    </div>
  );
}
