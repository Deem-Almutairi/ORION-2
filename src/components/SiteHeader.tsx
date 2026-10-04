import { site } from "@/content/site";
import { OrionMark } from "./icons";
import { TeamLogo } from "./TeamLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="wrap flex min-h-14 items-center justify-between gap-4 py-1.5 min-[1025px]:min-h-16 min-[1025px]:gap-7">
        <a href="#top" aria-label={`${site.name} home`} className="flex min-h-11 items-center gap-2.5 text-fg no-underline">
          <OrionMark />
          <b className="font-display text-[19px] font-bold tracking-[0.22em]">{site.name}</b>
        </a>
        <nav aria-label="Sections" className="hidden gap-6 min-[1025px]:flex">
          {site.nav.map((n) => (
            <a key={n.href} href={n.href} className="text-sm text-muted no-underline hover:text-fg">{n.label}</a>
          ))}
        </nav>
        <a href="#team" className="flex min-h-11 items-center gap-2 text-sm text-fg no-underline" aria-label="Team ForgeX_NBU">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-dim sm:inline">by</span>
          <TeamLogo size={26} />
        </a>
      </div>
    </header>
  );
}
