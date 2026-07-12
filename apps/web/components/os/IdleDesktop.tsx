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
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { PixelIcon, TENT, P_TENT } from "@/lib/pixel";
import { COLOR_HEX, COLOR_KEYS, type ColorKey } from "@/lib/colors/engine";
import {
  IDLE_CHAR_MOTION,
  IDLE_CUBE_CHARS,
  IDLE_CUBE_CHARS_WALK,
  dieFaceColors,
  idleCharPalette,
} from "@/lib/idleCubeChars";
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

type CubePhase = "idle" | "rolling" | "character" | "returning";

const CUBE_LAYOUT: Omit<CubeSpec, "id">[] = [
  { x: 18, y: 28, size: 52, driftX: 14, driftY: 10, rot: 8, duration: 22, delay: 0 },
  { x: 72, y: 22, size: 44, driftX: -12, driftY: 14, rot: -10, duration: 26, delay: 1.2 },
  { x: 28, y: 68, size: 48, driftX: 16, driftY: -12, rot: 6, duration: 24, delay: 0.6 },
  { x: 78, y: 62, size: 56, driftX: -14, driftY: -10, rot: -7, duration: 28, delay: 2 },
  { x: 48, y: 18, size: 40, driftX: 10, driftY: 16, rot: 12, duration: 20, delay: 1.5 },
  { x: 58, y: 74, size: 46, driftX: -10, driftY: 12, rot: -9, duration: 25, delay: 0.3 },
];

const FACE_NAMES = ["px", "nx", "py", "ny", "pz", "nz"] as const;
const ROLL_MS = 720;
const RETURN_MS = 520;
const CHAR_HOLD_MS = 3200;
const CYCLE_GAP_MS = 4200;
const WALK_FRAME_MS = 220;

function softHex(hex: string) {
  return `color-mix(in srgb, ${hex} 72%, var(--paper))`;
}

