import type { AppData, Exam, StudySession, TodoItem } from "@/lib/types";

export interface DashboardStore {
  getData: () => Promise<AppData>;
  saveData: (data: AppData) => Promise<void>;
  appendStudySession: (session: StudySession) => Promise<void>;
  addTodo: (todo: TodoItem) => Promise<void>;
  updateTodo: (id: string, patch: Partial<TodoItem>) => Promise<void>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  updateExams: (exams: Exam[]) => Promise<void>;
}
