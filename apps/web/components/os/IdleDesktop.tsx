"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
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

type CubeBehavior = "drift" | "wobbler";
type DepthLayer = "near" | "mid" | "far";

/** idle → egg shake → crack/pop → character hop → ease back to cube */
type CubePhase =
  | "idle"
  | "shaking"
  | "hatching"
  | "character"
  | "returning";

type CubeSpec = {
  id: string;
  color: ColorKey;
  x: number;
  y: number;
  size: number;
  /** Primary lateral drift amplitude (px). */
  driftX: number;
  /** Primary vertical drift amplitude (px). */
  driftY: number;
  /** Soft tumble amplitude (deg). */
  rot: number;
  /** Base float cycle length (s). */
  duration: number;
  delay: number;
  behavior: CubeBehavior;
  /** Soft egg-wobble cadence for ambiance (ms). */
  wobbleEvery: number;
  wobbleOffset: number;
  depth: DepthLayer;
  opacity: number;
};

/**
 * Space field around the tent brand — 34 cubes in near/mid/far layers.
 * Clear of MIDWAY mark (~40–60% × 32–58%). Depth via size + opacity + z-index.
 * Drift amplitudes are large enough to read as floating at a glance.
 */
const CUBE_LAYOUT: CubeSpec[] = [
  /* ── Near — larger, opaque, heavy float ── */
  { id: "c0", color: "blue", x: 8, y: 28, size: 52, driftX: 42, driftY: 34, rot: 20, duration: 11, delay: 0, behavior: "wobbler", wobbleEvery: 14000, wobbleOffset: 1600, depth: "near", opacity: 1 },
  { id: "c1", color: "pink", x: 92, y: 26, size: 50, driftX: -40, driftY: 32, rot: -18, duration: 12.5, delay: 0.4, behavior: "wobbler", wobbleEvery: 12500, wobbleOffset: 5200, depth: "near", opacity: 0.98 },
  { id: "c2", color: "orange", x: 94, y: 72, size: 48, driftX: -38, driftY: -34, rot: 19, duration: 10.5, delay: 1.1, behavior: "wobbler", wobbleEvery: 16000, wobbleOffset: 2400, depth: "near", opacity: 1 },
  { id: "c3", color: "green", x: 6, y: 74, size: 50, driftX: 40, driftY: -30, rot: -20, duration: 11.5, delay: 0.7, behavior: "wobbler", wobbleEvery: 14800, wobbleOffset: 9000, depth: "near", opacity: 0.97 },
  { id: "c4", color: "red", x: 50, y: 6, size: 46, driftX: 34, driftY: 38, rot: 16, duration: 9.5, delay: 1.6, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "near", opacity: 0.96 },
  { id: "c5", color: "yellow", x: 50, y: 94, size: 48, driftX: -36, driftY: -28, rot: -17, duration: 12, delay: 2.0, behavior: "wobbler", wobbleEvery: 13500, wobbleOffset: 7000, depth: "near", opacity: 1 },
  { id: "c6", color: "blue", x: 16, y: 50, size: 44, driftX: 36, driftY: 26, rot: 15, duration: 10, delay: 0.9, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "near", opacity: 0.95 },
  { id: "c7", color: "orange", x: 84, y: 52, size: 46, driftX: -38, driftY: -24, rot: -16, duration: 11, delay: 1.4, behavior: "wobbler", wobbleEvery: 17000, wobbleOffset: 11000, depth: "near", opacity: 0.98 },
  { id: "c8", color: "pink", x: 30, y: 8, size: 44, driftX: 32, driftY: 36, rot: 18, duration: 10.8, delay: 2.5, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "near", opacity: 0.94 },
  { id: "c9", color: "green", x: 70, y: 92, size: 44, driftX: -34, driftY: -32, rot: -15, duration: 11.2, delay: 0.2, behavior: "wobbler", wobbleEvery: 15500, wobbleOffset: 3800, depth: "near", opacity: 0.95 },

  /* ── Mid — readable ring + fillers ── */
  { id: "c10", color: "yellow", x: 24, y: 16, size: 36, driftX: 38, driftY: 40, rot: 22, duration: 9, delay: 0.5, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.86 },
  { id: "c11", color: "green", x: 76, y: 16, size: 34, driftX: -36, driftY: 38, rot: -20, duration: 8.5, delay: 1.8, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.84 },
  { id: "c12", color: "red", x: 96, y: 48, size: 38, driftX: -44, driftY: 28, rot: 18, duration: 9.8, delay: 1.2, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.88 },
  { id: "c13", color: "pink", x: 72, y: 84, size: 36, driftX: -32, driftY: -38, rot: 20, duration: 9.2, delay: 2.3, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.85 },
  { id: "c14", color: "blue", x: 28, y: 84, size: 38, driftX: 36, driftY: -34, rot: -17, duration: 10.2, delay: 0.3, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.87 },
  { id: "c15", color: "orange", x: 4, y: 48, size: 36, driftX: 42, driftY: 24, rot: 16, duration: 10.6, delay: 2.6, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.86 },
  { id: "c16", color: "yellow", x: 20, y: 40, size: 32, driftX: 34, driftY: 28, rot: -14, duration: 9.4, delay: 1.5, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.8 },
  { id: "c17", color: "pink", x: 80, y: 38, size: 34, driftX: -36, driftY: 30, rot: 17, duration: 8.8, delay: 0.8, behavior: "wobbler", wobbleEvery: 15200, wobbleOffset: 4500, depth: "mid", opacity: 0.82 },
  { id: "c18", color: "green", x: 36, y: 20, size: 30, driftX: 30, driftY: 36, rot: 19, duration: 8.2, delay: 2.1, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.78 },
  { id: "c19", color: "red", x: 64, y: 20, size: 32, driftX: -28, driftY: 38, rot: -16, duration: 9.6, delay: 1.0, behavior: "wobbler", wobbleEvery: 14200, wobbleOffset: 6000, depth: "mid", opacity: 0.8 },
  { id: "c20", color: "blue", x: 12, y: 62, size: 34, driftX: 40, driftY: -22, rot: 15, duration: 9.1, delay: 1.7, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.83 },
  { id: "c21", color: "orange", x: 88, y: 64, size: 32, driftX: -38, driftY: -26, rot: -18, duration: 8.7, delay: 2.8, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "mid", opacity: 0.81 },

  /* ── Far — tiny, faded field dust (larger travel so motion still reads) ── */
  { id: "c22", color: "blue", x: 14, y: 10, size: 24, driftX: 48, driftY: 42, rot: 26, duration: 14, delay: 0.2, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.55 },
  { id: "c23", color: "yellow", x: 38, y: 3, size: 22, driftX: 40, driftY: 48, rot: -24, duration: 15, delay: 1.9, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.5 },
  { id: "c24", color: "pink", x: 62, y: 4, size: 26, driftX: -44, driftY: 46, rot: 22, duration: 13.5, delay: 0.6, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.58 },
  { id: "c25", color: "green", x: 88, y: 12, size: 22, driftX: -46, driftY: 40, rot: -25, duration: 14.5, delay: 2.4, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.52 },
  { id: "c26", color: "orange", x: 98, y: 58, size: 24, driftX: -50, driftY: -36, rot: 21, duration: 13.8, delay: 1.3, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.56 },
  { id: "c27", color: "red", x: 86, y: 90, size: 26, driftX: -40, driftY: -44, rot: -23, duration: 15.5, delay: 0.1, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.52 },
  { id: "c28", color: "blue", x: 12, y: 90, size: 22, driftX: 44, driftY: -46, rot: 24, duration: 14.2, delay: 2.8, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.5 },
  { id: "c29", color: "yellow", x: 2, y: 36, size: 24, driftX: 46, driftY: 32, rot: -22, duration: 13, delay: 1.7, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.54 },
  { id: "c30", color: "pink", x: 44, y: 96, size: 20, driftX: 36, driftY: -40, rot: 20, duration: 14.8, delay: 0.9, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.48 },
  { id: "c31", color: "green", x: 56, y: 2, size: 20, driftX: -34, driftY: 44, rot: -19, duration: 15.2, delay: 2.2, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.5 },
  { id: "c32", color: "red", x: 2, y: 58, size: 22, driftX: 42, driftY: -28, rot: 23, duration: 13.2, delay: 1.4, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.53 },
  { id: "c33", color: "orange", x: 98, y: 34, size: 22, driftX: -48, driftY: 30, rot: -21, duration: 14.6, delay: 0.5, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0, depth: "far", opacity: 0.51 },
];

