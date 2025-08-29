export type TeacherType = '常勤' | '非常勤';
export type Department = 'ITソリューション' | '地域観光デザイン' | '共通';
export type Grade = '1年' | '2年' | '全学年';
export type LessonType = '通常' | 'コンビ授業' | '合同';
export type TimeSlotPeriod = '1限' | '2限' | '3限' | '4限';
export type DayOfWeek = '月' | '火' | '水' | '木' | '金';
export type BiweeklyType = 'odd' | 'even'; // 奇数週 | 偶数週

export interface Teacher {
  id: string;
  name: string;
  type: TeacherType;
  constraints?: TeacherConstraints;
}

export interface TeacherConstraints {
  // 確定条件（最優先 - 必ず守る）
  fixed?: Array<{
    date?: string;                          // 特定日付
    dayOfWeek?: DayOfWeek;                  // 曜日
    periods: string[];                      // 時限（'1限', '2限', '3限', '4限'）
    specialNote?: string;                   // 特殊注記（例: '13:15開始'）
    subjectNote?: string;                   // 科目名（特定科目用の確定条件）
    biweekly?: BiweeklyType;               // 隔週設定
    startWeek?: number;                     // 開始週
    endWeek?: number;                       // 終了週
  }>;

  // NG条件（絶対不可）
  ng?: {
    days?: DayOfWeek[];                     // NG曜日
    periods?: number[];                     // NG時限（1,2,3,4）
    dates?: string[];                       // 特定日付NG
    specificTime?: {                        // 特定時間NG
      day: DayOfWeek;
      startTime: string;
      endTime: string;
    };
  };

  // 希望条件（可能な限り考慮）
  wish?: {
    preferredDays?: DayOfWeek[];           // 希望曜日
    preferredPeriods?: number[];           // 希望時限
    preferredContinuous?: boolean;         // 連続授業希望
    biweekly?: BiweeklyType;              // 隔週希望
  };

  // 特殊要件（Fiona先生など）
  specialRequirement?: {
    mondayMakeup?: {                       // 月曜補填
      totalMinutes: number;
      suggestedSlots: Array<{
        period: string;
        minutes: number;
        count: number;
      }>;
    };
  };

  // レガシー属性（後方互換性のため）
  confirmed?: {
    days?: DayOfWeek[];
    periods?: TimeSlotPeriod[];
    classesPerDay?: number;
    frequency?: string;
    specialSchedule?: {
      date: string;
      periods?: TimeSlotPeriod[];
      subject?: string;
    }[];
    subjectSchedules?: {
      [subject: string]: {
        period?: string;
        days: DayOfWeek[];
        periods: TimeSlotPeriod[];
        notes?: string;
      };
    };
    specialTimeStart?: string;
    makeupSchedule?: {
      totalDelayMinutes: number;
      makeupLocation: string;
      makeupClasses: number;
      notes?: string;
    };
  };

  unavailable?: {
    days?: DayOfWeek[];
    allDay?: boolean;
    periods?: TimeSlotPeriod[] | {
      [key in DayOfWeek]?: TimeSlotPeriod[];
    };
    specificDates?: string[];
    recurringTime?: {
      day: DayOfWeek;
      time: string;
      notes?: string;
    };
  };

  preferred?: {
    days?: DayOfWeek[];
    periods?: {
      [key in DayOfWeek]?: TimeSlotPeriod[] | TimeSlotPeriod[][];
    };
    consecutivePeriods?: TimeSlotPeriod[][];
    sameSchedule?: string[];
    alternativePeriods?: {
      [key in DayOfWeek]?: TimeSlotPeriod[];
    };
    notes?: string;
  };

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