/** All page copy in one place. Edit text here without touching components. */

export const site = {
  name: "ORION",
  expansion: "Optimization Robotics Intelligence for Operations & Navigation",
  team: "ForgeX_NBU",
  university: "Northern Border University",
  competition: "Engineering Hackathon · IECE 2026",
  track: "Track 1 · Challenge 05: Self-managed cities",
  nav: [
    { href: "#capabilities", label: "Capabilities" },
    { href: "#engineering", label: "Engineering" },
    { href: "#hardware", label: "Hardware" },
    { href: "#roadmap", label: "Roadmap" },
    { href: "#team", label: "Team" },
  ],
};

export const members = [
  "Deem Ayyad Al-Mutairi",
  "Dina Mohammed Al-Zaidan",
  "Misk Abbas Al-Shaalan",
];

export const hero = {
  title: "Build ORION.",
  lede: "Drag each component onto its slot on the tower. When the last part locks in, ORION powers up, raises its camera mast and runs a live crowd scenario.",
  simNote: "Concept simulation. Movement between spots shows the planned mobile unit; the V1 tower is stationary. People, zones and readings are simulated.",
};

export const statement = {
  text: "A mobile unit that turns a live camera view into an early warning and a clear action,",
  accent: "anywhere, within minutes.",
  figures: [
    { value: "3.5 m", label: "Camera height on the telescopic mast (design range 2.5–4 m)" },
    { value: "13 TOPS", label: "On-board AI accelerator (Hailo-8L) for local processing" },
    { value: "0", label: "Cables or network needed to start monitoring" },
  ],
};

export type IconName = "detect" | "zones" | "risk" | "recommend" | "dashboard" | "log";

export const capabilities: { icon: IconName; title: string; body: string }[] = [
  { icon: "detect", title: "Person detection", body: "Detects and tracks people from an elevated camera, so people behind others are still counted." },
  { icon: "zones", title: "Zone density", body: "Divides the area into zones and measures density in people per square metre for each one." },
  { icon: "risk", title: "Risk matrix", body: "Classifies every zone as safe, warning or critical, with thresholds set below the levels where crowd crush risk rises." },
  { icon: "recommend", title: "Actionable recommendations", body: "Turns a warning into a concrete action, such as opening an overflow area or redirecting a queue." },
  { icon: "dashboard", title: "Live dashboard", body: "Shows zones, counts, risk and alerts on the unit's screen and on the operator's dashboard." },
  { icon: "log", title: "Event logging", body: "Records every alert and threshold crossing with a timestamp for review and reporting." },
];

/** The reviewer's three challenges, and how ORION answers each. */
export const engineering = [
  {
    tag: "Field of view",
    problem: "A camera at head height suffers occlusion: people at the front hide the people behind them.",
    answer: "A three-stage telescopic mast raises the camera to 2.5–4 m, giving a 45° or steeper view over the crowd.",
  },
  {
    tag: "Power and stability",
    problem: "A mobile unit must run for long shifts and keep working when the network is weak.",
    answer: "A battery pack with optional solar input powers the unit. Detection runs on board (Raspberry Pi 5 + Hailo-8L), and data syncs when the link returns.",
  },
  {
    tag: "Value proposition",
    problem: "Venues already have fixed CCTV, so a mobile unit must justify its place.",
    answer: "ORION complements fixed cameras by covering blind spots and changing zones, and works as a complete standalone system for temporary events and open sites.",
  },
];

export const pipeline = [
  { step: "Capture", title: "Elevated camera", body: "The mast camera streams the area from above." },
  { step: "Detect", title: "Edge AI model", body: "People are detected and tracked on board." },
  { step: "Analyze", title: "Dynamic zoning", body: "Density per zone in people per square metre." },
  { step: "Score", title: "Risk matrix", body: "Safe, warning or critical for every zone." },
  { step: "Respond", title: "Decision support", body: "Alerts, recommendations and an event log." },
];

export const hardware = [
  {
    title: "V1 · Competition prototype", badge: "Built", current: true,
    specs: [
      ["Form", "Stationary tower, ~1.5 m"],
      ["Structure", "Aluminum frame, removable acrylic panels"],
      ["Lighting", "Cyan LED status lighting"],
      ["AI compute", "Laptop · Next.js + TensorFlow.js"],
      ["Display", "Tablet mounted in the tower"],
    ],
  },
  {
    title: "V2 · Field unit", badge: "Next iteration", current: false,
    specs: [
      ["Camera mast", "Telescopic, 2.5–4 m"],
      ["Edge AI", "Raspberry Pi 5 + Hailo-8L (13 TOPS)"],
      ["Control", "ESP32 for low-level control"],
      ["Power", "Battery pack, optional solar input"],
      ["Connectivity", "Works offline, syncs when connected"],
    ],
  },
] as const;

export const roadmap = [
  { when: "Now", title: "V1 prototype", body: "Stationary tower with detection, zone density, risk scoring, recommendations, dashboard and logging.", current: true },
  { when: "Next", title: "V2 field unit", body: "Telescopic camera mast, battery power and on-board edge AI, ready for temporary events and open sites.", current: false },
  { when: "Future", title: "Networked and mobile", body: "Several units sharing one dashboard, then a mobile base with LiDAR and ROS2 for patrol, as previewed in the simulation.", current: false },
];

/** Sources behind the numbers on this page. */
export const sources = [
  { label: "G. K. Still, crowd density and flow (critical density 2–3 people/m²)", href: "https://gkstill.com/Support/crowd-flow/DensityFlow.html" },
  { label: "Crowd crush risk above about 5 people/m² (Wikipedia, citing Fruin and others)", href: "https://en.wikipedia.org/wiki/Crowd_crush" },
  { label: "Raspberry Pi AI Kit, Hailo-8L at 13 TOPS (Jeff Geerling)", href: "https://jeffgeerling.com/blog/2024/testing-raspberry-pis-ai-kit-13-tops-70" },
];
