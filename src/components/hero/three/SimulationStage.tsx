"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import { PHASES, sceneById, type SceneId } from "@/lib/sim/config";
import { SimEngine } from "@/lib/sim/engine";
import { placeLabel } from "@/lib/labels";
import { useHero } from "@/lib/store";
import { ACCENT, AMBER, ORANGE, getBlobTexture, mast } from "./materials";
import { Environment } from "./Environments";
import { Tower } from "./Tower";
import { mastPodY } from "./TowerParts";

const ACC = new THREE.Color(ACCENT), AMB = new THREE.Color(AMBER), ORG = new THREE.Color(ORANGE);

export function SimulationStage({ sceneId }: { sceneId: SceneId }) {
  const engine = useMemo(() => new SimEngine(sceneById(sceneId)), [sceneId]);
  const readoutTimer = useRef(0);

  useEffect(() => {
    const { pushLog, setPhase } = useHero.getState();
    engine.onEvent = pushLog;
    engine.onPhase = setPhase;
    // Development only: lets automated captures fast-forward the scenario.
    if (process.env.NODE_ENV === "development") (window as unknown as { __orionSim?: SimEngine }).__orionSim = engine;
    return () => { engine.onEvent = undefined; engine.onPhase = undefined; };
  }, [engine]);

  // Negative priority: step the simulation before any visual reads it this frame.
  useFrame((_, dt) => {
    if (useHero.getState().paused) return;
    engine.step(Math.min(dt, 0.05));
    readoutTimer.current -= dt;
    if (readoutTimer.current <= 0) { readoutTimer.current = 0.25; useHero.getState().setReadout(engine.readout()); }
  }, -1);

  return (
    <>
      <Environment scene={engine.scene} />
      <Heatmap engine={engine} />
      <Zones engine={engine} />
      <Chevrons engine={engine} />
      <Crowd engine={engine} />
      <OrionRig engine={engine} />
      <SceneTags engine={engine} />
      <SimCamera engine={engine} />
    </>
  );
}

/* ---------- crowd (instanced: one draw call per body part) ---------- */

