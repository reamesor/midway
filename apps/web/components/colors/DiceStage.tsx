"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ColorKey } from "@/lib/colors/engine";
import { COLOR_HEX, COLOR_KEYS } from "@/lib/colors/engine";

type DiceStageProps = {
  dice: ColorKey[] | null;
  rolling: boolean;
  hits: boolean[];
  prompt: string;
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

/** Soft Midway shade — paper-warm, not void black. */
const SHADE_INK = "#5a6e52";
/** Cream / paper-ink rim — matches light Midway chrome. */
const FACE_RIM = "#f7f5ef";

function shadeHex(hex: string, shade: FaceShade): string {
  switch (shade) {
    case "lit":
      return mixHex(hex, "#ffffff", 0.38);
    case "mid":
      return mixHex(hex, "#ffffff", 0.1);
    case "shade":
      return mixHex(hex, SHADE_INK, 0.16);
    case "deep":
      return mixHex(hex, SHADE_INK, 0.28);
  }
}

/** Chunky 8-bit face — flat fill, stepped bands, soft lattice, cream rim. */
function makePixelFaceTexture(hex: string, shade: FaceShade): THREE.CanvasTexture {
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
  const fill = shadeHex(hex, shade);
  const lit = mixHex(fill, "#ffffff", 0.4);
  const dark = mixHex(fill, SHADE_INK, 0.2);

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
  ctx.fillStyle = dark;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + y > size * 1.2) ctx.fillRect(x, y, 1, 1);
    }
  }

  // Soft sage pixel lattice.
  ctx.fillStyle = "rgba(47,90,56,0.09)";
  for (let i = 0; i < size; i += 4) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  // Cream paper rim (not black ink).
  ctx.strokeStyle = FACE_RIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

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

export function DiceStage({ dice, rolling, hits, prompt }: DiceStageProps) {
  const showPrompt = Boolean(prompt) && !rolling && !dice;

  return (
    <div className="bevel-inset relative isolate min-h-[300px] overflow-hidden bg-[var(--paper)]">
      <div
        className="pointer-events-none absolute inset-0 dithered opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(74,122,82,0.14) 0 2px,transparent 2px 5px),repeating-linear-gradient(90deg,rgba(74,122,82,0.1) 0 2px,transparent 2px 5px)",
        }}
        aria-hidden
      />
      {showPrompt ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
          <p className="rounded-sm border-2 border-line bg-[var(--panel)]/95 px-3 py-1 font-heading text-[11px] tracking-[0.18em] text-ink blink shadow-[2px_2px_0_var(--shadow-cut)]">
            {prompt}
          </p>
        </div>
      ) : null}
      <Canvas
        camera={{ position: [0, 1.1, 7.2], fov: 40 }}
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true }}
        style={{ height: 300, imageRendering: "pixelated" }}
      >
        {/* Flat arcade light — avoid soft PBR bloom */}
        <ambientLight intensity={1} />
        <directionalLight position={[4, 6, 5]} intensity={0.35} />
        {[-2.15, 0, 2.15].map((x, i) => (
          <DieMesh
            key={i}
            index={i}
            x={x}
            color={dice?.[i] ?? null}
            rolling={rolling}
            hit={Boolean(hits[i])}
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
}: {
  index: number;
  x: number;
  color: ColorKey | null;
  rolling: boolean;
  hit: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [spin, setSpin] = useState<ColorKey>(IDLE_FACES[index]![4]!);
  const idleFaces = IDLE_FACES[index]!;

  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => {
      setSpin(COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]!);
    }, 70);
    return () => window.clearInterval(id);
  }, [rolling]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const phase = index * 1.7;

    if (rolling) {
      group.current.rotation.x += 0.32;
      group.current.rotation.y += 0.38;
      group.current.position.y = Math.sin(t * 18 + phase) * 0.22;
      return;
    }

    if (color) {
      // Settle toward a readable isometric pose; tiny victory bob on hits.
      group.current.rotation.x +=
        (-0.28 - group.current.rotation.x) * 0.12;
      group.current.rotation.y +=
        (0.42 - group.current.rotation.y) * 0.12;
      group.current.rotation.z += (0 - group.current.rotation.z) * 0.12;
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
      const tex = makePixelFaceTexture(COLOR_HEX[key], FACE_SHADES[i]!);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        toneMapped: false,
      });
      if (hit && !rolling && i === 4) {
        mat.color = new THREE.Color("#fff4b0");
      }
      return mat;
    });
  }, [faceKeys, hit, rolling]);

  useEffect(() => {
    return () => {
      for (const mat of materials) {
        mat.map?.dispose();
        mat.dispose();
      }
    };
  }, [materials]);

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.42, 1.42, 1.42)), []);

  return (
    <group ref={group} position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        {materials.map((mat, i) => (
          <primitive key={i} object={mat} attach={`material-${i}`} />
        ))}
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={FACE_RIM} linewidth={2} />
      </lineSegments>
      {hit && !rolling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[1.05, 0.06, 4, 16]} />
          <meshBasicMaterial color="#f5c542" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
