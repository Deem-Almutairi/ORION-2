"use client";

import { hero } from "@/content/site";
import { PARTS } from "@/lib/parts";
import { PHASES, SCENES, captionFor, sceneById } from "@/lib/sim/config";
import type { Level } from "@/lib/sim/engine";
import { placedCount, useHero } from "@/lib/store";
import { DragIcon } from "@/components/icons";

/**
 * Overlay controls and readouts. Laid over the scene on large screens,
 * stacked below it on tablets in portrait and phones.
 */
export function Hud() {
  const mode = useHero((s) => s.mode);
  return (
    <div className="flex flex-col gap-5 border-t border-line bg-panel px-4 pb-7 pt-5 sm:px-6
      min-[1025px]:pointer-events-none min-[1025px]:absolute min-[1025px]:inset-0 min-[1025px]:grid min-[1025px]:grid-cols-[minmax(0,1fr)_320px]
      min-[1025px]:grid-rows-[auto_1fr_auto] min-[1025px]:border-0 min-[1025px]:bg-transparent min-[1025px]:p-8">
      {mode === "assemble" ? <AssembleHud /> : <SimHud />}
    </div>
  );
}

const corner = "min-[1025px]:pointer-events-auto min-[1025px]:w-fit min-[1025px]:justify-self-start";

function AssembleHud() {
  const placed = useHero((s) => s.placed);
  const requestAuto = useHero((s) => s.requestAuto);
  const skipToSim = useHero((s) => s.skipToSim);
  const count = placedCount(placed);

  return (
    <>
      <div className={`${corner} flex flex-col gap-3 min-[1025px]:col-start-1 min-[1025px]:row-start-1`}>
        <span className="eyebrow">ForgeX_NBU · ORION assembly bay</span>
        <div className="flex w-full max-w-80 gap-1" aria-hidden>
          {PARTS.map((p, i) => (
            <i key={p.id} className={`h-1 flex-1 transition-colors ${i < count ? "bg-acc shadow-[0_0_10px_rgb(34_211_238/0.6)]" : "bg-line-2"}`} />
          ))}
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted" aria-live="polite">{count} / 6 components locked</span>
      </div>

      <div className={`hidden items-center gap-2 self-start justify-self-end min-[1025px]:pointer-events-auto border border-line-2 bg-bg/60 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-dim min-[1025px]:col-start-2 min-[1025px]:row-start-1 min-[1025px]:flex`}>
        <DragIcon /> Drag a part to its slot
      </div>

      <div className={`${corner} flex max-w-[520px] flex-col gap-4 self-end min-[1025px]:col-start-1 min-[1025px]:row-start-3`}>
        <h1 className="text-[clamp(40px,5.2vw,76px)] leading-none">{hero.title}</h1>
        <p className="max-w-[46ch] text-[17px] text-muted">{hero.lede}</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-solid" onClick={requestAuto}>Assemble for me</button>
          <button type="button" className="btn" onClick={skipToSim}>Skip to simulation</button>
        </div>
      </div>
    </>
  );
}

const levelColor: Record<Level, string> = { Low: "#22d3ee", Moderate: "#fbbf24", High: "#f97316" };