const DEPTH_Z: Record<DepthLayer, number> = {
  far: 1,
  mid: 2,
  near: 3,
};

const FACE_NAMES = ["px", "nx", "py", "ny", "pz", "nz"] as const;
const SHAKE_MS = 820;
const HATCH_MS = 680;
const RETURN_MS = 560;
const CHAR_HOLD_MS = 3400;
const CYCLE_GAP_MS = 5400;
const WALK_FRAME_MS = 220;
const SOFT_SHAKE_MS = 900;
const HOVER_NUDGE_PX = 12;

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
  const [softShake, setSoftShake] = useState(false);
  const flashTimer = useRef<number | null>(null);
  const phaseTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const wobbleTimer = useRef<number | null>(null);
  const hovered = useRef(false);
  const cycleActive = useRef(false);
  const softShakeRef = useRef(false);
  const phaseRef = useRef<CubePhase>("idle");
  const busyRef = useRef(false);

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
    busyRef.current = phase !== "idle";
  }, [phase]);

  useEffect(() => {
    softShakeRef.current = softShake;
  }, [softShake]);

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

  const clearWobbleTimer = useCallback(() => {
    if (wobbleTimer.current) {
      window.clearTimeout(wobbleTimer.current);
      wobbleTimer.current = null;
    }
  }, []);

  const finishReturn = useCallback(() => {
    if (!hovered.current) {
      setPhase("idle");
      setWalkFrame(0);
      setSoftShake(false);
      softShakeRef.current = false;
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
      setSoftShake(false);
      softShakeRef.current = false;
      if (cycleActive.current) {
        cycleActive.current = false;
        onCycleDone?.();
      }
      return;
    }
    setPhase((prev) => (prev === "idle" ? "idle" : "returning"));
    phaseTimer.current = window.setTimeout(finishReturn, RETURN_MS);
  }, [clearHoldTimer, clearPhaseTimer, finishReturn, onCycleDone, reduced]);

  /** Full cinematic hatch: shake → crack/pop → character. */
  const enterHatch = useCallback(
    (fromCycle: boolean) => {
      clearPhaseTimer();
      clearHoldTimer();
      setSoftShake(false);
      softShakeRef.current = false;
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

      setPhase("shaking");
      phaseTimer.current = window.setTimeout(() => {
        if (!(hovered.current || cycleActive.current)) return;
        setPhase("hatching");
        phaseTimer.current = window.setTimeout(() => {
          if (!(hovered.current || cycleActive.current)) return;
          setPhase("character");
          if (fromCycle && !hovered.current) {
            holdTimer.current = window.setTimeout(() => {
              if (!hovered.current) startReturn();
            }, CHAR_HOLD_MS);
          }
        }, HATCH_MS);
      }, SHAKE_MS);
    },
    [clearHoldTimer, clearPhaseTimer, reduced, startReturn],
  );

  /** Ambiance-only egg wobble that settles back without hatching. */
  const startSoftWobble = useCallback(() => {
    if (reduced) return;
    if (hovered.current || cycleActive.current || busyRef.current) return;
    if (phaseRef.current !== "idle") return;

    clearPhaseTimer();
    setSoftShake(true);
    softShakeRef.current = true;
    setPhase("shaking");
    phaseTimer.current = window.setTimeout(() => {
      if (hovered.current || cycleActive.current) return;
      setSoftShake(false);
      softShakeRef.current = false;
      setPhase("idle");
    }, SOFT_SHAKE_MS);
  }, [clearPhaseTimer, reduced]);

  const enterHover = useCallback(() => {
    hovered.current = true;
    clearHoldTimer();
    if (phaseRef.current === "character") return;
    if (phaseRef.current === "hatching" && cycleActive.current) return;
    // Soft ambiance shake in progress — escalate into a full hatch.
    if (phaseRef.current === "shaking" && softShakeRef.current && !cycleActive.current) {
      setSoftShake(false);
      softShakeRef.current = false;
      clearPhaseTimer();
      setPhase("hatching");
      phaseTimer.current = window.setTimeout(() => {
        if (!hovered.current && !cycleActive.current) return;
        setPhase("character");
      }, HATCH_MS);
      return;
    }
    if (phaseRef.current === "shaking" || phaseRef.current === "hatching") return;
    enterHatch(false);
  }, [clearHoldTimer, clearPhaseTimer, enterHatch]);

  const leaveHover = useCallback(() => {
    hovered.current = false;
    setNudge({ x: 0, y: 0, rot: 0 });
    if (cycleActive.current && phaseRef.current === "character") {
      holdTimer.current = window.setTimeout(() => {
        if (!hovered.current) startReturn();
      }, Math.min(900, CHAR_HOLD_MS));
      return;
    }
    startReturn();
  }, [startReturn]);

  /** Per-cube repulsion — cubes drift away from the pointer, not the whole scene. */
  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (reduced) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const strength = HOVER_NUDGE_PX * (spec.depth === "far" ? 0.7 : 1);
      setNudge({
        x: -(dx / dist) * strength,
        y: -(dy / dist) * strength,
        rot: -(dx / dist) * 5,
      });
    },
    [reduced, spec.depth],
  );

  useEffect(() => {
    if (!forcedShow || hovered.current) return;
    // Soft ambiance wobble must not block the scheduled hatch cycle.
    if (phaseRef.current === "shaking" && softShakeRef.current) {
      enterHatch(true);
      return;
    }
    if (phaseRef.current !== "idle") return;
    enterHatch(true);
  }, [enterHatch, forcedShow, phase]);

  /* Soft egg wobbles for ambiance — never cursor-driven. */
  useEffect(() => {
    if (reduced || spec.behavior !== "wobbler" || !spec.wobbleEvery) {
      clearWobbleTimer();
      return;
    }

    let cancelled = false;
    const schedule = (ms: number) => {
      clearWobbleTimer();
      wobbleTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        startSoftWobble();
        schedule(spec.wobbleEvery);
      }, ms);
    };
    schedule(spec.wobbleOffset || spec.wobbleEvery);
    return () => {
      cancelled = true;
      clearWobbleTimer();
    };
  }, [
    clearWobbleTimer,
    reduced,
    spec.behavior,
    spec.wobbleEvery,
    spec.wobbleOffset,
    startSoftWobble,
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
      setFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 420);

      if (reduced) {
        if (phaseRef.current === "character") {
          startReturn();
        } else {
          enterHatch(false);
          holdTimer.current = window.setTimeout(() => {
            if (!hovered.current) startReturn();
          }, CHAR_HOLD_MS);
        }
        return;
      }

      if (phaseRef.current === "idle" || softShakeRef.current) {
        setSoftShake(false);
        softShakeRef.current = false;
        enterHatch(false);
        holdTimer.current = window.setTimeout(() => {
          if (!hovered.current) startReturn();
        }, SHAKE_MS + HATCH_MS + CHAR_HOLD_MS);
        return;
      }

      if (phaseRef.current === "character") {
        setNudge({
          x: (Math.random() - 0.5) * 14,
          y: (Math.random() - 0.5) * 10,
          rot: (Math.random() - 0.5) * 10,
        });
        window.setTimeout(() => setNudge({ x: 0, y: 0, rot: 0 }), 700);
        return;
      }
    },
    [enterHatch, reduced, startReturn],
  );

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      clearPhaseTimer();
      clearHoldTimer();
      clearWobbleTimer();
    };
  }, [clearHoldTimer, clearPhaseTimer, clearWobbleTimer]);

  const showCharacter = phase === "character";
  const isShaking = phase === "shaking";
  const isHatching = phase === "hatching";
  const isReturning = phase === "returning";
  const dieActive = !reduced && (isShaking || isHatching || showCharacter);
  const charGrid =
    showCharacter && walkFrame === 1
      ? IDLE_CUBE_CHARS_WALK[spec.color]
      : IDLE_CUBE_CHARS[spec.color];

  const dieClass = [
    "idle-die",
    `idle-die--${spec.color}`,
    isShaking ? (softShake ? "is-soft-shake" : "is-shaking") : "",
    isHatching ? "is-hatching" : "",
    isReturning ? "is-returning" : "",
    showCharacter ? "is-morphed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const charClass = [
    "idle-cube-char",
    `idle-cube-char--${motionStyle}`,
    showCharacter ? "is-visible" : "",
    dieActive && (isShaking || isHatching) ? "is-waiting" : "",
    isHatching ? "is-popping" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`idle-cube-slot idle-cube-slot--${spec.depth}`}
      style={{
        left: `${spec.x}%`,
        top: `${spec.y}%`,
        zIndex: DEPTH_Z[spec.depth],
        opacity: spec.opacity,
      }}
    >
      {/* CSS float — never shares transform with hatch (.idle-die) or hover nudge */}
      <div
        className="idle-cube-float"
        style={
          reduced
            ? { animation: "none" }
            : ({
                ["--fx" as string]: spec.driftX,
                ["--fy" as string]: spec.driftY,
                ["--frot" as string]: spec.rot,
                ["--fdur" as string]: `${spec.duration}s`,
                ["--fdelay" as string]: `${spec.delay}s`,
              } as CSSProperties)
        }
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
          onPointerMove={onPointerMove}
          initial={false}
          animate={{
            x: nudge.x,
            y: nudge.y,
            rotate: nudge.rot,
            scale: phase === "character" ? 1.08 : 1,
          }}
          transition={{
            x: { type: "spring", stiffness: 220, damping: 18, mass: 0.4 },
            y: { type: "spring", stiffness: 220, damping: 18, mass: 0.4 },
            rotate: { type: "spring", stiffness: 180, damping: 16 },
            scale: { duration: 0.28, ease: "easeOut" },
          }}
          whileTap={reduced ? undefined : { scale: 0.96 }}
        >
          <span className="idle-cube-scene" aria-hidden>
            <span className={dieClass}>
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

            <span className={charClass}>
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
    const kick = window.setTimeout(tick, 2800);
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
              <div className="tent-door-void" aria-hidden />
              <TentWalkers ink={ink} reduced={reduced} />
              <div
                className="tent-wall-occluder"
                style={{ background: tentPalette.K }}
                aria-hidden
              />
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
