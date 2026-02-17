import type {
  DailyRecommendation,
  DailyReadiness,
  ScientificChartPointPayload,
  ScientificDailyMetrics,
  WorkoutEntry,
} from "@/lib/types";

type ScientificDashboardProps = {
  todayReadiness: DailyReadiness | null;
  todayRecommendation: DailyRecommendation | null;
  todayScientific: ScientificDailyMetrics | null;
  scientificSeries: ScientificDailyMetrics[];
  sortedWorkouts: WorkoutEntry[];
  onExitScientificMode?: () => void;
};

type TrendPoint = {
  date: string;
  value: number;
  payload: ScientificChartPointPayload;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreColor(score: number): string {
  if (score >= 75) {
    return "#4ade80";
  }
  if (score >= 60) {
    return "#facc15";
  }
  if (score >= 45) {
    return "#fb923c";
  }
  return "#f87171";
}

function formatStateLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatContributionMap(map: Record<string, number>): string {
  const entries = Object.entries(map);
  if (entries.length === 0) {
    return "None";
  }
  return entries
    .map(([key, value]) => `${key}: ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`)
    .join(", ");
}

function GaugeRing({
  label,
  value,
  max,
  sublabel,
  title,
}: {
  label: string;
  value: number;
  max: number;
  sublabel?: string;
  title?: string;
}) {
  const normalized = clamp(value / Math.max(max, 1), 0, 1);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference * normalized;

  return (
    <article
      className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2"
      title={title}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${label} ${value}`}>
          <circle cx="38" cy="38" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="8" fill="none" />
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke={scoreColor((value / max) * 100)}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            transform="rotate(-90 38 38)"
            strokeDasharray={`${stroke} ${Math.max(circumference - stroke, 0)}`}
          />
          <text x="38" y="42" textAnchor="middle" className="fill-[var(--text)] text-[16px] font-semibold">
            {Math.round(value)}
          </text>
        </svg>
        <div>
          <p className="text-xs text-[var(--muted)]">/ {max}</p>
          {sublabel ? <p className="mt-1 text-[11px] text-[var(--muted)]">{sublabel}</p> : null}
        </div>
      </div>
    </article>
  );
}

function RangeBar({
  label,
  low,
  center,
  high,
  max = 100,
  title,
}: {
  label: string;
  low: number;
  center: number;
  high: number;
  max?: number;
  title?: string;
}) {
  const left = clamp((low / max) * 100, 0, 100);
  const mid = clamp((center / max) * 100, 0, 100);
  const right = clamp((high / max) * 100, 0, 100);

  return (
    <article
      className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-2"
      title={title}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
        <p className="text-xs text-[var(--muted)]">
          {low.toFixed(1)}-{high.toFixed(1)}
        </p>
      </div>
      <div className="relative mt-2 h-2 rounded bg-black/35">
        <div
          className="absolute top-0 h-2 rounded bg-[#5BC0EB]/60"
          style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-1 rounded bg-white"
          style={{ left: `${mid}%`, transform: "translateX(-50%)" }}
        />
      </div>
    </article>
  );
}

function MetricBar({
  label,
  value,
  max,
  color,
  title,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  title?: string;
}) {
  const ratio = clamp(value / Math.max(max || 100, 1), 0, 1);
  return (
    <div title={title}>
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 rounded bg-black/30">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${Math.max(2, ratio * 100)}%`, backgroundColor: color || "#5BC0EB" }}
        />
      </div>
    </div>
  );
}

