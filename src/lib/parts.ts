/** The six ORION tower components, in bottom-up assembly order. Units are metres. */

export const PART_IDS = ["base", "frame", "panels", "leds", "tablet", "head"] as const;
export type PartId = (typeof PART_IDS)[number];

export type Vec3 = [number, number, number];

export interface PartDef {
  id: PartId;
  /** Assembly order shown on the label. */
  n: string;
  name: string;
  short: string;
  /** Position of the part's origin when mounted on the tower. */
  target: Vec3;
  /** Size of the invisible grab box around the part. */
  grab: Vec3;
  /** Floating position before assembly: landscape and portrait screens. */
  home: { wide: Vec3; narrow: Vec3 };
  /** Vertical label offset in px on portrait screens (negative = below the part). */
  narrowLabel: number;
}

export const PARTS: PartDef[] = [
  { id: "base", n: "01", name: "Weighted base", short: "Base", target: [0, 0.06, 0], grab: [0.8, 0.34, 0.8],
    home: { wide: [1.95, 0.22, 0.45], narrow: [-0.85, -0.5, 0] }, narrowLabel: 34 },
  { id: "frame", n: "02", name: "Aluminum frame", short: "Frame", target: [0, 0.62, 0], grab: [0.75, 1.2, 0.75],
    home: { wide: [-1.95, 1.4, -0.35], narrow: [-0.85, 2.35, 0] }, narrowLabel: -88 },
  { id: "panels", n: "03", name: "Acrylic panels", short: "Panels", target: [0, 0.62, 0], grab: [0.75, 1.2, 0.75],
    home: { wide: [1.95, 1.4, -0.35], narrow: [0.85, -0.62, 0] }, narrowLabel: 64 },
  { id: "leds", n: "04", name: "LED light strips", short: "LEDs", target: [0, 0.64, 0], grab: [0.78, 1.2, 0.78],
    home: { wide: [-0.95, 1.55, 0.15], narrow: [0, 2.55, -0.2] }, narrowLabel: -88 },
  { id: "tablet", n: "05", name: "Tablet display", short: "Tablet", target: [0, 0.86, 0.3], grab: [0.52, 0.42, 0.24],
    home: { wide: [1.05, -0.05, 1.0], narrow: [0.02, -0.62, 0.1] }, narrowLabel: 30 },
  { id: "head", n: "06", name: "Vision head", short: "Head", target: [0, 1.24, 0], grab: [0.62, 0.48, 0.62],
    home: { wide: [1.2, 1.9, 0.1], narrow: [0.85, 2.4, 0] }, narrowLabel: -50 },
];
