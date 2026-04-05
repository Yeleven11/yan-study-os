"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { createDashboardRepository } from "@/lib/client/repository";
import type { DashboardRepository } from "@/lib/client/repository";
import { SUBJECTS, SUBJECT_BY_ID, SUBJECT_IDS } from "@/lib/constants";
import type { PastPaperAttempt, SubjectId } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Score color helpers                                                */
/* ------------------------------------------------------------------ */

function scoreColor(pct: number): string {
  if (pct < 50) return "#ef4444";
  if (pct < 70) return "#f97316";
  if (pct < 80) return "#eab308";
  return "#22c55e";
}

function scoreBg(pct: number): string {
  if (pct < 50) return "rgba(239,68,68,0.15)";
  if (pct < 70) return "rgba(249,115,22,0.15)";
  if (pct < 80) return "rgba(234,179,8,0.15)";
  return "rgba(34,197,94,0.15)";
}

/* ------------------------------------------------------------------ */
/*  Chart line colors for paper types                                  */
/* ------------------------------------------------------------------ */

const PAPER_TYPE_COLORS: Record<string, string> = {
  "Paper 1": "#38bdf8",
  "Paper 2": "#a78bfa",
  "Paper 3": "#fb923c",
  "Case Study": "#f87171",
  "Internal Oral": "#34d399",
};

