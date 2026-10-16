import { capabilities, engineering, hardware, members, pipeline, roadmap, site, sources, statement } from "@/content/site";
import { CapabilityIcon } from "./icons";
import { TeamLogo, TeamLogoFull } from "./TeamLogo";

function Head({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="rise flex max-w-[720px] flex-col gap-3.5">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-[clamp(32px,3.4vw,50px)] leading-[1.06]">{title}</h2>
      {body && <p className="max-w-[60ch] text-muted">{body}</p>}
    </div>
  );
}

const section = "border-b border-line";
const inner = "wrap flex flex-col gap-[clamp(36px,5vw,56px)] py-[clamp(72px,10vw,128px)]";

export function Statement() {
  return (
    <section className={section}>
      <div className={`${inner} rise`}>
        <p className="max-w-[22ch] font-display text-[clamp(28px,3.6vw,52px)] font-medium leading-[1.14]">
          {statement.text} <em className="not-italic text-acc">{statement.accent}</em>
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {statement.figures.map((f) => (
            <div key={f.label} className="flex flex-col gap-1.5 border-l border-line-2 pl-5">
              <b className="font-display text-[clamp(36px,4vw,48px)] font-semibold leading-none">{f.value}</b>
              <span className="text-sm text-dim">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Capabilities() {
  return (
    <section id="capabilities" className={section}>
      <div className={inner}>
        <Head eyebrow="Capabilities" title="Six capabilities. One continuous loop."
          body="Each capability feeds the next, so the tower moves from seeing people to recommending action without anyone stitching the pieces together." />
        <div className="rise grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-px border border-line bg-line">
          {capabilities.map((c) => (
            <article key={c.title} className="flex min-w-0 flex-col gap-3.5 bg-panel px-[30px] py-[34px]">
              <CapabilityIcon name={c.icon} />
              <h3 className="text-[22px]">{c.title}</h3>
              <p className="text-[15px] text-muted">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pipeline() {
  return (
    <section id="pipeline" className={`${section} bg-panel-2`}>
      <div className={inner}>
        <Head eyebrow="How it works" title="Five stages, running continuously." />
        <ol className="rise m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-6 p-0">
          {pipeline.map((p, i) => (
            <li key={p.step} className={`flex flex-col gap-2.5 border-t-2 pt-[18px] ${i === 0 ? "border-acc" : "border-line-2"}`}>
              <span className="eyebrow">{String(i + 1).padStart(2, "0")} · {p.step}</span>
              <b className="font-display text-xl font-semibold leading-tight">{p.title}</b>
              <p className="text-sm text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Hardware() {
  return (
    <section id="hardware" className={section}>
      <div className={inner}>
        <Head eyebrow="Hardware" title="Built in two tracks."
          body="A working competition tower today, and an engineered scale prototype heading toward a production unit." />
        <div className="rise grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-6">
          {hardware.map((h) => (
            <div key={h.title} className="flex min-w-0 flex-col gap-[22px] border border-line bg-panel px-8 py-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <b className="font-display text-2xl font-semibold leading-tight">{h.title}</b>
                <span className={`border px-2.5 py-[7px] font-mono text-[11px] uppercase leading-none tracking-[0.12em] ${h.current ? "border-acc bg-acc text-acc-ink" : "border-[var(--acc-line)] text-acc"}`}>{h.badge}</span>
              </div>
              <dl className="m-0 flex flex-col">
                {h.specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-t border-line py-[13px] text-[15px] last:border-b">
                    <dt className="text-dim">{k}</dt>
                    <dd className="m-0 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Roadmap() {
  return (
    <section id="roadmap" className={`${section} bg-panel-2`}>
      <div className={inner}>
        <Head eyebrow="Roadmap" title="From standing watch to autonomous patrol." />
        <div className="rise grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-6">
          {roadmap.map((r) => (
            <div key={r.when} className={`flex flex-col gap-3.5 border px-7 py-[30px] ${r.current ? "border-[var(--acc-line)] bg-[rgb(34_211_238/0.06)]" : "border-line bg-panel"}`}>
              <span className={`font-mono text-xs uppercase tracking-[0.14em] ${r.current ? "text-acc" : "text-dim"}`}>{r.when}</span>
              <b className="font-display text-2xl font-semibold leading-tight">{r.title}</b>
              <p className="text-[15px] text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Engineering() {
  return (
    <section id="engineering" className={section}>
      <div className={inner}>
        <Head eyebrow="Engineering answers" title="Three hard questions, answered in the design."
          body="These are the main challenges a field crowd-monitoring unit faces, and the design decision ORION makes for each." />
        <div className="rise grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
          {engineering.map((e, i) => (
            <div key={e.tag} className="flex min-w-0 flex-col gap-4 border border-line bg-panel px-7 py-8">
              <span className="eyebrow">{String(i + 1).padStart(2, "0")} · {e.tag}</span>
              <p className="text-[15px] text-dim"><b className="font-medium text-muted">Challenge.</b> {e.problem}</p>
              <p className="text-[16px] text-fg"><b className="font-semibold text-acc">ORION.</b> {e.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Team() {
  return (
    <section id="team" className={section}>
      <div className={`${inner} rise`}>
        <div className="flex flex-col gap-5">
          <TeamLogoFull width={260} className="max-w-[70vw]" />
          <h2 className="max-w-[18ch] text-[clamp(34px,4.6vw,60px)] leading-[1.04]">Built by team <span className="text-acc">ForgeX_NBU</span>.</h2>
          <p className="max-w-[60ch] text-[17px] text-muted">{site.university} · {site.competition} · {site.track}</p>
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-px border border-line bg-line p-0">
          {members.map((m) => (
            <li key={m} className="flex flex-col gap-1 bg-panel px-6 py-5">
              <b className="font-display text-xl font-semibold">{m}</b>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Team member</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-dim">Sources</span>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {sources.map((src) => <li key={src.href}><a href={src.href} target="_blank" rel="noreferrer" className="text-muted underline decoration-line-2 underline-offset-4 hover:text-fg">{src.label}</a></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap flex flex-wrap justify-between gap-3 py-7 font-mono text-xs tracking-[0.06em] text-dim">
        <span>{site.name} · {site.expansion}</span>
        <span className="flex items-center gap-2">© {new Date().getFullYear()} <TeamLogo size={18} /></span>
      </div>
    </footer>
  );
}
