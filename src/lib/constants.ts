import type {
  AppData,
  Exam,
  PerformanceGoals,
  SubjectDefinition,
  SubjectId,
  SubjectTotals,
} from "./types";
import { getDefaultSyllabusTopics } from "./ib-syllabus";

export const USER_NAME = "Yan";
export const EXAM_HIGHLIGHT_COLOR = "#00F0FF";
export const CALENDAR_DAYS_AHEAD = 120;
export const MIN_SESSION_SECONDS = 300;
export const DEFAULT_SLEEP_HOURS_TARGET = 9;
export const DEFAULT_BASELINE_STUDY_HOURS = 3.5;
export const DEFAULT_WEEKLY_WORKOUT_TARGET = 4;

export const SUBJECTS: SubjectDefinition[] = [
  {
    id: "math_aa_hl",
    name: "Math AA HL",
    shortName: "Math",
    color: "#f87171",
  },
  {
    id: "physics_hl",
    name: "Physics HL",
    shortName: "Physics",
    color: "#34d399",
  },
  {
    id: "computer_science_hl",
    name: "Computer Science HL",
    shortName: "CS",
    color: "#a78bfa",
  },
  {
    id: "german_lang_lit_sl",
    name: "German Lang Lit SL",
    shortName: "German",
    color: "#fbbf24",
  },
  {
    id: "english_lang_lit_sl",
    name: "English Lang Lit SL",
    shortName: "English",
    color: "#38bdf8",
  },
  {
    id: "business_sl",
    name: "Business SL",
    shortName: "Business",
    color: "#fb923c",
  },
];

export const SUBJECT_IDS = SUBJECTS.map((subject) => subject.id);

export const SUBJECT_BY_ID: Record<SubjectId, SubjectDefinition> = SUBJECTS.reduce(
  (accumulator, subject) => {
    accumulator[subject.id] = subject;
    return accumulator;
  },
  {} as Record<SubjectId, SubjectDefinition>,
);

export const MORNING_MESSAGES = [
  "Good morning, Yan.",
  "Morning focus window open, Yan.",
  "Fresh start, Yan. Let us make it count.",
  "Morning mode online. You are up, Yan.",
];

export const AFTERNOON_MESSAGES = [
  "Good afternoon, Yan. Keep the pace.",
  "Steady afternoon grind, Yan.",
  "Midday check-in, Yan. Stay sharp.",
  "Strong progress looks good on you, Yan.",
];

export const EVENING_MESSAGES = [
  "Good evening, Yan. Final push.",
  "Evening session loaded, Yan.",
  "Clean close to the day starts now, Yan.",
  "Lock in, Yan. This block matters.",
];

export const LATE_NIGHT_MESSAGES = [
  "A bit late for studying, no?",
  "Late session detected, Yan. Keep it intentional.",
  "Night mode active, Yan. Protect your focus.",
  "It is late, Yan. One precise block and done.",
];