function ReasonList({ label, reasons }: { label: string; reasons: string[] }) {
  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      {reasons.length === 0 ? (
        <p className="mt-1 text-xs text-[var(--muted)]">No specific reasons triggered.</p>
      ) : (
        <div className="mt-1 space-y-1 text-xs text-[var(--muted)]">
          {reasons.map((reason) => (
            <p key={`${label}-${reason}`}>• {reason}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function TrendChart({
  title,
  points,
  max,
  color,
}: {
  title: string;
  points: TrendPoint[];
  max: number;
  color: string;
}) {
  if (points.length === 0) {
    return (
      <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">No data</p>
      </article>
    );
  }

  const width = 360;
  const height = 120;
  const padX = 10;
  const padY = 12;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padY * 2;

  const chartPoints = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * plotWidth;
    const y = padY + (1 - clamp(point.value / Math.max(max, 1), 0, 1)) * plotHeight;
    return { x, y, ...point };
  });

  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const maxValue = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
      <svg className="mt-2 h-[120px] w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
          points={`${padX},${height - padY} ${width - padX},${height - padY}`}
        />
        <polyline fill="none" stroke={color} strokeWidth="2" points={polyline} />
        {chartPoints.map((point) => (
          <circle key={`${title}-${point.date}`} cx={point.x} cy={point.y} r="3" fill={color}>
            <title>{`${point.date}\nscore: ${point.value.toFixed(2)}\nraw: ${point.payload.rawValue.toFixed(2)}\nnormalized: ${point.payload.normalizedValue.toFixed(3)}\nconfidence: ${(point.payload.confidence * 100).toFixed(0)}%\ncomponents: ${formatContributionMap(point.payload.componentContributions)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-[var(--muted)]">
        <p>Min {min.toFixed(1)}</p>
        <p>Avg {avg.toFixed(1)}</p>
        <p className="text-right">Max {maxValue.toFixed(1)}</p>
      </div>
    </article>
  );
}

export function ScientificDashboard({
  todayReadiness,
  todayRecommendation,
  todayScientific,
  scientificSeries,
  sortedWorkouts,
  onExitScientificMode,
}: ScientificDashboardProps) {
  const latest = todayScientific;
  const latestReadiness = todayReadiness;
  const latestRecommendation = todayRecommendation;

  const tail14 = scientificSeries.slice(-14);
  const tail21 = scientificSeries.slice(-21);

  if (!latest) {
    return (
      <>
        <main className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)]">
          <p className="text-sm text-[var(--muted)]">No scientific model data yet.</p>
        </main>
        <aside className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          Import health + study data to enable this mode.
        </aside>
      </>
    );
  }

  const physicalTrendPoints: TrendPoint[] = tail14.map((item) => ({
    date: item.date,
    value: item.physicalStrain,
    payload: item.chartPayloads.physicalStrain,
  }));

  const mentalTrendPoints: TrendPoint[] = tail14.map((item) => ({
    date: item.date,
    value: item.mentalStrain,
    payload: item.chartPayloads.mentalStrain,
  }));

  const sleepExplain = latest.explainability.sleep;
  const physicalRecoveryExplain = latest.explainability.physicalRecovery;
  const mentalRecoveryExplain = latest.explainability.mentalRecovery;
  const targetExplain = latest.explainability.targetRange;

  return (
    <>
      <main
        className="grid h-full min-h-0 gap-4 overflow-hidden"
        style={{ gridTemplateRows: "240px minmax(0, 1fr) 300px" }}
      >
        <section className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Scientific View</p>
              <h2 className="text-sm font-semibold">Systems Snapshot</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-[var(--panel-border)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Confidence {Math.round(latest.confidence.overall * 100)}%
              </span>
              {onExitScientificMode ? (
                <button
                  type="button"
                  onClick={onExitScientificMode}
                  className="rounded border border-[var(--panel-border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  title="Return to default dashboard"
                >
                  Default View
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-5">
            <GaugeRing
              label="Sleep"
              value={latest.sleepScore}
              max={100}
              sublabel={`${latest.sleepHours.toFixed(1)}h vs need ${latest.sleepNeedHours.toFixed(1)}h`}
              title={sleepExplain.userMessages.join(" ")}
            />
            <GaugeRing
              label="Recovery"
              value={latest.recoveryScore}
              max={100}
              title={physicalRecoveryExplain.userMessages.join(" ")}
            />
            <GaugeRing
              label="Mental Recovery"
              value={latest.mentalRecovery}
              max={100}
              title={mentalRecoveryExplain.userMessages.join(" ")}
            />
            <RangeBar
              label="Physical Target (0-100)"
              low={latest.physicalTarget.low}
              center={latest.physicalTarget.center}
              high={latest.physicalTarget.high}
              title={targetExplain.physicalReasons.join(" ")}
            />
            <RangeBar
              label="Mental Target (0-100)"
              low={latest.mentalTarget.low}
              center={latest.mentalTarget.center}
              high={latest.mentalTarget.high}
              title={targetExplain.mentalReasons.join(" ")}
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Scientific Feed</p>
              <h2 className="text-2xl font-semibold">Interpreted Guidance</h2>
            </div>
            {latestReadiness ? (
              <span
                className="rounded border px-2 py-1 text-xs"
                style={{
                  borderColor: scoreColor(latestReadiness.score),
                  color: scoreColor(latestReadiness.score),
                }}
              >
                Readiness {Math.round(latestReadiness.score)}
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
            <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs text-[var(--muted)]">{latest.narrative}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2" title={latest.studyRationale}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Study Guidance</p>
                  <p className="mt-1 text-sm font-semibold">
                    {latest.studyTargetLow.toFixed(1)}-{latest.studyTargetHigh.toFixed(1)}h
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">{latest.studyRationale}</p>
                </div>
                <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2" title={latest.cardioLoad.stateRationale}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Cardio Load State</p>
                  <p className="mt-1 text-sm font-semibold">{formatStateLabel(latest.cardioLoad.state)}</p>
                  <p className="text-[11px] text-[var(--muted)]">State score {latest.cardioLoad.stateScore.toFixed(1)}</p>
                </div>
                <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2" title={latest.mentalLoadState.stateRationale}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Mental Load State</p>
                  <p className="mt-1 text-sm font-semibold">{formatStateLabel(latest.mentalLoadState.state)}</p>
                  <p className="text-[11px] text-[var(--muted)]">State score {latest.mentalLoadState.stateScore.toFixed(1)}</p>
                </div>
              </div>
            </article>

            <div className="grid gap-2 lg:grid-cols-2">
              <ReasonList
                label="Sleep: Why It Is Low/High"
                reasons={
                  sleepExplain.lowReasons.length > 0
                    ? sleepExplain.lowReasons
                    : sleepExplain.highReasons
                }
              />
              <ReasonList
                label="Physical Recovery Reasons"
                reasons={physicalRecoveryExplain.reasons}
              />
              <ReasonList
                label="Mental Recovery Reasons"
                reasons={mentalRecoveryExplain.reasons}
              />
              <ReasonList
                label="Target Range Reasons"
                reasons={[...targetExplain.physicalReasons, ...targetExplain.mentalReasons]}
              />
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              <TrendChart
                title="Physical Strain (14d)"
                points={physicalTrendPoints}
                max={100}
                color="#5BC0EB"
              />
              <TrendChart
                title="Mental Strain (14d)"
                points={mentalTrendPoints}
                max={100}
                color="#FDE74C"
              />
            </div>
          </div>
        </section>

        <div className="grid min-h-0 gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
          <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Physical Mechanics</p>
              <h2 className="text-sm font-semibold">Load and Recovery Dynamics</h2>
            </div>

            <div className="space-y-2">
              <MetricBar label="Raw load" value={latest.physicalRawLoad} max={Math.max(latest.physicalCap, 1)} color="#5BC0EB" />
              <MetricBar label="ATL (7d)" value={latest.physicalAcuteLoad} max={Math.max(latest.physicalCap, 1)} color="#7dd3fc" />
              <MetricBar label="CTL (42d)" value={latest.physicalChronicLoad} max={Math.max(latest.physicalCap, 1)} color="#38bdf8" />
              <MetricBar label="AI ((ATL-CTL)/CTLref)" value={latest.components.ai} max={1} color="#fb923c" />
              <MetricBar label="FI (CTL/CTLref)" value={latest.components.fi} max={2} color="#4ade80" />
            </div>

            <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Recovery Inputs</p>
              <div className="mt-2 space-y-2">
                <MetricBar label="z(HRV)" value={latest.components.zLhrv + 4} max={8} color="#4ade80" />
                <MetricBar label="z(RHR)" value={latest.components.zRhr + 4} max={8} color="#f87171" />
                <MetricBar label="z(RR)" value={latest.components.zRr + 4} max={8} color="#fb923c" />
              </div>
            </div>
          </section>

          <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Mental Mechanics</p>
              <h2 className="text-sm font-semibold">Cognitive Load and Pressure</h2>
            </div>

            <div className="space-y-2">
              <MetricBar label="Raw mental load" value={latest.mentalRawLoad} max={Math.max(latest.mentalCap, 1)} color="#FDE74C" />
              <MetricBar label="MAL (3d)" value={latest.mentalAcuteLoad} max={Math.max(latest.mentalCap, 1)} color="#fde68a" />
              <MetricBar label="MCL (21d)" value={latest.mentalChronicLoad} max={Math.max(latest.mentalCap, 1)} color="#facc15" />
              <MetricBar label="Exam urgency" value={latest.pressure} max={1} color="#f97316" />
              <MetricBar label="MAI ((MAL-MCL)/MCLref)" value={latest.components.mai} max={1} color="#f87171" />
            </div>

            <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Target Boost Terms</p>
              <div className="mt-2 space-y-2">
                <MetricBar label="Underload" value={latest.components.underload} max={1} color="#facc15" />
                <MetricBar label="Gate" value={latest.components.gate} max={1} color="#22d3ee" />
                <MetricBar label="G_under" value={latest.components.gUnder} max={1.3} color="#4ade80" />
              </div>
            </div>
          </section>
        </div>
      </main>

      <aside className="grid h-full min-h-0 gap-4" style={{ gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Confidence and Diagnostics</p>
            <h2 className="text-sm font-semibold">Trust Envelope</h2>
          </div>

          <div className="space-y-2">
            <MetricBar label="Sleep confidence" value={latest.confidence.sleep} max={1} color="#4ade80" />
            <MetricBar label="Recovery confidence" value={latest.confidence.recovery} max={1} color="#5BC0EB" />
            <MetricBar label="Physical confidence" value={latest.confidence.physicalStrain} max={1} color="#38bdf8" />
            <MetricBar label="Mental confidence" value={latest.confidence.mentalStrain} max={1} color="#facc15" />
          </div>

          <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Fallback Flags (today)</p>
            {latest.fallbackFlags.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No fallbacks triggered.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                {latest.fallbackFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2 text-xs text-[var(--muted)]">
            <p>Cardio thresholds: {formatContributionMap(latest.cardioLoad.stateThresholds)}</p>
            <p className="mt-1">Mental thresholds: {formatContributionMap(latest.mentalLoadState.stateThresholds)}</p>
          </div>
        </section>

        <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Recent Scientific Timeline</p>
            <h2 className="text-sm font-semibold">21-Day Model Trace</h2>
          </div>

          <div className="space-y-1 text-xs text-[var(--muted)]">
            {tail21
              .slice()
              .reverse()
              .map((item) => (
                <article
                  key={`trace-${item.date}`}
                  className="rounded border border-[var(--panel-border)] bg-[var(--panel-soft)] px-2 py-1.5"
                  title={item.narrative}
                >
                  <p className="font-semibold text-[var(--text)]">{item.date}</p>
                  <p>
                    Sleep {Math.round(item.sleepScore)} | Rec {Math.round(item.recoveryScore)} | Phys {item.physicalStrain.toFixed(1)} | Ment {item.mentalStrain.toFixed(1)}
                  </p>
                </article>
              ))}
          </div>

          <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Recent Workouts</p>
            {sortedWorkouts.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No workouts found.</p>
            ) : (
              <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                {sortedWorkouts.slice(0, 6).map((workout) => (
                  <p key={`scientific-workout-${workout.id}`}>
                    {workout.startedAt.slice(0, 10)} • {workout.workoutDisplayLabel || workout.workoutNameRaw || "Workout"} • {workout.durationMin.toFixed(0)}m
                  </p>
                ))}
              </div>
            )}
          </div>

          {latestRecommendation ? (
            <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2 text-xs text-[var(--muted)]">
              <p>Workout suggestion: {latestRecommendation.workoutSuggestion}</p>
              <p className="mt-1">Bedtime window: {latestRecommendation.bedtimeRangeLabel}</p>
            </div>
          ) : null}
        </section>
      </aside>
    </>
  );
}