function Crowd({ engine }: { engine: SimEngine }) {
  const n = engine.people.length;
  const refs = {
    legs: useRef<THREE.InstancedMesh>(null), torso: useRef<THREE.InstancedMesh>(null),
    head: useRef<THREE.InstancedMesh>(null), bag: useRef<THREE.InstancedMesh>(null),
    blob: useRef<THREE.InstancedMesh>(null), ring: useRef<THREE.InstancedMesh>(null),
    mark: useRef<THREE.InstancedMesh>(null),
  };
  const geos = useMemo(() => ({
    legs: new THREE.CylinderGeometry(0.13, 0.12, 0.82, 10),
    torso: new THREE.CylinderGeometry(0.17, 0.19, 0.66, 12),
    head: new THREE.SphereGeometry(0.12, 14, 12),
    bag: new THREE.BoxGeometry(0.24, 0.42, 0.36),
    blob: new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2),
    ring: new THREE.RingGeometry(0.32, 0.38, 32).rotateX(-Math.PI / 2),
    mark: new THREE.OctahedronGeometry(0.07),
  }), []);
  const blobTex = useMemo(() => getBlobTexture(), []);

  useEffect(() => {
    const t = refs.torso.current; if (!t) return;
    const c = new THREE.Color();
    engine.people.forEach((p, i) => t.setColorAt(i, c.setHex(p.look.color)));
    if (t.instanceColor) t.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const o = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const L = refs.legs.current, T = refs.torso.current, H = refs.head.current, B = refs.bag.current;
    const S = refs.blob.current, R = refs.ring.current, M = refs.mark.current;
    if (!L || !T || !H || !B || !S || !R || !M) return;
    const strength = engine.phase >= 1 ? 1 : 0.35;
    const flagCrowd = engine.phase >= 3 && engine.crowdHigh;
    engine.people.forEach((p, i) => {
      const hs = p.look.height, bob = p.moving ? Math.abs(Math.sin(p.walk)) * 0.045 : 0;
      const set = (mesh: THREE.InstancedMesh, x: number, y: number, z: number, ry = p.heading, sy = 1, s = 1) => {
        o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(s, sy * s, s); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
      };
      set(L, p.x, 0.41 * hs + bob, p.z, p.heading, hs);
      set(T, p.x, 1.15 * hs + bob, p.z, p.heading, hs);
      set(H, p.x, 1.6 * hs + bob, p.z);
      const c = Math.cos(p.heading), sn = Math.sin(p.heading);
      set(B, p.x + 0.32 * c - 0.15 * sn, 0.25, p.z - 0.32 * sn - 0.15 * c, p.heading, 1, p.look.suitcase ? 1 : 0);
      set(S, p.x, 0.012, p.z, 0);
      set(R, p.x, 0.03, p.z, 0);
      set(M, p.x, 1.95 * hs, p.z, engine.total * 2 + i);
      const k = p.det * strength;
      col.copy(flagCrowd && p.mode === "hold" ? ORG : ACC).multiplyScalar(k * 1.6);
      R.setColorAt(i, col); M.setColorAt(i, col);
    });
    for (const m of [L, T, H, B, S, R, M]) m.instanceMatrix.needsUpdate = true;
    if (R.instanceColor) R.instanceColor.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
  });

  const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false } as const;
  return (
    <group>
      <instancedMesh frustumCulled={false} ref={refs.legs} args={[geos.legs, undefined, n]}><meshStandardMaterial color="#1f262e" roughness={0.8} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.torso} args={[geos.torso, undefined, n]}><meshStandardMaterial color="#ffffff" roughness={0.7} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.head} args={[geos.head, undefined, n]}><meshStandardMaterial color="#9c8576" roughness={0.7} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.bag} args={[geos.bag, undefined, n]}><meshStandardMaterial color="#2e3742" roughness={0.5} metalness={0.3} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.blob} args={[geos.blob, undefined, n]}><meshBasicMaterial map={blobTex} transparent depthWrite={false} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.ring} args={[geos.ring, undefined, n]}><meshBasicMaterial {...additive} /></instancedMesh>
      <instancedMesh frustumCulled={false} ref={refs.mark} args={[geos.mark, undefined, n]}><meshBasicMaterial {...additive} /></instancedMesh>
    </group>
  );
}

/* ---------- ORION with vision cone and sonar ---------- */

