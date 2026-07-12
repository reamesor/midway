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

export function DiceStage({ dice, rolling, hits, prompt }: DiceStageProps) {
  return (
    <div className="bevel-inset relative isolate min-h-[300px] overflow-hidden bg-[#1a1a22]">
      <div
        className="pointer-events-none absolute inset-0 dithered opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#000 0 2px,transparent 2px 4px),repeating-linear-gradient(90deg,#222 0 2px,transparent 2px 4px)",
        }}
        aria-hidden
      />
      {prompt && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="font-heading text-[12px] tracking-[0.2em] text-acid blink">
            {prompt}
          </p>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0.6, 7.5], fov: 40 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true }}
        style={{ height: 300, imageRendering: "pixelated" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 4]} intensity={1.15} />
        <directionalLight position={[-5, 2, -3]} intensity={0.4} color="#e23bc8" />
        {[-2.15, 0, 2.15].map((x, i) => (
          <DieMesh
            key={i}
            x={x}
            color={dice?.[i] ?? null}
            rolling={rolling}
            hit={Boolean(hits[i])}
            visible={Boolean(dice) || rolling}
          />
        ))}
      </Canvas>
    </div>
  );
}

function DieMesh({
  x,
  color,
  rolling,
  hit,
  visible,
}: {
  x: number;
  color: ColorKey | null;
  rolling: boolean;
  hit: boolean;
  visible: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [spin, setSpin] = useState<ColorKey>("blue");

  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => {
      setSpin(COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]!);
    }, 70);
    return () => window.clearInterval(id);
  }, [rolling]);

  useFrame((state) => {
    if (!group.current || !visible) return;
    if (rolling) {
      group.current.rotation.x += 0.32;
      group.current.rotation.y += 0.38;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 18) * 0.22;
    } else {
      group.current.rotation.x *= 0.78;
      group.current.rotation.y *= 0.78;
      group.current.rotation.z *= 0.78;
      group.current.position.y *= 0.8;
    }
  });

  const face = rolling ? spin : (color ?? "yellow");

  const materials = useMemo(() => {
    const mk = (hex: string, emissive = false) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.32,
        metalness: 0.14,
        emissive: emissive ? "#f5c542" : "#000000",
        emissiveIntensity: emissive ? 0.4 : 0,
      });

    // +X -X +Y -Y +Z -Z — front (+Z) is the result face
    return [
      mk(COLOR_HEX.blue),
      mk(COLOR_HEX.orange),
      mk(COLOR_HEX.yellow),
      mk(COLOR_HEX.red),
      mk(COLOR_HEX[face], hit && !rolling),
      mk(COLOR_HEX.pink),
    ];
  }, [face, hit, rolling]);

  if (!visible) return null;

  return (
    <group ref={group} position={[x, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        {materials.map((mat, i) => (
          <primitive key={i} object={mat} attach={`material-${i}`} />
        ))}
      </mesh>
      {hit && !rolling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[1.05, 0.05, 12, 48]} />
          <meshStandardMaterial
            color="#f5c542"
            emissive="#f5c542"
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}
