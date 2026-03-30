const EPSILON = 1e-6;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return sorted[0];
  }

  const position = clamp(q, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sorted[lower];
  }

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function mad(values: number[], center = median(values)): number {
  if (values.length === 0) {
    return 0;
  }

  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations);
}

export function robustScale(values: number[]): number {
  return 1.4826 * mad(values);
}

export function robustZ(value: number, history: number[], invert = false): number {
  if (!Number.isFinite(value) || history.length < 7) {
    return 0;
  }

  const center = median(history);
  const scale = Math.max(robustScale(history), EPSILON);
  const raw = invert ? (center - value) / scale : (value - center) / scale;
  return clamp(raw, -4, 4);
}
