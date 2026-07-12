"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { PixelIcon, TENT, P_TENT } from "@/lib/pixel";
import { COLOR_HEX, COLOR_KEYS, type ColorKey } from "@/lib/colors/engine";
import { useOs } from "./OsContext";

type CubeSpec = {
  id: ColorKey;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  rot: number;
  duration: number;
  delay: number;
};

const CUBE_LAYOUT: Omit<CubeSpec, "id">[] = [
  { x: 18, y: 28, size: 52, driftX: 14, driftY: 10, rot: 8, duration: 22, delay: 0 },
  { x: 72, y: 22, size: 44, driftX: -12, driftY: 14, rot: -10, duration: 26, delay: 1.2 },
  { x: 28, y: 68, size: 48, driftX: 16, driftY: -12, rot: 6, duration: 24, delay: 0.6 },
  { x: 78, y: 62, size: 56, driftX: -14, driftY: -10, rot: -7, duration: 28, delay: 2 },
  { x: 48, y: 18, size: 40, driftX: 10, driftY: 16, rot: 12, duration: 20, delay: 1.5 },
  { x: 58, y: 74, size: 46, driftX: -10, driftY: 12, rot: -9, duration: 25, delay: 0.3 },
];

function softHex(hex: string) {
  return `color-mix(in srgb, ${hex} 72%, var(--paper))`;
}

function IdleCube({
  spec,
  reduced,
  pointer,
  attract,
}: {
  spec: CubeSpec;
  reduced: boolean;
  pointer: { x: number; y: number };
  attract: boolean;
}) {
  const [nudge, setNudge] = useState({ x: 0, y: 0, rot: 0 });
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);

  const baseX =
    (reduced ? 0 : (pointer.x - 0.5) * (attract ? 10 : 18) * (spec.x > 50 ? -1 : 1) * 0.35) +
    (attract ? (pointer.x * 100 - spec.x) * 0.08 : 0) +
    nudge.x;
  const baseY =
    (reduced ? 0 : (pointer.y - 0.5) * (attract ? 8 : 14) * (spec.y > 50 ? -1 : 1) * 0.35) +
    (attract ? (pointer.y * 100 - spec.y) * 0.08 : 0) +
    nudge.y;

  const driftTransition: Transition = reduced
    ? { duration: 0 }
    : {
        duration: attract ? spec.duration * 1.85 : spec.duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay: spec.delay,
      };

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (reduced) {
        setFlash(true);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), 420);
        return;
      }
      setNudge({
        x: (Math.random() - 0.5) * 28,
        y: (Math.random() - 0.5) * 28,
        rot: (Math.random() - 0.5) * 18,
      });
      setFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => {
        setNudge({ x: 0, y: 0, rot: 0 });
        setFlash(false);
      }, 700);
    },
    [reduced],
  );

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  return (
    <div
      className="idle-cube-slot"
      style={{ left: `${spec.x}%`, top: `${spec.y}%` }}
    >
      <motion.button
        type="button"
        aria-label={`${spec.id} cube`}
        className="idle-cube"
        style={{
          width: spec.size,
          height: spec.size,
          ["--cube" as string]: softHex(COLOR_HEX[spec.id]),
        }}
        onClick={onClick}
        initial={false}
        animate={
          reduced
            ? {
                x: baseX,
                y: baseY,
                rotate: spec.rot * 0.2 + nudge.rot,
              }
            : {
                x: [baseX, baseX + spec.driftX],
                y: [baseY, baseY + spec.driftY],
                rotate: [spec.rot * 0.35 + nudge.rot, -spec.rot * 0.35 + nudge.rot],
              }
        }
        transition={{
          x: driftTransition,
          y: driftTransition,
          rotate: driftTransition,
        }}
        whileHover={
          reduced
            ? undefined
            : { scale: 1.06, transition: { duration: 0.35, ease: "easeOut" } }
        }
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        <span className={`idle-cube-body${flash ? " is-flash" : ""}`} />
      </motion.button>
    </div>
  );
}

export function IdleDesktop() {
  const { open, theme } = useOs();
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [attract, setAttract] = useState(false);

  const empty = useMemo(() => Object.values(open).every((v) => !v), [open]);

  const cubes = useMemo<CubeSpec[]>(
    () =>
      COLOR_KEYS.map((id, i) => ({
        id,
        ...CUBE_LAYOUT[i]!,
      })),
    [],
  );

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = rootRef.current;
      if (!el || reduced) return;
      const rect = el.getBoundingClientRect();
      setPointer({
        x: (e.clientX - rect.left) / Math.max(1, rect.width),
        y: (e.clientY - rect.top) / Math.max(1, rect.height),
      });
    },
    [reduced],
  );

  const tentPalette =
    theme === "dark"
      ? { K: "#e9e6df", R: "#a9c6a0", W: "#2f5a38", Y: "#c08a2e", D: "#1a241c" }
      : { ...P_TENT };

  return (
    <AnimatePresence>
      {empty ? (
        <motion.div
          key="idle-desktop"
          ref={rootRef}
          className="idle-desktop"
          aria-label="Idle desktop scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.55, ease: "easeOut" }}
          onPointerMove={onMove}
          onPointerEnter={() => setAttract(true)}
          onPointerLeave={() => {
            setAttract(false);
            setPointer({ x: 0.5, y: 0.5 });
          }}
        >
          <div className="idle-desktop-stage pointer-events-none">
            <motion.div
              className="idle-brand"
              animate={{
                x: reduced ? 0 : (pointer.x - 0.5) * -12,
                y: reduced ? 0 : (pointer.y - 0.5) * -8,
              }}
              transition={{ type: "spring", stiffness: 45, damping: 20 }}
            >
              <motion.div
                animate={reduced ? { y: 0 } : { y: [0, -6] }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        duration: 7.5,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      }
                }
              >
                <PixelIcon
                  grid={[...TENT]}
                  palette={tentPalette}
                  px={3}
                  className="idle-brand-tent"
                  style={{ width: 72, height: 72 }}
                />
                <div className="idle-brand-copy">
                  <div className="idle-brand-word">MIDWAY</div>
                  <div className="idle-brand-tag">EVERY CUT COMES HOME</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="idle-cubes">
            {cubes.map((spec) => (
              <IdleCube
                key={spec.id}
                spec={spec}
                reduced={reduced}
                pointer={pointer}
                attract={attract}
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
