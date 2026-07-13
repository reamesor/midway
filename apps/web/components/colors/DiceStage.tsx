"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useOs } from "@/components/os/OsContext";
import type { ColorKey } from "@/lib/colors/engine";
import { COLOR_HEX, COLOR_KEYS } from "@/lib/colors/engine";
import { ResultBanner, type StageResult } from "./ResultBanner";

type DiceStageProps = {
  dice: ColorKey[] | null;
  rolling: boolean;
  hits: boolean[];
  prompt: string;
  result?: StageResult | null;
  /** Brief non-blocking celebrate burst after a 3-match jackpot. */
  jackpotFx?: boolean;
};

/** Per-die idle face layout — mixed Colors palette, like desktop jewelry cubes. */
const IDLE_FACES: ColorKey[][] = [
  ["yellow", "orange", "pink", "blue", "green", "red"],
  ["blue", "green", "yellow", "red", "orange", "pink"],
  ["pink", "red", "blue", "orange", "yellow", "green"],
];

type FaceShade = "lit" | "mid" | "shade" | "deep";

function mixHex(hex: string, other: string, t: number): string {
  const parse = (h: string) => {
    const n = h.replace("#", "");
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ] as const;
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(other);
  const m = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Soft Midway shade — sage, never void black. */
const SHADE_INK = "#7a9a72";
/** Dark-stage paper — used to pull pastels down without greying them out. */
const STAGE_INK = "#2a3830";
/** Cream / paper rim — must read in dark mode (not black). */
const FACE_RIM = "#f7f5ef";

/** Medium-fast roll — snappier tumble, still readable (not frantic). */
const ROLL_SPIN_X = 0.24;
const ROLL_SPIN_Y = 0.28;
const ROLL_BOB_HZ = 13;
const ROLL_BOB_AMP = 0.16;
const ROLL_FACE_MS = 80;
const SETTLE_LERP = 0.1;

/** Dark mode only: settle luminous pastels into the stage without muddying. */
function faceBaseHex(hex: string, dark: boolean): string {
  if (!dark) return hex;
  return mixHex(hex, STAGE_INK, 0.26);
}

function shadeHex(hex: string, shade: FaceShade, dark: boolean): string {
  switch (shade) {
    case "lit":
      return mixHex(hex, "#ffffff", dark ? 0.08 : 0.2);
    case "mid":
      return mixHex(hex, "#ffffff", dark ? 0 : 0.02);
    case "shade":
      return mixHex(hex, SHADE_INK, dark ? 0.16 : 0.08);
    case "deep":
      return mixHex(hex, SHADE_INK, dark ? 0.24 : 0.14);
  }
}

/** Pixel face — pastel fill, soft bands, thin cream rim. */
function makePixelFaceTexture(
  hex: string,
  shade: FaceShade,
  dark: boolean,
  /** Result tops: keep chroma punchy so PNK vs BLU stay unmistakable. */
  vivid = false,
): THREE.CanvasTexture {
  const size = 32;
  const canvas =
    typeof document !== "undefined"
      ? document.createElement("canvas")
      : null;
  const texture = new THREE.CanvasTexture(canvas ?? undefined);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!canvas) return texture;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Vivid tops: less stage-ink crush so banner chips match cube tops.
  const base = vivid
    ? dark
      ? mixHex(hex, STAGE_INK, 0.12)
      : hex
    : faceBaseHex(hex, dark);
  const fill = shadeHex(base, shade, dark);
  const lit = mixHex(fill, "#ffffff", dark ? (vivid ? 0.18 : 0.12) : 0.28);
  const darkBand = mixHex(fill, SHADE_INK, dark ? (vivid ? 0.1 : 0.18) : 0.1);

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, size, size);

  // Hard highlight band (top-left) — stepped, not blended.
  ctx.fillStyle = lit;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + y < size * 0.55) ctx.fillRect(x, y, 1, 1);
    }
  }

  // Hard shade band (bottom-right).
  ctx.fillStyle = darkBand;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + y > size * 1.2) ctx.fillRect(x, y, 1, 1);
    }
  }

  // Soft sage pixel lattice — keep chroma readable (lighter on result tops).
  ctx.fillStyle = vivid
    ? dark
      ? "rgba(74,122,82,0.04)"
      : "rgba(74,122,82,0.03)"
    : dark
      ? "rgba(74,122,82,0.1)"
      : "rgba(74,122,82,0.05)";
  for (let i = 0; i < size; i += 4) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  // Thin cream rim — 1px so nearest-filter stays crisp, not chunky.
  ctx.fillStyle = FACE_RIM;
  ctx.fillRect(0, 0, size, 1);
  ctx.fillRect(0, size - 1, size, 1);
  ctx.fillRect(0, 0, 1, size);
  ctx.fillRect(size - 1, 0, 1, size);

  texture.needsUpdate = true;
  return texture;
}

