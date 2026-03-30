import type { ActiveTimerState, OfflineAction } from "@/lib/types";

export type AuthStatus = "checking" | "signedOut" | "signedIn";
export type DashboardSessionMode = "full" | "demo";
export type ExpandedCard = "calendar" | "timer" | "totals" | "health" | null;

export const TIMER_STORAGE_KEY = "yan-study-os:active-timer:v1";
export const OFFLINE_QUEUE_KEY = "yan-study-os:offline-queue:v1";
export const COUNTDOWN_BASELINES_KEY = "yan-study-os:countdown-baselines:v1";
export const SCIENTIFIC_MODE_KEY = "yan-study-os:scientific-mode:v1";

export function readStoredTimer(): ActiveTimerState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ActiveTimerState;
  } catch {
    window.localStorage.removeItem(TIMER_STORAGE_KEY);
    return null;
  }
}

export function readStoredQueue(): OfflineAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OfflineAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return [];
  }
}

export function readCountdownBaselines(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(COUNTDOWN_BASELINES_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, seconds]) => typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0,
      ),
    );
  } catch {
    window.localStorage.removeItem(COUNTDOWN_BASELINES_KEY);
    return {};
  }
}