function IdleCube({
  spec,
  reduced,
  pointer,
  attract,
  ink,
  forcedShow,
  onCycleDone,
}: {
  spec: CubeSpec;
  reduced: boolean;
  pointer: { x: number; y: number };
  attract: boolean;
  ink: string;
  forcedShow: boolean;
  onCycleDone?: () => void;
}) {
  const [nudge, setNudge] = useState({ x: 0, y: 0, rot: 0 });
  const [flash, setFlash] = useState(false);
  const [phase, setPhase] = useState<CubePhase>("idle");
  const [walkFrame, setWalkFrame] = useState(0);
  const flashTimer = useRef<number | null>(null);
  const phaseTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const hovered = useRef(false);
  const cycleActive = useRef(false);

  const faces = useMemo(() => dieFaceColors(spec.id), [spec.id]);
  const charPalette = useMemo(() => idleCharPalette(spec.id, ink), [spec.id, ink]);
  const motionStyle = IDLE_CHAR_MOTION[spec.id];
  const half = spec.size / 2;
  const usesWalkFrames =
    motionStyle === "walk" || motionStyle === "strut" || motionStyle === "bounce";

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimer.current) {
      window.clearTimeout(phaseTimer.current);
      phaseTimer.current = null;
    }
  }, []);

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

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

  const finishReturn = useCallback(() => {
    if (!hovered.current) {
      setPhase("idle");
      setWalkFrame(0);
      if (cycleActive.current) {
        cycleActive.current = false;
        onCycleDone?.();
      }
    }
  }, [onCycleDone]);

  const startReturn = useCallback(() => {
    clearPhaseTimer();
    clearHoldTimer();
    if (reduced) {
      setPhase("idle");
      setWalkFrame(0);
      if (cycleActive.current) {
        cycleActive.current = false;
        onCycleDone?.();
      }
      return;
    }
    setPhase((prev) => (prev === "idle" ? "idle" : "returning"));
    phaseTimer.current = window.setTimeout(finishReturn, RETURN_MS);
  }, [clearHoldTimer, clearPhaseTimer, finishReturn, onCycleDone, reduced]);

  const enterCharacter = useCallback(
    (fromCycle: boolean) => {
      clearPhaseTimer();
      clearHoldTimer();
      if (fromCycle) cycleActive.current = true;

      if (reduced) {
        setPhase("character");
        if (fromCycle && !hovered.current) {
          holdTimer.current = window.setTimeout(() => {
            if (!hovered.current) startReturn();
          }, CHAR_HOLD_MS);
        }
        return;
      }

      setPhase("rolling");
      phaseTimer.current = window.setTimeout(() => {
        if (hovered.current || cycleActive.current) {
          setPhase("character");
          if (fromCycle && !hovered.current) {
            holdTimer.current = window.setTimeout(() => {
              if (!hovered.current) startReturn();
            }, CHAR_HOLD_MS);
          }
        }
      }, ROLL_MS);
    },
    [clearHoldTimer, clearPhaseTimer, reduced, startReturn],
  );

  const enterHover = useCallback(() => {
    hovered.current = true;
    clearHoldTimer();
    if (phase === "character" || phase === "rolling") return;
    enterCharacter(false);
  }, [clearHoldTimer, enterCharacter, phase]);

  const leaveHover = useCallback(() => {
    hovered.current = false;
    if (cycleActive.current && phase === "character") {
      holdTimer.current = window.setTimeout(() => {
        if (!hovered.current) startReturn();
      }, Math.min(900, CHAR_HOLD_MS));
      return;
    }
    startReturn();
  }, [phase, startReturn]);

  useEffect(() => {
    if (!forcedShow || hovered.current) return;
    if (phase !== "idle") return;
    enterCharacter(true);
  }, [enterCharacter, forcedShow, phase]);

  useEffect(() => {
    if (phase !== "character" || reduced || !usesWalkFrames) {
      setWalkFrame(0);
      return;
    }
    const id = window.setInterval(() => {
      setWalkFrame((f) => (f === 0 ? 1 : 0));
    }, WALK_FRAME_MS);
    return () => window.clearInterval(id);
  }, [phase, reduced, usesWalkFrames]);

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
      clearPhaseTimer();
      clearHoldTimer();
    };
  }, [clearHoldTimer, clearPhaseTimer]);

  const showCharacter = phase === "character";
  const isRolling = phase === "rolling";
  const isReturning = phase === "returning";
  const dieActive = !reduced && (isRolling || showCharacter);
  const charGrid =
    showCharacter && walkFrame === 1
      ? IDLE_CUBE_CHARS_WALK[spec.id]
      : IDLE_CUBE_CHARS[spec.id];

  return (
    <div
      className="idle-cube-slot"
      style={{ left: `${spec.x}%`, top: `${spec.y}%` }}
    >
      <motion.button
        type="button"
        aria-label={`${spec.id} cube`}
        className={`idle-cube${flash ? " is-flash" : ""}${phase !== "idle" ? ` is-${phase}` : ""}`}
        style={{
          width: spec.size,
          height: spec.size,
          ["--cube" as string]: softHex(COLOR_HEX[spec.id]),
          ["--cube-size" as string]: `${spec.size}px`,
          ["--cube-half" as string]: `${half}px`,
        }}
        onClick={onClick}
        onPointerEnter={enterHover}
        onPointerLeave={leaveHover}
        initial={false}
        animate={
          reduced
            ? {
                x: baseX,
                y: baseY,
                rotate: spec.rot * 0.2 + nudge.rot,
                scale: phase === "character" ? 1.08 : 1,
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
          scale: { duration: 0.28, ease: "easeOut" },
        }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        <span className="idle-cube-scene" aria-hidden>
          <span
            className={`idle-die idle-die--${spec.id}${isRolling ? " is-rolling" : ""}${isReturning ? " is-returning" : ""}${showCharacter ? " is-morphed" : ""}`}
          >
            {FACE_NAMES.map((name, i) => (
              <span
                key={name}
                className={`idle-die-face idle-die-face--${name}`}
                style={{
                  ["--face" as string]: softHex(COLOR_HEX[faces[i]!]),
                }}
              />
            ))}
          </span>

          <span
            className={`idle-cube-char idle-cube-char--${motionStyle}${showCharacter ? " is-visible" : ""}${dieActive && isRolling ? " is-waiting" : ""}`}
          >
            <PixelIcon
              grid={charGrid}
              palette={charPalette}
              px={2}
              className="idle-cube-char-icon"
              style={{ width: spec.size * 0.92, height: spec.size * 0.92 }}
            />
          </span>
        </span>
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
  const [cycleId, setCycleId] = useState<ColorKey | null>(null);
  const cycleIndex = useRef(0);

  const empty = useMemo(() => Object.values(open).every((v) => !v), [open]);

  // Hard stop: never keep idle cubes mounted under any open window.
  useEffect(() => {
    if (empty) return;
    setCycleId(null);
    setAttract(false);
    setPointer({ x: 0.5, y: 0.5 });
  }, [empty]);

  const cubes = useMemo<CubeSpec[]>(
    () =>
      COLOR_KEYS.map((id, i) => ({
        id,
        ...CUBE_LAYOUT[i]!,
      })),
    [],
  );

  const ink = theme === "dark" ? "#e9e6df" : "#2f5a38";

  const onCycleDone = useCallback(() => {
    setCycleId(null);
  }, []);

  useEffect(() => {
    if (!empty || reduced) {
      setCycleId(null);
      return;
    }
    const tick = () => {
      setCycleId((current) => {
        if (current) return current;
        const next = COLOR_KEYS[cycleIndex.current % COLOR_KEYS.length]!;
        cycleIndex.current += 1;
        return next;
      });
    };
    const id = window.setInterval(tick, CYCLE_GAP_MS);
    const kick = window.setTimeout(tick, 1800);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(kick);
    };
  }, [empty, reduced]);

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

  // Mount only when every OS window is closed — no exit linger under COLORS/dialogs.
  if (!empty) return null;

  return (
        <motion.div
          key="idle-desktop"
          ref={rootRef}
          className="idle-desktop"
          aria-label="Idle desktop scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.12 : 0.35, ease: "easeOut" }}
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
                ink={ink}
                forcedShow={cycleId === spec.id}
                onCycleDone={onCycleDone}
              />
            ))}
          </div>
        </motion.div>
  );
}
