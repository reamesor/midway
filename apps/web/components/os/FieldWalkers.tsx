"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PixelIcon } from "@/lib/pixel";
import type { ColorKey } from "@/lib/colors/engine";
import {
  IDLE_CUBE_CHARS,
  IDLE_CUBE_CHARS_WALK,
  idleCharPalette,
} from "@/lib/idleCubeChars";

export type FieldWalkerSpawn = {
  id: string;
  color: ColorKey;
  /** Start position as % of the idle-desktop stage. */
  x: number;
  y: number;
  size: number;
  /** End of the outbound stroll (%). */
  toX: number;
  toY: number;
  /** Optional cube to walk back into. */
  reenterX?: number;
  reenterY?: number;
  /** Outbound stroll duration (s). */
  duration: number;
  /** How the walker leaves the field. */
  exit: "fade" | "reenter";
};

const WALK_FRAME_MS = 210;
const EMERGE_S = 0.42;
const EXIT_S = 0.55;

function FieldWalkerSprite({
  walker,
  ink,
  reduced,
  onDone,
}: {
  walker: FieldWalkerSpawn;
  ink: string;
  reduced: boolean;
  onDone: (id: string) => void;
}) {
  const [frame, setFrame] = useState(0);
  const doneRef = useRef(false);
  const palette = useMemo(
    () => idleCharPalette(walker.color, ink),
    [walker.color, ink],
  );
  const grid =
    frame === 1
      ? IDLE_CUBE_CHARS_WALK[walker.color]
      : IDLE_CUBE_CHARS[walker.color];

  const dx = walker.toX - walker.x;
  const faceRight = dx >= 0;
  const reenter =
    walker.exit === "reenter" &&
    walker.reenterX != null &&
    walker.reenterY != null;
  const reDx = reenter ? walker.reenterX! - walker.toX : 0;
  const returnFaceRight = reenter ? reDx >= 0 : faceRight;
  const returnDur = reenter ? walker.duration * 0.85 : 0;
  const totalDur =
    EMERGE_S + walker.duration + (reenter ? returnDur + EXIT_S : EXIT_S);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, WALK_FRAME_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (!reduced) return;
    const id = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone(walker.id);
    }, 1600);
    return () => window.clearTimeout(id);
  }, [onDone, reduced, walker.id]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(walker.id);
  };

  if (reduced) {
    return (
      <span
        className="field-walker is-static"
        style={{
          left: `${walker.x}%`,
          top: `${walker.y}%`,
          width: walker.size,
          height: walker.size,
          marginLeft: -walker.size / 2,
          marginTop: -walker.size / 2,
        }}
        aria-hidden
      >
        <PixelIcon
          grid={IDLE_CUBE_CHARS[walker.color]}
          palette={palette}
          px={1}
          style={{ width: "100%", height: "100%" }}
        />
      </span>
    );
  }

  const emergeT = EMERGE_S / totalDur;
  const strollT = (EMERGE_S + walker.duration) / totalDur;
  const returnT = (EMERGE_S + walker.duration + returnDur) / totalDur;

  const keyframes = reenter
    ? {
        left: [
          `${walker.x}%`,
          `${walker.x}%`,
          `${walker.toX}%`,
          `${walker.reenterX}%`,
          `${walker.reenterX}%`,
        ],
        top: [
          `${walker.y}%`,
          `${walker.y}%`,
          `${walker.toY}%`,
          `${walker.reenterY}%`,
          `${walker.reenterY}%`,
        ],
        opacity: [0, 1, 1, 1, 0],
        scale: [0.35, 1.08, 1, 0.92, 0.28],
        times: [0, emergeT, strollT, returnT, 1],
      }
    : {
        left: [`${walker.x}%`, `${walker.x}%`, `${walker.toX}%`, `${walker.toX}%`],
        top: [`${walker.y}%`, `${walker.y}%`, `${walker.toY}%`, `${walker.toY}%`],
        opacity: [0, 1, 1, 0],
        scale: [0.35, 1.08, 1, 0.4],
        times: [0, emergeT, strollT, 1],
      };

  return (
    <motion.span
      className="field-walker"
      style={{
        width: walker.size,
        height: walker.size,
        marginLeft: -walker.size / 2,
        marginTop: -walker.size / 2,
      }}
      initial={{
        left: `${walker.x}%`,
        top: `${walker.y}%`,
        opacity: 0,
        scale: 0.35,
      }}
      animate={keyframes}
      transition={{
        duration: totalDur,
        ease: "easeInOut",
        times: keyframes.times,
      }}
      onAnimationComplete={finish}
      aria-hidden
    >
      <motion.span
        className="field-walker-face"
        initial={{ scaleX: faceRight ? 1 : -1 }}
        animate={
          reenter
            ? {
                scaleX: [
                  faceRight ? 1 : -1,
                  faceRight ? 1 : -1,
                  returnFaceRight ? 1 : -1,
                ],
              }
            : { scaleX: faceRight ? 1 : -1 }
        }
        transition={
          reenter
            ? {
                duration: totalDur,
                ease: "linear",
                times: [0, strollT, 1],
              }
            : { duration: 0 }
        }
      >
        <PixelIcon
          grid={grid}
          palette={palette}
          px={1}
          className="field-walker-icon"
          style={{ width: "100%", height: "100%" }}
        />
      </motion.span>
    </motion.span>
  );
}

