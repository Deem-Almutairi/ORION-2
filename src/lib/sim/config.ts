/** Layout and tuning for the ORION simulations (units: metres, seconds). */

export const HALL = { x0: -18, x1: 18, z0: -11, z1: 11 } as const;

export type SceneId = "event" | "station" | "airport";

/** How a scene looks: sky, light and the people in it. */
export interface SceneLook {
  /** Background (seen above the open ceiling and outdoors) and fog. */
  bg: string;
  fog: [near: number, far: number];
  hemi: [sky: string, ground: string, intensity: number];
  key: { color: string; intensity: number; pos: [number, number, number] };
  fill: { color: string; intensity: number; pos: [number, number, number] };
  exposure: number;
  /** Clothing colours for this crowd. */
  clothes: number[];
  legs: string;
  /** Share of people carrying a suitcase / bag. */
  bags: number;
  bagColor: string;
}

export interface SceneDef {
  id: SceneId;
  /** Selector label. */
  name: string;
  /** Short label in the HUD eyebrow. */
  place: string;
  /** The incident this scene plays out, shown under the selector. */
  incident: string;
  /** Time of day the shift clock starts at, in seconds after midnight. */
  clockStart: number;
  /** People in the space and how many of them form the crowd. */
  people: number;
  crowdSize: number;
  look: SceneLook;
  /** Monitored zones along the back of the space, left to right. */
  zones: { id: string; x: number }[];
  /** Zone that becomes crowded, and the zone the recommendation opens. */
  crowd: number;
  relief: number;
  /** Wording used in captions, log lines and pinned labels. */
  words: {
    zone: string;          // "Gate", "Section", "Fare-gate line"
    trigger: string;       // log line when the incident starts
    action: string;        // recommendation, e.g. "Open Gate B3 queue lane"
    resolve: string;       // caption for the recommend phase
    detect: string;        // caption for the detect phase
  };
}

const hm = (h: number, m: number) => h * 3600 + m * 60;

export const SCENES: SceneDef[] = [
  {
    id: "event", name: "Event plaza", place: "Outdoor concert · night",
    incident: "Headliner takes the stage and the crowd surges toward the front barrier.",
    clockStart: hm(21, 38), people: 56, crowdSize: 20,
    look: {
      bg: "#0b0717", fog: [22, 80], hemi: ["#6b4fd8", "#120a1c", 0.55],
      key: { color: "#ff4fd8", intensity: 0.9, pos: [0, 9, -14] },
      fill: { color: "#ffb36b", intensity: 0.45, pos: [-8, 5, 10] },
      exposure: 1.1,
      clothes: [0xff3d7f, 0x3dd6ff, 0xffd23d, 0x9b5cff, 0x2ee59d, 0xff7a3d, 0xf2f2f2, 0x222222, 0xe03dff, 0x37474f],
      legs: "#232a3a", bags: 0, bagColor: "#000000",
    },
    zones: [{ id: "P1", x: -12 }, { id: "P2", x: -6 }, { id: "P3", x: 0 }, { id: "P4", x: 6 }, { id: "P5", x: 12 }],
    crowd: 2, relief: 4,
    words: {
      zone: "Section",
      trigger: "Headliner on stage · crowd surging to front barrier",
      action: "Open overflow section P5 and slow the main entry",
      resolve: "ORION recommends opening overflow section P5 and slowing the entry. The pressure at the barrier eases.",
      detect: "At night, under moving stage lights, the mast camera still counts every fan, including those deep in the crowd.",
    },
  },
  {
    id: "station", name: "Metro station", place: "Underground metro · morning rush",
    incident: "A full train unloads at once while fare-gate line L1 is out of service.",
    clockStart: hm(7, 46), people: 46, crowdSize: 18,
    look: {
      bg: "#0e1512", fog: [16, 60], hemi: ["#e8fff4", "#26302c", 0.95],
      key: { color: "#e9fff6", intensity: 1.0, pos: [2, 7, 3] },
      fill: { color: "#9fd8ff", intensity: 0.35, pos: [-6, 4, -6] },
      exposure: 1.0,
      clothes: [0x2b3440, 0x46505c, 0x1c1f24, 0x5a4636, 0x3a4a5e, 0x6b7380, 0x283a2e, 0x7a6a58, 0x4a3a4e, 0x8a929c],
      legs: "#1b1e22", bags: 0.55, bagColor: "#1f2a35",
    },
    zones: [{ id: "L1", x: -12 }, { id: "L2", x: -6 }, { id: "L3", x: 0 }, { id: "L4", x: 6 }, { id: "L5", x: 12 }],
    crowd: 1, relief: 3,
    words: {
      zone: "Fare-gate line",
      trigger: "Line 2 train arrived · 300 passengers exiting · L1 out of service",
      action: "Open fare-gate line L4 in exit mode and guide passengers right",
      resolve: "ORION recommends switching fare-gate line L4 to exit mode and guides the wave there. The bottleneck clears.",
      detect: "Under hard station light, ORION follows commuters streaming up from the platforms and counts each one.",
    },
  },
  {
    id: "airport", name: "Airport", place: "Airport terminal · afternoon",
    incident: "A late gate change sends a full flight to Gate B1, next to a boarding gate.",
    clockStart: hm(14, 5), people: 42, crowdSize: 16,
    look: {
      bg: "#bcd6ea", fog: [26, 90], hemi: ["#f4f8ff", "#6f6a62", 1.15],
      key: { color: "#fff1d6", intensity: 1.7, pos: [-6, 12, -14] },
      fill: { color: "#cfe4ff", intensity: 0.5, pos: [8, 6, 10] },
      exposure: 1.0,
      clothes: [0x3f6fb5, 0xc9b79c, 0x8a96a3, 0x2e3a48, 0xb55a4a, 0xe8e2d6, 0x5f7a5a, 0x9a7bb0, 0x6b5440, 0xd9a441],
      legs: "#2c3440", bags: 0.7, bagColor: "#3a4656",
    },
    zones: [{ id: "A1", x: -12 }, { id: "A2", x: -6 }, { id: "B1", x: 0 }, { id: "B2", x: 6 }, { id: "B3", x: 12 }],
    crowd: 2, relief: 4,
    words: {
      zone: "Gate",
      trigger: "Gate change · FLT 03 moved to B1 · 180 passengers",
      action: "Open Gate B3 queue lane and announce zone boarding",
      resolve: "ORION recommends opening the Gate B3 lane with zone boarding and guides the flow. Risk drops.",
      detect: "From 3.5 m up, the camera sees over heads and luggage, so passengers at the back of the queue are not hidden.",
    },
  },
];

