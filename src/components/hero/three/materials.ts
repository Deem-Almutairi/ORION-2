import * as THREE from "three";

/**
 * Shared materials and geometry caches for the ORION scenes.
 * LED and screen materials are unlit and HDR-bright when powered, so the
 * bloom pass picks them up while everything else stays below its threshold.
 */

export const ACCENT = "#22d3ee";
export const AMBER = "#fbbf24";
export const ORANGE = "#f97316";

const ledLit = new THREE.Color(ACCENT).multiplyScalar(4.2);
const ledDark = new THREE.Color("#0b4450").multiplyScalar(0.6);

export const mats = {
  dark: new THREE.MeshStandardMaterial({ color: "#2a313a", metalness: 0.45, roughness: 0.5 }),
  alu: new THREE.MeshStandardMaterial({ color: "#b9c3cd", metalness: 0.55, roughness: 0.32 }),
  head: new THREE.MeshStandardMaterial({ color: "#1b2128", metalness: 0.4, roughness: 0.42 }),
  glass: new THREE.MeshStandardMaterial({ color: "#05090c", metalness: 0.2, roughness: 0.08 }),
  acrylic: new THREE.MeshStandardMaterial({
    color: "#9be8f5", transparent: true, opacity: 0.14, roughness: 0.06, metalness: 0,
    side: THREE.DoubleSide, depthWrite: false,
  }),
  panelEdge: new THREE.LineBasicMaterial({ color: "#9be8f5", transparent: true, opacity: 0.5 }),
  led: new THREE.MeshBasicMaterial({ color: ledDark.clone(), toneMapped: false }),
  screen: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.17, 0.17, 0.17), toneMapped: false }),
  /** Invisible but raycastable: used for generous grab areas. */
  grab: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
};

/** 0 = unpowered, 1 = online. Animated by <PowerDriver/>. */
export const power = { value: 0, target: 0 };

export function applyPower(k: number) {
  mats.led.color.copy(ledDark).lerp(ledLit, k);
  mats.screen.color.setScalar(0.17 + 0.95 * k);
}

/* ---------- geometry cache ---------- */

const cache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = cache.get(key) as T | undefined;
  if (!g) { g = make(); cache.set(key, g); }
  return g;
}

export const geo = {
  box: (w: number, h: number, d: number) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  plane: (w: number, h: number) => cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
  cyl: (rt: number, rb: number, h: number, s = 24) => cached(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)),
  sphere: (r: number) => cached(`s${r}`, () => new THREE.SphereGeometry(r, 14, 12)),
  torus: (r: number, t: number) => cached(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 10, 40)),
};

const edgeCache = new WeakMap<THREE.BufferGeometry, THREE.EdgesGeometry>();
export function edgesOf(g: THREE.BufferGeometry) {
  let e = edgeCache.get(g);
  if (!e) { e = new THREE.EdgesGeometry(g, 30); edgeCache.set(g, e); }
  return e;
}

/* ---------- canvas textures ---------- */

export function makeCanvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function redraw(t: THREE.CanvasTexture, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = t.image as HTMLCanvasElement;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  draw(ctx, c.width, c.height);
  t.needsUpdate = true;
}

export const MONO = '"IBM Plex Mono", ui-monospace, monospace';
export const DISPLAY = '"Chakra Petch", "Bahnschrift", sans-serif';

/** Illustrative mini-dashboard shown on the tower's tablet. */
export function drawTabletScreen(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#03101a"; g.fillRect(0, 0, w, h);
  g.fillStyle = ACCENT; g.font = `600 26px ${MONO}`; g.fillText("ORION · LIVE", 24, 44);
  g.fillStyle = "#7fa9b5"; g.font = `500 20px ${MONO}`; g.fillText("ZONE MAP", 340, 44);
  const a = [0.18, 0.6, 0.28, 0.9, 0.22, 0.45];
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(34,211,238,${a[i]})`;
    g.fillRect(24 + (i % 3) * 158, 70 + Math.floor(i / 3) * 104, 148, 94);
  }
  g.fillStyle = AMBER; g.fillRect(24, 292, 300, 16);
  g.fillStyle = "#1b2a33"; g.fillRect(324, 292, 164, 16);
  g.fillStyle = AMBER; g.font = `600 20px ${MONO}`; g.fillText("RISK  MODERATE", 24, 328);
}

let tabletTex: THREE.CanvasTexture | null = null;
export function getTabletTexture() {
  if (!tabletTex) {
    tabletTex = makeCanvasTexture(512, 340, drawTabletScreen);
    mats.screen.map = tabletTex;
    mats.screen.needsUpdate = true;
  }
  return tabletTex;
}

/** Soft radial blob, used for contact shadows under people and ORION. */
let blobTex: THREE.CanvasTexture | null = null;
export function getBlobTexture() {
  if (!blobTex) {
    blobTex = makeCanvasTexture(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    });
  }
  return blobTex;
}

/** Re-render canvas textures once the web fonts have loaded. */
export function whenFontsReady(fn: () => void) {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = [`600 64px ${DISPLAY}`, `500 24px ${MONO}`, `600 30px ${MONO}`].map((f) => document.fonts.load(f));
  Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2000))]).then(fn, fn);
}
