"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SUBJECTS, SUBJECT_BY_ID } from "@/lib/constants";
import {
  formatDuration,
  toDateKey,
  buildDayAggregates,
} from "@/lib/dashboard-utils";
import { createDashboardRepository } from "@/lib/client/repository";
import { mergeStudySessionsWithTimeline } from "@/lib/timeline";
import type {
  AppData,
  Exam,
  StudySession,
  SubjectId,
  SyllabusTopic,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlanBlock {
  subjectId: SubjectId;
  minutes: number;
  reason: string;
  focusTopics: SyllabusTopic[];
  daysUntilExam: number;
  topicGapPercent: number;
}

interface WeekDay {
  label: string;
  dateKey: string;
  hours: number;
}

/* ------------------------------------------------------------------ */
/*  Algorithm helpers                                                  */
/* ------------------------------------------------------------------ */

function nearestExamForSubject(exams: Exam[], subjectId: SubjectId, now: Date): Exam | null {
  const future = exams
    .filter((e) => e.subjectId === subjectId && new Date(e.startsAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return future[0] ?? null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function computeTopicGap(topics: SyllabusTopic[], subjectId: SubjectId): number {
  const subjectTopics = topics.filter((t) => t.subjectId === subjectId);
  if (subjectTopics.length === 0) return 0.5;
  const masteredCount = subjectTopics.filter(
    (t) => t.confidence === "confident" || t.confidence === "mastered",
  ).length;
  return 1 - masteredCount / subjectTopics.length;
}

function buildStudyPlan(
  exams: Exam[],
  syllabusTopics: SyllabusTopic[],
  baselineStudyHours: number,
  now: Date,
): PlanBlock[] {
  const totalMinutes = baselineStudyHours * 60;

  const raw: {
    subjectId: SubjectId;
    urgency: number;
    topicGap: number;
    weight: number;
    daysUntilExam: number;
    exam: Exam;
  }[] = [];

  for (const subject of SUBJECTS) {
    const exam = nearestExamForSubject(exams, subject.id, now);
    if (!exam) continue;

    const daysUntil = Math.max(1, daysBetween(now, new Date(exam.startsAt)));
    const urgency = 1 / daysUntil;
    const topicGap = computeTopicGap(syllabusTopics, subject.id);
    const weight = urgency * (0.5 + 0.5 * topicGap);

    raw.push({
      subjectId: subject.id,
      urgency,
      topicGap,
      weight,
      daysUntilExam: daysUntil,
      exam,
    });
  }

  if (raw.length === 0) return [];

  const totalWeight = raw.reduce((s, r) => s + r.weight, 0);
  const blocks: PlanBlock[] = [];

  for (const entry of raw) {
    const normalizedWeight = entry.weight / totalWeight;
    const minutes = Math.round(normalizedWeight * totalMinutes);
    if (minutes < 15) continue;

    const subjectTopics = syllabusTopics.filter(
      (t) =>
        t.subjectId === entry.subjectId &&
        (t.confidence === "not_started" || t.confidence === "learning"),
    );
    const focusTopics = subjectTopics.slice(0, 3);

    const subjectDef = SUBJECT_BY_ID[entry.subjectId];
    const gapPct = Math.round(entry.topicGap * 100);
    const reason = `${subjectDef.shortName} exam in ${entry.daysUntilExam} day${entry.daysUntilExam !== 1 ? "s" : ""}, ${gapPct}% topics uncovered`;

    blocks.push({
      subjectId: entry.subjectId,
      minutes,
      reason,
      focusTopics,
      daysUntilExam: entry.daysUntilExam,
      topicGapPercent: gapPct,
    });
  }

  blocks.sort((a, b) => a.daysUntilExam - b.daysUntilExam);
  return blocks;
}

function todaySessionsBySubject(
  sessions: StudySession[],
  todayKey: string,
): Record<SubjectId, number> {
  const result = {} as Record<SubjectId, number>;
  for (const s of SUBJECTS) result[s.id] = 0;
  for (const session of sessions) {
    const key = toDateKey(session.startedAt);
    if (key === todayKey) {
      result[session.subjectId] = (result[session.subjectId] || 0) + session.durationSec;
    }
  }
  return result;
}

function buildWeeklyData(sessions: StudySession[], now: Date): WeekDay[] {
  const aggregates = buildDayAggregates(sessions);
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    const agg = aggregates[dateKey];
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dateKey,
      hours: agg ? parseFloat((agg.totalSec / 3600).toFixed(1)) : 0,
    });
  }
  return days;
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for the weekly bar chart                            */
/* ------------------------------------------------------------------ */

function WeeklyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WeekDay }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--text)] shadow-lg">
      <p className="font-medium">{d.label}</p>
      <p className="text-[var(--muted)]">{d.hours.toFixed(1)}h studied</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PlannerPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const repo = createDashboardRepository();
    repo.getBootstrap().then((bootstrap) => {
      setData(bootstrap);
      setLoading(false);
    });
  }, []);

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);

  const plan = useMemo(() => {
    if (!data) return [];
    return buildStudyPlan(
      data.exams,
      data.syllabusTopics ?? [],
      data.goals.baselineStudyHours,
      now,
    );
  }, [data, now]);

  const totalPlannedMinutes = useMemo(() => plan.reduce((s, b) => s + b.minutes, 0), [plan]);

  const mergedStudySessions = useMemo(() => {
    if (!data) {
      return [];
    }

    return mergeStudySessionsWithTimeline(data.studySessions, data.timelineProgress);
  }, [data]);

  const todaySessions = useMemo(() => {
    return todaySessionsBySubject(mergedStudySessions, todayKey);
  }, [mergedStudySessions, todayKey]);

  const weeklyData = useMemo(() => {
    return buildWeeklyData(mergedStudySessions, now);
  }, [mergedStudySessions, now]);

  const upcomingExams = useMemo(() => {
    if (!data) return [];
    return [...data.exams]
      .filter((e) => new Date(e.startsAt).getTime() > now.getTime())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 10);
  }, [data, now]);

  const totalStudiedTodaySec = useMemo(
    () => Object.values(todaySessions).reduce((s, v) => s + v, 0),
    [todaySessions],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[var(--text)]">Today&apos;s Study Plan</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" | "}
            Target {(totalPlannedMinutes / 60).toFixed(1)}h
            {" | "}
            Studied {formatDuration(totalStudiedTodaySec)}
          </p>
        </header>

        {/* ---- Plan blocks ---- */}
        {plan.length === 0 ? (
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-[var(--muted)]">
              No upcoming exams found. Add exams on the dashboard to generate a study plan.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plan.map((block) => {
              const subjectDef = SUBJECT_BY_ID[block.subjectId];
              const actualSec = todaySessions[block.subjectId] || 0;
              const actualMin = actualSec / 60;
              const progress = Math.min(1, actualMin / block.minutes);

              return (
                <div
                  key={block.subjectId}
                  className="group relative flex flex-col rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 transition-colors hover:border-opacity-60"
                  style={{ borderLeftColor: subjectDef.color, borderLeftWidth: 3 }}
                >
                  {/* subject name + minutes */}
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: subjectDef.color }}
                      />
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {subjectDef.name}
                      </span>
                    </div>
                    <span className="whitespace-nowrap text-lg font-bold text-[var(--text)]">
                      {block.minutes}m
                    </span>
                  </div>

                  {/* reason */}
                  <p className="mb-3 text-xs leading-relaxed text-[var(--muted)]">{block.reason}</p>

                  {/* focus topics */}
                  {block.focusTopics.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                        Suggested focus
                      </p>
                      <ul className="space-y-0.5">
                        {block.focusTopics.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center gap-1.5 text-xs text-[var(--text)]"
                          >
                            <span
                              className="inline-block h-1 w-1 rounded-full"
                              style={{
                                backgroundColor:
                                  t.confidence === "learning"
                                    ? "#fbbf24"
                                    : "var(--muted)",
                              }}
                            />
                            <span className="truncate">
                              {t.topicNumber} {t.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* progress mini bar */}
                  <div className="mt-auto">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span>{Math.round(actualMin)}m done</span>
                      <span>{Math.round(progress * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--panel-soft)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress * 100}%`,
                          backgroundColor: subjectDef.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* start timer link */}
                  <Link
                    href="/"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
                  >
                    Start Timer
                  </Link>
                </div>
              );
            })}
          </section>
        )}

        {/* ---- Today's Progress ---- */}
        {plan.length > 0 && (
          <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Today&apos;s Progress
            </h2>
            <div className="space-y-3">
              {plan.map((block) => {
                const subjectDef = SUBJECT_BY_ID[block.subjectId];
                const actualSec = todaySessions[block.subjectId] || 0;
                const actualMin = actualSec / 60;
                const progress = Math.min(1, actualMin / block.minutes);
                const isComplete = progress >= 1;

                return (
                  <div key={block.subjectId} className="flex items-center gap-3">
                    <span
                      className="w-16 truncate text-xs font-medium"
                      style={{ color: subjectDef.color }}
                    >
                      {subjectDef.shortName}
                    </span>
                    <div className="relative flex-1">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--panel-soft)]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(progress * 100, 100)}%`,
                            backgroundColor: isComplete
                              ? "#34d399"
                              : subjectDef.color,
                            opacity: isComplete ? 1 : 0.8,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-xs text-[var(--muted)]">
                      {Math.round(actualMin)}m / {block.minutes}m
                    </span>
                  </div>
                );
              })}
            </div>
            {/* overall */}
            <div className="mt-4 flex items-center justify-between border-t border-[var(--panel-border)] pt-3 text-xs text-[var(--muted)]">
              <span>
                Overall:{" "}
                <span className="font-semibold text-[var(--text)]">
                  {formatDuration(totalStudiedTodaySec)}
                </span>{" "}
                / {(totalPlannedMinutes / 60).toFixed(1)}h planned
              </span>
              <span className="font-semibold text-[var(--text)]">
                {totalPlannedMinutes > 0
                  ? Math.round(
                      Math.min(
                        100,
                        (totalStudiedTodaySec / 60 / totalPlannedMinutes) * 100,
                      ),
                    )
                  : 0}
                %
              </span>
            </div>
          </section>
        )}

        {/* ---- Exam Timeline ---- */}
        {upcomingExams.length > 0 && (
          <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Exam Timeline
            </h2>
            <div className="relative space-y-0">
              {/* vertical line */}
              <div className="absolute bottom-0 left-[7px] top-0 w-px bg-[var(--panel-border)]" />
              {upcomingExams.map((exam) => {
                const subjectDef = SUBJECT_BY_ID[exam.subjectId];
                const daysLeft = Math.max(0, daysBetween(now, new Date(exam.startsAt)));
                const examDate = new Date(exam.startsAt);

                return (
                  <div key={exam.id} className="relative flex items-start gap-4 pb-4 pl-6">
                    {/* dot */}
                    <div
                      className="absolute left-[3px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--panel)]"
                      style={{ backgroundColor: subjectDef.color }}
                    />
                    {/* content */}
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-[var(--text)]">
                          {exam.title}
                        </span>
                        <span className="ml-2 text-xs text-[var(--muted)]">{exam.paper}</span>
                        <p className="text-xs text-[var(--muted)]">
                          {examDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          {" at "}
                          {examDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${subjectDef.color}18`,
                          color: subjectDef.color,
                        }}
                      >
                        {daysLeft}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---- Weekly Overview ---- */}
        <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Weekly Overview
          </h2>
          {weeklyData.every((d) => d.hours === 0) ? (
            <p className="py-6 text-center text-xs text-[var(--muted)]">
              No study sessions recorded in the last 7 days.
            </p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={28}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--panel-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <RechartsTooltip
                    content={<WeeklyTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry) => (
                      <Cell
                        key={entry.dateKey}
                        fill={entry.dateKey === todayKey ? "#a78bfa" : "#374151"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
