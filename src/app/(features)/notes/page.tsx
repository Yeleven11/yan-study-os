"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createDashboardRepository } from "@/lib/client/repository";
import type { DashboardRepository } from "@/lib/client/repository";
import { SUBJECTS, SUBJECT_BY_ID } from "@/lib/constants";
import type { StudyNote, SubjectId } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/* ------------------------------------------------------------------ */
/*  Type badge styles                                                  */
/* ------------------------------------------------------------------ */

const TYPE_STYLES: Record<
  StudyNote["type"],
  { label: string; color: string; bg: string }
> = {
  note: { label: "Note", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  reflection: {
    label: "Reflection",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
  },
  question: {
    label: "Question",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
  },
};

const NOTE_TYPES: StudyNote["type"][] = ["note", "reflection", "question"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotesPage() {
  const [repo] = useState<DashboardRepository>(() =>
    createDashboardRepository(),
  );
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- form state ---- */
  const [noteType, setNoteType] = useState<StudyNote["type"]>("note");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState<SubjectId | "">(
    "",
  );
  const [submitting, setSubmitting] = useState(false);

  /* ---- filters ---- */
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<SubjectId | "all">("all");
  const [filterType, setFilterType] = useState<StudyNote["type"] | "all">(
    "all",
  );

  /* ---- bootstrap ---- */
  useEffect(() => {
    repo.getBootstrap().then((bootstrap) => {
      setNotes(bootstrap.studyNotes ?? []);
      setLoading(false);
    });
  }, [repo]);

  /* ---- derived: sorted & filtered notes ---- */
  const filteredNotes = useMemo(() => {
    let result = [...notes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (filterSubject !== "all") {
      result = result.filter((n) => n.subjectId === filterSubject);
    }

    if (filterType !== "all") {
      result = result.filter((n) => n.type === filterType);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((n) => n.content.toLowerCase().includes(q));
    }

    return result;
  }, [notes, filterSubject, filterType, search]);

  /* ---- stats ---- */
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeek = notes.filter(
      (n) => new Date(n.createdAt) >= weekAgo,
    ).length;

    const byType = { note: 0, reflection: 0, question: 0 };
    const bySubject: Record<string, number> = {};

    for (const n of notes) {
      byType[n.type] = (byType[n.type] || 0) + 1;
      if (n.subjectId) {
        bySubject[n.subjectId] = (bySubject[n.subjectId] || 0) + 1;
      }
    }

    let mostActiveSubject: string | null = null;
    let maxCount = 0;
    for (const [sid, count] of Object.entries(bySubject)) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveSubject = sid;
      }
    }

    return {
      total: notes.length,
      thisWeek,
      byType,
      mostActiveSubject,
      mostActiveCount: maxCount,
    };
  }, [notes]);

  /* ---- handlers ---- */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      setSubmitting(true);

      const note: StudyNote = {
        id: crypto.randomUUID(),
        type: noteType,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        subjectId: subjectId || undefined,
      };

      await repo.createStudyNote(note);
      setNotes((prev) => [...prev, note]);
      setContent("");
      setSubmitting(false);
    },
    [repo, noteType, content, subjectId],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!repo) return;
      await repo.deleteStudyNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [repo],
  );

  /* ---- render ---- */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Study Notes</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Capture quick notes, reflections, and open questions while you study.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
            <p className="text-xs text-[var(--muted)]">Total</p>
            <p className="text-lg font-bold text-[var(--text)]">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
            <p className="text-xs text-[var(--muted)]">This Week</p>
            <p className="text-lg font-bold text-[var(--text)]">
              {stats.thisWeek}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
            <p className="text-xs" style={{ color: TYPE_STYLES.note.color }}>
              Notes
            </p>
            <p className="text-lg font-bold text-[var(--text)]">
              {stats.byType.note}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
            <p
              className="text-xs"
              style={{ color: TYPE_STYLES.reflection.color }}
            >
              Reflections
            </p>
            <p className="text-lg font-bold text-[var(--text)]">
              {stats.byType.reflection}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
            <p
              className="text-xs"
              style={{ color: TYPE_STYLES.question.color }}
            >
              Questions
            </p>
            <p className="text-lg font-bold text-[var(--text)]">
              {stats.byType.question}
            </p>
          </div>
          {stats.mostActiveSubject && (
            <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2.5">
              <p className="text-xs text-[var(--muted)]">Most Active</p>
              <p className="text-sm font-bold" style={{ color: SUBJECT_BY_ID[stats.mostActiveSubject as SubjectId]?.color }}>
                {SUBJECT_BY_ID[stats.mostActiveSubject as SubjectId]?.shortName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====== Quick Capture Form ====== */}
      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Quick Note
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector pills */}
          <div>
            <span className="mb-2 block text-xs font-medium text-[var(--muted)]">
              Type
            </span>
            <div className="flex gap-2">
              {NOTE_TYPES.map((t) => {
                const style = TYPE_STYLES[t];
                const active = noteType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNoteType(t)}
                    className="rounded-md px-4 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: active ? style.bg : "var(--panel-soft)",
                      color: active ? style.color : "var(--muted)",
                      border: active
                        ? `1px solid ${style.color}40`
                        : "1px solid transparent",
                    }}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={
              noteType === "question"
                ? "What is your question?"
                : noteType === "reflection"
                  ? "What did you learn or realize?"
                  : "Write your note here..."
            }
            className="w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
          />

          {/* Subject + submit row */}
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
                Subject (optional)
              </span>
              <select
                value={subjectId}
                onChange={(e) =>
                  setSubjectId(e.target.value as SubjectId | "")
                }
                className="w-full min-w-[180px] rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
              >
                <option value="">No Subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-md bg-[var(--focus)] px-5 py-2 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </section>

      {/* ====== Notes Feed ====== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          All Notes
        </h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-md border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--focus)]"
          />
        </div>

        {/* Filter pills row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {/* Subject filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterSubject("all")}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  filterSubject === "all" ? "var(--focus)" : "var(--panel-soft)",
                color:
                  filterSubject === "all" ? "var(--bg)" : "var(--muted)",
              }}
            >
              All Subjects
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSubject(s.id)}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filterSubject === s.id ? s.color : "var(--panel-soft)",
                  color: filterSubject === s.id ? "#000" : "var(--muted)",
                }}
              >
                {s.shortName}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  filterType === "all" ? "var(--focus)" : "var(--panel-soft)",
                color: filterType === "all" ? "var(--bg)" : "var(--muted)",
              }}
            >
              All Types
            </button>
            {NOTE_TYPES.map((t) => {
              const style = TYPE_STYLES[t];
              const active = filterType === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? style.bg : "var(--panel-soft)",
                    color: active ? style.color : "var(--muted)",
                    border: active
                      ? `1px solid ${style.color}40`
                      : "1px solid transparent",
                  }}
                >
                  {style.label}s
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes list */}
        {filteredNotes.length === 0 ? (
          <p className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 text-center text-sm text-[var(--muted)]">
            {notes.length === 0
              ? "No notes yet. Use the form above to capture your first note."
              : "No notes match the current filters."}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((n) => {
              const typeStyle = TYPE_STYLES[n.type];
              const subject = n.subjectId
                ? SUBJECT_BY_ID[n.subjectId]
                : null;

              return (
                <div
                  key={n.id}
                  className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
                >
                  {/* Top row: badges + time + delete */}
                  <div className="mb-2 flex items-center gap-2">
                    {/* Type badge */}
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.color,
                      }}
                    >
                      {typeStyle.label}
                    </span>

                    {/* Subject badge */}
                    {subject && (
                      <span
                        className="rounded px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: `${subject.color}18`,
                          color: subject.color,
                        }}
                      >
                        {subject.shortName}
                      </span>
                    )}

                    {/* Spacer */}
                    <span className="flex-1" />

                    {/* Relative time */}
                    <span className="text-xs text-[var(--muted)]">
                      {relativeTime(n.createdAt)}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="flex-shrink-0 rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
                      title="Delete note"
                    >
                      <svg
                        width="14"
                        height="14"
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

                  {/* Content */}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                    {n.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
