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
  // 確定事項
  confirmed?: {
    days?: DayOfWeek[];                     // 確定曜日
    periods?: TimeSlotPeriod[];             // 確定時限
    classesPerDay?: number;                 // 1日のコマ数
    frequency?: string;                     // 頻度（例：隔週）
    specialSchedule?: {                     // 特定日程の確定授業
      date: string;
      periods?: TimeSlotPeriod[];
      subject?: string;
    }[];
    subjectSchedules?: {                    // 科目別スケジュール
      [subject: string]: {
        period?: string;                    // 実施期間
        days: DayOfWeek[];
        periods: TimeSlotPeriod[];
        notes?: string;
      };
    };
    specialTimeStart?: string;              // 特殊な開始時刻
    makeupSchedule?: {                      // 補填授業の必要性
      totalDelayMinutes: number;
      makeupLocation: string;
      makeupClasses: number;
      notes?: string;
    };
  };

  // 不可条件（NG）
  unavailable?: {
    days?: DayOfWeek[];                     // NG曜日
    allDay?: boolean;                       // 終日NG
    periods?: TimeSlotPeriod[] | {          // NG時限
      [key in DayOfWeek]?: TimeSlotPeriod[];
    };
    specificDates?: string[];               // 特定日付NG
    recurringTime?: {                       // 定期的なNG時間
      day: DayOfWeek;
      time: string;
      notes?: string;
    };
  };

  // 希望条件
  preferred?: {
    days?: DayOfWeek[];                     // 希望曜日
    periods?: {                             // 希望時限
      [key in DayOfWeek]?: TimeSlotPeriod[] | TimeSlotPeriod[][];
    };
    consecutivePeriods?: TimeSlotPeriod[][]; // 連続授業希望
    sameSchedule?: string[];                // 同じ日程にしたい科目
    alternativePeriods?: {                  // 代替可能な時限
      [key in DayOfWeek]?: TimeSlotPeriod[];
    };
    notes?: string;                         // その他の希望
  };

  // 科目別の制約（岩木先生のような複雑なケース用）
  confirmedForSubject?: {
    [subject: string]: {
      days?: DayOfWeek[];
      periods?: TimeSlotPeriod[];
    };
  };
  unavailableForSubject?: {
    [subject: string]: {
      days?: DayOfWeek[];
      allDay?: boolean;
    };
  };
  confirmedForSubject2?: {
    [subject: string]: {
      days?: DayOfWeek[];
      periods?: TimeSlotPeriod[];
    };
  };
  unavailableForSubject2?: {
    [subject: string]: {
      days?: DayOfWeek[];
    };
  };
  preferredForSubject2?: {
    [subject: string]: {
      periods?: {
        [key in DayOfWeek]?: TimeSlotPeriod[][];
      };
      notes?: string;
    };
  };

  // レガシー属性（後方互換性のため）
  availableDays?: DayOfWeek[];
  unavailableDays?: DayOfWeek[];
  requiredPeriods?: TimeSlotPeriod[];
  preferConsecutiveClasses?: boolean;
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
  weeklyGrouping?: boolean;
  flexibleScheduling?: boolean;
  changeUnavailable?: boolean;
  availablePeriods?: {
    [key in DayOfWeek]?: TimeSlotPeriod[];
  };
  unavailablePeriods?: TimeSlotPeriod[];
  priorityOrder?: DayOfWeek[];
  
  // 補足情報
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
  placementFailures?: PlacementFailure[];
}

export interface PlacementFailure {
  reason: string;
  unplacedCount: number;
  totalCount: number;
  details: string[];
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