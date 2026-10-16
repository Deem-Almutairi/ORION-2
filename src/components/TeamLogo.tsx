/**
 * ForgeX_NBU team mark. `forgex-mark.png` is the X alone (header, footer);
 * `forgex-logo.png` is the full lockup with the wordmark (team section).
 * Both are cut from the official logo with a transparent background.
 */
const MARK = { src: "/forgex-mark.png", w: 320, h: 217 };
const FULL = { src: "/forgex-logo.png", w: 900, h: 718 };

export function TeamLogo({ size = 28, withName = true, className = "" }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MARK.src} alt={withName ? "" : "ForgeX_NBU"} width={Math.round((size * MARK.w) / MARK.h)} height={size} style={{ height: size, width: "auto" }} />
      {withName && (
        <b className="font-display font-semibold tracking-[0.06em]">
          Forge<span className="text-[#F7931E]">X</span><span className="text-muted">_NBU</span>
        </b>
      )}
    </span>
  );
}

/** Full ForgeX_NBU lockup (mark + wordmark), for the team section. */
export function TeamLogoFull({ width = 280, className = "" }: { width?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={FULL.src} alt="ForgeX_NBU" width={width} height={Math.round((width * FULL.h) / FULL.w)} className={className} style={{ width, height: "auto" }} />
  );
}
