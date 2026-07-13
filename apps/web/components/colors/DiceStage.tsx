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
  const base = faceBaseHex(hex, dark);
  const fill = shadeHex(base, shade, dark);
  const lit = mixHex(fill, "#ffffff", dark ? 0.12 : 0.28);
  const darkBand = mixHex(fill, SHADE_INK, dark ? 0.18 : 0.1);

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

  // Soft sage pixel lattice — keep chroma readable.
  ctx.fillStyle = dark ? "rgba(74,122,82,0.1)" : "rgba(74,122,82,0.05)";
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

const FACE_SHADES: FaceShade[] = [
  "shade", // +X
  "shade", // -X
  "lit", // +Y
  "deep", // -Y
  "mid", // +Z (result)
  "deep", // -Z
];

export function DiceStage({
  dice,
  rolling,
  hits,
  prompt,
  result = null,
}: DiceStageProps) {
  const { theme } = useOs();
  const dark = theme === "dark";
  const showPrompt = Boolean(prompt) && !rolling && !dice;
  const showTopBanner = rolling || Boolean(dice && result);

  return (
    <div className="colors-dice-stage bevel-inset relative isolate h-[220px] overflow-hidden sm:h-[260px] md:h-[300px]">
      <div
        className="pointer-events-none absolute inset-0 dithered opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(74,122,82,0.12) 0 2px,transparent 2px 5px),repeating-linear-gradient(90deg,rgba(74,122,82,0.08) 0 2px,transparent 2px 5px)",
        }}
        aria-hidden
      />
      {showTopBanner ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-2 pt-2 sm:px-3 sm:pt-3">
          <ResultBanner
            rolling={rolling}
            dice={dice}
            hits={hits}
            result={result}
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
        camera={{ position: [0, 1.1, 7.2], fov: 40 }}
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
}: {
  index: number;
  x: number;
  color: ColorKey | null;
  rolling: boolean;
  hit: boolean;
  dark: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [spin, setSpin] = useState<ColorKey>(IDLE_FACES[index]![4]!);
  const idleFaces = IDLE_FACES[index]!;

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
      // Settle toward a readable isometric pose; tiny victory bob on hits.
      group.current.rotation.x +=
        (-0.28 - group.current.rotation.x) * SETTLE_LERP;
      group.current.rotation.y +=
        (0.42 - group.current.rotation.y) * SETTLE_LERP;
      group.current.rotation.z += (0 - group.current.rotation.z) * SETTLE_LERP;
      const bob = hit ? Math.sin(t * 3.2 + phase) * 0.06 : Math.sin(t * 1.6 + phase) * 0.03;
      group.current.position.y += (bob - group.current.position.y) * 0.15;
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
      // Spinning: keep side faces fixed, flash the front.
      return [
        idleFaces[0]!,
        idleFaces[1]!,
        idleFaces[2]!,
        idleFaces[3]!,
        spin,
        idleFaces[5]!,
      ];
    }
    if (color) {
      return [
        idleFaces[0]!,
        idleFaces[1]!,
        idleFaces[2]!,
        idleFaces[3]!,
        color,
        idleFaces[5]!,
      ];
    }
    return idleFaces;
  }, [rolling, spin, color, idleFaces]);

  const materials = useMemo(() => {
    return faceKeys.map((key, i) => {
      const tex = makePixelFaceTexture(COLOR_HEX[key], FACE_SHADES[i]!, dark);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        toneMapped: false,
      });
      if (hit && !rolling && i === 4) {
        mat.color = new THREE.Color(dark ? "#e8d080" : "#fff4b0");
      }
      return mat;
    });
  }, [faceKeys, hit, rolling, dark]);

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
        color: FACE_RIM,
        toneMapped: false,
        depthTest: true,
        transparent: false,
      }),
    [],
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
          <torusGeometry args={[1.05, 0.06, 4, 16]} />
          <meshBasicMaterial color="#f5c542" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