function paperTypeColor(paperType: string): string {
  return PAPER_TYPE_COLORS[paperType] ?? "#94a3b8";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PapersPage() {
  const [repo] = useState<DashboardRepository>(() =>
    createDashboardRepository(),
  );
  const [papers, setPapers] = useState<PastPaperAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- form state ---- */
  const [subjectId, setSubjectId] = useState<SubjectId>("math_aa_hl");
  const [paperType, setPaperType] = useState("Paper 1");
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [session, setSession] = useState<"May" | "November">("May");
  const [actualMarks, setActualMarks] = useState<number | "">("");
  const [maxMarks, setMaxMarks] = useState<number | "">(100);
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---- active subject tab ---- */
  const [activeTab, setActiveTab] = useState<SubjectId | "all">("all");

  /* ---- bootstrap ---- */
  useEffect(() => {
    repo.getBootstrap().then((bootstrap) => {
      setPapers(bootstrap.pastPapers ?? []);
      setLoading(false);
    });
  }, [repo]);

  /* ---- derived: sorted papers ---- */
  const sortedPapers = useMemo(
    () =>
      [...papers].sort(
        (a, b) =>
          new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
      ),
    [papers],
  );

  /* ---- derived: filtered by active tab ---- */
  const filteredPapers = useMemo(
    () =>
      activeTab === "all"
        ? sortedPapers
        : sortedPapers.filter((p) => p.subjectId === activeTab),
    [sortedPapers, activeTab],
  );

  /* ---- derived: subject averages ---- */
  const subjectAverages = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const p of papers) {
      if (!map[p.subjectId]) map[p.subjectId] = { total: 0, count: 0 };
      map[p.subjectId].total += p.scorePercent;
      map[p.subjectId].count += 1;
    }
    return SUBJECTS.map((s) => ({
      subject: s,
      avg: map[s.id] ? map[s.id].total / map[s.id].count : null,
      count: map[s.id]?.count ?? 0,
    })).filter((entry) => entry.avg !== null);
  }, [papers]);

  /* ---- derived: chart data per subject ---- */
  const chartDataBySubject = useMemo(() => {
    const result: Record<
      string,
      { paperTypes: string[]; data: Record<string, unknown>[] }
    > = {};

    for (const sid of SUBJECT_IDS) {
      const subjectPapers = papers
        .filter((p) => p.subjectId === sid)
        .sort(
          (a, b) =>
            new Date(a.attemptedAt).getTime() -
            new Date(b.attemptedAt).getTime(),
        );
      if (subjectPapers.length < 2) continue;

      const paperTypesSet = new Set<string>();
      subjectPapers.forEach((p) => paperTypesSet.add(p.paper));
      const paperTypes = Array.from(paperTypesSet);

      const dataPoints: Record<string, unknown>[] = subjectPapers.map((p) => {
        const point: Record<string, unknown> = {
          date: new Date(p.attemptedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
          fullDate: p.attemptedAt,
        };
        point[p.paper] = p.scorePercent;
        return point;
      });

      result[sid] = { paperTypes, data: dataPoints };
    }

    return result;
  }, [papers]);

  /* ---- auto-calculated percentage ---- */
  const calcPercent =
    typeof actualMarks === "number" && typeof maxMarks === "number" && maxMarks > 0
      ? Math.round((actualMarks / maxMarks) * 100)
      : null;

  /* ---- handlers ---- */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (calcPercent === null) return;
      setSubmitting(true);

      const paper: PastPaperAttempt = {
        id: crypto.randomUUID(),
        subjectId,
        paper: paperType.trim(),
        year,
        session,
        scorePercent: calcPercent,
        actualMarks: typeof actualMarks === "number" ? actualMarks : undefined,
        maxMarks: typeof maxMarks === "number" ? maxMarks : undefined,
        attemptedAt: new Date().toISOString(),
        durationMinutes:
          typeof durationMinutes === "number" ? durationMinutes : undefined,
        notes: notes.trim() || undefined,
      };

      await repo.createPastPaper(paper);
      setPapers((prev) => [...prev, paper]);

      /* reset form */
      setActualMarks("");
      setNotes("");
      setDurationMinutes("");
      setSubmitting(false);
    },
    [
      repo,
      subjectId,
      paperType,
      year,
      session,
      actualMarks,
      maxMarks,
      durationMinutes,
      notes,
      calcPercent,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!repo) return;
      await repo.deletePastPaper(id);
      setPapers((prev) => prev.filter((p) => p.id !== id));
    },
    [repo],
  );

  /* ---- render ---- */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading papers...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Past Paper Tracker</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Log past paper attempts, track score trends, and compare performance by subject.
        </p>
      </div>

      {/* ====== Subject Average Summary ====== */}
      {subjectAverages.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Subject Averages
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectAverages.map(({ subject, avg, count }) => (
              <div
                key={subject.id}
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm font-medium text-[var(--text)]">
                      {subject.shortName}
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: scoreColor(avg!) }}
                  >
                    {Math.round(avg!)}%
                  </span>
                </div>
                {/* progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--panel-soft)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(avg!, 100)}%`,
                      backgroundColor: scoreColor(avg!),
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {count} attempt{count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====== Add Paper Form ====== */}
      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Log a Paper Attempt
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Subject */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Subject
              </span>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Paper type */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Paper Type
              </span>
              <input
                type="text"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                placeholder="Paper 1"
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              />
            </label>

            {/* Year */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Year
              </span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2000}
                max={2099}
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              />
            </label>

            {/* Session */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Session
              </span>
              <select
                value={session}
                onChange={(e) =>
                  setSession(e.target.value as "May" | "November")
                }
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              >
                <option value="May">May</option>
                <option value="November">November</option>
              </select>
            </label>

            {/* Actual marks */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Actual Marks
              </span>
              <input
                type="number"
                value={actualMarks}
                onChange={(e) =>
                  setActualMarks(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                min={0}
                placeholder="0"
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              />
            </label>

            {/* Max marks */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Max Marks
              </span>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) =>
                  setMaxMarks(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                min={1}
                placeholder="100"
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              />
            </label>

            {/* Duration */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Duration (min)
              </span>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                min={0}
                placeholder="Optional"
                className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              />
            </label>

            {/* Calculated percentage */}
            <div className="flex items-end">
              <div
                className="flex h-[38px] w-full items-center justify-center rounded-md border px-3 text-sm font-semibold"
                style={{
                  borderColor:
                    calcPercent !== null
                      ? scoreColor(calcPercent)
                      : "var(--panel-border)",
                  backgroundColor:
                    calcPercent !== null ? scoreBg(calcPercent) : "transparent",
                  color:
                    calcPercent !== null
                      ? scoreColor(calcPercent)
                      : "var(--muted)",
                }}
              >
                {calcPercent !== null ? `${calcPercent}%` : "-- %"}
              </div>
            </div>
          </div>

          {/* Notes */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes about the attempt..."
              className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || calcPercent === null || !paperType.trim()}
            className="rounded-md bg-[var(--focus)] px-5 py-2 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Log Paper"}
          </button>
        </form>
      </section>

      {/* ====== Score Trajectory Charts ====== */}
      {Object.keys(chartDataBySubject).length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Score Trajectory
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Object.entries(chartDataBySubject).map(
              ([sid, { paperTypes, data }]) => {
                const subject = SUBJECT_BY_ID[sid as SubjectId];
                return (
                  <div
                    key={sid}
                    className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium text-[var(--text)]">
                        {subject.name}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={data}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--panel-border)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "var(--muted)", fontSize: 11 }}
                          stroke="var(--panel-border)"
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "var(--muted)", fontSize: 11 }}
                          stroke="var(--panel-border)"
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--panel)",
                            border: "1px solid var(--panel-border)",
                            borderRadius: 8,
                            color: "var(--text)",
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
                        />
                        {paperTypes.map((pt) => (
                          <Line
                            key={pt}
                            type="monotone"
                            dataKey={pt}
                            stroke={paperTypeColor(pt)}
                            strokeWidth={2}
                            dot={{ r: 4, fill: paperTypeColor(pt) }}
                            connectNulls
                            name={pt}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              },
            )}
          </div>
        </section>
      )}

      {/* ====== Papers List ====== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Paper Attempts
        </h2>

        {/* Subject tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                activeTab === "all" ? "var(--focus)" : "var(--panel-soft)",
              color: activeTab === "all" ? "var(--bg)" : "var(--muted)",
            }}
          >
            All
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  activeTab === s.id ? s.color : "var(--panel-soft)",
                color: activeTab === s.id ? "#000" : "var(--muted)",
              }}
            >
              {s.shortName}
            </button>
          ))}
        </div>

        {filteredPapers.length === 0 ? (
          <p className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 text-center text-sm text-[var(--muted)]">
            No paper attempts logged yet. Use the form above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {filteredPapers.map((p) => {
              const subject = SUBJECT_BY_ID[p.subjectId];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3"
                >
                  {/* Subject color bar */}
                  <div
                    className="h-10 w-1 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: subject?.color ?? "#666" }}
                  />

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {subject?.shortName ?? p.subjectId} &mdash; {p.paper}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {p.session} {p.year}
                      </span>
                      {p.durationMinutes && (
                        <span className="text-xs text-[var(--muted)]">
                          {p.durationMinutes} min
                        </span>
                      )}
                    </div>
                    {p.notes && (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        {p.notes}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {new Date(p.attemptedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {p.actualMarks !== undefined &&
                        p.maxMarks !== undefined &&
                        ` \u00b7 ${p.actualMarks}/${p.maxMarks}`}
                    </p>
                  </div>

                  {/* Score badge */}
                  <div
                    className="flex-shrink-0 rounded-md px-3 py-1 text-sm font-bold"
                    style={{
                      color: scoreColor(p.scorePercent),
                      backgroundColor: scoreBg(p.scorePercent),
                    }}
                  >
                    {p.scorePercent}%
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-shrink-0 rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
                    title="Delete"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
