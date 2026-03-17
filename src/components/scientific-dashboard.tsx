"use client";

import { useState, useMemo } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import type {
  DailyHealthFact,
  DailyRecommendation,
  DailyReadiness,
  ScientificChartPointPayload,
  ScientificDailyMetrics,
  WorkoutEntry,
} from "@/lib/types";

/* ─── prop types ─── */

type ScientificDashboardProps = {
  todayReadiness: DailyReadiness | null;
  todayRecommendation: DailyRecommendation | null;
  todayScientific: ScientificDailyMetrics | null;
  scientificSeries: ScientificDailyMetrics[];
  sortedWorkouts: WorkoutEntry[];
  onExitScientificMode?: () => void;
};

type ScientificTrendsRailProps = {
  scientificSeries: ScientificDailyMetrics[];
  healthDaysSorted: DailyHealthFact[];
};

type TrendPoint = {
  date: string;
  value: number;
  payload: ScientificChartPointPayload;
};

type SnapshotMetricKey = "sleep" | "recovery" | "mentalRecovery";

type SnapshotDatum = {
  date: string;
  sleep: number;
  recovery: number;
  mentalRecovery: number;
  sleepHours: number;
  sleepNeed: number;
};

/* ─── helpers ─── */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreColor(score: number): string {
  if (score >= 75) return "#34d399";
  if (score >= 60) return "#fbbf24";
  if (score >= 45) return "#fb923c";
  return "#f87171";
}

function formatStateLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeAvg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function syntheticPayload(value: number, confidence = 0.7): ScientificChartPointPayload {
  return {
    timestamp: "",
    rawValue: value,
    normalizedValue: value,
    componentContributions: {},
    confidence,
  };
}

function parseBedtimeMinutes(day: DailyHealthFact): number | undefined {
  if (typeof day.sleepBedtimeAt === "string" && day.sleepBedtimeAt.length > 0) {
    const bedtime = new Date(day.sleepBedtimeAt);
    if (Number.isFinite(bedtime.getTime())) {
      return bedtime.getHours() * 60 + bedtime.getMinutes();
    }
  }
  if (typeof day.sleepBedtimeHour === "number" && Number.isFinite(day.sleepBedtimeHour)) {
    return (((day.sleepBedtimeHour % 24) + 24) % 24) * 60;
  }
  return undefined;
}

function formatClockMinutes(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60).toString().padStart(2, "0");
  const mm = (normalized % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDelta(current: number, baseline: number): string {
  const delta = current - baseline;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

/* ─── custom tooltip for area charts ─── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-[var(--text)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── radial gauge component ─── */

function RadialGauge({
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
  const normalized = clamp(value, 0, max);
  const color = scoreColor((normalized / Math.max(max, 1)) * 100);
  const data = [{ name: label, value: normalized, fill: color }];

  return (
    <article
      className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-3"
      title={title}
    >
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div className="relative h-[80px] w-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={8}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: "rgba(255,255,255,0.06)" }}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color }}>
              {Math.round(value)}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted)]">/ {max}</p>
          {sublabel ? <p className="mt-0.5 text-[11px] text-[var(--muted)]">{sublabel}</p> : null}
        </div>
      </div>
    </article>
  );
}

/* ─── range bar (physical/mental target) ─── */

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
  const leftPct = clamp((low / max) * 100, 0, 100);
  const midPct = clamp((center / max) * 100, 0, 100);
  const rightPct = clamp((high / max) * 100, 0, 100);

  return (
    <article
      className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] px-3 py-3"
      title={title}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
        <p className="text-xs text-[var(--muted)]">
          {low.toFixed(1)} – {high.toFixed(1)}
        </p>
      </div>
      <div className="relative mt-3 h-2.5 rounded-full bg-white/[0.04]">
        <div
          className="absolute top-0 h-2.5 rounded-full bg-[var(--focus)]/30"
          style={{ left: `${leftPct}%`, width: `${Math.max(rightPct - leftPct, 2)}%` }}
        />
        <div
          className="absolute -top-0.5 h-3.5 w-1 rounded-full bg-white"
          style={{ left: `${midPct}%`, transform: "translateX(-50%)" }}
        />
      </div>
    </article>
  );
}