function OrionRig({ engine }: { engine: SimEngine }) {
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const cone = useRef<THREE.MeshBasicMaterial>(null);
  const sonar = useRef<THREE.Mesh>(null);
  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(2.6, 6.5, 40, 1, true);
    g.translate(0, -3.25, 0); g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const blobTex = useMemo(() => getBlobTexture(), []);

  useFrame((_, dt) => {
    const r = root.current; if (!r) return;
    const o = engine.orion;
    r.position.set(o.x, o.moving ? Math.sin(engine.total * 3) * 0.006 : 0, o.z);
    r.rotation.y = o.heading;
    if (pivot.current) {
      pivot.current.rotation.y = engine.scanYaw;
      pivot.current.position.y = 1.24 + mastPodY(mast.value) + 0.05;
    }
    if (cone.current) {
      const want = engine.phase === 0 ? 0.03 : engine.phase === 1 ? 0.11 : 0.06;
      cone.current.opacity += (want - cone.current.opacity) * Math.min(1, dt * 2);
    }
    const s = sonar.current;
    if (s) {
      const k = (engine.total % 1.6) / 1.6;
      s.scale.setScalar(1 + k * 7);
      (s.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.5;
    }
  });

  return (
    <group ref={root}>
      <Tower />
      <pointLight color={ACCENT} intensity={1.4} distance={4} decay={2} position={[0, 1.1, 0.7]} />
      <group ref={pivot} position={[0, 1.24, 0.05]}>
        <mesh geometry={coneGeo} rotation={[0.55, 0, 0]}>
          <meshBasicMaterial ref={cone} color={ACCENT} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={sonar} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 64]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={blobTex} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------- floor heatmap ---------- */

function Heatmap({ engine }: { engine: SimEngine }) {
  const { canvas, ctx, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 288; canvas.height = 176;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, ctx, tex };
  }, []);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const timer = useRef(0);

  useFrame((_, dt) => {
    const m = mat.current; if (!m) return;
    const want = engine.phase >= 2 ? 1 : 0;
    m.opacity += (want - m.opacity) * Math.min(1, dt * 1.5);
    timer.current -= dt;
    if (m.opacity < 0.01 || timer.current > 0) return;
    timer.current = 0.2;
    const w = canvas.width, h = canvas.height, rad = (2.2 / 36) * w;
    ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of engine.people) {
      const x = ((p.x + 18) / 36) * w, y = ((p.z + 11) / 22) * h;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(255,255,255,.09)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gr; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    // Continuous ramp: faint cyan (sparse) -> amber (warning) -> orange (critical).
    const stops: [number, number, number, number, number][] = [
      [0.02, 34, 211, 238, 0], [0.12, 34, 211, 238, 0.22], [0.3, 251, 191, 36, 0.38], [0.5, 249, 115, 22, 0.55],
    ];
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i + 3] / 255; // accumulated alpha = local crowd intensity
      let c = stops[stops.length - 1];
      if (v <= stops[0][0]) { d[i + 3] = 0; continue; }
      for (let k = 1; k < stops.length; k++) {
        if (v <= stops[k][0]) {
          const a = stops[k - 1], b = stops[k], t = (v - a[0]) / (b[0] - a[0]);
          c = [v, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t];
          break;
        }
      }
      d[i] = c[1]; d[i + 1] = c[2]; d[i + 2] = c[3]; d[i + 3] = c[4] * 255;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.putImageData(img, 0, 0);
    tex.needsUpdate = true;
  });

  return (
    <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[36, 22]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ---------- gate zone outlines and the crowded-zone fill ---------- */

function Zones({ engine }: { engine: SimEngine }) {
  const lines = useRef<(Line2 | null)[]>([]);
  const fill = useRef<THREE.MeshBasicMaterial>(null);
  const crowd = engine.crowdZone;

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 2);
    engine.zones.forEach((z, i) => {
      const l = lines.current[i]; if (!l) return;
      const m = l.material;
      const want = engine.phase >= 2 ? (z.level === "High" ? 1 : 0.45) : 0;
      m.opacity += (want - m.opacity) * k;
      m.color.copy(z.level === "High" ? ORG : z.level === "Moderate" ? AMB : ACC);
    });
    const f = fill.current;
    if (f) {
      const pulse = 0.5 + 0.5 * Math.sin(engine.total * 4);
      const want = engine.phase >= 3 && engine.crowdHigh ? 0.08 + 0.12 * pulse : 0;
      f.opacity += (want - f.opacity) * Math.min(1, dt * 3);
    }
  });

  return (
    <group>
      {engine.zones.map((z, i) => (
        <Line
          key={z.id}
          ref={(el) => { lines.current[i] = el as Line2 | null; }}
          points={[[z.x0 + 0.15, 0.04, z.z0 + 0.15], [z.x1 - 0.15, 0.04, z.z0 + 0.15], [z.x1 - 0.15, 0.04, z.z1], [z.x0 + 0.15, 0.04, z.z1], [z.x0 + 0.15, 0.04, z.z0 + 0.15]]}
          color={ACCENT}
          lineWidth={2}
          transparent
          opacity={0}
          depthWrite={false}
        />
      ))}
      <mesh position={[crowd.x, 0.03, (crowd.z0 + crowd.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[crowd.x1 - crowd.x0 - 0.3, crowd.z1 - crowd.z0 - 0.15]} />
        <meshBasicMaterial ref={fill} color={ORANGE} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- guidance arrows from the crowded gate to the relief gate ---------- */

function Chevrons({ engine }: { engine: SimEngine }) {
  const from = useMemo(() => {
    const c = engine.crowdZone.x, r = engine.reliefZone.x, dir = Math.sign(r - c) || 1;
    return new THREE.Vector3(c + 1.6 * dir, 0.05, -4.6);
  }, [engine]);
  const to = useMemo(() => {
    const r = engine.reliefZone.x, dir = Math.sign(r - engine.crowdZone.x) || 1;
    return new THREE.Vector3(r - 0.6 * dir, 0.05, -6.6);
  }, [engine]);
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.4, -0.1); s.lineTo(0, 0.3); s.lineTo(0.4, -0.1); s.lineTo(0.4, -0.33); s.lineTo(0, 0.07); s.lineTo(-0.4, -0.33); s.closePath();
    return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
  }, []);
  const angle = Math.atan2(to.x - from.x, to.z - from.z) + Math.PI;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, dt) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = (i / 6 + engine.total * 0.35) % 1;
      m.position.lerpVectors(from, to, t);
      const mat = m.material as THREE.MeshBasicMaterial;
      const want = engine.phase === 4 ? Math.sin(t * Math.PI) * 0.95 : 0;
      mat.opacity += (want - mat.opacity) * Math.min(1, dt * 3);
    });
  });

  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo} rotation={[0, angle, 0]}>
          <meshBasicMaterial color={new THREE.Color(ACCENT).multiplyScalar(1.6)} transparent opacity={0} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- labels pinned in the scene ---------- */

