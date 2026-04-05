"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUBJECTS, SUBJECT_BY_ID } from "@/lib/constants";
import { getDefaultSyllabusTopics } from "@/lib/ib-syllabus";
import { createDashboardRepository } from "@/lib/client/repository";
import type { DashboardRepository } from "@/lib/client/repository";
import type { SubjectId, SyllabusTopic, TopicConfidence } from "@/lib/types";

/* ── constants ── */

const CONFIDENCE_LEVELS: TopicConfidence[] = [
  "not_started",
  "learning",
  "confident",
  "mastered",
];

const CONFIDENCE_META: Record<
  TopicConfidence,
  { label: string; color: string; bg: string; border: string }
> = {
  not_started: {
    label: "Not Started",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.15)",
    border: "rgba(107,114,128,0.3)",
  },
  learning: {
    label: "Learning",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
    border: "rgba(251,191,36,0.3)",
  },
  confident: {
    label: "Confident",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.3)",
  },
  mastered: {
    label: "Mastered",
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.3)",
  },
};

function nextConfidence(current: TopicConfidence): TopicConfidence {
  const idx = CONFIDENCE_LEVELS.indexOf(current);
  return CONFIDENCE_LEVELS[(idx + 1) % CONFIDENCE_LEVELS.length];
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/* ── main component ── */

export default function SyllabusPage() {
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [activeSubject, setActiveSubject] = useState<SubjectId>("math_aa_hl");
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const repoRef = useRef<DashboardRepository | null>(null);

  /* ── bootstrap ── */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const repo = createDashboardRepository();
      repoRef.current = repo;
      const bootstrap = await repo.getBootstrap();
      if (cancelled) return;

      let syllabusTopics = bootstrap.syllabusTopics;
      if (!syllabusTopics || syllabusTopics.length === 0) {
        syllabusTopics = getDefaultSyllabusTopics();
        await repo.setSyllabusTopics(syllabusTopics);
      }
      setTopics(syllabusTopics);
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── derived data ── */
  const subjectTopics = useMemo(
    () => topics.filter((t) => t.subjectId === activeSubject),
    [topics, activeSubject],
  );

  const childTopics = useMemo(
    () => subjectTopics.filter((t) => !!t.parentTopicId),
    [subjectTopics],
  );

  const parentTopics = useMemo(
    () => subjectTopics.filter((t) => !t.parentTopicId),
    [subjectTopics],
  );

  const stats = useMemo(() => {
    const total = childTopics.length;
    const counts: Record<TopicConfidence, number> = {
      not_started: 0,
      learning: 0,
      confident: 0,
      mastered: 0,
    };
    for (const t of childTopics) {
      counts[t.confidence]++;
    }
    return { total, counts };
  }, [childTopics]);

  /* ── all-subjects heat map data ── */
  const heatMapData = useMemo(() => {
    return SUBJECTS.map((subj) => {
      const subjTopics = topics
        .filter((t) => t.subjectId === subj.id && !!t.parentTopicId);
      return { subject: subj, topics: subjTopics };
    });
  }, [topics]);

  /* ── handlers ── */
  const handleCycleConfidence = useCallback(
    async (topicId: string) => {
      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;

      const newConfidence = nextConfidence(topic.confidence);
      const now = new Date().toISOString();

      // optimistic update
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? { ...t, confidence: newConfidence, lastStudiedAt: now }
            : t,
        ),
      );

      if (repoRef.current) {
        await repoRef.current.updateSyllabusTopic(topicId, {
          confidence: newConfidence,
          lastStudiedAt: now,
        });
      }
    },
    [topics],
  );

  const handleOpenNotes = useCallback(
    (topicId: string) => {
      if (editingNotes === topicId) {
        setEditingNotes(null);
        return;
      }
      const topic = topics.find((t) => t.id === topicId);
      setNotesDraft(topic?.notes ?? "");
      setEditingNotes(topicId);
    },
    [editingNotes, topics],
  );

  const handleSaveNotes = useCallback(
    async (topicId: string) => {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId ? { ...t, notes: notesDraft } : t,
        ),
      );
      setEditingNotes(null);

      if (repoRef.current) {
        await repoRef.current.updateSyllabusTopic(topicId, {
          notes: notesDraft,
        });
      }
    },
    [notesDraft],
  );

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--focus)]"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">IB Syllabus Tracker</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Track confidence across every topic and keep notes attached to exact syllabus items.
        </p>
      </div>

      {/* ── heat map (all subjects) ── */}
      <div
        className="mb-6 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Coverage Overview
        </h2>
        <div className="flex flex-wrap gap-4">
          {heatMapData.map(({ subject, topics: subjectChildTopics }) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setActiveSubject(subject.id)}
              className="group flex flex-col items-start gap-1 rounded-lg p-2 transition-colors hover:bg-[var(--panel-soft)]"
              style={{
                outline:
                  activeSubject === subject.id
                    ? `2px solid ${subject.color}`
                    : "2px solid transparent",
                outlineOffset: "2px",
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: subject.color }}
              >
                {subject.shortName}
              </span>
              <div className="flex flex-wrap gap-[3px]" style={{ maxWidth: 140 }}>
                {subjectChildTopics.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-[3px]"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: CONFIDENCE_META[t.confidence].color,
                      opacity: t.confidence === "not_started" ? 0.35 : 0.9,
                    }}
                    title={`${t.topicNumber} ${t.title} - ${CONFIDENCE_META[t.confidence].label}`}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {CONFIDENCE_LEVELS.map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="rounded-[3px]"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: CONFIDENCE_META[level].color,
                  opacity: level === "not_started" ? 0.35 : 0.9,
                }}
              />
              <span className="text-[10px] text-[var(--muted)]">
                {CONFIDENCE_META[level].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── subject tabs ── */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {SUBJECTS.map((subj) => {
          const isActive = activeSubject === subj.id;
          return (
            <button
              key={subj.id}
              type="button"
              onClick={() => setActiveSubject(subj.id)}
              className="shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive
                  ? subj.color + "22"
                  : "transparent",
                color: isActive ? subj.color : "var(--muted)",
                border: `1px solid ${isActive ? subj.color + "44" : "var(--panel-border)"}`,
              }}
            >
              {subj.shortName}
            </button>
          );
        })}
      </div>

      {/* ── coverage summary ── */}
      <div
        className="mb-6 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4"
      >
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-[var(--text)]">
            {SUBJECT_BY_ID[activeSubject].name}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {stats.total} topics
          </span>
        </div>

        {/* stat badges */}
        <div className="mb-3 flex flex-wrap gap-2">
          {CONFIDENCE_LEVELS.map((level) => {
            const count = stats.counts[level];
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const meta = CONFIDENCE_META[level];
            return (
              <div
                key={level}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
                style={{
                  backgroundColor: meta.bg,
                  border: `1px solid ${meta.border}`,
                  color: meta.color,
                }}
              >
                <span className="font-semibold">{count}</span>
                <span style={{ opacity: 0.75 }}>{meta.label}</span>
                <span style={{ opacity: 0.55 }}>({pct}%)</span>
              </div>
            );
          })}
        </div>

        {/* progress bar */}
        <div
          className="flex h-3 overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(107,114,128,0.15)" }}
        >
          {CONFIDENCE_LEVELS.map((level) => {
            const pct =
              stats.total > 0
                ? (stats.counts[level] / stats.total) * 100
                : 0;
            if (pct === 0) return null;
            return (
              <div
                key={level}
                style={{
                  width: `${pct}%`,
                  backgroundColor: CONFIDENCE_META[level].color,
                  opacity: level === "not_started" ? 0.35 : 0.85,
                }}
                title={`${CONFIDENCE_META[level].label}: ${stats.counts[level]}`}
              />
            );
          })}
        </div>
      </div>

      {/* ── topic list grouped by parent ── */}
      <div className="space-y-4">
        {parentTopics.map((parent) => {
          const children = childTopics.filter(
            (t) => t.parentTopicId === parent.id,
          );
          if (children.length === 0) return null;

          return (
            <div
              key={parent.id}
              className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden"
            >
              {/* parent header */}
              <div
                className="flex items-center gap-2 border-b border-[var(--panel-border)] px-4 py-3"
                style={{
                  background: `linear-gradient(135deg, ${SUBJECT_BY_ID[activeSubject].color}08, transparent)`,
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  style={{
                    backgroundColor: SUBJECT_BY_ID[activeSubject].color + "22",
                    color: SUBJECT_BY_ID[activeSubject].color,
                  }}
                >
                  {parent.topicNumber}
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {parent.title}
                </span>
                <span className="ml-auto text-[10px] text-[var(--muted)]">
                  {children.filter((c) => c.confidence === "mastered").length}/
                  {children.length} mastered
                </span>
              </div>

              {/* children */}
              <div className="divide-y divide-[var(--panel-border)]">
                {children.map((child) => {
                  const meta = CONFIDENCE_META[child.confidence];
                  const isEditing = editingNotes === child.id;

                  return (
                    <div key={child.id}>
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        {/* topic number */}
                        <span className="w-8 shrink-0 text-xs font-mono text-[var(--muted)]">
                          {child.topicNumber}
                        </span>

                        {/* title */}
                        <span className="flex-1 text-sm text-[var(--text)]">
                          {child.title}
                        </span>

                        {/* last studied */}
                        {child.lastStudiedAt && (
                          <span className="hidden text-[10px] text-[var(--muted)] sm:block">
                            {formatDate(child.lastStudiedAt)}
                          </span>
                        )}

                        {/* notes button */}
                        <button
                          type="button"
                          onClick={() => handleOpenNotes(child.id)}
                          className="shrink-0 rounded p-1 text-[var(--muted)] transition-colors hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
                          title="Toggle notes"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>

                        {/* confidence badge - clickable */}
                        <button
                          type="button"
                          onClick={() => handleCycleConfidence(child.id)}
                          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            color: meta.color,
                          }}
                          title="Click to cycle confidence level"
                        >
                          {meta.label}
                        </button>
                      </div>

                      {/* inline notes editor */}
                      {isEditing && (
                        <div className="border-t border-[var(--panel-border)] bg-[var(--panel-soft)] px-4 py-3">
                          <textarea
                            className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--focus)] focus:outline-none focus:ring-1 focus:ring-[var(--focus)]"
                            rows={3}
                            placeholder="Add notes for this topic..."
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            onBlur={() => handleSaveNotes(child.id)}
                            autoFocus
                          />
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[10px] text-[var(--muted)]">
                              Notes save on blur
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveNotes(child.id)}
                              className="ml-auto rounded-md bg-[var(--focus)] px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:opacity-90"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* show existing notes preview when not editing */}
                      {!isEditing && child.notes && (
                        <div className="border-t border-[var(--panel-border)] bg-[var(--panel-soft)] px-4 py-2">
                          <p className="text-xs text-[var(--muted)] line-clamp-2">
                            {child.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