const LEGACY_STARTER_EXAMS: Exam[] = [
  {
    id: "exam-math-aa-hl-p1",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 1",
    startsAt: "2026-05-04T09:00:00+02:00",
  },
  {
    id: "exam-math-aa-hl-p2",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 2",
    startsAt: "2026-05-06T09:00:00+02:00",
  },
  {
    id: "exam-math-aa-hl-p3",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 3",
    startsAt: "2026-05-09T09:00:00+02:00",
  },
  {
    id: "exam-physics-hl-p1",
    subjectId: "physics_hl",
    title: "Physics HL",
    paper: "Paper 1",
    startsAt: "2026-05-11T13:00:00+02:00",
  },
  {
    id: "exam-physics-hl-p2",
    subjectId: "physics_hl",
    title: "Physics HL",
    paper: "Paper 2",
    startsAt: "2026-05-13T09:00:00+02:00",
  },
  {
    id: "exam-physics-hl-p3",
    subjectId: "physics_hl",
    title: "Physics HL",
    paper: "Paper 3",
    startsAt: "2026-05-14T13:00:00+02:00",
  },
  {
    id: "exam-cs-hl-p1",
    subjectId: "computer_science_hl",
    title: "Computer Science HL",
    paper: "Paper 1",
    startsAt: "2026-05-15T09:00:00+02:00",
  },
  {
    id: "exam-cs-hl-p2",
    subjectId: "computer_science_hl",
    title: "Computer Science HL",
    paper: "Paper 2",
    startsAt: "2026-05-16T13:00:00+02:00",
  },
  {
    id: "exam-cs-hl-p3",
    subjectId: "computer_science_hl",
    title: "Computer Science HL",
    paper: "Paper 3",
    startsAt: "2026-05-19T09:00:00+02:00",
  },
  {
    id: "exam-german-sl-p1",
    subjectId: "german_lang_lit_sl",
    title: "German Lang Lit SL",
    paper: "Paper 1",
    startsAt: "2026-05-20T09:00:00+02:00",
  },
  {
    id: "exam-german-sl-p2",
    subjectId: "german_lang_lit_sl",
    title: "German Lang Lit SL",
    paper: "Paper 2",
    startsAt: "2026-05-21T13:00:00+02:00",
  },
  {
    id: "exam-german-sl-io",
    subjectId: "german_lang_lit_sl",
    title: "German Lang Lit SL",
    paper: "Internal Oral",
    startsAt: "2026-04-28T10:00:00+02:00",
  },
  {
    id: "exam-english-sl-p1",
    subjectId: "english_lang_lit_sl",
    title: "English Lang Lit SL",
    paper: "Paper 1",
    startsAt: "2026-05-07T13:00:00+02:00",
  },
  {
    id: "exam-english-sl-p2",
    subjectId: "english_lang_lit_sl",
    title: "English Lang Lit SL",
    paper: "Paper 2",
    startsAt: "2026-05-08T09:00:00+02:00",
  },
  {
    id: "exam-english-sl-io",
    subjectId: "english_lang_lit_sl",
    title: "English Lang Lit SL",
    paper: "Internal Oral",
    startsAt: "2026-04-30T11:00:00+02:00",
  },
  {
    id: "exam-business-sl-p1",
    subjectId: "business_sl",
    title: "Business SL",
    paper: "Paper 1",
    startsAt: "2026-05-12T09:00:00+02:00",
  },
  {
    id: "exam-business-sl-p2",
    subjectId: "business_sl",
    title: "Business SL",
    paper: "Paper 2",
    startsAt: "2026-05-18T13:00:00+02:00",
  },
  {
    id: "exam-business-sl-p3",
    subjectId: "business_sl",
    title: "Business SL",
    paper: "Case Study",
    startsAt: "2026-05-22T09:00:00+02:00",
  },
];

export const STARTER_EXAMS: Exam[] = [
  {
    id: "exam-german-sl-p1",
    subjectId: "german_lang_lit_sl",
    title: "German Lang Lit SL",
    paper: "Paper 1",
    startsAt: "2026-04-27T13:00:00+02:00",
  },
  {
    id: "exam-german-sl-p2",
    subjectId: "german_lang_lit_sl",
    title: "German Lang Lit SL",
    paper: "Paper 2",
    startsAt: "2026-04-28T09:00:00+02:00",
  },
  {
    id: "exam-physics-hl-p1",
    subjectId: "physics_hl",
    title: "Physics HL",
    paper: "Paper 1A + 1B",
    startsAt: "2026-04-28T13:00:00+02:00",
  },
  {
    id: "exam-physics-hl-p2",
    subjectId: "physics_hl",
    title: "Physics HL",
    paper: "Paper 2",
    startsAt: "2026-04-29T09:00:00+02:00",
  },
  {
    id: "exam-business-sl-p1",
    subjectId: "business_sl",
    title: "Business SL",
    paper: "Paper 1",
    startsAt: "2026-04-29T13:00:00+02:00",
  },
  {
    id: "exam-business-sl-p2",
    subjectId: "business_sl",
    title: "Business SL",
    paper: "Paper 2",
    startsAt: "2026-04-30T09:00:00+02:00",
  },
  {
    id: "exam-cs-hl-p1",
    subjectId: "computer_science_hl",
    title: "Computer Science HL",
    paper: "Paper 1",
    startsAt: "2026-04-30T13:00:00+02:00",
  },
  {
    id: "exam-cs-hl-p23",
    subjectId: "computer_science_hl",
    title: "Computer Science HL",
    paper: "Paper 2 + Paper 3",
    startsAt: "2026-05-04T09:00:00+02:00",
  },
  {
    id: "exam-english-sl-p1",
    subjectId: "english_lang_lit_sl",
    title: "English Lang Lit SL",
    paper: "Paper 1",
    startsAt: "2026-05-07T13:00:00+02:00",
  },
  {
    id: "exam-english-sl-p2",
    subjectId: "english_lang_lit_sl",
    title: "English Lang Lit SL",
    paper: "Paper 2",
    startsAt: "2026-05-08T09:00:00+02:00",
  },
  {
    id: "exam-math-aa-hl-p1",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 1",
    startsAt: "2026-05-14T13:00:00+02:00",
  },
  {
    id: "exam-math-aa-hl-p2",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 2",
    startsAt: "2026-05-15T09:00:00+02:00",
  },
  {
    id: "exam-math-aa-hl-p3",
    subjectId: "math_aa_hl",
    title: "Math AA HL",
    paper: "Paper 3",
    startsAt: "2026-05-20T13:00:00+02:00",
  },
];

