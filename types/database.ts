export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";
export type GoalType = "daily" | "weekly" | "monthly" | "yearly";
export type GoalStatus = "active" | "completed" | "archived";
export type HabitFrequency = "daily" | "weekly";
export type SessionType = "pomodoro" | "block" | "track";
export type SessionCategory = "work" | "study" | "exercise" | "break" | "other";
export type EventSource = "manual" | "google";
export type TransactionType = "income" | "expense";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";
export type AssignmentStatus = "pending" | "in_progress" | "submitted" | "graded";
export type ExamStatus = "upcoming" | "completed";
export type ExerciseType = "cardio" | "strength" | "yoga" | "sports" | "other";
export type NotificationType = "task" | "event" | "habit" | "goal" | "system" | "ai";
export type ThemePreference = "light" | "dark" | "system";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  daily_work_hours: number;
  timezone: string;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  recurrence: RecurrenceType;
  sort_order: number;
  parent_task_id: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  source: EventSource;
  google_event_id: string | null;
  reminder_minutes: number | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: GoalType;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  target_per_week: number;
  reminder_time: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  completed: boolean;
  note: string | null;
  created_at: string;
}

export interface TimeSession {
  id: string;
  user_id: string;
  task_id: string | null;
  type: SessionType;
  category: SessionCategory;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  log_date: string;
  water_cups: number;
  sleep_hours: number | null;
  sleep_quality: number | null;
  weight_kg: number | null;
  calories_consumed: number | null;
  calories_burned: number | null;
  exercise_minutes: number;
  exercise_type: ExerciseType | null;
  steps: number | null;
  mood: number | null;
  note: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string | null;
  description: string | null;
  transaction_date: string;
  recurring: boolean;
  budget_id: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  color: string;
  instructor: string | null;
  credits: number | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: AssignmentStatus;
  priority: TaskPriority;
  grade: number | null;
  created_at: string;
  updated_at: string;
  subject?: Subject | null;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  topics: string | null;
  location: string | null;
  duration_minutes: number | null;
  grade: number | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  subject?: Subject | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}
