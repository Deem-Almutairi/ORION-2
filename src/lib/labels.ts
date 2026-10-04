import type * as THREE from "three";

/**
 * Screen-space labels pinned to 3D objects. The DOM elements are rendered by
 * <SceneLabels/> outside the canvas; scene components move them every frame.
 */
const els = new Map<string, HTMLElement>();

export function labelRef(id: string) {
  return (el: HTMLElement | null) => { if (el) els.set(id, el); else els.delete(id); };
}

/** Positions label `id` at a world point, `lift` px above it (negative = below). */
export function placeLabel(
  id: string, world: THREE.Vector3, camera: THREE.Camera, size: { width: number; height: number },
  show: boolean, lift = 0, active = false,
) {
  const el = els.get(id);
  if (!el) return;
  const v = world.clone().project(camera);
  const visible = show && v.z < 1 && v.x > -1.2 && v.x < 1.2 && v.y > -1.2 && v.y < 1.2;
  el.style.display = visible ? "" : "none";
  if (!visible) return;
  const x = Math.round((v.x * 0.5 + 0.5) * size.width), y = Math.round((-v.y * 0.5 + 0.5) * size.height);
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - ${lift}px))`;
  el.classList.toggle("active", active);
}