/**
 * BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
 * Engine result ALWAYS paints material index 2 (+Y).
 *
 * Settle pose MUST tip +Y toward the camera (positive rot.x).
 * Negative rot.x tips +Z upward — d500437 painted results on +Y but kept a
 * negative settle tip, so the visible “top” diamond was still idle +Z paint
 * (e.g. PNK/BLU/BLU banner while cubes showed green/orange/yellow tops).
 *
 * Manual check: dice [pink, blue, blue] → each mesh’s +Y face is that color
 * and must dominate the silhouette after settle.
 */
const RESULT_FACE = 2;

const FACE_SHADES: FaceShade[] = [
  "shade", // +X
  "shade", // -X
  "lit", // +Y (result / top)
  "deep", // -Y
  "mid", // +Z
  "deep", // -Z
];

/**
 * Tip +Y (result) toward +Z/camera. Shared target quat so Euler spin from the
 * tumble cannot leave dice on mismatched faces (lerp of huge Euler angles is
 * unstable; slerp to this pose is exact).
 */
const SETTLE_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0.78, 0.32, -0.06, "XYZ"),
);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function DiceStage({
  dice,
  rolling,
  hits,
  prompt,
  result = null,
  jackpotFx = false,
}: DiceStageProps) {
  const { theme } = useOs();
  const dark = theme === "dark";
  const showPrompt = Boolean(prompt) && !rolling && !dice;
  const showTopBanner = rolling || Boolean(dice && result);
  const isJackpot = Boolean(result && result.matches === 3);
  const celebrate = jackpotFx && isJackpot && !rolling;

  return (
    <div
      className={`colors-dice-stage bevel-inset relative isolate min-h-[220px] flex-1 overflow-hidden sm:min-h-[240px] md:min-h-[260px]${
        isJackpot ? " is-jackpot" : ""
      }${celebrate ? " is-jackpot-fx" : ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 dithered opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(74,122,82,0.12) 0 2px,transparent 2px 5px),repeating-linear-gradient(90deg,rgba(74,122,82,0.08) 0 2px,transparent 2px 5px)",
        }}
        aria-hidden
      />
      {celebrate ? (
        <div className="colors-jackpot-fx" aria-hidden>
          <div className="colors-jackpot-fx__flash" />
          <div className="colors-jackpot-fx__scan" />
          <div className="colors-jackpot-fx__vignette" />
        </div>
      ) : null}
      {showTopBanner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-2 pt-2 sm:px-3 sm:pt-3">
          <ResultBanner
            rolling={rolling}
            dice={dice}
            hits={hits}
            result={result}
            celebrate={celebrate}
          />
        </div>
      ) : null}
      {showPrompt ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-2 sm:bottom-3 sm:px-3">
          <p className="colors-stage-prompt max-w-full rounded-sm px-2 py-1.5 text-center font-heading text-[10px] tracking-[0.14em] blink sm:px-3 sm:text-[11px] sm:tracking-[0.18em]">
            {prompt}
          </p>
        </div>
      ) : null}
      <Canvas
        // High angle so settled +Y (result) tops dominate over side faces.
        camera={{ position: [0, 4.35, 5.15], fov: 34 }}
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true }}
        className="!h-full !w-full"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Flat arcade light — avoid soft PBR bloom; slightly cooler in dark */}
        <ambientLight intensity={dark ? 0.82 : 1} />
        <directionalLight position={[4, 6, 5]} intensity={dark ? 0.28 : 0.35} />
        {[-2.15, 0, 2.15].map((x, i) => (
          <DieMesh
            key={i}
            index={i}
            x={x}
            color={dice?.[i] ?? null}
            rolling={rolling}
            hit={Boolean(hits[i])}
            dark={dark}
            celebrate={celebrate}
          />
        ))}
      </Canvas>
    </div>
  );
}

function DieMesh({
  index,
  x,
  color,
  rolling,
  hit,
  dark,
  celebrate,
}: {
  index: number;
  x: number;
  color: ColorKey | null;
  rolling: boolean;
  hit: boolean;
  dark: boolean;
  celebrate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [spin, setSpin] = useState<ColorKey>(IDLE_FACES[index]![RESULT_FACE]!);
  const idleFaces = IDLE_FACES[index]!;
  const celebrateAt = useRef(0);
  const reduceMotion = useRef(false);
  const scratchTarget = useRef(new THREE.Quaternion());
  const scratchSpin = useRef(new THREE.Quaternion());
  const settleQuat = useMemo(() => {
    const q = SETTLE_QUAT.clone();
    q.multiply(
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, (index - 1) * 0.1),
    );
    return q;
  }, [index]);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (celebrate) celebrateAt.current = performance.now();
  }, [celebrate]);

  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => {
      setSpin(COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]!);
    }, ROLL_FACE_MS);
    return () => window.clearInterval(id);
  }, [rolling]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const phase = index * 1.7;

    if (rolling) {
      group.current.rotation.x += ROLL_SPIN_X;
      group.current.rotation.y += ROLL_SPIN_Y;
      group.current.position.y =
        Math.sin(t * ROLL_BOB_HZ + phase) * ROLL_BOB_AMP;
      return;
    }

    if (color) {
      // Slerp to a known +Y-up pose (not Euler lerp from unbounded tumble angles).
      // Jackpot flourish: yaw-only spin so RESULT_FACE (+Y) stays on top.
      const elapsed = (performance.now() - celebrateAt.current) / 1000;
      const burst =
        celebrate && hit && !reduceMotion.current
          ? Math.max(0, 1 - elapsed / 1.45)
          : 0;
      const target = scratchTarget.current.copy(settleQuat);
      if (burst > 0) {
        scratchSpin.current.setFromAxisAngle(
          Y_AXIS,
          burst * Math.PI * 2.1 * (1 - burst) +
            Math.sin(elapsed * 9 + phase) * 0.12 * burst,
        );
        target.multiply(scratchSpin.current);
      }
      group.current.quaternion.slerp(target, SETTLE_LERP);
      const bobBase = hit
        ? Math.sin(t * 3.2 + phase) * 0.06
        : Math.sin(t * 1.6 + phase) * 0.03;
      const bob =
        bobBase + burst * Math.abs(Math.sin(elapsed * 11 + phase)) * 0.28;
      group.current.position.y += (bob - group.current.position.y) * 0.18;
      return;
    }

    // Pre-bet idle: soft tumble + bob — cubes always on stage.
    group.current.rotation.x = -0.22 + Math.sin(t * 0.55 + phase) * 0.18;
    group.current.rotation.y = 0.55 + t * 0.22 + Math.sin(t * 0.35 + phase) * 0.12;
    group.current.rotation.z = Math.sin(t * 0.4 + phase) * 0.08;
    group.current.position.y = Math.sin(t * 1.35 + phase) * 0.14;
  });

  const faceKeys = useMemo((): ColorKey[] => {
    if (rolling) {
      // Spinning: keep side faces fixed, flash the top (+Y).
      return [
        idleFaces[0]!,
        idleFaces[1]!,
        spin,
        idleFaces[3]!,
        idleFaces[4]!,
        idleFaces[5]!,
      ];
    }
    if (color) {
      // Engine result lands on top (+Y) — same colors as ResultBanner chips.
      return [
        idleFaces[0]!,
        idleFaces[1]!,
        color,
        idleFaces[3]!,
        idleFaces[4]!,
        idleFaces[5]!,
      ];
    }
    return idleFaces;
  }, [rolling, spin, color, idleFaces]);

  const materials = useMemo(() => {
    return faceKeys.map((key, i) => {
      const isResult = i === RESULT_FACE;
      // Result tops stay true to COLOR_HEX (no gold multiply — that washed BLU→yellow).
      const tex = makePixelFaceTexture(
        COLOR_HEX[key],
        isResult ? "lit" : FACE_SHADES[i]!,
        dark,
        isResult,
      );
      return new THREE.MeshBasicMaterial({
        map: tex,
        toneMapped: false,
      });
    });
  }, [faceKeys, dark]);

  useEffect(() => {
    return () => {
      for (const mat of materials) {
        mat.map?.dispose();
        mat.dispose();
      }
    };
  }, [materials]);

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.42, 1.42, 1.42)),
    [],
  );
  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: celebrate && hit ? "#f5c542" : FACE_RIM,
        toneMapped: false,
        depthTest: true,
        transparent: false,
      }),
    [celebrate, hit],
  );

  useEffect(() => {
    return () => {
      edges.dispose();
      edgeMat.dispose();
    };
  }, [edges, edgeMat]);

  return (
    <group ref={group} position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        {materials.map((mat, i) => (
          <primitive key={i} object={mat} attach={`material-${i}`} />
        ))}
      </mesh>
      <lineSegments geometry={edges} material={edgeMat} renderOrder={2} />
      {hit && !rolling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[1.05, celebrate ? 0.085 : 0.06, 4, 16]} />
          <meshBasicMaterial
            color={celebrate ? "#ffe066" : "#f5c542"}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
