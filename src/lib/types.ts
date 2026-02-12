export type SubjectId =
  | "math_aa_hl"
  | "physics_hl"
  | "computer_science_hl"
  | "german_lang_lit_sl"
  | "english_lang_lit_sl"
  | "business_sl";

export interface SubjectDefinition {
  id: SubjectId;
  name: string;
  shortName: string;
  color: string;
}

export interface Exam {
  id: string;
  subjectId: SubjectId;
  title: string;
  paper: string;
  startsAt: string;
}

export interface StudySession {
  id: string;
  subjectId: SubjectId;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  subjectId: SubjectId;
  deadline: string;
  ultraPriority: boolean;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  completedAt?: string;
}

export type SubjectTotals = Record<SubjectId, number>;

export interface DayStudyAggregate {
  date: string;
  totalSec: number;
  dominantSubjectId?: SubjectId;
  bySubject: SubjectTotals;
  sessionCount: number;
}

export interface AppSettings {
  timezone: string;
  examHighlightColor: string;
}

export interface AppData {
  exams: Exam[];
  studySessions: StudySession[];
  todos: TodoItem[];
  settings: AppSettings;
}

export interface DashboardBootstrap extends AppData {
  generatedAt: string;
}

export interface ActiveTimerState {
  subjectId: SubjectId;
  startedAt: string;
  elapsedBeforePauseSec: number;
  isRunning: boolean;
  resumedAt?: string;
}

export type OfflineAction =
  | {
      id: string;
      type: "createStudySession";
      payload: StudySession;
      createdAt: string;
    }
  | {
      id: string;
      type: "createTodo";
      payload: TodoItem;
      createdAt: string;
    }
  | {
      id: string;
      type: "updateTodo";
      payload: { id: string; patch: Partial<TodoItem> };
      createdAt: string;
    }
  | {
      id: string;
      type: "archiveTodo";
      payload: { id: string };
      createdAt: string;
    }
  | {
      id: string;
      type: "restoreTodo";
      payload: { id: string };
      createdAt: string;
    }
  | {
      id: string;
      type: "updateExams";
      payload: { exams: Exam[] };
      createdAt: string;
    };
