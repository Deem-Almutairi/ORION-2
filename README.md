# ORION landing page

Landing page for ORION (Optimization Robotics Intelligence for Operations & Navigation).

It opens with an interactive 3D hero in two stages:

1. **Assemble:** visitors drag the six tower components onto their slots. Mouse and touch both work.
2. **Simulate:** ORION powers up and runs a looping airport-concourse shift. The loop covers patrol, detection, a density heatmap, a risk alert at Gate B2 and a recommendation that redirects the crowd to B3.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- React Three Fiber + drei for 3D, with `@react-three/postprocessing` for bloom
- Zustand for shared state between the 3D scene and the HUD
- Self-hosted fonts via Fontsource (Chakra Petch, IBM Plex Sans, IBM Plex Mono)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

Deploy to Vercel as is (no environment variables needed).

## Where things live

| Path | What it is |
| --- | --- |
| `src/content/site.ts` | All page copy: capabilities, specs, roadmap, contact. Edit text here. |
| `src/lib/parts.ts` | The six tower parts: names, mount positions, floating positions, grab sizes. |
| `src/lib/sim/config.ts` | Simulation tuning: gates, patrol route, phase timings, thresholds, passenger count. |
| `src/lib/sim/engine.ts` | Framework-free simulation engine (passengers, ORION steering, zones, risk, event log). |
| `src/lib/store.ts` | Zustand store: mode, assembly progress, phase, readout, log. |
| `src/components/hero/three/` | 3D scene: `Scene`, `AssemblyStage`, `SimulationStage`, `Hall`, `TowerParts`, shared `materials`. |
| `src/components/hero/Hud.tsx` | Overlay controls and live readout. |
| `src/components/Sections.tsx` | Statement, capabilities, pipeline, hardware, roadmap, contact, footer. |

## Common edits

- **Contact details:** set `contactEmail` and `team` in `src/content/site.ts` (currently placeholders).
- **Real ORION model:** export the CAD as `.glb` into `public/`, load it with drei's `useGLTF` and render it in place of `<Tower/>` (`src/components/hero/three/Tower.tsx`). To keep drag-to-assemble, export each component as its own named node and map them to the ids in `src/lib/parts.ts`.
- **Busier or calmer hall:** change `SIM.passengers` in `src/lib/sim/config.ts`. Lower it for older phones.
- **Glow strength:** adjust `<Bloom intensity>` in `src/components/hero/three/Scene.tsx`.

## Notes

- The 3D scene loads client-side only (`next/dynamic` with `ssr: false`). The text sections are statically rendered.
- Rendering quality drops automatically on slow devices (drei `PerformanceMonitor`).
- In development, each part's screen position is published on `window.__orionParts` for automated touch tests. This is stripped from production builds.
- The simulation is labelled on the page as a concept for a future autonomous phase. The V1 tower is stationary.
