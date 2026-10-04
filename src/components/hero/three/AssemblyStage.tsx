"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { placeLabel } from "@/lib/labels";
import { PARTS, type PartDef, type PartId } from "@/lib/parts";
import { placedCount, useHero } from "@/lib/store";
import { ACCENT, geo, mast, mats } from "./materials";
import { Ghost, PartModel } from "./TowerParts";

type Status = "free" | "drag" | "snap" | "return" | "placed";

const easeOutBack = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Whether the canvas is taller than wide, which switches to the stacked part layout. */
function useNarrow() {
  const size = useThree((s) => s.size);
  return size.width / size.height < 1.05;
}

export function AssemblyStage() {
  const narrow = useNarrow();
  const placed = useHero((s) => s.placed);
  const autoRequest = useHero((s) => s.autoRequest);
  const markPlaced = useHero((s) => s.markPlaced);
  const assembled = placedCount(placed) === PARTS.length;

  const snapFns = useRef(new Map<PartId, () => boolean>());
  const register = useCallback((id: PartId, fn: () => boolean) => { snapFns.current.set(id, fn); }, []);

  const ghostMats = useMemo(
    () => Object.fromEntries(PARTS.map((p) => [p.id, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.13, depthWrite: false })])) as Record<PartId, THREE.LineBasicMaterial>,
    [],
  );

  // "Assemble for me": snap the remaining parts one after another.
  const firstAuto = useRef(autoRequest);
  useEffect(() => {
    if (autoRequest === firstAuto.current) return;
    const queue = PARTS.map((p) => p.id);
    const timer = setInterval(() => {
      while (queue.length) { const fn = snapFns.current.get(queue.shift()!); if (fn?.()) return; }
      clearInterval(timer);
    }, 380);
    return () => clearInterval(timer);
  }, [autoRequest]);

  // Camera rig and the celebratory spin once assembled.
  const spin = useRef<THREE.Group>(null);
  const spinStart = useRef<number | null>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const fov = narrow ? 42 : 38;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    const fit = Math.max(1, 1.75 / aspect);
    const px = state.pointer.x * 0.3, py = state.pointer.y * 0.15;
    // Pull back as the mast rises so the whole 3.5 m unit stays in frame.
    const m = mast.value;
    if (narrow) { cam.position.set(px, 1.2 + py + m * 0.6, 7.0 + m * 2.6); look.set(0, 1.05 + m * 0.75, 0); }
    else { cam.position.set(px, 1.25 + py + m * 0.5, 4.6 * fit + m * 2.4); look.set(-0.15 * (1 - m), 0.82 + (fit - 1) * 0.4 + m * 0.95, 0); }
    cam.lookAt(look);

    const g = spin.current;
    if (!g) return;
    if (assembled) {
      if (spinStart.current === null) spinStart.current = state.clock.elapsedTime;
      const k = Math.min(1, (state.clock.elapsedTime - spinStart.current) / 2.2);
      g.rotation.y = k < 1 ? easeInOut(k) * Math.PI * 2 : g.rotation.y + dt * 0.4;
    }
  });

  return (
    <>
      <Platform />
      <Dust />
      <group ref={spin}>
        {PARTS.map((p) => (
          <DraggablePart key={p.id} def={p} narrow={narrow} ghost={ghostMats[p.id]} register={register} onPlaced={markPlaced} />
        ))}
      </group>
      {PARTS.map((p) => !placed[p.id] && (
        <Ghost key={p.id} material={ghostMats[p.id]}>
          <group position={p.target}><PartModel id={p.id} /></group>
        </Ghost>
      ))}
    </>
  );
}

