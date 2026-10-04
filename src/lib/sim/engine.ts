import {
  HALL, LOOP_SECONDS, PHASES, ROUTE, SIM, type SceneDef,
} from "./config";

/**
 * Framework-free simulation of the airport concourse: passengers, ORION's
 * patrol, zone density, risk levels and the scripted phase timeline.
 * Rendering code reads this state every frame; nothing here touches three.js or React.
 */

export type Level = "Low" | "Moderate" | "High";
type PersonMode = "normal" | "toCrowd" | "hold" | "toRelief";
type Activity = "walk" | "seat" | "queue";

export interface Person {
  x: number; z: number;
  tx: number; tz: number;
  vx: number; vz: number;
  heading: number;
  speed: number;
  wait: number;
  mode: PersonMode;
  activity: Activity;
  /** 0..1 detection highlight, decays when out of view. */
  det: number;
  walk: number;
  moving: boolean;
  /** Static appearance, fixed at creation. */
  look: { color: number; height: number; suitcase: boolean };
}

export interface Zone {
  id: string; x: number;
  x0: number; x1: number; z0: number; z1: number;
  count: number; level: Level;
}

export interface Orion {
  x: number; z: number; heading: number;
  moving: boolean;
  mode: "patrol" | "go";
  tx: number; tz: number;
  face: number | null;
  wp: number;
}

export interface SimEvent {
  id: number;
  clock: string;
  text: string;
  kind?: "alert" | "rec";
}

export interface Readout {
  people: number;
  tracked: number;
  highest: Level;
  clock: string;
  zones: { id: string; count: number; level: Level }[];
}

const COLORS = [0x8a96a3, 0x5b6b7a, 0xa58e74, 0x6d5f7a, 0x4f6d5f, 0xb0a597, 0x7a5c5c, 0x3f5873, 0x9b7f62, 0x55606c];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const wrapAngle = (a: number) => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

export function levelFor(count: number): Level {
  if (count >= SIM.highAt) return "High";
  if (count >= SIM.moderateAt) return "Moderate";
  return "Low";
}

function spot(kind: "queue" | "seat" | "entrance" | "concourse", gx = 0): [number, number] {
  switch (kind) {
    case "queue": return [gx + rand(-1.4, 1.4), rand(-9.2, -7.6)];
    case "seat": return [gx + rand(-1.7, 1.7), pick([-6.4, -5.1]) + 0.1];
    case "entrance": return [rand(-15, 15), rand(8.6, 10)];
    default: return [rand(-16, 16), rand(-2.5, 6)];
  }
}

export class SimEngine {
  readonly people: Person[] = [];
  readonly zones: Zone[];
  readonly orion: Orion = { x: -10, z: 3, heading: Math.PI / 2, moving: false, mode: "patrol", tx: 0, tz: 0, face: null, wp: 1 };

  /** Seconds into the current loop. */
  t = 0;
  /** Seconds since the simulation started (drives the clock and ambient motion). */
  total = 0;
  phase = 0;
  scanYaw = 0;
  tracked = 0;

  onEvent?: (e: SimEvent) => void;
  onPhase?: (index: number) => void;

  private lastPhase = -1;
  private fired = new Set<string>();
  private eventId = 0;

  readonly scene: SceneDef;
  private gateXs: number[];

  constructor(scene: SceneDef, count: number = SIM.passengers) {
    this.scene = scene;
    this.gateXs = scene.zones.map((z) => z.x);
    this.zones = scene.zones.map((g) => ({ id: g.id, x: g.x, x0: g.x - 3, x1: g.x + 3, z0: -10.6, z1: -4.2, count: 0, level: "Low" as Level }));
    for (let i = 0; i < count; i++) {
      this.people.push({
        x: 0, z: 0, tx: 0, tz: 0, vx: 0, vz: 0, heading: rand(-3, 3), speed: rand(0.85, 1.35),
        wait: 0, mode: "normal", activity: "walk", det: 0, walk: rand(0, 6), moving: false,
        look: { color: pick(COLORS), height: rand(0.92, 1.08), suitcase: Math.random() < 0.45 },
      });
    }
    this.reset();
  }

  reset() {
    for (const p of this.people) {
      const s = Math.random() < 0.5 ? spot("concourse") : spot(pick(["seat", "queue"] as const), pick(this.gateXs));
      p.x = s[0]; p.z = s[1]; p.vx = 0; p.vz = 0; p.det = 0;
      p.mode = "normal"; p.wait = rand(0, 4);
      this.nextTarget(p);
    }
    Object.assign(this.orion, { x: -10, z: 3, heading: Math.PI / 2, mode: "patrol", face: null, wp: 1 });
    this.t = 0; this.total = 0; this.lastPhase = -1; this.fired.clear();
    this.updateZones();
  }

