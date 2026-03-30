import type { SleepDriverKey } from "@/lib/types";

export function sentenceForDriver(mode: "negative" | "positive", key: SleepDriverKey): string {
  if (mode === "negative") {
    if (key === "duration") {
      return "Sleep score is mainly limited by sleep duration relative to your current need.";
    }
    if (key === "regularity") {
      return "Sleep score is mainly limited by irregular sleep midpoint timing.";
    }
    if (key === "stage") {
      return "Sleep score is mainly limited by low deep/REM stage composition.";
    }
    if (key === "awake") {
      return "Sleep score is mainly limited by fragmentation and awake time.";
    }
    if (key === "schedule") {
      return "Sleep score is mainly limited by midpoint shifts from your baseline.";
    }
    return "Sleep score is mainly limited by accumulated sleep debt.";
  }

  if (key === "duration") {
    return "Sleep score is mainly supported by strong duration relative to your current need.";
  }
  if (key === "regularity") {
    return "Sleep score is mainly supported by consistent midpoint timing.";
  }
  if (key === "stage") {
    return "Sleep score is mainly supported by healthy deep/REM composition.";
  }
  if (key === "awake") {
    return "Sleep score is mainly supported by good continuity and low awake time.";
  }
  if (key === "schedule") {
    return "Sleep score is mainly supported by stable circadian timing.";
  }
  return "Sleep score is mainly supported by low sleep debt.";
}
