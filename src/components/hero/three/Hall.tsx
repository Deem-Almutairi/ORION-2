"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SCENES } from "@/lib/sim/config";

const GATES = SCENES.find((s) => s.id === "airport")!.zones;
import { Ceiling } from "./Ceiling";
import { AMBER, DISPLAY, MONO, edgesOf, geo, makeCanvasTexture, redraw, whenFontsReady } from "./materials";

/** Static airport concourse: floor, walls, windows, gates, seating, columns and the departures board. */

const FLIGHTS: [string, string, string][] = [
  ["FLT 01", "A1", "ON TIME"], ["FLT 02", "A2", "ON TIME"], ["FLT 03", "B1", "DELAYED"],
  ["FLT 04", "B2", "BOARDING"], ["FLT 05", "B3", "ON TIME"],
];

function drawSign(id: string) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = "#0d141b"; g.fillRect(0, 0, w, h);
    g.fillStyle = AMBER; g.font = `600 64px ${DISPLAY}`; g.fillText(`GATE ${id}`, 28, 88);
    g.fillStyle = "#6f7d8a"; g.font = `500 22px ${MONO}`; g.fillText("BOARDING", 360, 80);
  };
}

function drawBoard(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#070c11"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#6f7d8a"; g.font = `500 24px ${MONO}`;
  g.fillText("FLIGHT", 30, 46); g.fillText("GATE", 520, 46); g.fillText("STATUS", 720, 46);
  g.font = `600 30px ${MONO}`;
  FLIGHTS.forEach(([f, gate, status], i) => {
    const y = 96 + i * 46;
    g.fillStyle = "#E6EDF2"; g.fillText(f, 30, y); g.fillText(gate, 520, y);
    g.fillStyle = status === "BOARDING" ? AMBER : status === "DELAYED" ? "#F97316" : "#22D3EE";
    g.fillText(status, 720, y);
  });
}

export function AirportHall() {
  const t = useMemo(() => {
    const floor = makeCanvasTexture(256, 256, (g) => {
      g.fillStyle = "#0c1117"; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#18212b"; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
      g.strokeStyle = "#111922"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
    });
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
    floor.repeat.set(12, 22 / 3);
    const signs = GATES.map((gt) => makeCanvasTexture(512, 128, drawSign(gt.id)));
    const board = makeCanvasTexture(1024, 320, drawBoard);
    return { floor, signs, board };
  }, []);

  useEffect(() => {
    whenFontsReady(() => {
      t.signs.forEach((s, i) => redraw(s, drawSign(GATES[i].id)));
      redraw(t.board, drawBoard);
    });
  }, [t]);

  const m = useMemo(() => ({
    wall: new THREE.MeshStandardMaterial({ color: "#10161d", roughness: 0.8 }),
    win: new THREE.MeshBasicMaterial({ color: "#0c2433" }),
    mull: new THREE.MeshBasicMaterial({ color: "#1d2a36" }),
    strip: new THREE.MeshBasicMaterial({ color: new THREE.Color("#7fa6b8").multiplyScalar(0.8), toneMapped: false }),
    bench: new THREE.MeshStandardMaterial({ color: "#222b36", roughness: 0.6, metalness: 0.2 }),
    desk: new THREE.MeshStandardMaterial({ color: "#19212b", roughness: 0.5, metalness: 0.3 }),
    door: new THREE.MeshBasicMaterial({ color: "#070b0f" }),
    doorLine: new THREE.LineBasicMaterial({ color: "#3b4b5b" }),
    col: new THREE.MeshStandardMaterial({ color: "#151c24", roughness: 0.7 }),
  }), []);

  const door = geo.plane(2.2, 2.6);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 22]} />
        <meshStandardMaterial map={t.floor} roughness={0.38} metalness={0.18} />
      </mesh>
      <mesh geometry={geo.box(36, 8, 0.3)} material={m.wall} position={[0, 4, -11.15]} />
      <mesh geometry={geo.box(0.3, 8, 22)} material={m.wall} position={[-18.15, 4, 0]} />
      <mesh geometry={geo.box(0.3, 8, 22)} material={m.wall} position={[18.15, 4, 0]} />
      <Ceiling height={8}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
          <planeGeometry args={[36, 22]} />
          <meshBasicMaterial color="#080b0f" />
        </mesh>
        {[-7, -2, 3, 8].map((z) => <mesh key={z} geometry={geo.box(32, 0.05, 0.22)} material={m.strip} position={[0, 7.6, z]} />)}
      </Ceiling>

      {Array.from({ length: 12 }, (_, i) => -16.5 + i * 3).map((x) => (
        <group key={x}>
          <mesh geometry={geo.plane(2.7, 3.2)} material={m.win} position={[x, 5.6, -10.99]} />
          <mesh geometry={geo.plane(0.06, 3.2)} material={m.mull} position={[x, 5.6, -10.98]} />
        </group>
      ))}
      {GATES.map((gt, i) => (
        <group key={gt.id}>
          <mesh geometry={door} material={m.door} position={[gt.x, 1.3, -10.98]} />
          <lineSegments geometry={edgesOf(door)} material={m.doorLine} position={[gt.x, 1.3, -10.97]} />
          <mesh position={[gt.x, 3.3, -10.95]}>
            <planeGeometry args={[2.4, 0.6]} />
            <meshBasicMaterial map={t.signs[i]} toneMapped={false} />
          </mesh>
          <mesh geometry={geo.box(1.5, 1.0, 0.6)} material={m.desk} position={[gt.x - 2.1, 0.5, -9.4]} />
          {[-6.4, -5.1].map((z) => (
            <group key={z}>
              <mesh geometry={geo.box(3.6, 0.45, 0.5)} material={m.bench} position={[gt.x, 0.225, z]} />
              <mesh geometry={geo.box(3.6, 0.4, 0.08)} material={m.bench} position={[gt.x, 0.62, z + 0.22]} />
            </group>
          ))}
        </group>
      ))}

      {[-12, -4, 4, 12].map((x) => <mesh key={x} geometry={geo.box(0.8, 8, 0.8)} material={m.col} position={[x, 4, 7]} />)}

      <group position={[-17.95, 4.6, 1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={geo.box(4.9, 1.6, 0.1)} material={m.desk} position={[0, 0, -0.06]} />
        <mesh>
          <planeGeometry args={[4.8, 1.5]} />
          <meshBasicMaterial map={t.board} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
