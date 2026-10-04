/** Static layout and tuning for the airport concourse simulation (units: metres, seconds). */

export const HALL = { x0: -18, x1: 18, z0: -11, z1: 11 } as const;

export interface Gate {
  id: string;
  x: number;
}

export const GATES: Gate[] = [
  { id: "A1", x: -12 },
  { id: "A2", x: -6 },
  { id: "B1", x: 0 },
  { id: "B2", x: 6 },
  { id: "B3", x: 12 },
];

/** Index of the gate that becomes crowded, and the gate the recommendation opens. */
export const CROWD_GATE = 3;
export const RELIEF_GATE = 4;

/** ORION patrol loop through the concourse. */
export const ROUTE: [number, number][] = [
  [-10, 3], [-5, 4.6], [0, 1.2], [5, 3.8], [11, 1],
  [14, -1.5], [8, -1.8], [1, -0.6], [-6, -1.6], [-13, 0.5],
];

export type PhaseId = "PATROL" | "DETECT" | "DENSITY" | "RISK" | "RECOMMEND";

export interface Phase {
  id: PhaseId;
  label: string;
  start: number;
  caption: string;
  status: string;
}

export const PHASES: Phase[] = [
  { id: "PATROL", label: "Patrol", start: 0, status: "Patrol",
    caption: "ORION moves through the hall between passengers, keeping a safe distance." },
  { id: "DETECT", label: "Detect", start: 8, status: "Scanning",
    caption: "The vision head sweeps the crowd and tracks every person in view." },
  { id: "DENSITY", label: "Density", start: 16, status: "Mapping density",
    caption: "Positions become a live density map across the gate zones." },
  { id: "RISK", label: "Risk", start: 24, status: "Responding",
    caption: "Gate B2 crosses the crowding threshold and is flagged." },
  { id: "RECOMMEND", label: "Recommend", start: 31, status: "Guiding flow",
    caption: "ORION proposes opening the B3 lane and guides the flow. Risk drops." },
];

export const LOOP_SECONDS = 46;

export const SIM = {
  passengers: 46,
  orionSpeed: 1.55,
  /** People within this radius step aside for ORION. */
  yieldRadius: 1.7,
  personalSpace: 0.6,
  detectRange: 6.8,
  /** cos of the half-angle of the vision cone (~33 degrees). */
  detectCos: 0.84,
  crowdSize: 14,
  highAt: 9,
  moderateAt: 5,
  /** Simulated shift clock start, seconds after midnight (08:42). */
  clockStart: 8 * 3600 + 42 * 60,
} as const;
