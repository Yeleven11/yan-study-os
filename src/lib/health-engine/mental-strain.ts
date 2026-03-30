import { clamp } from "@/lib/health-engine/normalization";

const EPSILON = 1e-6;
const MENTAL_STRAIN_M0 = 60;
const MENTAL_STRAIN_MIN_REF = 200;

export function mentalStrainFromImpulse(impulse: number, impulseRef: number): number {
  const safeRef = Math.max(impulseRef, MENTAL_STRAIN_MIN_REF);
  const numerator = Math.log(1 + Math.max(impulse, 0) / MENTAL_STRAIN_M0);
  const denominator = Math.log(1 + safeRef / MENTAL_STRAIN_M0);
  return clamp(100 * (numerator / Math.max(denominator, EPSILON)), 0, 100);
}
