"use client";

import { useEffect, useState } from "react";
import { useOs } from "./OsContext";

export function BootScreen() {
  const { booted, finishBoot, calm } = useOs();
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (booted) return;
    if (calm) {
      finishBoot();
      return;
    }

    const script = [
      "MIDWAY OS v1.0",
      "CHECKING TREASURY BUS … OK",
      "LOADING ATTRACTIONS …",
      "COLORS.EXE FOUND",
      "LOOP.EXE FOUND",
      "TREASURY.MON ONLINE ✓",
      "EVERY CUT COMES HOME",
      "BOOT COMPLETE",
    ];

    let i = 0;
    const lineTimer = setInterval(() => {
      if (i < script.length) {
        setLines((l) => [...l, script[i]!]);
        setProgress(Math.round(((i + 1) / script.length) * 100));
        i++;
      } else {
        clearInterval(lineTimer);
        setTimeout(finishBoot, 350);
      }
    }, 160);

    return () => clearInterval(lineTimer);
  }, [booted, calm, finishBoot]);

  if (booted) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black font-mono text-sm text-win"
      onClick={finishBoot}
    >
      <div className="w-full max-w-lg px-6">
        <pre className="mb-4 whitespace-pre-wrap leading-relaxed">
          {lines.map((l, idx) => (
            <div key={idx}>{`> ${l}`}</div>
          ))}
          <span className="blink">█</span>
        </pre>
        <div className="bevel-inset h-5 w-full bg-black p-0.5">
          <div
            className="h-full bg-acid transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-ink-dim">
          CLICK TO SKIP · MIDWAY BIOS
        </p>
      </div>
    </div>
  );
}