function SceneTags({ engine }: { engine: SimEngine }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  const crowd = engine.crowdZone, relief = engine.reliefZone;
  useFrame(() => {
    placeLabel("orion", v.set(engine.orion.x, 1.6 + mastPodY(mast.value), engine.orion.z), camera, size, true);
    placeLabel("alert", v.set(crowd.x, 2.9, -7.4), camera, size, engine.phase >= 3 && engine.crowdHigh);
    placeLabel("rec", v.set(relief.x, 2.9, -7.6), camera, size, engine.phase === 4);
  });
  return null;
}

/* ---------- cinematic camera, one framing per phase ---------- */

function SimCamera({ engine }: { engine: SimEngine }) {
  const pos = useRef(new THREE.Vector3(-16, 5, 10));
  const look = useRef(new THREE.Vector3(-10, 1, 3));
  const wantPos = useMemo(() => new THREE.Vector3(), []);
  const wantLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const narrow = state.size.width / state.size.height < 1.05;
    const fov = narrow ? 50 : 40;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const k = narrow ? 1.45 : 1;
    const o = engine.orion, fx = Math.sin(o.heading), fz = Math.cos(o.heading);
    const crowdX = engine.crowdZone.x, relX = engine.reliefZone.x, side = Math.sign(relX - crowdX) || 1;
    switch (engine.phase) {
      case 0: wantPos.set(o.x - fx * 5.5 * k + fz * 1.6, 3.0 * k, o.z - fz * 5.5 * k - fx * 1.6); wantLook.set(o.x + fx * 2.5, 1.0, o.z + fz * 2.5); break;
      case 1: { const a = engine.t * 0.22 + 0.6; wantPos.set(o.x + Math.cos(a) * 5.2 * k, 2.6 * k, o.z + Math.sin(a) * 5.2 * k); wantLook.set(o.x + fx * 1.5, 1.1, o.z + fz * 1.5); break; }
      case 2: wantPos.set(1, 19 * k, 11 * k); wantLook.set(1, 0, -3); break;
      case 3: wantPos.set(crowdX - 5.5 * side, 5.2 * k, 3.8 * k); wantLook.set(crowdX + 1.5 * side, 0.8, -7); break;
      default: { const t = (engine.t - PHASES[4].start) / 15, mid = (crowdX + relX) / 2; wantPos.set(THREE.MathUtils.lerp(mid - 3 * side, mid - 8 * side, t), THREE.MathUtils.lerp(6.5, 11, t) * k, THREE.MathUtils.lerp(4.5, 10, t) * k); wantLook.set(THREE.MathUtils.lerp(mid, mid - 2 * side, t), 0.6, THREE.MathUtils.lerp(-6.5, -4, t)); }
    }
    const s = useHero.getState().paused ? 0 : 1 - Math.exp(-dt * 1.4);
    pos.current.lerp(wantPos, s); look.current.lerp(wantLook, s);
    cam.position.copy(pos.current); cam.lookAt(look.current);
  });
  return null;
}
