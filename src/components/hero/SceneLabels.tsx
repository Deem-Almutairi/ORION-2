"use client";

import { labelRef } from "@/lib/labels";
import { PARTS } from "@/lib/parts";
import { PHASES, sceneById } from "@/lib/sim/config";
import { useHero } from "@/lib/store";

const base = "tag absolute left-0 top-0 will-change-transform";
const hidden = { display: "none" } as const;

/** DOM labels laid over the canvas; their positions are driven from the 3D scene. */
export function SceneLabels() {
  const mode = useHero((s) => s.mode);
  const phase = useHero((s) => s.phase);
  const sc = sceneById(useHero((s) => s.scene));
  const crowd = sc.zones[sc.crowd].id, relief = sc.zones[sc.relief].id;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {mode === "assemble" ? (
        PARTS.map((p) => (
          <div key={p.id} ref={labelRef(p.id)} className={base} style={hidden}>
            <span className="k">{p.n}</span> <span className="full">{p.name}</span><span className="short">{p.short}</span>
          </div>
        ))
      ) : (
        <>
          <div ref={labelRef("orion")} className={`${base} ok`} style={hidden}>
            <span className="k">ORION</span> {PHASES[phase]?.status}
          </div>
          <div ref={labelRef("alert")} className={`${base} warn`} style={hidden}>
            <span className="k">Alert</span> {sc.words.zone} {crowd} · high density
          </div>
          <div ref={labelRef("rec")} className={`${base} ok`} style={hidden}>
            <span className="k">Recommend</span> Open {relief}
          </div>
        </>
      )}
    </div>
  );
}
