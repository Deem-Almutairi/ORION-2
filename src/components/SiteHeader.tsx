import { site } from "@/content/site";
import { OrionMark } from "./icons";

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
        <a href="#contact" className="btn px-3.5 text-[11px] min-[1025px]:px-5 min-[1025px]:text-xs">Request a demo</a>
      </div>
    </header>
  );
}
