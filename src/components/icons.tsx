import type { IconName } from "@/content/site";

export function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 2v12M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3M5 5l3-3 3 3M5 11l3 3 3-3" />
    </svg>
  );
}

export function OrionMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#22D3EE" strokeWidth="1.6" aria-hidden>
      <path d="M14 2 L24 8 V20 L14 26 L4 20 V8 Z" />
      <circle cx="14" cy="14" r="4" />
    </svg>
  );
}

const PATHS: Record<IconName, React.ReactNode> = {
  detect: <><path d="M4 10V4h6M26 4h6v6M32 26v6h-6M10 32H4v-6" /><circle cx="18" cy="13" r="4" /><path d="M10 27c1.5-4.5 4.5-7 8-7s6.5 2.5 8 7" /></>,
  zones: <><rect x="4" y="4" width="12" height="12" /><rect x="20" y="4" width="12" height="12" /><rect x="4" y="20" width="12" height="12" /><rect x="20" y="20" width="12" height="12" /><circle cx="24" cy="24" r="1.2" /><circle cx="28" cy="27" r="1.2" /><circle cx="25" cy="29" r="1.2" /><circle cx="10" cy="10" r="1.2" /></>,
  risk: <><path d="M4 28h28" /><path d="M4 24l7-6 6 4 7-10 8 6" /><circle cx="24" cy="12" r="2" /></>,
  recommend: <path d="M18 4l3.5 9.5L31 17l-9.5 3.5L18 30l-3.5-9.5L5 17l9.5-3.5z" />,
  dashboard: <><rect x="4" y="6" width="28" height="20" /><path d="M12 32h12M18 26v6M9 20v-4M14 20v-8M19 20v-6M24 20v-10" /></>,
  log: <><rect x="7" y="4" width="22" height="28" /><path d="M12 11h12M12 16h12M12 21h8" /><circle cx="24" cy="26" r="2.5" /></>,
};

export function CapabilityIcon({ name }: { name: IconName }) {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="text-acc">
      {PATHS[name]}
    </svg>
  );
}
