"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PARTS } from "@/lib/parts";
import { applyPower, mast, power } from "./materials";
import { PartModel } from "./TowerParts";

/** The fully assembled tower, origin at floor level. */
export function Tower() {
  return (
    <group>
      {PARTS.map((p) => (
        <group key={p.id} position={p.target}>
          <PartModel id={p.id} />
        </group>
      ))}
    </group>
  );
}

/** Eases the shared LED and screen materials toward the current power target. */
export function PowerDriver({ on }: { on: boolean }) {
  useEffect(() => { power.target = on ? 1 : 0; mast.target = on ? 1 : 0; }, [on]);
  useFrame((_, dt) => {
    const next = power.value + (power.target - power.value) * Math.min(1, dt * 2.2);
    if (Math.abs(next - power.value) > 1e-4) { power.value = next; applyPower(next); }
    // The mast starts rising once the unit is mostly powered.
    const goal = mast.target > 0 && power.value < 0.6 ? mast.value : mast.target;
    mast.value += Math.sign(goal - mast.value) * Math.min(Math.abs(goal - mast.value), dt * 0.55);
  });
  return null;
}
