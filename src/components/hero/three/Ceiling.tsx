"use client";

import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/** Hides ceiling fixtures whenever the camera rises above them (overhead density view). */
export function Ceiling({ height, children }: { height: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => { if (ref.current) ref.current.visible = camera.position.y < height - 0.3; });
  return <group ref={ref}>{children}</group>;
}
