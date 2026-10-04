/** All page copy in one place. Edit text here without touching components. */

export const site = {
  name: "ORION",
  expansion: "Optimization Robotics Intelligence for Operations & Navigation",
  contactEmail: "[CONTACT EMAIL]",
  team: "[TEAM NAME]",
  nav: [
    { href: "#capabilities", label: "Capabilities" },
    { href: "#pipeline", label: "How it works" },
    { href: "#hardware", label: "Hardware" },
    { href: "#roadmap", label: "Roadmap" },
  ],
};

export const hero = {
  title: "Build ORION.",
  lede: "Drag each component onto its slot on the tower. When the last part locks in, ORION powers up and runs a shift in an airport concourse.",
  simNote: "Concept simulation of the autonomous patrol planned for a future phase. The V1 tower is stationary. Passengers, zones and readings are simulated.",
};

export const statement = {
  text: "From a live camera feed to an operator decision,",
  accent: "inside one unit.",
  figures: [
    { value: "~1.5 m", label: "Monitoring tower height" },
    { value: "6", label: "Core intelligence capabilities" },
    { value: "TF.js", label: "Vision runtime behind a Next.js interface" },
  ],
};

export type IconName = "detect" | "zones" | "risk" | "recommend" | "dashboard" | "log";

export const capabilities: { icon: IconName; title: string; body: string }[] = [
  { icon: "detect", title: "Person detection", body: "Finds and follows people in the camera view, frame by frame, as the basis for everything downstream." },
  { icon: "zones", title: "Zone & crowd density", body: "Divides the monitored space into zones and measures how crowded each one becomes over time." },
  { icon: "risk", title: "Dynamic risk scoring", body: "Updates a risk level for every zone as occupancy and movement change, instead of relying on one fixed threshold." },
  { icon: "recommend", title: "Adaptive recommendations", body: "Suggests operator actions matched to the current risk picture and adjusts them as the situation changes." },
  { icon: "dashboard", title: "Live dashboard", body: "Shows zones, counts, risk levels and alerts on the tower display, with a fuller view for the operator." },
  { icon: "log", title: "Event logging", body: "Records every alert and threshold crossing with a timestamp, ready for review and reporting." },
];

export const pipeline = [
  { step: "Capture", title: "Camera feed", body: "The tower camera streams the monitored area." },
  { step: "Detect", title: "Vision model", body: "People are located and tracked in each frame." },
  { step: "Analyze", title: "Zone analytics", body: "Positions map to zones and density is computed." },
  { step: "Score", title: "Risk engine", body: "Each zone receives a risk level that adapts." },
  { step: "Respond", title: "Act and record", body: "Recommendations, dashboard updates and an event log." },
];

export const hardware = [
  {
    title: "V1 · Competition tower", badge: "Current", current: true,
    specs: [
      ["Form", "Stationary tower, ~1.5 m"],
      ["Structure", "Aluminum frame, removable acrylic panels"],
      ["Lighting", "Cyan LED accents"],
      ["AI compute", "Laptop · Next.js + TensorFlow.js"],
      ["Display", "Tablet mounted in the tower"],
    ],
  },
  {
    title: "Scale prototype track", badge: "In development", current: false,
    specs: [
      ["Scale", "500 mm acrylic prototype → 150 cm unit"],
      ["Control", "ESP32 low-level control"],
      ["Vision / AI", "Raspberry Pi 5 + Hailo-8L"],
      ["Enclosure", "Electronics bay, removable tray, thermal management"],
      ["Phase 1", "Mains-powered, stationary"],
    ],
  },
] as const;

export const roadmap = [
  { when: "Now", title: "V1 monitoring tower", body: "Stationary tower with detection, zone density, risk scoring, recommendations, dashboard and logging.", current: true },
  { when: "Phase 2", title: "Mobility", body: "The platform gains the ability to move, building on the scale prototype architecture.", current: false },
  { when: "Future", title: "Autonomous patrol", body: "Multi-camera coverage, LiDAR sensing and a ROS2 software stack, as previewed in the simulation above.", current: false },
];
