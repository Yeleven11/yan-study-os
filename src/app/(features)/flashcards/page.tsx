"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUBJECTS, SUBJECT_BY_ID } from "@/lib/constants";
import {
  createFlashcard,
  pickNextFlashcard,
  buildFlashcardSessionSnapshot,
} from "@/lib/flashcards/scheduler";
import { createDashboardRepository } from "@/lib/client/repository";
import type {
  Flashcard,
  FlashcardStatus,
  PerformanceGoals,
  SubjectId,
} from "@/lib/types";
import type { DashboardRepository } from "@/lib/client/repository";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type TabId = "review" | "deck" | "trouble";
type SortKey = "due" | "lapses" | "created";

const STATUS_COLORS: Record<FlashcardStatus, string> = {
  new: "#6b7280",
  learning: "#eab308",
  review: "#22c55e",
  relearning: "#ef4444",
};

const STATUS_LABELS: Record<FlashcardStatus, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  relearning: "Relearning",
};

const ALL_STATUSES: FlashcardStatus[] = ["new", "learning", "review", "relearning"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FlashcardsPage() {
  const repoRef = useRef<DashboardRepository | null>(null);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [goals, setGoals] = useState<PerformanceGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("review");

  // Review state
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Create form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<SubjectId | "">(""  );

  // Deck filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deckSubjectFilter, setDeckSubjectFilter] = useState<SubjectId | "all">("all");
  const [deckStatusFilter, setDeckStatusFilter] = useState<FlashcardStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("due");

  /* ---------------------------------------------------------------- */
  /*  Bootstrap                                                        */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const repo = createDashboardRepository();
    repoRef.current = repo;
    repo.getBootstrap().then((data) => {
      setCards(data.flashcards ?? []);
      setGoals(data.goals);
      setLoading(false);
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Snapshot & next card                                              */
  /* ---------------------------------------------------------------- */

  const timezone = goals ? "Europe/Berlin" : "Europe/Berlin";

  const snapshot = useMemo(
    () => buildFlashcardSessionSnapshot(cards, new Date(), timezone),
    [cards, timezone],
  );

  const picked = useMemo(
    () => pickNextFlashcard(cards, new Date(), timezone),
    [cards, timezone],
  );

  /* ---------------------------------------------------------------- */
  /*  Grading                                                          */
  /* ---------------------------------------------------------------- */

  const handleGrade = useCallback(
    async (outcome: "correct" | "incorrect") => {
      if (!picked || !repoRef.current) return;
      const input = {
        cardId: picked.card.id,
        outcome,
        reviewedAt: new Date().toISOString(),
      };
      await repoRef.current.gradeFlashcard(input);
      // Reload from storage
      const data = await repoRef.current.getBootstrap();
      setCards(data.flashcards ?? []);
      setFlipped(false);
      setReviewedCount((c) => c + 1);
    },
    [picked],
  );

  /* ---------------------------------------------------------------- */
  /*  Create card                                                      */
  /* ---------------------------------------------------------------- */

  const handleCreate = useCallback(async () => {
    if (!newQuestion.trim() || !newAnswer.trim() || !repoRef.current) return;
    const card = createFlashcard(newQuestion, newAnswer);
    if (newSubjectId) {
      card.subjectId = newSubjectId as SubjectId;
    }
    await repoRef.current.createFlashcard(card);
    const data = await repoRef.current.getBootstrap();
    setCards(data.flashcards ?? []);
    setNewQuestion("");
    setNewAnswer("");
    setNewSubjectId("");
  }, [newQuestion, newAnswer, newSubjectId]);

  /* ---------------------------------------------------------------- */
  /*  Deck: filtered & sorted                                          */
  /* ---------------------------------------------------------------- */

  const filteredDeck = useMemo(() => {
    let result = [...cards];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.question.toLowerCase().includes(q) ||
          c.answer.toLowerCase().includes(q),
      );
    }

    if (deckSubjectFilter !== "all") {
      result = result.filter((c) => c.subjectId === deckSubjectFilter);
    }

    if (deckStatusFilter !== "all") {
      result = result.filter((c) => c.status === deckStatusFilter);
    }

    result.sort((a, b) => {
      if (sortKey === "due") {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (sortKey === "lapses") {
        return b.lapseCount - a.lapseCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [cards, searchQuery, deckSubjectFilter, deckStatusFilter, sortKey]);

  /* ---------------------------------------------------------------- */
  /*  Trouble spots                                                    */
  /* ---------------------------------------------------------------- */

  const troubleCards = useMemo(
    () =>
      cards
        .filter((c) => c.lapseCount >= 3)
        .sort((a, b) => b.lapseCount - a.lapseCount),
    [cards],
  );

  const troubleBySubject = useMemo(() => {
    const groups: Record<string, Flashcard[]> = {};
    for (const card of troubleCards) {
      const key = card.subjectId ?? "_none";
      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
    }
    return groups;
  }, [troubleCards]);

  const masteryStats = useMemo(() => {
    const subjectGroups: Record<string, Flashcard[]> = {};
    for (const card of cards) {
      const key = card.subjectId ?? "_none";
      if (!subjectGroups[key]) subjectGroups[key] = [];
      subjectGroups[key].push(card);
    }

    const perSubject: Record<string, { mastered: number; total: number; pct: number }> = {};
    let totalMastered = 0;
    const totalCards = cards.length;

    for (const [key, group] of Object.entries(subjectGroups)) {
      const mastered = group.filter(
        (c) => c.status === "review" && c.consecutiveCorrect >= 3,
      ).length;
      totalMastered += mastered;
      perSubject[key] = {
        mastered,
        total: group.length,
        pct: group.length > 0 ? Math.round((mastered / group.length) * 100) : 0,
      };
    }

    return {
      perSubject,
      overallPct: totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0,
    };
  }, [cards]);

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, max) + "..." : text;
  }

  function formatDueDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    const diffH = Math.round(diffMs / 3_600_000);
    const diffD = Math.round(diffMs / 86_400_000);

    if (diffMin <= 0) return "Now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffH < 24) return `${diffH}h`;
    return `${diffD}d`;
  }

  function subjectBadge(subjectId?: SubjectId) {
    if (!subjectId) return null;
    const subj = SUBJECT_BY_ID[subjectId];
    if (!subj) return null;
    return (
      <span
        style={{
          background: subj.color + "22",
          color: subj.color,
          border: `1px solid ${subj.color}44`,
        }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      >
        <span
          style={{ background: subj.color }}
          className="inline-block h-1.5 w-1.5 rounded-full"
        />
        {subj.shortName}
      </span>
    );
  }

  function statusBadge(status: FlashcardStatus) {
    const color = STATUS_COLORS[status];
    return (
      <span
        style={{
          background: color + "22",
          color,
          border: `1px solid ${color}44`,
        }}
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      >
        {STATUS_LABELS[status]}
      </span>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-[var(--muted)]">Loading flashcards...</div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "review", label: "Review", count: snapshot.dueNowCount },
    { id: "deck", label: "Deck", count: cards.length },
    { id: "trouble", label: "Trouble Spots", count: troubleCards.length },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--text)]">Flashcard Manager</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Review due cards, manage the full deck, and keep an eye on your trouble spots.
          {` `}
          {cards.length} cards total, {snapshot.dueNowCount} due now.
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg border border-[var(--panel-border)] bg-[var(--card)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.id ? "var(--panel-soft)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--muted)",
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                style={{
                  background: activeTab === tab.id ? "var(--focus)" : "var(--border)",
                  color: "#fff",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  REVIEW TAB                                                    */}
      {/* ============================================================ */}
      {activeTab === "review" && (
        <div className="mt-6 space-y-6">
          {/* Session stats bar */}
          <div className="flex gap-4 rounded-lg border border-[var(--panel-border)] bg-[var(--card)] p-4">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-[var(--focus)]">{snapshot.dueNowCount}</div>
              <div className="text-xs text-[var(--muted)]">Due Now</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-[#eab308]">{snapshot.criticalTodayCount}</div>
              <div className="text-xs text-[var(--muted)]">Critical Today</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-[#22c55e]">{reviewedCount}</div>
              <div className="text-xs text-[var(--muted)]">Reviewed</div>
            </div>
          </div>

          {/* Card display */}
          {picked ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
                <div className="flex items-center gap-2">
                  {statusBadge(picked.card.status)}
                  {subjectBadge(picked.card.subjectId)}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>Ease: {picked.card.easeFactor.toFixed(2)}</span>
                  <span>Lapses: {picked.card.lapseCount}</span>
                </div>
              </div>

              {/* Card body - click to flip */}
              <button
                onClick={() => setFlipped(!flipped)}
                className="block w-full cursor-pointer px-6 py-10 text-left transition-colors hover:bg-[var(--border-translucent,rgba(255,255,255,0.03))]"
              >
                <div className="text-center">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    {flipped ? "Answer" : "Question"}
                  </div>
                  <div className="text-lg text-[var(--text)]">
                    {flipped ? picked.card.answer : picked.card.question}
                  </div>
                </div>
                {!flipped && (
                  <div className="mt-6 text-center text-xs text-[var(--muted)]">
                    Click to reveal answer
                  </div>
                )}
              </button>

              {/* Grade buttons */}
              {flipped && (
                <div className="flex gap-3 border-t border-[var(--border)] p-4">
                  <button
                    onClick={() => handleGrade("incorrect")}
                    className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#ef4444" }}
                  >
                    Incorrect
                  </button>
                  <button
                    onClick={() => handleGrade("correct")}
                    className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#22c55e" }}
                  >
                    Correct
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
              <div className="text-4xl">&#10003;</div>
              <div className="mt-3 text-lg font-semibold text-[var(--text)]">All caught up!</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                No cards due. Create a new card below or check back later.
              </div>
            </div>
          )}

          {/* Create new card form */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Create New Card</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Question</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter question..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Answer</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Enter answer..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Subject</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value as SubjectId | "")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">No subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DECK TAB                                                      */}
      {/* ============================================================ */}
      {activeTab === "deck" && (
        <div className="mt-6 space-y-4">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions and answers..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />

          {/* Subject filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDeckSubjectFilter("all")}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: deckSubjectFilter === "all" ? "var(--accent)" : "var(--card)",
                color: deckSubjectFilter === "all" ? "#fff" : "var(--muted)",
                border: `1px solid ${deckSubjectFilter === "all" ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              All
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setDeckSubjectFilter(s.id)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: deckSubjectFilter === s.id ? s.color + "33" : "var(--card)",
                  color: deckSubjectFilter === s.id ? s.color : "var(--muted)",
                  border: `1px solid ${deckSubjectFilter === s.id ? s.color + "66" : "var(--border)"}`,
                }}
              >
                {s.shortName}
              </button>
            ))}
          </div>

          {/* Status filter & sort */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setDeckStatusFilter("all")}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: deckStatusFilter === "all" ? "var(--accent)" : "var(--card)",
                  color: deckStatusFilter === "all" ? "#fff" : "var(--muted)",
                  border: `1px solid ${deckStatusFilter === "all" ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                All
              </button>
              {ALL_STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => setDeckStatusFilter(st)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{
                    background: deckStatusFilter === st ? STATUS_COLORS[st] + "33" : "var(--card)",
                    color: deckStatusFilter === st ? STATUS_COLORS[st] : "var(--muted)",
                    border: `1px solid ${deckStatusFilter === st ? STATUS_COLORS[st] + "66" : "var(--border)"}`,
                  }}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Sort:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none"
              >
                <option value="due">Due Date</option>
                <option value="lapses">Lapse Count</option>
                <option value="created">Created</option>
              </select>
            </div>
          </div>

          {/* Card count */}
          <div className="text-xs text-[var(--muted)]">
            Showing {filteredDeck.length} of {cards.length} cards
          </div>

          {/* Cards list */}
          <div className="space-y-2">
            {filteredDeck.length === 0 && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center text-sm text-[var(--muted)]">
                No cards match your filters.
              </div>
            )}
            {filteredDeck.map((card) => (
              <div
                key={card.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--text)]">
                    {truncate(card.question, 80)}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {truncate(card.answer, 60)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {statusBadge(card.status)}
                    {subjectBadge(card.subjectId)}
                    <span className="text-[10px] text-[var(--muted)]">
                      Ease: {card.easeFactor.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      Lapses: {card.lapseCount}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      Due: {formatDueDate(card.dueAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  TROUBLE SPOTS TAB                                             */}
      {/* ============================================================ */}
      {activeTab === "trouble" && (
        <div className="mt-6 space-y-6">
          {/* Overall mastery */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Overall Mastery
            </div>
            <div
              className="mt-2 text-5xl font-bold"
              style={{
                color:
                  masteryStats.overallPct >= 70
                    ? "#22c55e"
                    : masteryStats.overallPct >= 40
                      ? "#eab308"
                      : "#ef4444",
              }}
            >
              {masteryStats.overallPct}%
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              Cards with 3+ consecutive correct in review status
            </div>
          </div>

          {/* Per-subject mastery */}
          {Object.keys(masteryStats.perSubject).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(masteryStats.perSubject).map(([key, stat]) => {
                const subj = key !== "_none" ? SUBJECT_BY_ID[key as SubjectId] : null;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex items-center gap-2">
                      {subj && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: subj.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-[var(--text)]">
                        {subj ? subj.shortName : "No Subject"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color:
                            stat.pct >= 70
                              ? "#22c55e"
                              : stat.pct >= 40
                                ? "#eab308"
                                : "#ef4444",
                        }}
                      >
                        {stat.pct}%
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {stat.mastered}/{stat.total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${stat.pct}%`,
                          background:
                            stat.pct >= 70
                              ? "#22c55e"
                              : stat.pct >= 40
                                ? "#eab308"
                                : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trouble spots heading */}
          {troubleCards.length > 0 ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  These are your weak areas
                </h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Cards with 3 or more lapses, sorted by frequency of failure
                </p>
              </div>

              {Object.entries(troubleBySubject).map(([key, group]) => {
                const subj = key !== "_none" ? SUBJECT_BY_ID[key as SubjectId] : null;
                return (
                  <div key={key}>
                    {/* Subject group header */}
                    <div className="mb-2 flex items-center gap-2">
                      {subj && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: subj.color }}
                        />
                      )}
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {subj ? subj.name : "No Subject"}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        ({group.length} {group.length === 1 ? "card" : "cards"})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[var(--text)]">
                              {card.question}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {/* Lapse count badge */}
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                                style={{
                                  background: "#ef444422",
                                  color: "#ef4444",
                                  border: "1px solid #ef444444",
                                }}
                              >
                                {card.lapseCount} lapses
                              </span>
                              <span className="text-[10px] text-[var(--muted)]">
                                Ease: {card.easeFactor.toFixed(2)}
                              </span>
                              {card.lastOutcome && (
                                <span
                                  className="text-[10px] font-medium"
                                  style={{
                                    color: card.lastOutcome === "correct" ? "#22c55e" : "#ef4444",
                                  }}
                                >
                                  Last: {card.lastOutcome}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center">
              <div className="text-sm text-[var(--muted)]">
                No trouble spots yet. Cards that accumulate 3 or more lapses will appear here.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
