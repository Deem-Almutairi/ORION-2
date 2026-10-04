"use client";

import { create } from "zustand";
import type { Readout, SimEvent } from "./sim/engine";
import { sceneById, type SceneId } from "./sim/config";
import { PART_IDS, type PartId } from "./parts";

export type Mode = "assemble" | "sim";

interface HeroState {
  mode: Mode;
  scene: SceneId;
  placed: Record<PartId, boolean>;
  /** Bumps when the visitor asks for automatic assembly. */
  autoRequest: number;
  online: boolean;
  fading: boolean;
  fadeText: string;
  paused: boolean;
  phase: number;
  readout: Readout | null;
  log: SimEvent[];

  markPlaced: (id: PartId) => void;
  requestAuto: () => void;
  setOnline: (v: boolean) => void;
  goTo: (mode: Mode) => void;
  setScene: (id: SceneId) => void;
  skipToSim: () => void;
  togglePause: () => void;
  setPhase: (i: number) => void;
  setReadout: (r: Readout) => void;
  pushLog: (e: SimEvent) => void;
}

const nonePlaced = () => Object.fromEntries(PART_IDS.map((id) => [id, false])) as Record<PartId, boolean>;
const allPlaced = () => Object.fromEntries(PART_IDS.map((id) => [id, true])) as Record<PartId, boolean>;

let fadeTimer: ReturnType<typeof setTimeout> | undefined;

export const useHero = create<HeroState>((set, get) => ({
  mode: "assemble",
  scene: "event",
  placed: nonePlaced(),
  autoRequest: 0,
  online: false,
  fading: false,
  fadeText: "",
  paused: false,
  phase: 0,
  readout: null,
  log: [],

  markPlaced: (id) => set((s) => ({ placed: { ...s.placed, [id]: true } })),
  requestAuto: () => set((s) => ({ autoRequest: s.autoRequest + 1 })),
  setOnline: (online) => set({ online }),

  goTo: (mode) => {
    if (get().mode === mode || get().fading) return;
    clearTimeout(fadeTimer);
    set({ fading: true, fadeText: mode === "sim" ? "Entering simulation" : "Back to the assembly bay" });
    fadeTimer = setTimeout(() => {
      set({
        mode,
        paused: false,
        online: false,
        phase: 0,
        log: [],
        readout: null,
        placed: mode === "sim" ? allPlaced() : nonePlaced(),
      });
      fadeTimer = setTimeout(() => set({ fading: false }), 160);
    }, 560);
  },

  setScene: (scene) => {
    if (get().scene === scene || get().fading) return;
    if (get().mode !== "sim") { set({ scene }); return; }
    clearTimeout(fadeTimer);
    set({ fading: true, fadeText: `Loading ${sceneById(scene).name.toLowerCase()}` });
    fadeTimer = setTimeout(() => {
      set({ scene, phase: 0, log: [], readout: null, paused: false });
      fadeTimer = setTimeout(() => set({ fading: false }), 160);
    }, 560);
  },

  skipToSim: () => {
    set({ placed: allPlaced() });
    get().goTo("sim");
  },

  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPhase: (phase) => set({ phase }),
  setReadout: (readout) => set({ readout }),
  pushLog: (e) => set((s) => ({ log: [e, ...s.log].slice(0, 7) })),
}));

export const placedCount = (placed: Record<PartId, boolean>) => Object.values(placed).filter(Boolean).length;
