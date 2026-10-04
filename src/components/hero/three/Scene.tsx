"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { PARTS } from "@/lib/parts";
import { placedCount, useHero } from "@/lib/store";
import { AssemblyStage } from "./AssemblyStage";
import { SimulationStage } from "./SimulationStage";
import { PowerDriver } from "./Tower";

/** The WebGL canvas behind the hero. Loaded client-side only. */
export default function Scene() {
  const mode = useHero((s) => s.mode);
  const scene = useHero((s) => s.scene);
  const placed = useHero((s) => s.placed);
  const powered = mode === "sim" || placedCount(placed) === PARTS.length;
  const [dpr, setDpr] = useState(1.75);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 38, near: 0.05, far: 120, position: [0, 1.25, 4.6] }}
      style={{ touchAction: "none" }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; }}
      fallback={<p className="nogl">This interactive scene needs WebGL, which is not available in this browser.</p>}
      aria-label="3D scene: drag the ORION components onto the tower, then watch it manage crowds at an event plaza, a metro station or an airport"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <color attach="background" args={["#06080b"]} />
      <fog key={mode} attach="fog" args={["#06080b", mode === "sim" ? 18 : 9, mode === "sim" ? 70 : 22]} />
      <hemisphereLight args={["#bcd4e6", "#0a0e12", 0.6]} />
      <directionalLight position={[3, 6, 5]} intensity={1.15} />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} color="#88aabb" />
      <PowerDriver on={powered} />
      {mode === "assemble" ? <AssemblyStage /> : <SimulationStage key={scene} sceneId={scene} />}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} radius={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
