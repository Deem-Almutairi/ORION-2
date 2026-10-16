"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Ceiling } from "./Ceiling";
import type { SceneDef } from "@/lib/sim/config";
import { DISPLAY, MONO, geo, makeCanvasTexture, redraw, whenFontsReady } from "./materials";
import { AirportHall } from "./Hall";

/**
 * Static surroundings for each simulation scene. Each place has its own time of day,
 * materials and landmarks so it reads as a different location at a glance:
 * a concert at night, an underground station at rush hour, a sunlit airport terminal.
 */
export function Environment({ scene }: { scene: SceneDef }) {
  if (scene.id === "airport") return <AirportHall />;
  if (scene.id === "station") return <StationConcourse scene={scene} />;
  return <EventPlaza scene={scene} />;
}

/* ---------- shared helpers ---------- */

export type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

/** Canvas textures that redraw once web fonts are ready. */
export function useSigns(specs: { w: number; h: number; draw: Draw }[]) {
  const tex = useMemo(() => specs.map((s) => makeCanvasTexture(s.w, s.h, s.draw)), [specs]);
  useEffect(() => { whenFontsReady(() => tex.forEach((t, i) => redraw(t, specs[i].draw))); }, [tex, specs]);
  return tex;
}

export function repeatTex(t: THREE.CanvasTexture, rx: number, ry: number) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

/** Unlit material bright enough to bloom. */
export const glow = (hex: string, k: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

/* =====================================================================
   Outdoor concert at night
   ===================================================================== */

const STAGE_COLORS = ["#ff3dc8", "#3dd6ff", "#ffd23d", "#9b5cff"];

function drawSkyline(seed: number): Draw {
  return (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let x = 0, i = seed;
    while (x < w) {
      const bw = 40 + ((i * 37) % 90), bh = h * (0.25 + ((i * 53) % 70) / 100);
      g.fillStyle = "#0a0814"; g.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 10; wy < h - 6; wy += 14) {
        for (let wx = x + 6; wx < x + bw - 8; wx += 11) {
          if (((wx * 7 + wy * 13 + i) % 9) < 3) {
            g.fillStyle = ((wx + wy) % 5) < 2 ? "rgba(255,206,140,.85)" : "rgba(160,190,255,.55)";
            g.fillRect(wx, wy, 5, 7);
          }
        }
      }
      if (i % 4 === 0) { g.fillStyle = "#ff3344"; g.fillRect(x + bw / 2 - 2, h - bh - 8, 4, 4); }
      x += bw + 4; i++;
    }
  };
}

function drawStageScreen(g: CanvasRenderingContext2D, w: number, h: number) {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, "#2a0636"); gr.addColorStop(0.5, "#6b1a8a"); gr.addColorStop(1, "#0b2a5c");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 32; i++) {
    const x = (i / 32) * w, bh = h * (0.15 + 0.55 * Math.abs(Math.sin(i * 1.7)));
    g.fillStyle = `rgba(255,${80 + (i * 9) % 150},${200 + (i * 5) % 55},${0.35 + 0.4 * Math.abs(Math.sin(i))})`;
    g.fillRect(x + 4, h - bh, w / 32 - 8, bh);
  }
  g.fillStyle = "#ffffff"; g.font = `700 104px ${DISPLAY}`;
  const t = "LIVE TONIGHT"; g.fillText(t, (w - g.measureText(t).width) / 2, 140);
  g.fillStyle = "#ffd6f5"; g.font = `500 30px ${MONO}`;
  const s = "MAIN STAGE · 21:30"; g.fillText(s, (w - g.measureText(s).width) / 2, 190);
}

function drawSectionSign(id: string): Draw {
  return (g, w, h) => {
    g.fillStyle = "#14051f"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#ff3dc8"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = "#ffffff"; g.font = `700 70px ${DISPLAY}`; g.fillText(id, 30, 92);
    g.fillStyle = "#ff9be6"; g.font = `500 24px ${MONO}`; g.fillText("STANDING", w - 170, 82);
  };
}

function drawStall(name: string, color: string): Draw {
  return (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff"; g.font = `700 56px ${DISPLAY}`;
    g.fillText(name, (w - g.measureText(name).width) / 2, 84);
  };
}

function drawAwning(a: string, b: string): Draw {
  return (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); } };
}

