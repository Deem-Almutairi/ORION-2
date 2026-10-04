"use client";

import { useEffect, useMemo } from "react";
import { Ceiling } from "./Ceiling";
import * as THREE from "three";
import type { SceneDef } from "@/lib/sim/config";
import { AMBER, ACCENT, DISPLAY, MONO, edgesOf, geo, makeCanvasTexture, redraw, whenFontsReady } from "./materials";
import { AirportHall } from "./Hall";

/** Picks the static surroundings for the selected simulation scene. */
export function Environment({ scene }: { scene: SceneDef }) {
  if (scene.id === "airport") return <AirportHall />;
  if (scene.id === "station") return <StationConcourse scene={scene} />;
  return <EventPlaza scene={scene} />;
}

/* ---------- shared helpers ---------- */



type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function signDrawer(title: string, sub: string, color: string): Draw {
  return (g, w, h) => {
    g.fillStyle = "#0d141b"; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.font = `600 64px ${DISPLAY}`; g.fillText(title, 28, 88);
    g.fillStyle = "#7d8a97"; g.font = `500 22px ${MONO}`; g.fillText(sub, w - 28 - g.measureText(sub).width, 80);
  };
}

/** Canvas textures that redraw once web fonts are ready. */
function useSigns(specs: { w: number; h: number; draw: Draw }[]) {
  const tex = useMemo(() => specs.map((s) => makeCanvasTexture(s.w, s.h, s.draw)), [specs]);
  useEffect(() => { whenFontsReady(() => tex.forEach((t, i) => redraw(t, specs[i].draw))); }, [tex, specs]);
  return tex;
}

