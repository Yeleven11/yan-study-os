import { Suspense } from "react";
import TimelinePage from "@/components/timeline/timeline-page";

export default function TimelineRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-[var(--muted)]">Loading timeline...</div>
        </div>
      }
    >
      <TimelinePage />
    </Suspense>
  );
}
