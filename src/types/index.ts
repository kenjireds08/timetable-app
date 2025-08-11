export type TeacherType = '常勤' | '非常勤';
export type Department = 'ITソリューション' | '地域観光デザイン' | '共通';
export type Grade = '1年' | '2年' | '全学年';
export type LessonType = '通常' | 'コンビ授業' | '合同';
export type TimeSlotPeriod = '1限' | '2限' | '3限' | '4限';
export type DayOfWeek = '月' | '火' | '水' | '木' | '金';

export interface Teacher {
  id: string;
  name: string;
  type: TeacherType;
  constraints?: TeacherConstraints;
}

export interface TeacherConstraints {
  availableDays?: DayOfWeek[];
  unavailableDays?: DayOfWeek[];
  preferConsecutiveClasses?: boolean;
  specialTimeStart?: string;
  maxClassesPerDay?: number;
  maxClassesPerWeek?: number;
  monthlyExceptions?: {
    day: DayOfWeek;
    periods: TimeSlotPeriod[];
    frequency: number;
    description?: string;
  }[];
  sequentialSubjects?: {
    subjects: string[];
    mustBeConsecutiveDays: boolean;
    description?: string;
  };
  prioritizeGapMinimization?: boolean;
  specialNotes?: string;
}

export interface Subject {
  id: string;
  name: string;
  teacherIds: string[];
  department: Department;
  grade: Grade;
  totalClasses: number;
  lessonType: LessonType;
  availableClassroomIds: string[];
  comboSubjectId?: string;
  comboSubjectName?: string;
  sequenceGroup?: string;
  specialRequirements?: string;
}

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
  equipment?: string[];
}

export interface TimeSlot {
  date: string;
  dayOfWeek: DayOfWeek;
  period: TimeSlotPeriod;
}

export interface ScheduleEntry {
  id: string;
  timeSlot: TimeSlot;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  department: Department;
  grade: Grade;
}

export interface TimetableData {
  teachers: Teacher[];
  subjects: Subject[];
  classrooms: Classroom[];
  schedule: ScheduleEntry[];
}

// スケジュール調整要求の型定義
export type ScheduleRequestType = 
  | 'periods-only'      // 特定時限のみ (例: 1-2限のみ)
  | 'start-from'        // 指定時限から開始 (例: 2限目から)
  | 'end-until'         // 指定時限まで (例: 3限目まで)
  | 'exclude-periods';  // 特定時限を除外 (例: 1限目なし)

export interface ScheduleRequest {
  id: string;
  date: string;        // YYYY-MM-DD形式
  type: ScheduleRequestType;
  periods: TimeSlotPeriod[];  // 対象時限
  description: string; // 人間が読める説明 (例: "健康診断のため1-2限のみ")
}

export const TIME_PERIODS = {
  '1限': { start: '09:00', end: '10:30' },
  '2限': { start: '10:40', end: '12:10' },
  '3限': { start: '13:00', end: '14:30' },
  '4限': { start: '14:40', end: '16:10' },
} as const;

export const DAYS_OF_WEEK: DayOfWeek[] = ['月', '火', '水', '木', '金'];
export const PERIODS: TimeSlotPeriod[] = ['1限', '2限', '3限', '4限'];