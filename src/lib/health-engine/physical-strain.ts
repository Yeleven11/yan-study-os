import { clamp } from "@/lib/health-engine/normalization";

const EPSILON = 1e-6;
const PHYSICAL_STRAIN_U0 = 30;
const PHYSICAL_STRAIN_MIN_REF = 150;

export function physicalStrainFromImpulse(impulse: number, impulseRef: number): number {
  const safeRef = Math.max(impulseRef, PHYSICAL_STRAIN_MIN_REF);
  const numerator = Math.log(1 + Math.max(impulse, 0) / PHYSICAL_STRAIN_U0);
  const denominator = Math.log(1 + safeRef / PHYSICAL_STRAIN_U0);
  return clamp(100 * (numerator / Math.max(denominator, EPSILON)), 0, 100);
}
