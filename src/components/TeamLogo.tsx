/**
 * ForgeX_NBU team mark. Placeholder until the official logo arrives:
 * drop the file in /public as forgex-logo.png and set LOGO_SRC below.
 */
const LOGO_SRC: string | null = null; // e.g. "/forgex-logo.png"

export function TeamLogo({ size = 28, withName = true, className = "" }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {LOGO_SRC ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO_SRC} alt="ForgeX_NBU" width={size} height={size} style={{ height: size, width: "auto" }} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
          <rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="#22D3EE" strokeWidth="1.6" />
          <path d="M9 23V9h10M9 16h7" fill="none" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="square" />
          <path d="M19 19l6 6M25 19l-6 6" fill="none" stroke="#22D3EE" strokeWidth="2.4" strokeLinecap="square" />
        </svg>
      )}
      {withName && <b className="font-display font-semibold tracking-[0.06em]">ForgeX<span className="text-acc">_NBU</span></b>}
    </span>
  );
}
