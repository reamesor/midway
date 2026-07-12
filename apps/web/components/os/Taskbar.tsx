"use client";

import { useEffect, useState } from "react";
import { PixelIcon, GLYPHS, inkPalette } from "@/lib/pixel";
import { Marquee } from "./Marquee";
import { useOs, type WinId } from "./OsContext";

const TABS: { id: WinId; label: string }[] = [
  { id: "colors", label: "COLORS.EXE" },
  { id: "loop", label: "LOOP.EXE" },
  { id: "treasury", label: "TREASURY.MON" },
  { id: "readme", label: "README.TXT" },
];

type TaskbarProps = {
  treasuryTotal: number;
  burnedTokens: number;
  believers: number;
};

export function Taskbar({
  treasuryTotal,
  burnedTokens,
  believers,
}: TaskbarProps) {
  const {
    open,
    focused,
    toggleWin,
    openWin,
    calm,
    setCalm,
    oneBit,
    setOneBit,
    sound,
    setSound,
    theme,
    toggleTheme,
    goToIntro,
  } = useOs();
  const [clock, setClock] = useState("--:--");
  const [menu, setMenu] = useState(false);
  const palette = inkPalette(theme);
  const menuInk = { K: "currentColor", Y: "currentColor", X: "currentColor" };

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const marqueeItems = [
    `◎ TREASURY ${treasuryTotal.toFixed(2)}`,
    `BURNED ${burnedTokens.toLocaleString()}`,
    `BELIEVERS ${believers.toFixed(2)}`,
    "EVERY CUT COMES HOME",
    "MIDWAY OS v1.0",
  ];

  return (
    <div className="taskbar font-heading text-[11px]">
      <div className="relative">
        <button
          type="button"
          className="bevel-btn bevel-btn-hot flex items-center gap-1.5 px-3 py-1 text-[11px]"
          onClick={() => setMenu((m) => !m)}
        >
          <PixelIcon
            grid={[...GLYPHS.arrow]}
            palette={{ K: "currentColor" }}
            px={2}
            style={{ width: 10, height: 10 }}
          />
          MIDWAY
        </button>
        {menu && (
          <div className="absolute bottom-10 left-0 z-[120] min-w-[200px] bevel hard-shadow bg-panel p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
                onClick={() => {
                  openWin(t.id);
                  setMenu(false);
                }}
              >
                {t.label}
              </button>
            ))}
            <hr className="my-1 border-line" />
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
              onClick={() => {
                goToIntro();
                setMenu(false);
              }}
            >
              <PixelIcon
                className="menu-check"
                grid={[...GLYPHS.play]}
                palette={menuInk}
                px={2}
              />
              REPLAY INTRO
            </button>
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
              onClick={() => {
                toggleTheme();
                setMenu(false);
              }}
            >
              <PixelIcon
                className="menu-check"
                grid={[...(theme === "light" ? GLYPHS.moon : GLYPHS.sun)]}
                palette={menuInk}
                px={2}
              />
              {theme === "light" ? "DARK MODE" : "LIGHT MODE"}
            </button>
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
              onClick={() => {
                setCalm(!calm);
                setMenu(false);
              }}
            >
              <PixelIcon
                className="menu-check"
                grid={[...(calm ? GLYPHS.boxOn : GLYPHS.box)]}
                palette={menuInk}
                px={2}
              />
              CALM MODE
            </button>
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
              onClick={() => {
                setOneBit(!oneBit);
                setMenu(false);
              }}
            >
              <PixelIcon
                className="menu-check"
                grid={[...(oneBit ? GLYPHS.boxOn : GLYPHS.box)]}
                palette={menuInk}
                px={2}
              />
              1-BIT MODE
            </button>
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
              onClick={() => {
                setSound(!sound);
                setMenu(false);
              }}
            >
              <PixelIcon
                className="menu-check"
                grid={[...(sound ? GLYPHS.boxOn : GLYPHS.box)]}
                palette={menuInk}
                px={2}
              />
              SOUND
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {TABS.filter((t) => open[t.id]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleWin(t.id)}
            className={`bevel-inset px-2 py-1 whitespace-nowrap ${
              focused === t.id ? "bg-ink text-[var(--btn)]" : "bg-chrome text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Marquee items={marqueeItems} />

      <button
        type="button"
        className="bevel-btn flex items-center gap-1 px-2 py-1 text-[10px] whitespace-nowrap"
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        onClick={toggleTheme}
        aria-label="Toggle light/dark mode"
      >
        <PixelIcon
          grid={[...(theme === "light" ? GLYPHS.moon : GLYPHS.sun)]}
          palette={palette}
          px={2}
          style={{ width: 12, height: 12 }}
        />
        <span className="hidden sm:inline">{theme === "light" ? "DARK" : "LIGHT"}</span>
      </button>

      <button
        type="button"
        className="bevel-btn flex items-center gap-1 px-2 py-1 text-[10px] whitespace-nowrap"
        title="Replay tent intro"
        onClick={goToIntro}
        aria-label="Replay intro"
      >
        <PixelIcon
          grid={[...GLYPHS.tentMini]}
          palette={palette}
          px={1}
          style={{ width: 14, height: 14 }}
        />
        <span className="hidden md:inline">INTRO</span>
      </button>

      <button type="button" className="bevel-btn px-2 py-1 text-[10px] whitespace-nowrap">
        CONNECT
      </button>
      <div className="bevel-inset num px-2 py-1 text-amber blink whitespace-nowrap">
        {clock}
      </div>
    </div>
  );
}