function DraggablePart({ def, narrow, ghost, register, onPlaced }: {
  def: PartDef;
  narrow: boolean;
  ghost: THREE.LineBasicMaterial;
  register: (id: PartId, fn: () => boolean) => void;
  onPlaced: (id: PartId) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const target = useMemo(() => new THREE.Vector3(...def.target), [def]);
  const home = useMemo(() => new THREE.Vector3(...(narrow ? def.home.narrow : def.home.wide)), [def, narrow]);
  const s = useRef({
    status: "free" as Status, hover: false,
    dragTo: new THREE.Vector3(), from: new THREE.Vector3(), fromRot: new THREE.Euler(), t: 0,
    plane: new THREE.Plane(), off: new THREE.Vector3(), hit: new THREE.Vector3(),
    phase: Math.random() * 6, spin: (Math.random() - 0.5) * 0.8, pulseT: -1,
  });
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), n: new THREE.Vector3() }), []);
  const reduced = useMemo(reducedMotion, []);
  const lift = narrow ? def.narrowLabel : 40;

  const screenDistance = useCallback(() => {
    const g = group.current!;
    g.getWorldPosition(tmp.a).project(camera);
    tmp.b.copy(target).project(camera);
    return Math.hypot((tmp.a.x - tmp.b.x) * size.width / 2, (tmp.a.y - tmp.b.y) * size.height / 2);
  }, [camera, size, target, tmp]);
  const snapRadius = Math.max(60, Math.min(size.width, size.height) * 0.11);

  const snap = useCallback(() => {
    const st = s.current, g = group.current;
    if (!g || st.status === "placed" || st.status === "snap") return false;
    st.status = "snap"; st.t = 0; st.from.copy(g.position); st.fromRot.copy(g.rotation);
    return true;
  }, []);
  useEffect(() => register(def.id, snap), [def.id, register, snap]);

  useFrame((state, dt) => {
    const g = group.current, st = s.current;
    if (!g) return;
    const time = state.clock.elapsedTime;
    switch (st.status) {
      case "free": {
        const bob = reduced ? 0 : Math.sin(time * 1.2 + st.phase) * 0.05;
        g.position.set(home.x, home.y + bob, home.z);
        if (!reduced) { g.rotation.y += st.spin * dt; g.rotation.x = Math.sin(time * 0.7 + st.phase) * 0.12; }
        break;
      }
      case "drag": {
        g.position.lerp(st.dragTo, Math.min(1, dt * 18));
        const k = 1 - Math.min(1, dt * 6);
        g.rotation.x *= k; g.rotation.y *= k; g.rotation.z *= k;
        break;
      }
      case "snap": {
        st.t = Math.min(1, st.t + dt / 0.45);
        g.position.lerpVectors(st.from, target, easeOutBack(st.t));
        g.rotation.set(st.fromRot.x * (1 - st.t), st.fromRot.y * (1 - st.t), st.fromRot.z * (1 - st.t));
        if (st.t >= 1) {
          st.status = "placed"; g.position.copy(target); g.rotation.set(0, 0, 0); st.pulseT = 0;
          onPlaced(def.id);
        }
        break;
      }
      case "return": {
        st.t = Math.min(1, st.t + dt / 0.6);
        g.position.lerpVectors(st.from, home, easeOutCubic(st.t));
        if (st.t >= 1) st.status = "free";
        break;
      }
    }

    // Blueprint slot brightens while the part is held near it.
    const near = st.status === "drag" && screenDistance() < snapRadius;
    const want = st.status === "placed" ? 0 : st.status === "drag" ? (near ? 0.85 : 0.4) : st.hover ? 0.32 : 0.13;
    ghost.opacity += (want - ghost.opacity) * Math.min(1, dt * 10);

    const showLabel = st.status !== "placed" && st.status !== "snap";
    placeLabel(def.id, g.getWorldPosition(tmp.n), camera, size, showLabel, lift, st.hover || st.status === "drag");

    if (process.env.NODE_ENV === "development") exposeForTests(def.id, g, target, camera, size, st.status);

    const p = pulse.current;
    if (p) {
      if (st.pulseT >= 0 && st.pulseT < 1) {
        st.pulseT += dt / 0.8;
        p.visible = true; p.scale.setScalar(1 + st.pulseT * 1.6);
        (p.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - st.pulseT);
      } else p.visible = false;
    }
  });

  const setCursor = (c: string) => { gl.domElement.style.cursor = c; };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const st = s.current, g = group.current;
    if (!g || st.status !== "free") return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    camera.getWorldDirection(tmp.n);
    st.plane.setFromNormalAndCoplanarPoint(tmp.n.negate(), g.position);
    if (e.ray.intersectPlane(st.plane, st.hit)) st.off.subVectors(g.position, st.hit); else st.off.set(0, 0, 0);
    st.dragTo.copy(g.position);
    st.status = "drag";
    setCursor("grabbing");
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const st = s.current;
    if (st.status !== "drag") return;
    e.stopPropagation();
    if (e.ray.intersectPlane(st.plane, st.hit)) st.dragTo.copy(st.hit).add(st.off);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    const st = s.current, g = group.current;
    if (!g || st.status !== "drag") return;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    setCursor(st.hover ? "grab" : "default");
    if (screenDistance() < snapRadius) snap();
    else { st.status = "return"; st.t = 0; st.from.copy(g.position); }
  };

  const grab = def.grab.map((v) => v * (narrow ? 1.3 : 1)) as [number, number, number];

  return (
    <group ref={group} position={home}>
      <PartModel id={def.id} />
      <mesh
        geometry={geo.box(...grab)}
        material={mats.grab}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerOver={() => { s.current.hover = true; if (s.current.status === "free") setCursor("grab"); }}
        onPointerOut={() => { s.current.hover = false; if (s.current.status !== "drag") setCursor("default"); }}
      />
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.33, 64]} />
        <meshBasicMaterial color={new THREE.Color(ACCENT).multiplyScalar(3)} toneMapped={false} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Development-only: publishes each part's screen position so automated touch tests can drag it. */
const testV = new THREE.Vector3();
function exposeForTests(id: PartId, g: THREE.Object3D, target: THREE.Vector3, camera: THREE.Camera, size: { width: number; height: number }, status: Status) {
  const w = window as unknown as { __orionParts?: Record<string, unknown> };
  const toPx = (v: THREE.Vector3) => ({ x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height });
  const at = toPx(g.getWorldPosition(testV).project(camera));
  const to = toPx(testV.copy(target).project(camera));
  (w.__orionParts ??= {})[id] = { at, to, status };
}

function Platform() {
  const slot = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => { if (slot.current) slot.current.opacity = 0.18 + 0.12 * Math.sin(state.clock.elapsedTime * 2); });
  return (
    <group>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.66, 0.7, 0.04, 64]} />
        <meshStandardMaterial color="#10161d" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.led}>
        <torusGeometry args={[0.69, 0.005, 8, 96]} />
      </mesh>
      <mesh position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 0.905, 96]} />
        <meshBasicMaterial ref={slot} color={ACCENT} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[24, 48, "#1c2834", "#111820"]} position={[0, -0.04, 0]} />
    </group>
  );
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const n = 380, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 10;
      a[i * 3 + 1] = -0.5 + Math.random() * 4;
      a[i * 3 + 2] = -4 + Math.random() * 7;
    }
    return a;
  }, []);
  useFrame((_, dt) => { if (ref.current && !reducedMotion()) ref.current.rotation.y += dt * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5fb3c2" size={0.018} transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}
