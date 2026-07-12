"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { PixelIcon, TENT, P_TENT } from "@/lib/pixel";
import { COLOR_HEX, type ColorKey } from "@/lib/colors/engine";
import {
  IDLE_CHAR_MOTION,
  IDLE_CUBE_CHARS,
  IDLE_CUBE_CHARS_WALK,
  dieFaceColors,
  idleCharPalette,
} from "@/lib/idleCubeChars";
import { TentWalkers } from "./TentWalkers";
import { useOs } from "./OsContext";

type CubeBehavior = "drift" | "roller";

type CubeSpec = {
  id: string;
  color: ColorKey;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  rot: number;
  duration: number;
  delay: number;
  behavior: CubeBehavior;
  /** Stagger offset (ms) before first autonomous tumble for rollers. */
  rollEvery: number;
  rollOffset: number;
};

type CubePhase = "idle" | "rolling" | "character" | "returning";

/** Calm scatter around center tent — no overlap with brand mark. */
const CUBE_LAYOUT: CubeSpec[] = [
  { id: "c0", color: "blue", x: 12, y: 30, size: 48, driftX: 10, driftY: 8, rot: 7, duration: 24, delay: 0, behavior: "roller", rollEvery: 11000, rollOffset: 1800 },
  { id: "c1", color: "yellow", x: 50, y: 12, size: 38, driftX: 8, driftY: 12, rot: 11, duration: 21, delay: 1.1, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c2", color: "orange", x: 86, y: 26, size: 44, driftX: -10, driftY: 10, rot: -9, duration: 26, delay: 0.8, behavior: "roller", rollEvery: 13000, rollOffset: 4200 },
  { id: "c3", color: "green", x: 18, y: 58, size: 42, driftX: 12, driftY: -8, rot: 5, duration: 23, delay: 1.6, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c4", color: "pink", x: 84, y: 54, size: 50, driftX: -12, driftY: -9, rot: -6, duration: 27, delay: 0.4, behavior: "roller", rollEvery: 14500, rollOffset: 2600 },
  { id: "c5", color: "red", x: 34, y: 82, size: 46, driftX: 9, driftY: -10, rot: 8, duration: 25, delay: 2.0, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c6", color: "yellow", x: 68, y: 80, size: 40, driftX: -8, driftY: 9, rot: -10, duration: 22, delay: 1.3, behavior: "roller", rollEvery: 12000, rollOffset: 6500 },
  { id: "c7", color: "green", x: 72, y: 16, size: 36, driftX: -7, driftY: 11, rot: 9, duration: 20, delay: 2.4, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c8", color: "blue", x: 28, y: 16, size: 34, driftX: 7, driftY: 10, rot: -8, duration: 28, delay: 0.2, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c9", color: "orange", x: 10, y: 74, size: 40, driftX: 11, driftY: -7, rot: 6, duration: 24, delay: 1.9, behavior: "roller", rollEvery: 15500, rollOffset: 8000 },
  { id: "c10", color: "pink", x: 90, y: 72, size: 38, driftX: -9, driftY: -8, rot: -7, duration: 23, delay: 0.7, behavior: "drift", rollEvery: 0, rollOffset: 0 },
  { id: "c11", color: "red", x: 54, y: 88, size: 42, driftX: -6, driftY: 7, rot: 10, duration: 26, delay: 2.8, behavior: "roller", rollEvery: 16000, rollOffset: 10000 },
];

const FACE_NAMES = ["px", "nx", "py", "ny", "pz", "nz"] as const;
const ROLL_MS = 720;
const TUMBLE_MS = 1050;
const RETURN_MS = 520;
const CHAR_HOLD_MS = 3200;
const CYCLE_GAP_MS = 5600;
const WALK_FRAME_MS = 220;

function softHex(hex: string) {
  return `color-mix(in srgb, ${hex} 72%, var(--paper))`;
}

function IdleCube({
  spec,
  reduced,
  ink,
  forcedShow,
  onCycleDone,
}: {
  spec: CubeSpec;
  reduced: boolean;
  ink: string;
  forcedShow: boolean;
  onCycleDone?: () => void;
}) {
  const [nudge, setNudge] = useState({ x: 0, y: 0, rot: 0 });
  const [flash, setFlash] = useState(false);
  const [phase, setPhase] = useState<CubePhase>("idle");
  const [walkFrame, setWalkFrame] = useState(0);
  const [tumbleSlow, setTumbleSlow] = useState(false);
  const flashTimer = useRef<number | null>(null);
  const phaseTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const tumbleTimer = useRef<number | null>(null);
  const hovered = useRef(false);
  const cycleActive = useRef(false);
  const phaseRef = useRef<CubePhase>("idle");

  const faces = useMemo(() => dieFaceColors(spec.color), [spec.color]);
  const charPalette = useMemo(
    () => idleCharPalette(spec.color, ink),
    [spec.color, ink],
  );
  const motionStyle = IDLE_CHAR_MOTION[spec.color];
  const half = spec.size / 2;
  const usesWalkFrames =
    motionStyle === "walk" || motionStyle === "strut" || motionStyle === "bounce";

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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

  const clearTumbleTimer = useCallback(() => {
    if (tumbleTimer.current) {
      window.clearTimeout(tumbleTimer.current);
      tumbleTimer.current = null;
    }
  }, []);

  const driftTransition: Transition = reduced
    ? { duration: 0 }
    : {
        duration: spec.duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay: spec.delay,
      };

  const finishReturn = useCallback(() => {
    if (!hovered.current) {
      setPhase("idle");
      setWalkFrame(0);
      setTumbleSlow(false);
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
      setTumbleSlow(false);
      if (cycleActive.current) {
        cycleActive.current = false;
        onCycleDone?.();
      }
      return;
    }
    setPhase((prev) => (prev === "idle" ? "idle" : "returning"));
    phaseTimer.current = window.setTimeout(finishReturn, RETURN_MS);
  }, [clearHoldTimer, clearPhaseTimer, finishReturn, onCycleDone, reduced]);

  /** Autonomous Colors-style tumble that settles back as a die (no character). */
  const startTumble = useCallback(() => {
    if (reduced) return;
    if (hovered.current || cycleActive.current) return;
    if (phaseRef.current !== "idle") return;

    clearPhaseTimer();
    clearHoldTimer();
    setTumbleSlow(true);
    setPhase("rolling");
    phaseTimer.current = window.setTimeout(() => {
      if (hovered.current || cycleActive.current) return;
      setPhase("returning");
      phaseTimer.current = window.setTimeout(finishReturn, RETURN_MS);
    }, TUMBLE_MS);
  }, [clearHoldTimer, clearPhaseTimer, finishReturn, reduced]);

  const enterCharacter = useCallback(
    (fromCycle: boolean) => {
      clearPhaseTimer();
      clearHoldTimer();
      setTumbleSlow(false);
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
    if (phaseRef.current === "character") return;
    // Autonomous tumble in progress — convert into a proper morph roll.
    if (phaseRef.current === "rolling" && cycleActive.current) return;
    enterCharacter(false);
  }, [clearHoldTimer, enterCharacter]);

  const leaveHover = useCallback(() => {
    hovered.current = false;
    if (cycleActive.current && phaseRef.current === "character") {
      holdTimer.current = window.setTimeout(() => {
        if (!hovered.current) startReturn();
      }, Math.min(900, CHAR_HOLD_MS));
      return;
    }
    startReturn();
  }, [startReturn]);

  useEffect(() => {
    if (!forcedShow || hovered.current) return;
    if (phaseRef.current !== "idle") return;
    enterCharacter(true);
  }, [enterCharacter, forcedShow]);

  /* Autonomous staggered rolls for roller cubes — never cursor-driven. */
  useEffect(() => {
    if (reduced || spec.behavior !== "roller" || !spec.rollEvery) {
      clearTumbleTimer();
      return;
    }

    let cancelled = false;
    const schedule = (ms: number) => {
      clearTumbleTimer();
      tumbleTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        startTumble();
        schedule(spec.rollEvery);
      }, ms);
    };
    schedule(spec.rollOffset || spec.rollEvery);
    return () => {
      cancelled = true;
      clearTumbleTimer();
    };
  }, [
    clearTumbleTimer,
    reduced,
    spec.behavior,
    spec.rollEvery,
    spec.rollOffset,
    startTumble,
  ]);

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
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 16,
        rot: (Math.random() - 0.5) * 12,
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
      clearTumbleTimer();
    };
  }, [clearHoldTimer, clearPhaseTimer, clearTumbleTimer]);

  const showCharacter = phase === "character";
  const isRolling = phase === "rolling";
  const isReturning = phase === "returning";
  const dieActive = !reduced && (isRolling || showCharacter);
  const charGrid =
    showCharacter && walkFrame === 1
      ? IDLE_CUBE_CHARS_WALK[spec.color]
      : IDLE_CUBE_CHARS[spec.color];

  return (
    <div
      className="idle-cube-slot"
      style={{ left: `${spec.x}%`, top: `${spec.y}%` }}
    >
      <motion.button
        type="button"
        aria-label="Decorative cube"
        className={`idle-cube${flash ? " is-flash" : ""}${phase !== "idle" ? ` is-${phase}` : ""}`}
        style={{
          width: spec.size,
          height: spec.size,
          ["--cube" as string]: softHex(COLOR_HEX[spec.color]),
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
                x: nudge.x,
                y: nudge.y,
                rotate: spec.rot * 0.2 + nudge.rot,
                scale: phase === "character" ? 1.08 : 1,
              }
            : {
                x: [nudge.x, nudge.x + spec.driftX],
                y: [nudge.y, nudge.y + spec.driftY],
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
            className={`idle-die idle-die--${spec.color}${isRolling ? " is-rolling" : ""}${tumbleSlow && isRolling ? " is-rolling-slow" : ""}${isReturning ? " is-returning" : ""}${showCharacter ? " is-morphed" : ""}`}
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
  const [cycleId, setCycleId] = useState<string | null>(null);
  const cycleIndex = useRef(0);

  const empty = useMemo(() => Object.values(open).every((v) => !v), [open]);

  useEffect(() => {
    if (empty) return;
    setCycleId(null);
  }, [empty]);

  const cubes = useMemo(() => CUBE_LAYOUT, []);
  const morphCycleIds = useMemo(
    () => cubes.filter((c) => c.behavior === "drift").map((c) => c.id),
    [cubes],
  );

  const ink = theme === "dark" ? "#e9e6df" : "#2f5a38";

  const onCycleDone = useCallback(() => {
    setCycleId(null);
  }, []);

  useEffect(() => {
    if (!empty || reduced || morphCycleIds.length === 0) {
      setCycleId(null);
      return;
    }
    const tick = () => {
      setCycleId((current) => {
        if (current) return current;
        const next = morphCycleIds[cycleIndex.current % morphCycleIds.length]!;
        cycleIndex.current += 1;
        return next;
      });
    };
    const id = window.setInterval(tick, CYCLE_GAP_MS);
    const kick = window.setTimeout(tick, 2400);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(kick);
    };
  }, [empty, morphCycleIds, reduced]);

  const tentPalette =
    theme === "dark"
      ? { K: "#e9e6df", R: "#a9c6a0", W: "#2f5a38", Y: "#c08a2e", D: "#1a241c" }
      : { ...P_TENT };

  // Mount only when every OS window is closed — no exit linger under COLORS/dialogs.
  if (!empty) return null;

  return (
    <motion.div
      key="idle-desktop"
      className="idle-desktop"
      aria-label="Idle desktop scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.12 : 0.35, ease: "easeOut" }}
    >
      <div className="idle-desktop-stage pointer-events-none">
        <div className="idle-brand">
          <motion.div
            animate={reduced ? { y: 0 } : { y: [0, -5] }}
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
            <div className="idle-tent-stage">
              <TentWalkers ink={ink} reduced={reduced} />
              <PixelIcon
                grid={[...TENT]}
                palette={{ ...tentPalette, D: "" }}
                px={3}
                className="idle-brand-tent"
                style={{ width: 72, height: 72 }}
              />
            </div>
            <div className="idle-brand-copy">
              <div className="idle-brand-word">MIDWAY</div>
              <div className="idle-brand-tag">EVERY CUT COMES HOME</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="idle-cubes">
        {cubes.map((spec) => (
          <IdleCube
            key={spec.id}
            spec={spec}
            reduced={reduced}
            ink={ink}
            forcedShow={cycleId === spec.id}
            onCycleDone={onCycleDone}
          />
        ))}
      </div>
    </motion.div>
  );
}