function SimHud() {
  const phase = useHero((s) => s.phase);
  const readout = useHero((s) => s.readout);
  const log = useHero((s) => s.log);
  const paused = useHero((s) => s.paused);
  const togglePause = useHero((s) => s.togglePause);
  const goTo = useHero((s) => s.goTo);
  const sceneId = useHero((s) => s.scene);
  const setScene = useHero((s) => s.setScene);
  const scene = sceneById(sceneId);

  return (
    <>
      <div className={`${corner} flex flex-col gap-3.5 min-[1025px]:col-start-1 min-[1025px]:row-start-1 min-[1025px]:max-w-[520px]`}>
        <span className="eyebrow">Simulation · {scene.place}</span>
        <div role="group" aria-label="Choose a scene" className="flex flex-wrap gap-1.5">
          {SCENES.map((sc) => (
            <button key={sc.id} type="button" aria-pressed={sc.id === sceneId} onClick={() => setScene(sc.id)}
              className={`min-h-9 cursor-pointer border px-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                sc.id === sceneId ? "border-acc bg-[rgb(34_211_238/0.12)] text-fg" : "border-line-2 bg-bg/60 text-muted hover:border-[var(--acc-line)] hover:text-fg"}`}>
              {sc.name}
            </button>
          ))}
        </div>
        <p className="m-0 max-w-[46ch] border-l-2 border-[#f97316] pl-2.5 font-mono text-[11px] uppercase leading-snug tracking-[0.08em] text-muted">
          <span className="text-[#f97316]">Case · </span>{scene.incident}
        </p>
        <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
          {PHASES.map((p, i) => (
            <li key={p.id} className={`border px-2.5 py-2 font-mono text-[11px] uppercase leading-none tracking-[0.12em] transition-colors ${
              i === phase ? "border-acc bg-acc text-acc-ink" : i < phase ? "border-[var(--acc-line)] bg-bg/60 text-muted" : "border-line-2 bg-bg/60 text-dim"}`}>
              {p.label}
            </li>
          ))}
        </ol>
        <p className="max-w-[24ch] font-display text-[clamp(20px,2vw,28px)] leading-tight min-[1025px]:min-h-[2.4em]">{captionFor(scene, phase)}</p>
      </div>

      <div className={`min-[1025px]:pointer-events-auto flex flex-col gap-3 min-[1025px]:col-start-2 min-[1025px]:row-span-3 min-[1025px]:row-start-1 min-[1025px]:self-start`}>
        <div className="panel">
          <h3 className="border-b border-line px-3.5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-dim">Live readout</h3>
          <dl className="m-0 grid grid-cols-2">
            <Stat label="On site" value={readout?.people ?? 0} />
            <Stat label="Tracked now" value={readout?.tracked ?? 0} />
            <Stat label="Highest risk" value={readout?.highest ?? "Low"} color={readout && readout.highest !== "Low" ? levelColor[readout.highest] : undefined} />
            <Stat label="Shift clock" value={readout?.clock ?? "08:42"} />
          </dl>
          <div className="flex flex-col gap-1.5 px-3.5 py-3">
            {(readout?.zones ?? []).map((z) => (
              <div key={z.id} className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 font-mono text-[11px] tracking-[0.08em]">
                <span>{z.id}</span>
                <div className="relative h-[5px] overflow-hidden bg-line-2">
                  <i className="absolute inset-y-0 left-0 transition-all duration-300" style={{ width: `${Math.min(100, (z.count / 12) * 100)}%`, background: levelColor[z.level] }} />
                </div>
                <span className="whitespace-nowrap text-right" style={{ color: z.level === "Low" ? "var(--color-muted)" : levelColor[z.level] }}>{z.level} · {z.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 className="border-b border-line px-3.5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-dim">Event log</h3>
          <ul className="m-0 flex max-h-[150px] list-none flex-col overflow-hidden p-0 py-1.5 min-[1025px]:max-h-[190px]" aria-live="polite">
            {log.map((e) => (
              <li key={e.id} className={`log-in grid grid-cols-[62px_minmax(0,1fr)] gap-2 px-3.5 py-1.5 font-mono text-[11.5px] leading-snug ${e.kind === "alert" ? "text-[#ffd9bf]" : e.kind === "rec" ? "text-[#c7f5fc]" : "text-muted"}`}>
                <time className={`tabular-nums ${e.kind === "alert" ? "text-orange" : e.kind === "rec" ? "text-acc" : "text-dim"}`}>{e.clock}</time>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${corner} flex max-w-[520px] flex-col gap-3.5 self-end min-[1025px]:col-start-1 min-[1025px]:row-start-3`}>
        <p className="max-w-[52ch] text-[13px] text-dim">{hero.simNote}</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn" onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
          <button type="button" className="btn" onClick={() => goTo("assemble")}>Rebuild ORION</button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line px-3.5 py-3 odd:border-r">
      <dt className="font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-dim">{label}</dt>
      <dd className="m-0 font-display text-[22px] font-semibold leading-tight tabular-nums" style={color ? { color } : undefined}>{value}</dd>
    </div>
  );
}