/* ─── metric bar ─── */

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
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, ratio * 100)}%`, backgroundColor: color || "#8b5cf6" }}
        />
      </div>
    </div>
  );
}

/* ─── reason list ─── */

function ReasonList({ label, reasons }: { label: string; reasons: string[] }) {
  return (
    <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      {reasons.length === 0 ? (
        <p className="mt-1 text-xs text-[var(--muted)]">No specific reasons triggered.</p>
      ) : (
        <ul className="mt-1.5 space-y-1 text-xs text-[var(--muted)]">
          {reasons.map((reason) => (
            <li key={`${label}-${reason}`} className="flex gap-1.5">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[var(--focus)]" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ─── area trend chart ─── */

function TrendAreaChart({
  title,
  points,
  color,
  unit,
  gradientId,
}: {
  title: string;
  points: TrendPoint[];
  color: string;
  unit?: string;
  gradientId: string;
}) {
  if (points.length === 0) {
    return (
      <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">No data</p>
      </article>
    );
  }

  const data = points.map((p) => ({
    date: shortDate(p.date),
    value: Number(p.value.toFixed(1)),
  }));

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = safeAvg(values);

  return (
    <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
        <p className="text-[10px] tabular-nums text-[var(--muted)]">
          avg {avg.toFixed(1)}{unit ? ` ${unit}` : ""}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2736" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7b8ba3" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#7b8ba3" }} tickLine={false} axisLine={false} width={40} />
          <RechartsTooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--muted)]">
        <span>Min {min.toFixed(1)}</span>
        <span>Max {max.toFixed(1)}</span>
      </div>
    </article>
  );
}

/* ─── snapshot heatmap (14 day) ─── */

function SnapshotHeatmap({ rows }: { rows: SnapshotDatum[] }) {
  const metrics: Array<{ key: SnapshotMetricKey; label: string }> = [
    { key: "sleep", label: "Sleep" },
    { key: "recovery", label: "Recovery" },
    { key: "mentalRecovery", label: "Mental" },
  ];

  const data = rows.map((row) => ({
    date: shortDate(row.date),
    Sleep: Math.round(row.sleep),
    Recovery: Math.round(row.recovery),
    Mental: Math.round(row.mentalRecovery),
  }));

  return (
    <article className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Last 14 Days Snapshot
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-2">
          {rows.map((row) => (
            <div key={`snapshot-${row.date}`} className="flex flex-col items-center gap-1">
              {metrics.map((metric) => {
                const value = row[metric.key];
                return (
                  <div
                    key={`${row.date}-${metric.key}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold"
                    style={{ backgroundColor: scoreColor(value), color: "#000" }}
                    title={`${row.date} ${metric.label}: ${value.toFixed(1)}`}
                  >
                    {Math.round(value)}
                  </div>
                );
              })}
              <p className="mt-0.5 text-[9px] text-[var(--muted)]">{shortDate(row.date)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-[10px] text-[var(--muted)]">
        {metrics.map((m) => (
          <span key={m.key} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: scoreColor(75) }} /> {m.label}
          </span>
        ))}
      </div>
    </article>
  );
}

/* ─── stat card with delta comparison ─── */

