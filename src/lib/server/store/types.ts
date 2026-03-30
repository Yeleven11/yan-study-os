import type {
  AppData,
  Exam,
  HealthRawFile,
  HealthRawRow,
  StudySession,
  TodoItem,
  WorkoutDetail,
} from "@/lib/types";

export interface DashboardStore {
  getData: () => Promise<AppData>;
  listStudySessions: (input?: {
    cursor?: string;
    limit?: number;
  }) => Promise<{ items: StudySession[]; nextCursor: string | null }>;
  listTodos: (input?: {
    cursor?: string;
    limit?: number;
  }) => Promise<{ items: TodoItem[]; nextCursor: string | null }>;
  saveData: (data: AppData) => Promise<void>;
  appendStudySession: (session: StudySession) => Promise<void>;
  addTodo: (todo: TodoItem) => Promise<void>;
  updateTodo: (id: string, patch: Partial<TodoItem>) => Promise<void>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  updateExams: (exams: Exam[]) => Promise<void>;
  appendHealthRawFiles: (files: HealthRawFile[]) => Promise<void>;
  appendHealthRawRows: (rows: HealthRawRow[]) => Promise<void>;
  upsertWorkoutDetails: (details: WorkoutDetail[]) => Promise<void>;
}
