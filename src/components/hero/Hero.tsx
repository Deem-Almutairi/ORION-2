"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { PARTS } from "@/lib/parts";
import { placedCount, useHero } from "@/lib/store";
import { DragIcon } from "@/components/icons";
import { Hud } from "./Hud";
import { SceneLabels } from "./SceneLabels";

const Scene = dynamic(() => import("./three/Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.14em] text-dim">
      Loading 3D scene
    </div>
  ),
});

export function Hero() {
  const mode = useHero((s) => s.mode);
  const placed = useHero((s) => s.placed);
  const online = useHero((s) => s.online);
  const fading = useHero((s) => s.fading);
  const fadeText = useHero((s) => s.fadeText);
  const count = placedCount(placed);
  const assembled = count === PARTS.length;

  // Power-up moment, then hand over to the simulation.
  useEffect(() => {
    if (mode !== "assemble" || !assembled || useHero.getState().fading) return;
    const { setOnline, goTo } = useHero.getState();
    const timers = [
      setTimeout(() => setOnline(true), 350),
      setTimeout(() => setOnline(false), 2300),
      setTimeout(() => goTo("sim"), 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [mode, assembled]);

  return (
    <section id="top" aria-label="Interactive ORION assembly and airport simulation" className="relative border-b border-line">
      <div className="relative h-[clamp(460px,72svh,620px)] overflow-hidden bg-bg min-[1025px]:h-[clamp(560px,86vh,940px)]">
        <div className="absolute inset-0">
          <Scene />
        </div>
        <SceneLabels />

        {mode === "assemble" && (
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg min-[1025px]:hidden"
            style={{ borderColor: "var(--acc-line)", background: "rgb(6 8 11 / 0.82)" }}>
            <DragIcon />
            Drag parts onto the tower · <b className="font-medium text-acc">{count}/6</b>
          </div>
        )}

        <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${online ? "opacity-100" : "opacity-0"}`}>
          <b className="font-display text-[clamp(36px,6vw,88px)] font-bold leading-none tracking-[0.24em]" style={{ textShadow: "0 0 30px rgb(34 211 238 / 0.55)" }}>ORION</b>
          <span className="eyebrow">Systems online</span>
        </div>

        <div className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg transition-opacity duration-500 ${fading ? "opacity-100" : "opacity-0"}`}>
          <span className="eyebrow">{fadeText}</span>
        </div>
      </div>

      <Hud />
    </section>
  );
}