function tiledFloor(base: string, line: string, repeat: [number, number]) {
  const t = makeCanvasTexture(256, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = line; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  return t;
}

/* ---------- outdoor event plaza ---------- */

function EventPlaza({ scene }: { scene: SceneDef }) {
  const specs = useMemo(() => [
    { w: 1024, h: 400, draw: ((g, w, h) => {
      g.fillStyle = "#050a10"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const x = (i / 26) * w, bh = h * (0.25 + 0.6 * Math.abs(Math.sin(i * 1.7)));
        g.fillStyle = `rgba(34,211,238,${0.25 + 0.5 * Math.abs(Math.sin(i))})`;
        g.fillRect(x + 6, h - bh, w / 26 - 12, bh);
      }
      g.fillStyle = "#e6edf2"; g.font = `700 92px ${DISPLAY}`;
      const t = "LIVE ON STAGE"; g.fillText(t, (w - g.measureText(t).width) / 2, 130);
    }) as Draw },
    { w: 512, h: 128, draw: signDrawer("ENTRY", "GATE 1", AMBER) },
    { w: 512, h: 128, draw: signDrawer("FOOD", "COURT", AMBER) },
    ...scene.zones.map((z) => ({ w: 512, h: 128, draw: signDrawer(z.id, "SECTION", ACCENT) })),
  ], [scene]);
  const [screen, entry, food, ...zoneSigns] = useSigns(specs);
  const floor = useMemo(() => tiledFloor("#10141a", "#1a212b", [18, 12]), []);
  const m = useMemo(() => ({
    stage: new THREE.MeshStandardMaterial({ color: "#151b23", roughness: 0.6, metalness: 0.3 }),
    truss: new THREE.MeshStandardMaterial({ color: "#56616d", roughness: 0.4, metalness: 0.7 }),
    barrier: new THREE.MeshStandardMaterial({ color: "#8a96a3", roughness: 0.4, metalness: 0.6 }),
    kiosk: new THREE.MeshStandardMaterial({ color: "#1d252f", roughness: 0.7 }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2b0").multiplyScalar(1.6), toneMapped: false }),
    beam: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  }), []);
  const beamGeo = useMemo(() => { const g = new THREE.ConeGeometry(1.6, 9, 24, 1, true); g.translate(0, -4.5, 0); return g; }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[72, 48]} />
        <meshStandardMaterial map={floor} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* stage, roof truss, LED screen, speaker stacks */}
      <mesh geometry={geo.box(20, 1.2, 4)} material={m.stage} position={[0, 0.6, -13.2]} />
      {[-10, 10].map((x) => <mesh key={x} geometry={geo.box(0.35, 8, 0.35)} material={m.truss} position={[x, 4, -12]} />)}
      <mesh geometry={geo.box(20.4, 0.35, 0.35)} material={m.truss} position={[0, 8, -12]} />
      <mesh position={[0, 4.6, -13.1]}>
        <planeGeometry args={[11, 4.3]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      {[-7.8, 7.8].map((x) => <mesh key={x} geometry={geo.box(1.4, 3, 1.2)} material={m.kiosk} position={[x, 2.7, -12.4]} />)}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} geometry={beamGeo} material={m.beam} position={[x, 7.8, -11.8]} rotation={[0.35, 0, x * 0.03]} />
      ))}

      {/* crowd barrier at the stage front and low dividers between sections */}
      <mesh geometry={geo.box(30, 1.1, 0.08)} material={m.barrier} position={[0, 0.55, -10.75]} />
      {[-9, -3, 3, 9].map((x) => <mesh key={x} geometry={geo.box(0.08, 1.0, 6.2)} material={m.barrier} position={[x, 0.5, -7.5]} />)}
      {scene.zones.map((z, i) => (
        <mesh key={z.id} position={[z.x, 2.6, -10.7]}>
          <planeGeometry args={[1.8, 0.45]} />
          <meshBasicMaterial map={zoneSigns[i]} toneMapped={false} />
        </mesh>
      ))}

      {/* food stalls along both sides */}
      {[-16.5, 16.5].map((x) =>
        [-1, 3, 7].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh geometry={geo.box(3, 2.6, 2)} material={m.kiosk} position={[0, 1.3, 0]} />
            <mesh position={[0, 2.95, 1.01]}>
              <planeGeometry args={[2.4, 0.6]} />
              <meshBasicMaterial map={food} toneMapped={false} />
            </mesh>
          </group>
        )))}

      {/* light poles */}
      {[[-14, -4], [14, -4], [-14, 6], [14, 6]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh geometry={geo.cyl(0.08, 0.1, 6, 10)} material={m.truss} position={[0, 3, 0]} />
          <mesh geometry={geo.box(0.6, 0.12, 0.3)} material={m.lamp} position={[0, 6.05, 0]} />
          <pointLight color="#ffe2b0" intensity={10} distance={14} decay={2} position={[0, 5.6, 0]} />
        </group>
      ))}

      {/* entry arch */}
      <group position={[0, 0, 10.6]}>
        {[-3, 3].map((x) => <mesh key={x} geometry={geo.box(0.4, 4, 0.4)} material={m.truss} position={[x, 2, 0]} />)}
        <mesh geometry={geo.box(6.4, 0.8, 0.4)} material={m.truss} position={[0, 4.3, 0]} />
        <mesh position={[0, 4.3, -0.21]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.6, 0.65]} />
          <meshBasicMaterial map={entry} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- metro station concourse ---------- */

