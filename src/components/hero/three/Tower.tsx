"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PARTS } from "@/lib/parts";
import { applyPower, power } from "./materials";
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
  useEffect(() => { power.target = on ? 1 : 0; }, [on]);
  useFrame((_, dt) => {
    const next = power.value + (power.target - power.value) * Math.min(1, dt * 2.2);
    if (Math.abs(next - power.value) > 1e-4) { power.value = next; applyPower(next); }
  });
  return null;
}
