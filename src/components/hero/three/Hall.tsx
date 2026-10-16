"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Sky } from "@react-three/drei";
import { SCENES } from "@/lib/sim/config";
import { Ceiling } from "./Ceiling";
import { DISPLAY, MONO, geo, makeCanvasTexture } from "./materials";
import { glow, repeatTex, useSigns, type Draw } from "./Environments";

const GATES = SCENES.find((s) => s.id === "airport")!.zones;

/**
 * Sunlit airport terminal in the afternoon: light terrazzo floor, a glass wall onto the
 * apron with aircraft parked at the jet bridges, blue gate seating and shopfronts.
 */

const FLIGHTS: [string, string, string, string][] = [
  ["FLT 01", "DUBAI", "A1", "ON TIME"], ["FLT 02", "CAIRO", "A2", "BOARDING"], ["FLT 03", "LONDON", "B1", "GATE CHANGE"],
  ["FLT 04", "ISTANBUL", "B2", "DELAYED"], ["FLT 05", "RIYADH", "B3", "ON TIME"],
];

function drawGateSign(id: string): Draw {
  return (g, w, h) => {
    g.fillStyle = "#14171c"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffd200"; g.fillRect(0, 0, 150, h);
    g.fillStyle = "#14171c"; g.font = `700 70px ${DISPLAY}`; g.fillText(id, 75 - g.measureText(id).width / 2, 92);
    g.fillStyle = "#ffd200"; g.font = `600 44px ${DISPLAY}`; g.fillText("GATE", 180, 82);
    g.fillStyle = "#c9ced6"; g.font = `500 22px ${MONO}`; g.fillText(id === "B1" ? "FLT 03 · LONDON" : "BOARDING", 320, 80);
  };
}

function drawBoard(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#0b1a33"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffd200"; g.font = `600 24px ${MONO}`;
  g.fillText("DEPARTURES", 30, 40);
  g.fillStyle = "#8fa3c4"; g.font = `500 20px ${MONO}`;
  g.fillText("FLIGHT", 30, 72); g.fillText("TO", 200, 72); g.fillText("GATE", 520, 72); g.fillText("STATUS", 680, 72);
  g.font = `600 28px ${MONO}`;
  FLIGHTS.forEach(([f, to, gate, status], i) => {
    const y = 114 + i * 42;
    g.fillStyle = "#ffffff"; g.fillText(f, 30, y); g.fillText(to, 200, y); g.fillText(gate, 520, y);
    g.fillStyle = status === "BOARDING" ? "#5df28a" : status === "GATE CHANGE" ? "#ff8a3d" : status === "DELAYED" ? "#ff5a5a" : "#ffd200";
    g.fillText(status, 680, y);
  });
}

function drawTerrazzo(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#cfcac0"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    const v = 150 + Math.random() * 90;
    g.fillStyle = Math.random() < 0.08 ? "#8a8070" : `rgb(${v},${v - 4},${v - 10})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 2, 2 + Math.random() * 2);
  }
  g.strokeStyle = "#b5afa3"; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
}

function drawApron(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#8f918c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 600; i++) { const v = 125 + Math.random() * 40; g.fillStyle = `rgb(${v},${v + 1},${v - 3})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  g.strokeStyle = "#7c7e79"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
}

function drawShop(name: string, bg: string, fg: string): Draw {
  return (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `700 64px ${DISPLAY}`; g.fillText(name, (w - g.measureText(name).width) / 2, 88);
  };
}

/** Narrow-body airliner, nose pointing at the terminal (+z). */
function Aircraft({ position, livery }: { position: [number, number, number]; livery: string }) {
  const m = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: 0.35, metalness: 0.2 }),
    belly: new THREE.MeshStandardMaterial({ color: "#c9ced4", roughness: 0.4, metalness: 0.3 }),
    livery: new THREE.MeshStandardMaterial({ color: livery, roughness: 0.4 }),
    engine: new THREE.MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.3, metalness: 0.7 }),
    window: new THREE.MeshBasicMaterial({ color: "#1c2733" }),
    tyre: new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9 }),
  }), [livery]);
  const fus = useMemo(() => new THREE.CylinderGeometry(1.9, 1.9, 30, 28).rotateX(Math.PI / 2), []);
  const nose = useMemo(() => new THREE.SphereGeometry(1.9, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 1.8), []);
  const tailCone = useMemo(() => new THREE.ConeGeometry(1.9, 6, 28).rotateX(-Math.PI / 2), []);
  const wing = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(15, -5); s.lineTo(15, -7); s.lineTo(0, -6.5); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false }).rotateX(Math.PI / 2);
  }, []);
  const fin = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(-5, 0); s.lineTo(-6.5, 6.5); s.lineTo(-4, 6.5); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false }).rotateY(Math.PI / 2);
  }, []);
  return (
    <group position={position}>
      <group position={[0, 3.3, 0]}>
        <mesh geometry={fus} material={m.body} />
        <mesh geometry={nose} material={m.body} position={[0, 0, 15]} />
        <mesh geometry={tailCone} material={m.body} position={[0, 0.4, -18]} />
        <mesh geometry={geo.box(3.82, 0.5, 30)} material={m.livery} position={[0, 0.2, 0]} />
        {Array.from({ length: 22 }, (_, i) => [-1.92, 1.92].map((x) => (
          <mesh key={`${i}${x}`} geometry={geo.box(0.05, 0.32, 0.3)} material={m.window} position={[x, 0.75, -12 + i * 1.15]} />
        )))}
        <mesh geometry={geo.box(4.2, 1.6, 3)} material={m.window} position={[0, 0.8, 16.6]} scale={[0.6, 0.3, 0.2]} />
        {[1, -1].map((sd) => (
          <group key={sd} scale={[sd, 1, 1]}>
            <mesh geometry={wing} material={m.belly} position={[1.2, -0.8, 3]} />
            <mesh geometry={geo.cyl(0.85, 0.85, 3.6, 20)} material={m.engine} position={[6, -1.8, 1.2]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={geo.box(5.5, 0.15, 2)} material={m.belly} position={[3.5, 1.4, -17]} />
          </group>
        ))}
        <mesh geometry={fin} material={m.livery} position={[0.12, 1.4, -14]} />
      </group>
      {[[0, 13], [-2.5, -1], [2.5, -1]].map(([x, z]) => (
        <mesh key={`${x}${z}`} geometry={geo.cyl(0.45, 0.45, 0.4, 16)} material={m.tyre} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]} />
      ))}
    </group>
  );
}

