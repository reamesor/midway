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

type CubeBehavior = "drift" | "wobbler";

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
  /** Soft egg-wobble cadence for ambiance (ms). */
  wobbleEvery: number;
  wobbleOffset: number;
};

/** idle → egg shake → crack/pop → character hop → ease back to cube */
type CubePhase =
  | "idle"
  | "shaking"
  | "hatching"
  | "character"
  | "returning";

/**
 * Calm ring around the tent brand — 18 cubes, no overlap with MIDWAY mark.
 * Outer oval + a few mid-ring fillers; sizes vary slightly for depth.
 */
const CUBE_LAYOUT: CubeSpec[] = [
  { id: "c0", color: "blue", x: 10, y: 30, size: 46, driftX: 9, driftY: 7, rot: 7, duration: 25, delay: 0, behavior: "wobbler", wobbleEvery: 14000, wobbleOffset: 1600 },
  { id: "c1", color: "yellow", x: 26, y: 12, size: 36, driftX: 7, driftY: 10, rot: 10, duration: 22, delay: 1.0, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c2", color: "orange", x: 50, y: 8, size: 40, driftX: -8, driftY: 9, rot: -8, duration: 24, delay: 0.6, behavior: "wobbler", wobbleEvery: 15500, wobbleOffset: 3800 },
  { id: "c3", color: "green", x: 74, y: 12, size: 34, driftX: -7, driftY: 11, rot: 9, duration: 21, delay: 2.1, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c4", color: "pink", x: 90, y: 28, size: 48, driftX: -10, driftY: 8, rot: -6, duration: 27, delay: 0.3, behavior: "wobbler", wobbleEvery: 12500, wobbleOffset: 5200 },
  { id: "c5", color: "red", x: 94, y: 50, size: 38, driftX: -9, driftY: -7, rot: 8, duration: 23, delay: 1.5, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c6", color: "blue", x: 88, y: 72, size: 42, driftX: -8, driftY: -9, rot: -7, duration: 26, delay: 0.9, behavior: "wobbler", wobbleEvery: 16000, wobbleOffset: 2400 },
  { id: "c7", color: "yellow", x: 70, y: 88, size: 36, driftX: -7, driftY: 8, rot: 11, duration: 20, delay: 2.4, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c8", color: "orange", x: 50, y: 92, size: 44, driftX: 6, driftY: -8, rot: -9, duration: 25, delay: 1.2, behavior: "wobbler", wobbleEvery: 13500, wobbleOffset: 7000 },
  { id: "c9", color: "green", x: 30, y: 88, size: 40, driftX: 9, driftY: -9, rot: 6, duration: 22, delay: 1.8, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c10", color: "pink", x: 10, y: 70, size: 38, driftX: 10, driftY: -7, rot: -10, duration: 24, delay: 0.5, behavior: "wobbler", wobbleEvery: 14800, wobbleOffset: 9000 },
  { id: "c11", color: "red", x: 8, y: 48, size: 42, driftX: 11, driftY: 6, rot: 5, duration: 26, delay: 2.7, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  /* Mid-ring fillers — keep clear of tent brand (~40–60% / 32–58%). */
  { id: "c12", color: "yellow", x: 20, y: 44, size: 32, driftX: 8, driftY: 6, rot: -5, duration: 28, delay: 1.4, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c13", color: "pink", x: 80, y: 44, size: 34, driftX: -8, driftY: 7, rot: 7, duration: 23, delay: 0.8, behavior: "wobbler", wobbleEvery: 17000, wobbleOffset: 11000 },
  { id: "c14", color: "green", x: 36, y: 20, size: 30, driftX: 6, driftY: 9, rot: 8, duration: 21, delay: 2.0, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c15", color: "blue", x: 64, y: 20, size: 32, driftX: -6, driftY: 10, rot: -6, duration: 24, delay: 1.7, behavior: "wobbler", wobbleEvery: 15200, wobbleOffset: 4500 },
  { id: "c16", color: "orange", x: 22, y: 66, size: 34, driftX: 9, driftY: -6, rot: 9, duration: 22, delay: 0.4, behavior: "drift", wobbleEvery: 0, wobbleOffset: 0 },
  { id: "c17", color: "red", x: 78, y: 66, size: 36, driftX: -9, driftY: -8, rot: -8, duration: 25, delay: 2.2, behavior: "wobbler", wobbleEvery: 14200, wobbleOffset: 6000 },
];

const FACE_NAMES = ["px", "nx", "py", "ny", "pz", "nz"] as const;
const SHAKE_MS = 820;
const HATCH_MS = 680;
const RETURN_MS = 560;
const CHAR_HOLD_MS = 3400;
const CYCLE_GAP_MS = 5400;
const WALK_FRAME_MS = 220;
const SOFT_SHAKE_MS = 900;

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