  get crowdZone() { return this.zones[this.scene.crowd]; }
  get reliefZone() { return this.zones[this.scene.relief]; }
  get crowdHigh() { return this.crowdZone.level === "High"; }

  clock(withSeconds = false) {
    const s = Math.floor(SIM.clockStart + this.total);
    const h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}${withSeconds ? ":" + pad(sec) : ""}`;
  }

  readout(): Readout {
    let highest: Level = "Low";
    for (const z of this.zones) {
      if (z.level === "High") highest = "High";
      else if (z.level === "Moderate" && highest !== "High") highest = "Moderate";
    }
    return {
      people: this.people.length,
      tracked: this.tracked,
      highest,
      clock: this.clock(),
      zones: this.zones.map((z) => ({ id: z.id, count: z.count, level: z.level })),
    };
  }

  step(dt: number) {
    this.t += dt; this.total += dt;
    if (this.t >= LOOP_SECONDS) {
      this.t -= LOOP_SECONDS;
      this.releaseAll();
      Object.assign(this.orion, { mode: "patrol", face: null, wp: this.nearestWaypoint() });
      this.fired.clear();
    }
    this.phase = phaseAt(this.t);
    if (this.phase !== this.lastPhase) this.enterPhase(this.phase);

    const p = this.phase;
    if (this.t > 11) this.once("track", () => this.emit(`Tracking ${this.tracked} people in view`));
    if (this.t > 12.5) this.once("gather", () => this.gatherCrowd());
    if (p >= 3) this.once("alert", () => this.emit(`${this.scene.words.zone} ${this.crowdZone.id} high density · ${this.crowdZone.count} people`, "alert"));
    if (p === 4 && this.t > 39 && !this.crowdHigh) this.once("normal", () => this.emit(`${this.scene.words.zone} ${this.crowdZone.id} density back to ${this.crowdZone.level.toLowerCase()}`));
    if (p === 4 && this.t > 41) this.once("resume", () => {
      Object.assign(this.orion, { mode: "patrol", face: null, wp: this.nearestWaypoint() });
      this.emit("Patrol resumed");
    });

    this.steerOrion(dt);
    this.movePeople(dt);
    this.scanYaw = Math.sin(this.total * (p === 1 ? 1.1 : 0.7)) * (p === 1 ? 0.6 : 0.35);
    this.detect(dt, p >= 1);
    this.zoneTimer -= dt;
    if (this.zoneTimer <= 0) { this.zoneTimer = 0.2; this.updateZones(); }
  }

  private zoneTimer = 0;

  private enterPhase(i: number) {
    this.lastPhase = i;
    const crowd = this.crowdZone;
    if (i === 0) this.emit(`Mast deployed · ${this.scene.place.toLowerCase()}`);
    if (i === 1) this.emit("Vision sweep active");
    if (i === 2) this.emit(`Density map updated · ${this.zones.length} gate zones`);
    if (i === 3) Object.assign(this.orion, { mode: "go", tx: crowd.x + 0.4, tz: -3.6, face: Math.PI });
    if (i === 4) { this.redirectCrowd(); this.emit(this.scene.words.action, "rec"); }
    this.onPhase?.(i);
  }

  private emit(text: string, kind?: SimEvent["kind"]) {
    this.onEvent?.({ id: ++this.eventId, clock: this.clock(true), text, kind });
  }

  private once(key: string, fn: () => void) {
    if (!this.fired.has(key)) { this.fired.add(key); fn(); }
  }

  private nextTarget(p: Person) {
    const r = Math.random(), gx = pick(this.gateXs);
    let s: [number, number];
    if (r < 0.38) { s = spot("concourse"); p.activity = "walk"; }
    else if (r < 0.66) { s = spot("seat", gx); p.activity = "seat"; }
    else if (r < 0.9) { s = spot("queue", gx); p.activity = "queue"; }
    else { s = spot("entrance"); p.activity = "walk"; }
    p.tx = s[0]; p.tz = s[1];
  }

  private gatherCrowd() {
    const cx = this.crowdZone.x;
    this.people
      .filter((p) => p.mode === "normal")
      .sort((a, b) => Math.hypot(a.x - cx, a.z + 6) - Math.hypot(b.x - cx, b.z + 6))
      .slice(0, SIM.crowdSize)
      .forEach((p) => { p.mode = "toCrowd"; p.tx = cx + rand(-2.2, 2.2); p.tz = rand(-9.6, -5.0); p.wait = 0; p.speed = rand(1.1, 1.5); });
  }

  private redirectCrowd() {
    const rx = this.reliefZone.x;
    this.people
      .filter((p) => p.mode === "hold" || p.mode === "toCrowd")
      .forEach((p, i) => {
        if (i % 5 < 3) { p.mode = "toRelief"; p.tx = rx + rand(-1.8, 1.8); p.tz = rand(-9.4, -6.8); p.wait = rand(0, 1.2); }
        else { p.mode = "normal"; p.wait = rand(4, 12); }
      });
  }

  private releaseAll() {
    for (const p of this.people) if (p.mode !== "normal") { p.mode = "normal"; p.wait = rand(0, 3); this.nextTarget(p); }
  }

  private nearestWaypoint() {
    let best = 0, bd = Infinity;
    ROUTE.forEach(([x, z], i) => { const d = Math.hypot(x - this.orion.x, z - this.orion.z); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  private steerOrion(dt: number) {
    const o = this.orion;
    let tx: number, tz: number;
    if (o.mode === "patrol") {
      [tx, tz] = ROUTE[o.wp];
      if (Math.hypot(tx - o.x, tz - o.z) < 0.6) o.wp = (o.wp + 1) % ROUTE.length;
    } else { tx = o.tx; tz = o.tz; }
    const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
    if (d > 0.15) {
      const sp = SIM.orionSpeed * Math.min(1, d / 1.2);
      const dh = wrapAngle(Math.atan2(dx, dz) - o.heading);
      o.heading += dh * Math.min(1, dt * 2.4);
      const fwd = Math.max(0, Math.cos(dh));
      o.x += Math.sin(o.heading) * sp * fwd * dt;
      o.z += Math.cos(o.heading) * sp * fwd * dt;
      o.moving = true;
    } else {
      o.moving = false;
      if (o.face != null) o.heading += wrapAngle(o.face - o.heading) * Math.min(1, dt * 2);
    }
  }

  private movePeople(dt: number) {
    const { people, orion } = this;
    const ps = SIM.personalSpace, ps2 = ps * ps;
    for (let i = 0; i < people.length; i++) {
      const p = people[i];
      let vx = 0, vz = 0;
      if (p.wait > 0) {
        p.wait -= dt;
        if (p.wait <= 0 && p.mode === "normal") this.nextTarget(p);
      } else {
        const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
        if (d < 0.3) {
          if (p.mode === "toCrowd") { p.mode = "hold"; p.wait = Infinity; }
          else if (p.mode === "toRelief") { p.mode = "normal"; p.wait = rand(6, 14); }
          else p.wait = p.activity === "seat" ? rand(5, 14) : p.activity === "queue" ? rand(3, 9) : rand(0.5, 3);
        } else { vx = (dx / d) * p.speed; vz = (dz / d) * p.speed; }
      }
      for (let j = 0; j < people.length; j++) {
        if (i === j) continue;
        const q = people[j], sx = p.x - q.x, sz = p.z - q.z, s2 = sx * sx + sz * sz;
        if (s2 < ps2 && s2 > 1e-4) { const s = Math.sqrt(s2), f = (ps - s) * 2.2; vx += (sx / s) * f; vz += (sz / s) * f; }
      }
      const rx = p.x - orion.x, rz = p.z - orion.z, r = Math.hypot(rx, rz);
      if (r < SIM.yieldRadius && r > 1e-3) { const f = (SIM.yieldRadius - r) * 2.6; vx += (rx / r) * f; vz += (rz / r) * f; }
      const k = Math.min(1, dt * 6);
      p.vx = lerp(p.vx, vx, k); p.vz = lerp(p.vz, vz, k);
      p.x = clamp(p.x + p.vx * dt, HALL.x0 + 0.6, HALL.x1 - 0.6);
      p.z = clamp(p.z + p.vz * dt, HALL.z0 + 0.9, HALL.z1 - 0.6);
      const sp = Math.hypot(p.vx, p.vz);
      p.moving = sp > 0.15;
      if (p.moving) { p.heading += wrapAngle(Math.atan2(p.vx, p.vz) - p.heading) * Math.min(1, dt * 7); p.walk += dt * sp * 7; }
    }
  }

  private detect(dt: number, active: boolean) {
    const o = this.orion;
    const fx = Math.sin(o.heading + this.scanYaw), fz = Math.cos(o.heading + this.scanYaw);
    let n = 0;
    for (const p of this.people) {
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz);
      const inView = d < SIM.detectRange && d > 0.2 && (dx * fx + dz * fz) / d > SIM.detectCos;
      p.det = inView ? 1 : Math.max(0, p.det - dt * 0.6);
      if (p.det > 0.05) n++;
    }
    this.tracked = active ? n : 0;
  }

  private updateZones() {
    for (const z of this.zones) z.count = 0;
    for (const p of this.people) for (const z of this.zones) if (p.x >= z.x0 && p.x < z.x1 && p.z >= z.z0 && p.z < z.z1) z.count++;
    for (const z of this.zones) z.level = levelFor(z.count);
  }

  isHolding(p: Person) { return p.mode === "hold"; }
}

export function phaseAt(t: number) {
  for (let i = PHASES.length - 1; i >= 0; i--) if (t >= PHASES[i].start) return i;
  return 0;
}
