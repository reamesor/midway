"use client";

import { useEffect, useState } from "react";
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
  } = useOs();
  const [clock, setClock] = useState("--:--");
  const [menu, setMenu] = useState(false);

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
    `🔥 BURNED ${burnedTokens.toLocaleString()}`,
    `⭐ BELIEVERS ${believers.toFixed(2)}`,
    "EVERY CUT COMES HOME",
    "MIDWAY OS v1.0",
  ];

  return (
    <div className="taskbar font-heading text-[11px]">
      <div className="relative">
        <button
          type="button"
          className="bevel-btn bevel-btn-hot px-3 py-1 text-[11px]"
          onClick={() => setMenu((m) => !m)}
        >
          ▸ MIDWAY
        </button>
        {menu && (
          <div className="absolute bottom-10 left-0 z-[120] min-w-[180px] bevel hard-shadow bg-panel p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-acid hover:text-black"
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
              className="block w-full px-3 py-1.5 text-left hover:bg-acid hover:text-black"
              onClick={() => {
                setCalm(!calm);
                setMenu(false);
              }}
            >
              {calm ? "☑" : "☐"} CALM MODE
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left hover:bg-acid hover:text-black"
              onClick={() => {
                setOneBit(!oneBit);
                setMenu(false);
              }}
            >
              {oneBit ? "☑" : "☐"} 1-BIT MODE
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left hover:bg-acid hover:text-black"
              onClick={() => {
                setSound(!sound);
                setMenu(false);
              }}
            >
              {sound ? "☑" : "☐"} SOUND
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {TABS.filter((t) => open[t.id]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleWin(t.id)}
            className={`bevel-inset px-2 py-1 ${
              focused === t.id ? "bg-acid text-black" : "bg-chrome text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Marquee items={marqueeItems} />

      <button type="button" className="bevel-btn px-2 py-1 text-[10px] whitespace-nowrap">
        CONNECT
      </button>
      <div className="bevel-inset num px-2 py-1 text-amber blink whitespace-nowrap">
        {clock}
      </div>
    </div>
  );
}