function StatCard({
  title,
  current,
  previous,
  historical,
  formatter,
}: {
  title: string;
  current: number;
  previous: number;
  historical: number;
  formatter: (value: number) => string;
}) {
  const delta = current - previous;
  const deltaColor = delta >= 0 ? "#34d399" : "#f87171";

  return (
    <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-base font-bold">{formatter(current)}</p>
      <div className="mt-1.5 flex items-center gap-3 text-[11px]">
        <span style={{ color: deltaColor }}>
          {formatDelta(current, previous)} vs prev
        </span>
        <span className="text-[var(--muted)]">
          {formatDelta(current, historical)} vs 180d
        </span>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED: ScientificTrendsRail
   ═══════════════════════════════════════════════ */

export function ScientificTrendsRail({ scientificSeries, healthDaysSorted }: ScientificTrendsRailProps) {
  const tail7 = scientificSeries.slice(-7);
  const prev7 = scientificSeries.slice(-14, -7);
  const tail180 = scientificSeries.slice(-180);

  const bedtimeSeries = healthDaysSorted
    .map((day) => ({ date: day.date, bedtimeMinutes: parseBedtimeMinutes(day) }))
    .filter((e): e is { date: string; bedtimeMinutes: number } => typeof e.bedtimeMinutes === "number");

  const bedtime7 = bedtimeSeries.slice(-7).map((e) => e.bedtimeMinutes);
  const bedtimePrev7 = bedtimeSeries.slice(-14, -7).map((e) => e.bedtimeMinutes);
  const bedtime180 = bedtimeSeries.slice(-180).map((e) => e.bedtimeMinutes);

  const sleepHours7 = safeAvg(tail7.map((i) => i.sleepHours));
  const sleepHoursPrev7 = safeAvg(prev7.map((i) => i.sleepHours));
  const sleepHours180 = safeAvg(tail180.map((i) => i.sleepHours));

  const sleepScore7 = safeAvg(tail7.map((i) => i.sleepScore));
  const sleepScorePrev7 = safeAvg(prev7.map((i) => i.sleepScore));
  const sleepScore180 = safeAvg(tail180.map((i) => i.sleepScore));

  const recovery7 = safeAvg(tail7.map((i) => i.recoveryScore));
  const recoveryPrev7 = safeAvg(prev7.map((i) => i.recoveryScore));
  const recovery180 = safeAvg(tail180.map((i) => i.recoveryScore));

  const cardioLoad7 = safeAvg(tail7.map((i) => i.physicalChronicLoad));
  const cardioLoadPrev7 = safeAvg(prev7.map((i) => i.physicalChronicLoad));
  const cardioLoad180 = safeAvg(tail180.map((i) => i.physicalChronicLoad));

  const sleepTrend: TrendPoint[] = scientificSeries.slice(-21).map((i) => ({
    date: i.date,
    value: i.sleepScore,
    payload: syntheticPayload(i.sleepScore, i.confidence.sleep),
  }));

  const cardioTrend: TrendPoint[] = scientificSeries.slice(-21).map((i) => ({
    date: i.date,
    value: i.physicalChronicLoad,
    payload: syntheticPayload(i.physicalChronicLoad, i.confidence.physicalStrain),
  }));

  const bedtimeTrend: TrendPoint[] = bedtimeSeries.slice(-21).map((i) => ({
    date: i.date,
    value: i.bedtimeMinutes / 60,
    payload: syntheticPayload(i.bedtimeMinutes / 60, 0.8),
  }));

  return (
    <>
      <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Scientific Stats</p>
          <h2 className="text-sm font-semibold">Weekly vs Baseline</h2>
        </div>
        <div className="space-y-2">
          <StatCard title="Avg Sleep Hours (7d)" current={sleepHours7} previous={sleepHoursPrev7} historical={sleepHours180} formatter={(v) => `${v.toFixed(2)} h`} />
          <StatCard title="Avg Bedtime (7d)" current={safeAvg(bedtime7)} previous={safeAvg(bedtimePrev7)} historical={safeAvg(bedtime180)} formatter={(v) => (v > 0 ? formatClockMinutes(v) : "No data")} />
          <StatCard title="Avg Sleep Score (7d)" current={sleepScore7} previous={sleepScorePrev7} historical={sleepScore180} formatter={(v) => v.toFixed(1)} />
          <StatCard title="Avg Recovery Score (7d)" current={recovery7} previous={recoveryPrev7} historical={recovery180} formatter={(v) => v.toFixed(1)} />
          <StatCard title="Avg Cardio Load CTL (7d)" current={cardioLoad7} previous={cardioLoadPrev7} historical={cardioLoad180} formatter={(v) => v.toFixed(1)} />
        </div>
      </section>

      <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <div className="mb-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Trend Dashboard</p>
          <h2 className="text-sm font-semibold">Raw Trends</h2>
        </div>
        <div className="space-y-3">
          <TrendAreaChart title="Sleep Score (21d)" points={sleepTrend} color="#34d399" gradientId="sleepGrad" />
          <TrendAreaChart title="Cardio Load CTL (21d)" points={cardioTrend} color="#38bdf8" gradientId="cardioGrad" />
          {bedtimeTrend.length > 0 ? (
            <TrendAreaChart title="Bedtime Hour (21d)" points={bedtimeTrend} color="#fbbf24" unit="h" gradientId="bedtimeGrad" />
          ) : (
            <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Bedtime Hour (21d)</p>
              <p className="mt-2 text-xs text-[var(--muted)]">No bedtime timestamps available yet.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED: ScientificDashboard
   ═══════════════════════════════════════════════ */

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
  const [showSnapshotHistory, setShowSnapshotHistory] = useState(false);

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

  const physicalTrendPoints: TrendPoint[] = tail14.map((i) => ({
    date: i.date,
    value: i.physicalStrain,
    payload: i.chartPayloads.physicalStrain,
  }));

  const mentalTrendPoints: TrendPoint[] = tail14.map((i) => ({
    date: i.date,
    value: i.mentalStrain,
    payload: i.chartPayloads.mentalStrain,
  }));

  const cardioLoadTrendPoints: TrendPoint[] = tail21.map((i) => ({
    date: i.date,
    value: i.physicalChronicLoad,
    payload: {
      ...i.chartPayloads.physicalStrain,
      rawValue: i.physicalChronicLoad,
      normalizedValue: i.physicalChronicLoad,
      componentContributions: {
        ctl: i.physicalChronicLoad,
        atl: i.physicalAcuteLoad,
        rawLoad: i.physicalRawLoad,
      },
    },
  }));

  const snapshotRows: SnapshotDatum[] = tail14.map((i) => ({
    date: i.date,
    sleep: i.sleepScore,
    recovery: i.recoveryScore,
    mentalRecovery: i.mentalRecovery,
    sleepHours: i.sleepHours,
    sleepNeed: i.sleepNeedHours,
  }));

  const sleepExplain = latest.explainability.sleep;
  const physicalRecoveryExplain = latest.explainability.physicalRecovery;
  const mentalRecoveryExplain = latest.explainability.mentalRecovery;
  const targetExplain = latest.explainability.targetRange;

  /* stacked area data for physical/mental strain overlay */
  const dualStrainData = tail14.map((i) => ({
    date: shortDate(i.date),
    physical: Number(i.physicalStrain.toFixed(1)),
    mental: Number(i.mentalStrain.toFixed(1)),
  }));

  return (
    <>
      <main
        className="grid h-full min-h-0 gap-4 overflow-hidden"
        style={{ gridTemplateRows: "auto minmax(0, 1fr) 340px" }}
      >
        {/* ── systems snapshot ── */}
        <section className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Scientific View</p>
              <h2 className="text-sm font-semibold">Systems Snapshot</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSnapshotHistory((c) => !c)}
                className="rounded-lg border border-[var(--panel-border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--focus)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              >
                {showSnapshotHistory ? "Hide 14d" : "Show 14d"}
              </button>
              <span className="rounded-lg border border-[var(--panel-border)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Confidence {Math.round(latest.confidence.overall * 100)}%
              </span>
              {onExitScientificMode ? (
                <button
                  type="button"
                  onClick={onExitScientificMode}
                  className="rounded-lg border border-[var(--panel-border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--focus)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                >
                  Default View
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-5">
            <RadialGauge
              label="Sleep"
              value={latest.sleepScore}
              max={100}
              sublabel={`${latest.sleepHours.toFixed(1)}h vs ${latest.sleepNeedHours.toFixed(1)}h need`}
              title={sleepExplain.userMessages.join(" ")}
            />
            <RadialGauge
              label="Recovery"
              value={latest.recoveryScore}
              max={100}
              title={physicalRecoveryExplain.userMessages.join(" ")}
            />
            <RadialGauge
              label="Mental Recovery"
              value={latest.mentalRecovery}
              max={100}
              title={mentalRecoveryExplain.userMessages.join(" ")}
            />
            <RangeBar
              label="Physical Target"
              low={latest.physicalTarget.low}
              center={latest.physicalTarget.center}
              high={latest.physicalTarget.high}
              title={targetExplain.physicalReasons.join(" ")}
            />
            <RangeBar
              label="Mental Target"
              low={latest.mentalTarget.low}
              center={latest.mentalTarget.center}
              high={latest.mentalTarget.high}
              title={targetExplain.mentalReasons.join(" ")}
            />
          </div>

          {showSnapshotHistory ? <SnapshotHeatmap rows={snapshotRows} /> : null}
        </section>

        {/* ── interpreted guidance ── */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Scientific Feed</p>
              <h2 className="text-xl font-bold">Interpreted Guidance</h2>
            </div>
            {latestReadiness ? (
              <span
                className="rounded-lg border px-3 py-1 text-xs font-semibold"
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
            <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs leading-relaxed text-[var(--muted)]">{latest.narrative}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-2.5" title={latest.studyRationale}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Study Guidance</p>
                  <p className="mt-1 text-base font-bold text-[var(--focus)]">
                    {latest.studyTargetLow.toFixed(1)}-{latest.studyTargetHigh.toFixed(1)}h
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{latest.studyRationale}</p>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-2.5" title={latest.cardioLoad.stateRationale}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Cardio Load State</p>
                  <p className="mt-1 text-base font-bold text-[#38bdf8]">{formatStateLabel(latest.cardioLoad.state)}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">Score {latest.cardioLoad.stateScore.toFixed(1)}</p>
                </div>
                <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-2.5" title={latest.mentalLoadState.stateRationale}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Mental Load State</p>
                  <p className="mt-1 text-base font-bold text-[#fbbf24]">{formatStateLabel(latest.mentalLoadState.state)}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">Score {latest.mentalLoadState.stateScore.toFixed(1)}</p>
                </div>
              </div>
            </article>

            <div className="grid gap-2 lg:grid-cols-2">
              <ReasonList label="Sleep Factors" reasons={sleepExplain.lowReasons.length > 0 ? sleepExplain.lowReasons : sleepExplain.highReasons} />
              <ReasonList label="Physical Recovery" reasons={physicalRecoveryExplain.reasons} />
              <ReasonList label="Mental Recovery" reasons={mentalRecoveryExplain.reasons} />
              <ReasonList label="Target Range" reasons={[...targetExplain.physicalReasons, ...targetExplain.mentalReasons]} />
            </div>

            {/* combined strain chart */}
            <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Physical vs Mental Strain (14d)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={dualStrainData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="physGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2736" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7b8ba3" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7b8ba3" }} tickLine={false} axisLine={false} width={40} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="physical" name="Physical" stroke="#38bdf8" strokeWidth={2} fill="url(#physGrad)" dot={false} activeDot={{ r: 3, fill: "#38bdf8" }} />
                  <Area type="monotone" dataKey="mental" name="Mental" stroke="#fbbf24" strokeWidth={2} fill="url(#mentGrad)" dot={false} activeDot={{ r: 3, fill: "#fbbf24" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#7b8ba3" }} />
                </AreaChart>
              </ResponsiveContainer>
            </article>

            <TrendAreaChart title="Cardio Load CTL (21d)" points={cardioLoadTrendPoints} color="#a78bfa" gradientId="cardioLoadGrad" />
          </div>
        </section>

        {/* ── load mechanics ── */}
        <div className="grid min-h-0 gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
          <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="mb-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Physical Mechanics</p>
              <h2 className="text-sm font-semibold">Load & Recovery Dynamics</h2>
            </div>
            <div className="space-y-2">
              <MetricBar label="Raw load" value={latest.physicalRawLoad} max={Math.max(latest.physicalCap, 1)} color="#38bdf8" />
              <MetricBar label="Training load (qualifying)" value={latest.chartPayloads.physicalStrain.componentContributions.qualifyingLoad || 0} max={Math.max(latest.physicalCap, 1)} color="#7dd3fc" />
              <MetricBar label="ATL (7d)" value={latest.physicalAcuteLoad} max={Math.max(latest.physicalCap, 1)} color="#38bdf8" />
              <MetricBar label="CTL (42d)" value={latest.physicalChronicLoad} max={Math.max(latest.physicalCap, 1)} color="#a78bfa" />
              <MetricBar label="AI ((ATL-CTL)/CTLref)" value={latest.components.ai} max={1} color="#fb923c" />
              <MetricBar label="FI (CTL/CTLref)" value={latest.components.fi} max={2} color="#34d399" />
            </div>
            <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Recovery Inputs</p>
              <div className="mt-2 space-y-2">
                <MetricBar label="z(HRV)" value={latest.components.zLhrv + 4} max={8} color="#34d399" />
                <MetricBar label="z(RHR)" value={latest.components.zRhr + 4} max={8} color="#f87171" />
                <MetricBar label="z(RR)" value={latest.components.zRr + 4} max={8} color="#fb923c" />
              </div>
            </div>
          </section>

          <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="mb-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Mental Mechanics</p>
              <h2 className="text-sm font-semibold">Cognitive Load & Pressure</h2>
            </div>
            <div className="space-y-2">
              <MetricBar label="Raw mental load" value={latest.mentalRawLoad} max={Math.max(latest.mentalCap, 1)} color="#fbbf24" />
              <MetricBar label="MAL (3d)" value={latest.mentalAcuteLoad} max={Math.max(latest.mentalCap, 1)} color="#fde68a" />
              <MetricBar label="MCL (21d)" value={latest.mentalChronicLoad} max={Math.max(latest.mentalCap, 1)} color="#fbbf24" />
              <MetricBar label="Pressure score" value={latest.components.pressureScore || 0} max={100} color="#f87171" />
              <MetricBar label="MAI (stabilized)" value={latest.components.mai} max={1} color="#f87171" />
              <MetricBar label="MAI raw" value={latest.components.maiRaw || 0} max={1} color="#fb7185" />
            </div>
            <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Target Boost Terms</p>
              <div className="mt-2 space-y-2">
                <MetricBar label="Underload" value={latest.components.underload} max={1} color="#fbbf24" />
                <MetricBar label="Gate" value={latest.components.gate} max={1} color="#38bdf8" />
                <MetricBar label="G_under" value={latest.components.gUnder} max={1.3} color="#34d399" />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── right sidebar ── */}
      <aside className="grid h-full min-h-0 gap-4" style={{ gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Confidence & Diagnostics</p>
            <h2 className="text-sm font-semibold">Trust Envelope</h2>
          </div>
          <div className="space-y-2">
            <MetricBar label="Sleep confidence" value={latest.confidence.sleep} max={1} color="#34d399" />
            <MetricBar label="Recovery confidence" value={latest.confidence.recovery} max={1} color="#38bdf8" />
            <MetricBar label="Physical confidence" value={latest.confidence.physicalStrain} max={1} color="#a78bfa" />
            <MetricBar label="Mental confidence" value={latest.confidence.mentalStrain} max={1} color="#fbbf24" />
          </div>

          <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Fallback Flags</p>
            {latest.fallbackFlags.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No fallbacks triggered.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                {latest.fallbackFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {latest.denominatorDiagnostics ? (
            <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5 text-xs text-[var(--muted)]">
              <p>Physical ref: ctlRef {latest.denominatorDiagnostics.physical.ctlRef.toFixed(2)} / effective {latest.denominatorDiagnostics.physical.ctlRefEffective.toFixed(2)}</p>
              <p className="mt-1">Mental ref: mclRef {latest.denominatorDiagnostics.mental.mclRef.toFixed(2)} / effective {latest.denominatorDiagnostics.mental.mclRefEffective.toFixed(2)}</p>
              <p className="mt-1">MAI raw {latest.denominatorDiagnostics.mental.maiRaw.toFixed(2)} / clamped {latest.denominatorDiagnostics.mental.maiClamped.toFixed(2)}</p>
            </div>
          ) : null}
        </section>

        <section className="min-h-0 overflow-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
          <div className="mb-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Scientific Timeline</p>
            <h2 className="text-sm font-semibold">21-Day Model Trace</h2>
          </div>

          <div className="space-y-1 text-xs text-[var(--muted)]">
            {tail21
              .slice()
              .reverse()
              .map((item) => (
                <article
                  key={`trace-${item.date}`}
                  className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-soft)] px-2.5 py-1.5"
                  title={item.narrative}
                >
                  <p className="font-semibold text-[var(--text)]">{item.date}</p>
                  <p>
                    Sleep {Math.round(item.sleepScore)} | Rec {Math.round(item.recoveryScore)} | Phys {item.physicalStrain.toFixed(1)} | Ment {item.mentalStrain.toFixed(1)}
                  </p>
                </article>
              ))}
          </div>

          <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Recent Workouts</p>
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
            <div className="mt-3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-soft)] p-2.5 text-xs text-[var(--muted)]">
              <p>Workout suggestion: {latestRecommendation.workoutSuggestion}</p>
              <p className="mt-1">Bedtime window: {latestRecommendation.bedtimeRangeLabel}</p>
            </div>
          ) : null}
        </section>
      </aside>
    </>
  );
}