function sortExams(exams: Exam[]): Exam[] {
  return [...exams].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
}

function matchesExamSchedule(left: Exam[], right: Exam[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightById = new Map(right.map((exam) => [exam.id, exam]));

  return left.every((exam) => {
    const candidate = rightById.get(exam.id);
    return (
      candidate &&
      exam.paper === candidate.paper &&
      new Date(exam.startsAt).getTime() === new Date(candidate.startsAt).getTime()
    );
  });
}

export function reconcileExamSchedule(exams: Exam[] | undefined): Exam[] {
  if (!Array.isArray(exams) || exams.length === 0) {
    return sortExams(STARTER_EXAMS);
  }

  const sorted = sortExams(exams);
  if (matchesExamSchedule(sorted, LEGACY_STARTER_EXAMS)) {
    return sortExams(STARTER_EXAMS);
  }

  const canonicalById = new Map(STARTER_EXAMS.map((exam) => [exam.id, exam]));
  const physicsPaper2 = sorted.find((exam) => exam.id === "exam-physics-hl-p2");

  return sorted.map((exam) => {
    const canonical = canonicalById.get(exam.id);
    if (!canonical) {
      return exam;
    }

    if (
      exam.id === "exam-business-sl-p1" &&
      physicsPaper2 &&
      new Date(exam.startsAt).getTime() === new Date(physicsPaper2.startsAt).getTime()
    ) {
      return {
        ...exam,
        paper: canonical.paper,
        startsAt: canonical.startsAt,
      };
    }

    return exam;
  });
}

export function createEmptySubjectTotals(): SubjectTotals {
  return SUBJECT_IDS.reduce((accumulator, subjectId) => {
    accumulator[subjectId] = 0;
    return accumulator;
  }, {} as SubjectTotals);
}

export function createDefaultPerformanceGoals(): PerformanceGoals {
  return {
    sleepHoursTarget: DEFAULT_SLEEP_HOURS_TARGET,
    baselineStudyHours: DEFAULT_BASELINE_STUDY_HOURS,
    weeklyWorkoutTarget: DEFAULT_WEEKLY_WORKOUT_TARGET,
    weekdayWakeTime: "06:30",
    weekendWakeTime: "08:30",
    preferredBedtimeStart: "21:00",
    preferredBedtimeEnd: "22:00",
    ageYears: 18,
  };
}

export function createDefaultAppData(timezone = "Europe/Berlin"): AppData {
  return {
    exams: sortExams(STARTER_EXAMS),
    studySessions: [],
    todos: [],
    flashcards: [],
    studyNotes: [],
    pastPapers: [],
    syllabusTopics: getDefaultSyllabusTopics(),
    timelineProgress: [],
    dailyHealth: [],
    workouts: [],
    workoutDetails: [],
    healthRawFiles: [],
    healthRawRows: [],
    goals: createDefaultPerformanceGoals(),
    settings: {
      timezone,
      examHighlightColor: EXAM_HIGHLIGHT_COLOR,
    },
  };
}