function EventPlaza({ scene }: { scene: SceneDef }) {
  const specs = useMemo(() => [
    { w: 1024, h: 420, draw: drawStageScreen },
    { w: 2048, h: 256, draw: drawSkyline(3) },
    { w: 2048, h: 256, draw: drawSkyline(11) },
    { w: 512, h: 128, draw: drawStall("BURGERS", "#c0262d") },
    { w: 512, h: 128, draw: drawStall("TACOS", "#d98a00") },
    { w: 512, h: 128, draw: drawStall("DRINKS", "#1a7fb8") },
    { w: 256, h: 64, draw: drawAwning("#ffffff", "#d7263d") },
    { w: 256, h: 64, draw: drawAwning("#ffffff", "#f2a900") },
    { w: 512, h: 128, draw: drawStall("ENTRY · GATE 1", "#5a1a8a") },
    ...scene.zones.map((z) => ({ w: 512, h: 128, draw: drawSectionSign(z.id) })),
  ], [scene]);
  const [screen, skyA, skyB, burgers, tacos, drinks, awnRed, awnYel, entry, ...zoneSigns] = useSigns(specs);
  const stalls = [burgers, tacos, drinks], awnings = [awnRed, awnYel, awnRed];

  const ground = useMemo(() => repeatTex(makeCanvasTexture(256, 256, (g) => {
    g.fillStyle = "#2a2b35"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const v = 34 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v + 6})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  }), 20, 14), []);

  const m = useMemo(() => ({
    stage: new THREE.MeshStandardMaterial({ color: "#16121e", roughness: 0.6, metalness: 0.3 }),
    truss: new THREE.MeshStandardMaterial({ color: "#8d8a99", roughness: 0.35, metalness: 0.8 }),
    barrier: new THREE.MeshStandardMaterial({ color: "#c3c7d0", roughness: 0.35, metalness: 0.7 }),
    speaker: new THREE.MeshStandardMaterial({ color: "#0c0c10", roughness: 0.8 }),
    kiosk: new THREE.MeshStandardMaterial({ color: "#2c2530", roughness: 0.7 }),
    counter: glow("#ffcf8a", 1.3),
    bulb: glow("#ffd49a", 3.2),
    wire: new THREE.LineBasicMaterial({ color: "#3a3440" }),
    pole: new THREE.MeshStandardMaterial({ color: "#3d3a46", roughness: 0.5, metalness: 0.6 }),
    grass: new THREE.MeshStandardMaterial({ color: "#16301f", roughness: 1 }),
    tree: new THREE.MeshStandardMaterial({ color: "#10241a", roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#2a2018", roughness: 1 }),
    strip: STAGE_COLORS.map((c) => glow(c, 2.4)),
  }), []);

  // Sweeping coloured beams from the stage roof, and a colour-cycling wash over the crowd.
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const beamGeo = useMemo(() => { const g = new THREE.ConeGeometry(1.5, 14, 24, 1, true); g.translate(0, -7, 0); return g; }, []);
  const beamMats = useMemo(() => STAGE_COLORS.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })), []);
  const wash = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    beams.current.forEach((b, i) => { if (b) { b.rotation.z = Math.sin(t * 0.7 + i * 1.3) * 0.55; b.rotation.x = 0.55 + Math.sin(t * 0.5 + i) * 0.2; } });
    if (wash.current) wash.current.color.setHSL((0.85 + Math.sin(t * 0.3) * 0.12 + 1) % 1, 0.9, 0.6);
  });

  // Festoon (string) lights hung between the poles.
  const festoon = useMemo(() => {
    const runs: [number, number, number, number][] = [[-14, -4, 14, -4], [-14, 6, 14, 6], [-14, -4, -14, 6], [14, -4, 14, 6], [-14, 1, 14, 1]];
    const bulbs: [number, number, number][] = [];
    const lines: THREE.Line[] = [];
    for (const [x0, z0, x1, z1] of runs) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = 5.4 - Math.sin(t * Math.PI) * 1.1;
        pts.push(new THREE.Vector3(x, y, z));
        if (i % 2 === 0) bulbs.push([x, y - 0.12, z]);
      }
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m.wire));
    }
    return { bulbs, lines };
  }, [m]);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const im = bulbRef.current; if (!im) return;
    const o = new THREE.Object3D();
    festoon.bulbs.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
  }, [festoon]);

  return (
    <group>
      <Stars radius={70} depth={20} count={1800} factor={3} saturation={0} fade speed={0.4} />
      {/* city skyline beyond the park */}
      <mesh position={[0, 9, -42]}><planeGeometry args={[110, 14]} /><meshBasicMaterial map={skyA} transparent fog={false} toneMapped={false} /></mesh>
      <mesh position={[-48, 8, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[100, 12]} /><meshBasicMaterial map={skyB} transparent fog={false} toneMapped={false} /></mesh>
      <mesh position={[48, 8, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[100, 12]} /><meshBasicMaterial map={skyA} transparent fog={false} toneMapped={false} /></mesh>

      {/* asphalt plaza inside a park */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={m.grass}><planeGeometry args={[120, 100]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 26]} /><meshStandardMaterial map={ground} roughness={0.85} metalness={0.05} /></mesh>
      {[[-24, -16], [-30, 4], [-22, 16], [24, -14], [30, 6], [22, 17], [-8, 20], [10, 21]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh geometry={geo.cyl(0.18, 0.25, 2.2, 8)} material={m.trunk} position={[0, 1.1, 0]} />
          <mesh geometry={geo.sphere(1.8)} material={m.tree} position={[0, 3.4, 0]} scale={[1, 1.2, 1]} />
        </group>
      ))}

      {/* main stage: deck, roof truss, LED wall, speaker stacks, light bars, sweeping beams */}
      <mesh geometry={geo.box(22, 1.4, 5)} material={m.stage} position={[0, 0.7, -13.6]} />
      {[-11, 11].map((x) => <mesh key={x} geometry={geo.box(0.45, 10, 0.45)} material={m.truss} position={[x, 5, -12]} />)}
      <mesh geometry={geo.box(22.5, 0.5, 0.5)} material={m.truss} position={[0, 10, -12]} />
      <mesh geometry={geo.box(22.5, 0.5, 0.5)} material={m.truss} position={[0, 10, -15]} />
      <mesh position={[0, 5.4, -14.8]}><planeGeometry args={[14, 5.8]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>
      {[-9, 9].map((x) => (
        <group key={x}>
          <mesh geometry={geo.box(1.8, 4.2, 1.4)} material={m.speaker} position={[x, 3.5, -12.6]} />
          <mesh geometry={geo.box(1.8, 3.0, 1.4)} material={m.speaker} position={[x, 8.0, -12.6]} />
        </group>
      ))}
      {STAGE_COLORS.map((_, i) => <mesh key={i} geometry={geo.box(20, 0.12, 0.12)} material={m.strip[i]} position={[0, 9.6 - i * 0.22, -11.8]} />)}
      {[-7, -2.5, 2.5, 7].map((x, i) => (
        <mesh key={x} ref={(el) => { beams.current[i] = el; }} geometry={beamGeo} material={beamMats[i]} position={[x, 9.7, -12]} />
      ))}
      <pointLight ref={wash} intensity={60} distance={26} decay={1.6} position={[0, 7, -9]} />
      <pointLight color="#3dd6ff" intensity={25} distance={18} decay={1.6} position={[-10, 5, -8]} />
      <pointLight color="#ffd23d" intensity={25} distance={18} decay={1.6} position={[10, 5, -8]} />

      {/* front-of-stage crowd barrier and section dividers */}
      <mesh geometry={geo.box(26, 1.15, 0.1)} material={m.barrier} position={[0, 0.58, -10.75]} />
      {[-9, -3, 3, 9].map((x) => <mesh key={x} geometry={geo.box(0.08, 1.05, 6.2)} material={m.barrier} position={[x, 0.52, -7.5]} />)}
      {scene.zones.map((z, i) => (
        <mesh key={z.id} position={[z.x, 2.4, -10.68]}><planeGeometry args={[1.9, 0.48]} /><meshBasicMaterial map={zoneSigns[i]} toneMapped={false} /></mesh>
      ))}

      {/* food trucks with striped awnings and lit counters */}
      {[-16.8, 16.8].map((x) =>
        [-1, 3, 7].map((z, k) => (
          <group key={`${x}${z}`} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh geometry={geo.box(3.2, 2.8, 2.2)} material={m.kiosk} position={[0, 1.4, -0.2]} />
            <mesh geometry={geo.box(2.6, 0.9, 0.05)} material={m.counter} position={[0, 1.55, 0.92]} />
            <mesh position={[0, 3.0, 0.92]}><planeGeometry args={[2.8, 0.7]} /><meshBasicMaterial map={stalls[k]} toneMapped={false} /></mesh>
            <mesh position={[0, 2.45, 1.35]} rotation={[-0.5, 0, 0]}><planeGeometry args={[3.2, 1.0]} /><meshStandardMaterial map={awnings[k]} side={THREE.DoubleSide} roughness={0.8} /></mesh>
            <pointLight color="#ffc070" intensity={6} distance={6} decay={2} position={[0, 1.8, 1.8]} />
          </group>
        )))}

      {/* poles and festoon lights */}
      {[[-14, -4], [14, -4], [-14, 6], [14, 6], [-14, 1], [14, 1]].map(([x, z]) => (
        <mesh key={`${x}${z}`} geometry={geo.cyl(0.08, 0.1, 5.6, 10)} material={m.pole} position={[x, 2.8, z]} />
      ))}
      {festoon.lines.map((l, i) => <primitive key={i} object={l} />)}
      <instancedMesh ref={bulbRef} args={[geo.sphere(0.07), m.bulb, festoon.bulbs.length]} frustumCulled={false} />

      {/* entry arch */}
      <group position={[0, 0, 10.8]}>
        {[-3.4, 3.4].map((x) => <mesh key={x} geometry={geo.box(0.5, 4.4, 0.5)} material={m.truss} position={[x, 2.2, 0]} />)}
        <mesh geometry={geo.box(7.3, 0.9, 0.5)} material={m.truss} position={[0, 4.7, 0]} />
        <mesh position={[0, 4.7, -0.26]} rotation={[0, Math.PI, 0]}><planeGeometry args={[3.4, 0.85]} /><meshBasicMaterial map={entry} toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

/* =====================================================================
   Underground metro station at morning rush hour
   ===================================================================== */

/** Signature colours of the five fare-gate lines. */
const LINE_COLORS = ["#e53935", "#43a047", "#1e88e5", "#fb8c00", "#8e24aa"];

function drawLineSign(id: string, color: string, closed: boolean): Draw {
  return (g, w, h) => {
    g.fillStyle = closed ? "#3a0d0d" : "#f4f6f5"; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.beginPath(); g.arc(64, h / 2, 44, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff"; g.font = `700 44px ${DISPLAY}`; g.fillText(id, 64 - g.measureText(id).width / 2, h / 2 + 16);
    g.fillStyle = closed ? "#ff6b6b" : "#1b2026"; g.font = `600 34px ${DISPLAY}`;
    g.fillText(closed ? "OUT OF SERVICE" : "EXIT  ↑  PLATFORMS", 130, h / 2 + 12);
  };
}

function drawTiles(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#aab3ae"; g.fillRect(0, 0, w, h);
  const tw = w / 4, th = h / 8;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) {
    const x = c * tw - (r % 2 ? tw / 2 : 0);
    const v = 226 + ((r * 7 + c * 3) % 5) * 4;
    g.fillStyle = `rgb(${v},${v + 3},${v})`; g.fillRect(x + 2, r * th + 2, tw - 4, th - 4);
  }
}

function drawGranite(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#7c8384"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { const v = 90 + Math.random() * 70; g.fillStyle = `rgb(${v},${v + 3},${v + 3})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = "#646a6b"; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
}

function drawRoundel(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "#d32f2f"; g.lineWidth = 40; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 30, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#123b8a"; g.fillRect(10, h / 2 - 46, w - 20, 92);
  g.fillStyle = "#ffffff"; g.font = `700 62px ${DISPLAY}`; const t = "METRO"; g.fillText(t, (w - g.measureText(t).width) / 2, h / 2 + 22);
}

function drawMap(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#f7f7f2"; g.fillRect(0, 0, w, h);
  g.lineWidth = 12; g.lineCap = "round";
  LINE_COLORS.forEach((c, i) => {
    g.strokeStyle = c; g.beginPath();
    g.moveTo(40, 60 + i * 40); g.lineTo(240 + i * 30, 60 + i * 40); g.lineTo(340 + i * 20, 180 - i * 10); g.lineTo(w - 40, 120 + i * 30); g.stroke();
  });
  g.fillStyle = "#1b2026"; g.font = `600 22px ${MONO}`; g.fillText("NETWORK MAP · YOU ARE HERE ●", 40, h - 24);
}

function drawTrains(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#06090c"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#808c98"; g.font = `500 24px ${MONO}`;
  g.fillText("LINE", 30, 46); g.fillText("TO", 200, 46); g.fillText("DUE", 820, 46);
  const rows: [string, string, string][] = [["2", "CITY CENTRE", "ARR"], ["2", "UNIVERSITY", "3 MIN"], ["3", "STADIUM", "4 MIN"], ["1", "AIRPORT", "SUSP"], ["5", "NORTH TERMINAL", "8 MIN"]];
  g.font = `600 30px ${MONO}`;
  rows.forEach(([l, d, t], i) => {
    const y = 96 + i * 46;
    g.fillStyle = LINE_COLORS[+l - 1]; g.fillRect(36, y - 26, 34, 34);
    g.fillStyle = "#fff"; g.fillText(l, 44, y);
    g.fillStyle = "#f2c94c"; g.fillText(d, 200, y);
    g.fillStyle = t === "SUSP" ? "#ff5a5a" : t === "ARR" ? "#5df28a" : "#f2c94c"; g.fillText(t, 820, y);
  });
}

function StationConcourse({ scene }: { scene: SceneDef }) {
  const specs = useMemo(() => [
    ...scene.zones.map((z, i) => ({ w: 768, h: 128, draw: drawLineSign(z.id, LINE_COLORS[i], i === 0) })),
    { w: 1024, h: 320, draw: drawTrains },
    { w: 512, h: 512, draw: drawRoundel },
    { w: 1024, h: 400, draw: drawMap },
  ], [scene]);
  const tex = useSigns(specs);
  const n = scene.zones.length;
  const lineSigns = tex.slice(0, n), board = tex[n], roundel = tex[n + 1], map = tex[n + 2];

  const m = useMemo(() => ({
    tile: new THREE.MeshStandardMaterial({ map: repeatTex(makeCanvasTexture(256, 256, drawTiles), 18, 3), roughness: 0.25, metalness: 0.05 }),
    tileSide: new THREE.MeshStandardMaterial({ map: repeatTex(makeCanvasTexture(256, 256, drawTiles), 11, 3), roughness: 0.25, metalness: 0.05 }),
    floor: new THREE.MeshStandardMaterial({ map: repeatTex(makeCanvasTexture(256, 256, drawGranite), 18, 11), roughness: 0.35, metalness: 0.15 }),
    band: new THREE.MeshStandardMaterial({ color: "#1f7a4a", roughness: 0.4 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#3b4240", roughness: 0.9 }),
    tube: glow("#eafff4", 2.2),
    gate: new THREE.MeshStandardMaterial({ color: "#b8c0c4", roughness: 0.25, metalness: 0.8 }),
    flap: new THREE.MeshStandardMaterial({ color: "#d9f3ff", transparent: true, opacity: 0.35, roughness: 0.05 }),
    ok: glow("#34e07a", 2.2),
    no: glow("#ff3030", 2.4),
    tape: new THREE.MeshStandardMaterial({ color: "#f2c200", roughness: 0.6 }),
    tactile: new THREE.MeshStandardMaterial({ color: "#e6b800", roughness: 0.7 }),
    pit: new THREE.MeshBasicMaterial({ color: "#050707" }),
    step: new THREE.MeshStandardMaterial({ color: "#5a6264", roughness: 0.6, metalness: 0.4 }),
    rail: new THREE.MeshStandardMaterial({ color: "#d0d6da", metalness: 0.85, roughness: 0.2 }),
    col: new THREE.MeshStandardMaterial({ color: "#2f6b4c", roughness: 0.5 }),
    machine: new THREE.MeshStandardMaterial({ color: "#c62828", roughness: 0.45, metalness: 0.3 }),
    screen: glow("#7fd3ff", 1.5),
    bench: new THREE.MeshStandardMaterial({ color: "#8a6a3a", roughness: 0.6 }),
  }), []);
  const cabinet = geo.box(0.24, 1.05, 1.5);

  return (
    <group>
      {/* granite floor, white tiled walls with a green line band, low ceiling with fluorescent tubes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor}><planeGeometry args={[36, 22]} /></mesh>
      <mesh position={[0, 2.75, -11.0]} material={m.tile}><planeGeometry args={[36, 5.5]} /></mesh>
      <mesh position={[-18, 2.75, 0]} rotation={[0, Math.PI / 2, 0]} material={m.tileSide}><planeGeometry args={[22, 5.5]} /></mesh>
      <mesh position={[18, 2.75, 0]} rotation={[0, -Math.PI / 2, 0]} material={m.tileSide}><planeGeometry args={[22, 5.5]} /></mesh>
      <mesh geometry={geo.box(36, 0.35, 0.05)} material={m.band} position={[0, 2.2, -10.97]} />
      <mesh geometry={geo.box(0.05, 0.35, 22)} material={m.band} position={[-17.97, 2.2, 0]} />
      <mesh geometry={geo.box(0.05, 0.35, 22)} material={m.band} position={[17.97, 2.2, 0]} />
      <Ceiling height={5.5}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]} material={m.ceiling}><planeGeometry args={[36, 22]} /></mesh>
        {[-8, -4, 0, 4, 8].map((z) => [-12, -4, 4, 12].map((x) => (
          <mesh key={`${x}${z}`} geometry={geo.box(6, 0.06, 0.18)} material={m.tube} position={[x, 5.4, z]} />
        )))}
      </Ceiling>
      <pointLight color="#eafff4" intensity={18} distance={20} decay={1.5} position={[-8, 5, -5]} />
      <pointLight color="#eafff4" intensity={18} distance={20} decay={1.5} position={[8, 5, -5]} />
      <pointLight color="#eafff4" intensity={14} distance={20} decay={1.5} position={[0, 5, 5]} />

      {/* fare-gate lines with stairs down to the platforms behind them; L1 is taped off */}
      {scene.zones.map((z, i) => {
        const closed = i === 0;
        return (
          <group key={z.id}>
            {[-1.5, -0.5, 0.5, 1.5].map((dx) => (
              <group key={dx} position={[z.x + dx, 0, -8.3]}>
                <mesh geometry={cabinet} material={m.gate} position={[0, 0.52, 0]} />
                <mesh geometry={geo.box(0.1, 0.08, 0.14)} material={closed ? m.no : m.ok} position={[0, 1.08, 0.55]} />
                {!closed && <mesh geometry={geo.plane(0.5, 0.6)} material={m.flap} position={[0.37, 0.72, 0]} rotation={[0, Math.PI / 2, 0]} />}
              </group>
            ))}
            {closed && [0.75, 1.05].map((y) => <mesh key={y} geometry={geo.box(4.2, 0.07, 0.03)} material={m.tape} position={[z.x, y, -7.5]} />)}
            <mesh position={[z.x, 3.4, -8.3]}><planeGeometry args={[3.2, 0.53]} /><meshBasicMaterial map={lineSigns[i]} toneMapped={false} /></mesh>
            <mesh geometry={geo.box(3.6, 0.06, 0.4)} material={m.tactile} position={[z.x, 0.03, -7.2]} />
            {/* stair well going down to the platforms */}
            <mesh geometry={geo.box(3.4, 0.02, 1.6)} material={m.pit} position={[z.x, 0.012, -10.15]} />
            {[0, 1, 2, 3].map((k) => <mesh key={k} geometry={geo.box(3.3, 0.06, 0.32)} material={m.step} position={[z.x, 0.02 - k * 0.005, -9.55 - k * 0.36]} />)}
            {[-1.75, 1.75].map((dx) => <mesh key={dx} geometry={geo.box(0.06, 0.06, 1.8)} material={m.rail} position={[z.x + dx, 1.0, -10.1]} />)}
            {[-1.75, 1.75].map((dx) => <mesh key={`p${dx}`} geometry={geo.box(0.06, 1.0, 0.06)} material={m.rail} position={[z.x + dx, 0.5, -9.25]} />)}
          </group>
        );
      })}

      {/* green columns, red ticket machines, network map and the train board */}
      {[-12, -4, 4, 12].map((x) => <mesh key={x} geometry={geo.box(0.9, 5.5, 0.9)} material={m.col} position={[x, 2.75, 4]} />)}
      {[-17.6, 17.6].map((x) => [0, 3, 6].map((z) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh geometry={geo.box(0.6, 1.8, 0.9)} material={m.machine} position={[0, 0.9, 0]} />
          <mesh geometry={geo.plane(0.6, 0.45)} material={m.screen} position={[x < 0 ? 0.31 : -0.31, 1.3, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} />
        </group>
      )))}
      <mesh position={[-17.97, 3.9, 2.5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[4.8, 1.5]} /><meshBasicMaterial map={board} toneMapped={false} /></mesh>
      <mesh position={[17.97, 3.6, 3]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[5.2, 2.0]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>
      {[-9, 9].map((x) => <mesh key={x} position={[x, 4.3, -10.96]}><planeGeometry args={[1.6, 1.6]} /><meshBasicMaterial map={roundel} transparent toneMapped={false} /></mesh>)}
      {[-8, 8].map((x) => <mesh key={x} geometry={geo.box(3, 0.45, 0.6)} material={m.bench} position={[x, 0.45, 8.8]} />)}
    </group>
  );
}