export function AirportHall() {
  const specs = useMemo(() => [
    ...GATES.map((gt) => ({ w: 640, h: 128, draw: drawGateSign(gt.id) })),
    { w: 1024, h: 340, draw: drawBoard },
    { w: 768, h: 128, draw: drawShop("DUTY FREE", "#1c1c1c", "#e8c66a") },
    { w: 768, h: 128, draw: drawShop("CAFÉ", "#2f5d3a", "#ffffff") },
  ], []);
  const tex = useSigns(specs);
  const signs = tex.slice(0, GATES.length), board = tex[GATES.length], dutyFree = tex[GATES.length + 1], cafe = tex[GATES.length + 2];

  const m = useMemo(() => ({
    floor: new THREE.MeshStandardMaterial({ map: repeatTex(makeCanvasTexture(256, 256, drawTerrazzo), 12, 22 / 3), roughness: 0.22, metalness: 0.08 }),
    apron: new THREE.MeshStandardMaterial({ map: repeatTex(makeCanvasTexture(256, 256, drawApron), 30, 12), roughness: 0.9 }),
    taxi: new THREE.MeshBasicMaterial({ color: "#e8c200" }),
    carpet: new THREE.MeshStandardMaterial({ color: "#3b4f6b", roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: "#e4e6e8", roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: "#cfe8f7", transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false }),
    mull: new THREE.MeshStandardMaterial({ color: "#5b6672", roughness: 0.3, metalness: 0.8 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#f2f3f4", roughness: 0.8 }),
    skylight: glow("#ffffff", 1.3),
    seat: new THREE.MeshStandardMaterial({ color: "#2f5fa8", roughness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#c7cdd3", roughness: 0.2, metalness: 0.9 }),
    desk: new THREE.MeshStandardMaterial({ color: "#f5f6f7", roughness: 0.4 }),
    deskBand: new THREE.MeshStandardMaterial({ color: "#2f5fa8", roughness: 0.4 }),
    door: new THREE.MeshStandardMaterial({ color: "#7d8893", roughness: 0.4, metalness: 0.6 }),
    bridge: new THREE.MeshStandardMaterial({ color: "#b9c0c7", roughness: 0.4, metalness: 0.5 }),
    col: new THREE.MeshStandardMaterial({ color: "#f4f5f6", roughness: 0.5 }),
    planter: new THREE.MeshStandardMaterial({ color: "#6e6a62", roughness: 0.8 }),
    plant: new THREE.MeshStandardMaterial({ color: "#3f7f45", roughness: 0.9 }),
    shop: new THREE.MeshStandardMaterial({ color: "#2a2d33", roughness: 0.5 }),
    shopLit: glow("#fff4dc", 1.1),
  }), []);
  const seatRow = useMemo(() => Array.from({ length: 6 }, (_, k) => -1.5 + k * 0.6), []);

  return (
    <group>
      <Sky distance={450} sunPosition={[-40, 35, -100]} turbidity={5} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.85} />

      {/* apron outside the glass wall with taxi lines, parked aircraft and jet bridges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]} material={m.apron}><planeGeometry args={[160, 60]} /></mesh>
      {[-6, 6].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.0, -30]} material={m.taxi}><planeGeometry args={[0.25, 34]} /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -48]} material={m.taxi}><planeGeometry args={[120, 0.3]} /></mesh>
      <Aircraft position={[-6, 0, -34]} livery="#1f6fbf" />
      <Aircraft position={[6, 0, -34]} livery="#b3261e" />
      {[-6, 6].map((x) => (
        <group key={x}>
          <mesh geometry={geo.box(2.4, 2.6, 7.5)} material={m.bridge} position={[x - 3.2, 3.6, -14.9]} />
          <mesh geometry={geo.box(2.4, 2.6, 2.5)} material={m.bridge} position={[x - 2.4, 3.6, -18.6]} rotation={[0, 0.5, 0]} />
          <mesh geometry={geo.cyl(0.2, 0.2, 2.3, 10)} material={m.mull} position={[x - 3.2, 1.15, -16.5]} />
        </group>
      ))}

      {/* terrazzo floor with carpeted gate lounges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor}><planeGeometry args={[36, 22]} /></mesh>
      {GATES.map((gt) => <mesh key={gt.id} rotation={[-Math.PI / 2, 0, 0]} position={[gt.x, 0.006, -5.8]} material={m.carpet}><planeGeometry args={[4.6, 2.6]} /></mesh>)}

      {/* full-height glass wall onto the apron */}
      <mesh position={[0, 4, -11]} material={m.glass}><planeGeometry args={[36, 8]} /></mesh>
      {Array.from({ length: 13 }, (_, i) => -18 + i * 3).map((x) => <mesh key={x} geometry={geo.box(0.12, 8, 0.12)} material={m.mull} position={[x, 4, -11]} />)}
      {[2.8, 5.6, 7.9].map((y) => <mesh key={y} geometry={geo.box(36, 0.1, 0.12)} material={m.mull} position={[0, y, -11]} />)}
      <mesh geometry={geo.box(0.3, 8, 22)} material={m.wall} position={[-18.15, 4, 0]} />
      <mesh geometry={geo.box(0.3, 8, 22)} material={m.wall} position={[18.15, 4, 0]} />
      <Ceiling height={8}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]} material={m.ceiling}><planeGeometry args={[36, 22]} /></mesh>
        {[-7, -2, 3, 8].map((z) => <mesh key={z} geometry={geo.box(32, 0.05, 0.9)} material={m.skylight} position={[0, 7.95, z]} />)}
      </Ceiling>

      {/* gates: boarding door, overhead sign, desk and rows of blue seats */}
      {GATES.map((gt, i) => (
        <group key={gt.id}>
          <mesh geometry={geo.box(2.4, 2.8, 0.2)} material={m.door} position={[gt.x, 1.4, -10.9]} />
          <mesh position={[gt.x, 3.3, -10.7]}><planeGeometry args={[3.0, 0.6]} /><meshBasicMaterial map={signs[i]} toneMapped={false} /></mesh>
          <group position={[gt.x - 2.1, 0, -9.3]}>
            <mesh geometry={geo.box(1.7, 1.05, 0.7)} material={m.desk} position={[0, 0.525, 0]} />
            <mesh geometry={geo.box(1.72, 0.18, 0.72)} material={m.deskBand} position={[0, 0.85, 0]} />
          </group>
          {[-6.4, -5.1].map((z) => (
            <group key={z} position={[gt.x, 0, z]}>
              <mesh geometry={geo.box(3.6, 0.05, 0.12)} material={m.chrome} position={[0, 0.3, 0]} />
              {seatRow.map((dx) => (
                <group key={dx} position={[dx, 0, 0]}>
                  <mesh geometry={geo.box(0.52, 0.08, 0.48)} material={m.seat} position={[0, 0.44, 0]} />
                  <mesh geometry={geo.box(0.52, 0.5, 0.06)} material={m.seat} position={[0, 0.72, 0.22]} />
                </group>
              ))}
            </group>
          ))}
        </group>
      ))}

      {/* white columns with planters */}
      {[-12, -4, 4, 12].map((x) => (
        <group key={x} position={[x, 0, 7]}>
          <mesh geometry={geo.cyl(0.4, 0.4, 8, 20)} material={m.col} position={[0, 4, 0]} />
          {[-1.1, 1.1].map((dx) => (
            <group key={dx} position={[dx, 0, 0]}>
              <mesh geometry={geo.cyl(0.35, 0.3, 0.6, 14)} material={m.planter} position={[0, 0.3, 0]} />
              <mesh geometry={geo.sphere(0.5)} material={m.plant} position={[0, 1.0, 0]} scale={[1, 1.3, 1]} />
            </group>
          ))}
        </group>
      ))}

      {/* departures board on the left wall, shopfronts on the right */}
      <group position={[-17.98, 4.4, 1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={geo.box(5.0, 1.75, 0.1)} material={m.shop} position={[0, 0, -0.06]} />
        <mesh><planeGeometry args={[4.9, 1.65]} /><meshBasicMaterial map={board} toneMapped={false} /></mesh>
      </group>
      {[[2, dutyFree], [7.5, cafe]].map(([z, t]) => (
        <group key={z as number} position={[17.98, 0, z as number]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={geo.box(4.6, 3.2, 0.1)} material={m.shopLit} position={[0, 1.6, 0.02]} />
          <mesh geometry={geo.box(4.8, 0.8, 0.2)} material={m.shop} position={[0, 3.6, 0.05]} />
          <mesh position={[0, 3.6, 0.16]}><planeGeometry args={[4.4, 0.7]} /><meshBasicMaterial map={t as THREE.Texture} toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  );
}