function StationConcourse({ scene }: { scene: SceneDef }) {
  const specs = useMemo(() => [
    ...scene.zones.map((z) => ({ w: 512, h: 128, draw: signDrawer(z.id, "PLATFORMS", ACCENT) })),
    { w: 1024, h: 320, draw: ((g, w, h) => {
      g.fillStyle = "#070c11"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#808c98"; g.font = `500 24px ${MONO}`;
      g.fillText("LINE", 30, 46); g.fillText("DESTINATION", 200, 46); g.fillText("DUE", 820, 46);
      const rows: [string, string, string][] = [["1", "CITY CENTRE", "2 MIN"], ["2", "UNIVERSITY", "4 MIN"], ["3", "STADIUM", "5 MIN"], ["1", "AIRPORT", "7 MIN"], ["2", "NORTH TERMINAL", "9 MIN"]];
      g.font = `600 30px ${MONO}`;
      rows.forEach(([l, d, t], i) => { const y = 96 + i * 46; g.fillStyle = "#22D3EE"; g.fillText(l, 40, y); g.fillStyle = "#E6EDF2"; g.fillText(d, 200, y); g.fillStyle = AMBER; g.fillText(t, 820, y); });
    }) as Draw },
  ], [scene]);
  const tex = useSigns(specs);
  const zoneSigns = tex.slice(0, scene.zones.length), board = tex[scene.zones.length];
  const floor = useMemo(() => tiledFloor("#141a21", "#1c242e", [24, 14]), []);
  const m = useMemo(() => ({
    wall: new THREE.MeshStandardMaterial({ color: "#121921", roughness: 0.85 }),
    gate: new THREE.MeshStandardMaterial({ color: "#2b3540", roughness: 0.35, metalness: 0.6 }),
    flap: new THREE.MeshStandardMaterial({ color: "#9be8f5", transparent: true, opacity: 0.25, roughness: 0.1 }),
    ok: new THREE.MeshBasicMaterial({ color: new THREE.Color("#34d399").multiplyScalar(1.4), toneMapped: false }),
    stair: new THREE.MeshStandardMaterial({ color: "#0b1015", roughness: 0.9 }),
    rail: new THREE.MeshStandardMaterial({ color: "#8a96a3", metalness: 0.7, roughness: 0.3 }),
    strip: new THREE.MeshBasicMaterial({ color: new THREE.Color("#cfe6f2").multiplyScalar(0.9), toneMapped: false }),
    col: new THREE.MeshStandardMaterial({ color: "#1a222c", roughness: 0.6 }),
    machine: new THREE.MeshStandardMaterial({ color: "#20303d", roughness: 0.5, metalness: 0.4 }),
  }), []);
  const cabinet = geo.box(0.22, 1.0, 1.4);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 22]} />
        <meshStandardMaterial map={floor} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh geometry={geo.box(36, 7, 0.3)} material={m.wall} position={[0, 3.5, -11.15]} />
      <mesh geometry={geo.box(0.3, 7, 22)} material={m.wall} position={[-18.15, 3.5, 0]} />
      <mesh geometry={geo.box(0.3, 7, 22)} material={m.wall} position={[18.15, 3.5, 0]} />
      <Ceiling height={7}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7, 0]}>
          <planeGeometry args={[36, 22]} />
          <meshBasicMaterial color="#090d12" />
        </mesh>
        {[-8, -3, 2, 7].map((z) => <mesh key={z} geometry={geo.box(30, 0.05, 0.3)} material={m.strip} position={[0, 6.8, z]} />)}
        <lineSegments geometry={edgesOf(geo.box(36, 7, 22))} position={[0, 3.5, 0]}>
          <lineBasicMaterial color="#1b2530" />
        </lineSegments>
      </Ceiling>

      {/* fare-gate lines: four cabinets per line, signs overhead, stairs behind */}
      {scene.zones.map((z, i) => (
        <group key={z.id}>
          {[-1.5, -0.5, 0.5, 1.5].map((dx) => (
            <group key={dx} position={[z.x + dx, 0, -8.3]}>
              <mesh geometry={cabinet} material={m.gate} position={[0, 0.5, 0]} />
              <mesh geometry={geo.box(0.08, 0.06, 0.12)} material={m.ok} position={[0, 1.03, 0.5]} />
              <mesh geometry={geo.plane(0.5, 0.6)} material={m.flap} position={[0.36, 0.7, 0]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ))}
          <mesh position={[z.x, 3.2, -8.3]}>
            <planeGeometry args={[2.2, 0.55]} />
            <meshBasicMaterial map={zoneSigns[i]} toneMapped={false} />
          </mesh>
          <mesh geometry={geo.box(3.4, 0.05, 1.8)} material={m.stair} position={[z.x, 0.03, -10.1]} />
          {[-1.75, 1.75].map((dx) => <mesh key={dx} geometry={geo.box(0.06, 1, 1.8)} material={m.rail} position={[z.x + dx, 0.5, -10.1]} />)}
        </group>
      ))}

      {[-12, -4, 4, 12].map((x) => <mesh key={x} geometry={geo.box(0.9, 7, 0.9)} material={m.col} position={[x, 3.5, 4]} />)}
      {[-17.6, 17.6].map((x) => [0, 3, 6].map((z) => (
        <mesh key={`${x}${z}`} geometry={geo.box(0.6, 1.8, 0.9)} material={m.machine} position={[x, 0.9, z]} />
      )))}
      <group position={[-17.95, 4.4, 2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={geo.box(4.9, 1.6, 0.1)} material={m.col} position={[0, 0, -0.06]} />
        <mesh>
          <planeGeometry args={[4.8, 1.5]} />
          <meshBasicMaterial map={board} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