/** Colors mascots that emerge from idle cubes and stroll the empty field. */
export function FieldWalkers({
  walkers,
  ink,
  reduced,
  onDone,
}: {
  walkers: FieldWalkerSpawn[];
  ink: string;
  reduced: boolean;
  onDone: (id: string) => void;
}) {
  if (walkers.length === 0) return null;

  return (
    <div className="field-walkers" aria-hidden>
      {walkers.map((w) => (
        <FieldWalkerSprite
          key={w.id}
          walker={w}
          ink={ink}
          reduced={reduced}
          onDone={onDone}
        />
      ))}
    </div>
  );
}

/** Pick a calm stroll destination away from the tent brand. */
export function planFieldWalk(
  fromX: number,
  fromY: number,
  cubeHomes: { x: number; y: number }[],
): Pick<
  FieldWalkerSpawn,
  "toX" | "toY" | "reenterX" | "reenterY" | "duration" | "exit"
> {
  const brandPad = (x: number, y: number) =>
    x > 38 && x < 62 && y > 28 && y < 62;

  const dirX = fromX < 50 ? 1 : -1;
  const cross = Math.random() > 0.45;
  const signX = cross ? -dirX : dirX;
  const signY =
    fromY < 45 ? 1 : fromY > 70 ? -1 : Math.random() > 0.5 ? 1 : -1;
  const distX = 11 + Math.random() * 12;
  const distY = 4 + Math.random() * 9;

  let toX = Math.min(96, Math.max(4, fromX + signX * distX));
  let toY = Math.min(92, Math.max(6, fromY + signY * distY));
  if (brandPad(toX, toY)) {
    toY = fromY < 50 ? Math.max(8, fromY - 14) : Math.min(90, fromY + 14);
    toX = Math.min(96, Math.max(4, fromX + signX * (distX + 4)));
  }

  const wantReenter = Math.random() > 0.42 && cubeHomes.length > 0;
  if (wantReenter) {
    const candidates = cubeHomes
      .map((c) => ({
        ...c,
        d: Math.hypot(c.x - toX, c.y - toY),
      }))
      .filter((c) => c.d > 10 && c.d < 48 && !brandPad(c.x, c.y))
      .sort((a, b) => a.d - b.d);
    const home =
      candidates[Math.floor(Math.random() * Math.min(4, candidates.length))];
    if (home) {
      return {
        toX,
        toY,
        reenterX: home.x,
        reenterY: home.y,
        duration: 3.6 + Math.random() * 2.2,
        exit: "reenter",
      };
    }
  }

  return {
    toX,
    toY,
    duration: 3.2 + Math.random() * 2.4,
    exit: "fade",
  };
}
