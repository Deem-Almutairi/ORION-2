/** Layout and tuning for the ORION simulations (units: metres, seconds). */

export const HALL = { x0: -18, x1: 18, z0: -11, z1: 11 } as const;

export type SceneId = "event" | "station" | "airport";

export interface SceneDef {
  id: SceneId;
  /** Selector label. */
  name: string;
  /** Short label in the HUD eyebrow. */
  place: string;
  /** Monitored zones along the back of the space, left to right. */
  zones: { id: string; x: number }[];
  /** Zone that becomes crowded, and the zone the recommendation opens. */
  crowd: number;
  relief: number;
  /** Wording used in captions, log lines and pinned labels. */
  words: {
    zone: string;          // "Gate", "Section", "Fare-gate line"
    action: string;        // recommendation, e.g. "Open Gate B3 queue lane"
    resolve: string;       // caption for the recommend phase
  };
}

export const SCENES: SceneDef[] = [
  {
    id: "event", name: "Event plaza", place: "Outdoor event plaza",
    zones: [{ id: "P1", x: -12 }, { id: "P2", x: -6 }, { id: "P3", x: 0 }, { id: "P4", x: 6 }, { id: "P5", x: 12 }],
    crowd: 2, relief: 4,
    words: {
      zone: "Section",
      action: "Open overflow section P5 and slow the main entry",
      resolve: "ORION recommends opening overflow section P5 and slowing the entry. The crowd spreads and risk drops.",
    },
  },
  {
    id: "station", name: "Transit station", place: "Metro station concourse",
    zones: [{ id: "L1", x: -12 }, { id: "L2", x: -6 }, { id: "L3", x: 0 }, { id: "L4", x: 6 }, { id: "L5", x: 12 }],
    crowd: 1, relief: 3,
    words: {
      zone: "Fare-gate line",
      action: "Open fare-gate line L4 and guide passengers right",
      resolve: "ORION recommends opening fare-gate line L4 and guides the queue there. Risk drops.",
    },
  },
  {
    id: "airport", name: "Airport", place: "Airport concourse",
    zones: [{ id: "A1", x: -12 }, { id: "A2", x: -6 }, { id: "B1", x: 0 }, { id: "B2", x: 6 }, { id: "B3", x: 12 }],
    crowd: 3, relief: 4,
    words: {
      zone: "Gate",
      action: "Open Gate B3 queue lane",
      resolve: "ORION recommends opening the Gate B3 lane and guides the flow. Risk drops.",
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
    case 1: return "From 3.5 m up, the camera sees over heads, so people at the back are not hidden. Every person in view is tracked.";
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
  passengers: 46,
  orionSpeed: 1.55,
  yieldRadius: 1.7,
  personalSpace: 0.6,
  detectRange: 7.5,
  /** cos of the half-angle of the vision cone (~33 degrees). */
  detectCos: 0.84,
  crowdSize: 14,
  /** The simulated zones are scaled down; these counts map to the density bands above. */
  highAt: 9,
  moderateAt: 5,
  clockStart: 8 * 3600 + 42 * 60,
  /** Mast height when deployed, metres above the floor. */
  mastHeight: 3.5,
} as const;
