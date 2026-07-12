"use client";

import { useEffect, useMemo, useState } from "react";
import { PixelIcon } from "@/lib/pixel";
import type { ColorKey } from "@/lib/colors/engine";
import {
  IDLE_CUBE_CHARS,
  IDLE_CUBE_CHARS_WALK,
  idleCharPalette,
} from "@/lib/idleCubeChars";

type WalkerSpec = {
  id: ColorKey;
  path: "left-in-right-out" | "right-in-left-out" | "loop-left" | "loop-right";
  duration: number;
  delay: number;
  /** Pixel size — must fit inside the tent door hole (~9×18 on 72px stage). */
  size: number;
};

const WALKERS: WalkerSpec[] = [
  { id: "blue", path: "left-in-right-out", duration: 12, delay: 0, size: 11 },
  { id: "red", path: "right-in-left-out", duration: 14, delay: 2.4, size: 10 },
  { id: "yellow", path: "loop-left", duration: 16, delay: 5.0, size: 10 },
  { id: "green", path: "loop-right", duration: 13.5, delay: 1.2, size: 10 },
  { id: "pink", path: "left-in-right-out", duration: 15, delay: 7.2, size: 9 },
  { id: "orange", path: "right-in-left-out", duration: 17, delay: 3.6, size: 9 },
];

const WALK_FRAME_MS = 240;

function TentWalker({
  spec,
  ink,
  reduced,
}: {
  spec: WalkerSpec;
  ink: string;
  reduced: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const palette = useMemo(() => idleCharPalette(spec.id, ink), [spec.id, ink]);
  const grid =
    frame === 1 ? IDLE_CUBE_CHARS_WALK[spec.id] : IDLE_CUBE_CHARS[spec.id];

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, WALK_FRAME_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  if (reduced) {
    const staticX = spec.path.includes("right") ? "58%" : "28%";
    return (
      <span
        className="tent-walker is-static"
        style={{ left: staticX, bottom: "2%", width: spec.size, height: spec.size }}
        aria-hidden
      >
        <PixelIcon
          grid={IDLE_CUBE_CHARS[spec.id]}
          palette={palette}
          px={1}
          style={{ width: "100%", height: "100%" }}
        />
      </span>
    );
  }

  return (
    <span
      className={`tent-walker tent-walker--${spec.path}`}
      style={{
        width: spec.size,
        height: spec.size,
        marginLeft: -spec.size / 2,
        animationDuration: `${spec.duration}s`,
        animationDelay: `${spec.delay}s`,
      }}
      aria-hidden
    >
      <PixelIcon
        grid={grid}
        palette={palette}
        px={1}
        className="tent-walker-icon"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}

/** Colors mascots that walk in/out of the tent doorway (transparent door, solid sill). */
export function TentWalkers({
  ink,
  reduced,
  max = 6,
}: {
  ink: string;
  reduced: boolean;
  max?: number;
}) {
  const list = useMemo(
    () => (reduced ? WALKERS.slice(0, 2) : WALKERS.slice(0, max)),
    [max, reduced],
  );

  return (
    <div className="tent-walkers" aria-hidden>
      {list.map((spec) => (
        <TentWalker key={spec.id} spec={spec} ink={ink} reduced={reduced} />
      ))}
    </div>
  );
}
