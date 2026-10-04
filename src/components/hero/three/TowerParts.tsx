"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import type { PartId } from "@/lib/parts";
import { edgesOf, geo, getTabletTexture, mats } from "./materials";

type V3 = [number, number, number];

/** When set, every primitive below renders as a blueprint outline in this material. */
const GhostContext = createContext<THREE.LineBasicMaterial | null>(null);

export function Ghost({ material, children }: { material: THREE.LineBasicMaterial; children: ReactNode }) {
  return <GhostContext.Provider value={material}>{children}</GhostContext.Provider>;
}

function Prim({ g, m, p, r }: { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; r?: V3 }) {
  const ghost = useContext(GhostContext);
  if (ghost) return <lineSegments geometry={edgesOf(g)} material={ghost} position={p} rotation={r} />;
  return <mesh geometry={g} material={m} position={p} rotation={r} />;
}

const CORNERS: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];

function Base() {
  return (
    <group>
      <Prim g={geo.box(0.6, 0.12, 0.6)} m={mats.dark} />
      <Prim g={geo.box(0.56, 0.012, 0.56)} m={mats.alu} p={[0, 0.066, 0]} />
      {CORNERS.map(([x, z]) => <Prim key={`${x}${z}`} g={geo.cyl(0.03, 0.035, 0.02, 16)} m={mats.alu} p={[x * 0.25, -0.07, z * 0.25]} />)}
    </group>
  );
}

function Frame() {
  return (
    <group>
      {CORNERS.map(([x, z]) => <Prim key={`${x}${z}`} g={geo.box(0.035, 1, 0.035)} m={mats.alu} p={[x * 0.26, 0, z * 0.26]} />)}
      {[-0.49, 0, 0.49].map((y) => (
        <group key={y}>
          <Prim g={geo.box(0.52, 0.028, 0.028)} m={mats.alu} p={[0, y, 0.26]} />
          <Prim g={geo.box(0.52, 0.028, 0.028)} m={mats.alu} p={[0, y, -0.26]} />
          <Prim g={geo.box(0.028, 0.028, 0.52)} m={mats.alu} p={[0.26, y, 0]} />
          <Prim g={geo.box(0.028, 0.028, 0.52)} m={mats.alu} p={[-0.26, y, 0]} />
        </group>
      ))}
    </group>
  );
}

function Panels() {
  const ghost = useContext(GhostContext);
  const plane = geo.plane(0.49, 0.95);
  const sides: { p: V3; r: V3 }[] = [
    { p: [0, 0, 0.263], r: [0, 0, 0] },
    { p: [0, 0, -0.263], r: [0, Math.PI, 0] },
    { p: [0.263, 0, 0], r: [0, Math.PI / 2, 0] },
    { p: [-0.263, 0, 0], r: [0, -Math.PI / 2, 0] },
  ];
  return (
    <group>
      {sides.map((s, i) => (
        <group key={i}>
          <Prim g={plane} m={mats.acrylic} p={s.p} r={s.r} />
          {!ghost && <lineSegments geometry={edgesOf(plane)} material={mats.panelEdge} position={s.p} rotation={s.r} />}
        </group>
      ))}
    </group>
  );
}

function Leds() {
  return (
    <group>
      {CORNERS.map(([x, z]) => <Prim key={`${x}${z}`} g={geo.box(0.014, 0.98, 0.014)} m={mats.led} p={[x * 0.285, 0, z * 0.285]} />)}
      <Prim g={geo.box(0.584, 0.014, 0.014)} m={mats.led} p={[0, 0.49, 0.285]} />
      <Prim g={geo.box(0.584, 0.014, 0.014)} m={mats.led} p={[0, 0.49, -0.285]} />
      <Prim g={geo.box(0.014, 0.014, 0.584)} m={mats.led} p={[0.285, 0.49, 0]} />
      <Prim g={geo.box(0.014, 0.014, 0.584)} m={mats.led} p={[-0.285, 0.49, 0]} />
    </group>
  );
}

function Tablet() {
  useMemo(() => getTabletTexture(), []);
  return (
    <group>
      <Prim g={geo.box(0.34, 0.23, 0.025)} m={mats.head} />
      <Prim g={geo.plane(0.31, 0.2)} m={mats.screen} p={[0, 0, 0.0132]} />
      <Prim g={geo.box(0.06, 0.06, 0.05)} m={mats.alu} p={[0, 0, -0.035]} />
    </group>
  );
}

function Head() {
  return (
    <group>
      <Prim g={geo.box(0.44, 0.22, 0.44)} m={mats.head} />
      <Prim g={geo.box(0.4, 0.02, 0.4)} m={mats.alu} p={[0, 0.12, 0]} />
      <Prim g={geo.cyl(0.062, 0.062, 0.03, 32)} m={mats.glass} p={[0, 0, 0.225]} r={[Math.PI / 2, 0, 0]} />
      <Prim g={geo.torus(0.074, 0.009)} m={mats.led} p={[0, 0, 0.232]} />
      <Prim g={geo.sphere(0.016)} m={mats.glass} p={[0.13, 0, 0.222]} />
      <Prim g={geo.sphere(0.016)} m={mats.glass} p={[-0.13, 0, 0.222]} />
      <Prim g={geo.cyl(0.05, 0.05, 0.03)} m={mats.led} p={[0, 0.145, 0]} />
    </group>
  );
}

const BY_ID: Record<PartId, () => React.JSX.Element> = {
  base: Base, frame: Frame, panels: Panels, leds: Leds, tablet: Tablet, head: Head,
};

export function PartModel({ id }: { id: PartId }) {
  const C = BY_ID[id];
  return <C />;
}