export const sceneById = (id: SceneId) => SCENES.find((s) => s.id === id) ?? SCENES[0];

/** ORION patrol loop through the space. */
export const ROUTE: [number, number][] = [
  [-10, 3], [-5, 4.6], [0, 1.2], [5, 3.8], [11, 1],
  [14, -1.5], [8, -1.8], [1, -0.6], [-6, -1.6], [-13, 0.5],
];

export type PhaseId = "PATROL" | "DETECT" | "DENSITY" | "RISK" | "RECOMMEND";

export interface Phase {
  id: PhaseId;
  label: string;
  start: number;
  status: string;
}

export const PHASES: Phase[] = [
  { id: "PATROL", label: "Deploy", start: 0, status: "Mast up · patrol" },
  { id: "DETECT", label: "Detect", start: 8, status: "Scanning" },
  { id: "DENSITY", label: "Density", start: 16, status: "Mapping density" },
  { id: "RISK", label: "Risk", start: 24, status: "Responding" },
  { id: "RECOMMEND", label: "Recommend", start: 31, status: "Guiding flow" },
];

export function captionFor(scene: SceneDef, phase: number) {
  const crowd = `${scene.words.zone} ${scene.zones[scene.crowd].id}`;
  switch (phase) {
    case 0: return "ORION deploys its telescopic mast and moves through the space, keeping a safe distance from people.";
    case 1: return scene.words.detect;
    case 2: return "Positions become a live density map, measured in people per square metre for each zone.";
    case 3: return `${crowd} crosses the warning threshold and is flagged before it becomes critical.`;
    default: return scene.words.resolve;
  }
}

export const LOOP_SECONDS = 46;

/**
 * Risk thresholds in people per square metre. Crowd flow starts to break down at
 * a critical density of about 2–3 /m² (G. K. Still), and crush risk rises sharply
 * above about 5 /m², so ORION warns well before that point.
 */
export const RISK = { warning: 2, critical: 4 } as const;

export const SIM = {
  orionSpeed: 1.55,
  yieldRadius: 1.7,
  personalSpace: 0.6,
  detectRange: 7.5,
  /** cos of the half-angle of the vision cone (~33 degrees). */
  detectCos: 0.84,
  /** The simulated zones are scaled down; these counts map to the density bands above. */
  highAt: 9,
  moderateAt: 5,
  /** Mast height when deployed, metres above the floor. */
  mastHeight: 3.5,
} as const;
