import type { 
  Teacher, 
  Subject, 
  Classroom, 
  ScheduleEntry, 
  TimeSlot,
  DayOfWeek
} from '../types';
import { DAYS_OF_WEEK, PERIODS } from '../types';

interface GeneratorInput {
  teachers: Teacher[];
  subjects: Subject[];
  classrooms: Classroom[];
  startDate: string;
  weeks: number;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

export class TimetableGenerator {
  private teachers: Map<string, Teacher>;
  private subjects: Map<string, Subject>;
  private classrooms: Map<string, Classroom>;
  private schedule: ScheduleEntry[] = [];
  private subjectClassCount: Map<string, number> = new Map();

  constructor(input: GeneratorInput) {
    this.teachers = new Map(input.teachers.map(t => [t.id, t]));
    this.subjects = new Map(input.subjects.map(s => [s.id, s]));
    this.classrooms = new Map(input.classrooms.map(c => [c.id, c]));
  }

  generate(): ScheduleEntry[] {
    this.schedule = [];
    this.subjectClassCount.clear();

    // Initialize class counts
    this.subjects.forEach(subject => {
      this.subjectClassCount.set(subject.id, 0);
    });

    // Generate time slots for the semester
    const timeSlots = this.generateTimeSlots(16); // 16 weeks

    // Sort subjects by constraints complexity (more constrained first)
    const sortedSubjects = Array.from(this.subjects.values()).sort((a, b) => {
      const aConstraints = this.getConstraintScore(a);
      const bConstraints = this.getConstraintScore(b);
      return bConstraints - aConstraints;
    });

    // Try to schedule each subject
    for (const subject of sortedSubjects) {
      this.scheduleSubject(subject, timeSlots);
    }

    return this.schedule;
  }

  private generateTimeSlots(weeks: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startDate = new Date('2025-10-01');

    for (let week = 0; week < weeks; week++) {
      for (const day of DAYS_OF_WEEK) {
        for (const period of PERIODS) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (week * 7) + this.getDayOffset(day));
          
          slots.push({
            date: date.toISOString().split('T')[0],
            dayOfWeek: day,
            period: period
          });
        }
      }
    }

    return slots;
  }

  private scheduleSubject(subject: Subject, timeSlots: TimeSlot[]) {
    const targetClasses = subject.totalClasses;
    let scheduledClasses = 0;

    for (const slot of timeSlots) {
      if (scheduledClasses >= targetClasses) break;

      // Check if we can schedule this subject in this slot
      const validation = this.validateScheduling(subject, slot);
      if (validation.valid) {
        // Find available classroom
        const classroom = this.findAvailableClassroom(subject, slot);
        if (classroom) {
          // Schedule the class
          const teacher = this.teachers.get(subject.teacherIds[0]);
          if (teacher) {
            const entry: ScheduleEntry = {
              id: `entry-${Date.now()}-${Math.random()}`,
              timeSlot: slot,
              subjectId: subject.id,
              teacherId: teacher.id,
              classroomId: classroom.id,
              department: subject.department,
              grade: subject.grade
            };

            this.schedule.push(entry);
            scheduledClasses++;
            this.subjectClassCount.set(subject.id, scheduledClasses);

            // Handle combo lessons
            if (subject.lessonType === 'コンビ授業' && subject.comboSubjectId) {
              const comboSubject = this.subjects.get(subject.comboSubjectId);
              if (comboSubject) {
                const comboClassroom = this.findAvailableClassroom(comboSubject, slot, classroom.id);
                if (comboClassroom && comboSubject.teacherIds[0]) {
                  const comboEntry: ScheduleEntry = {
                    id: `entry-${Date.now()}-${Math.random()}`,
                    timeSlot: slot,
                    subjectId: comboSubject.id,
                    teacherId: comboSubject.teacherIds[0],
                    classroomId: comboClassroom.id,
                    department: comboSubject.department,
                    grade: comboSubject.grade
                  };
                  this.schedule.push(comboEntry);
                  const comboCount = this.subjectClassCount.get(comboSubject.id) || 0;
                  this.subjectClassCount.set(comboSubject.id, comboCount + 1);
                }
              }
            }
          }
        }
      }
    }
  }

  private validateScheduling(subject: Subject, slot: TimeSlot): ValidationResult {
    // Check teacher availability
    const teacherId = subject.teacherIds[0];
    const teacher = this.teachers.get(teacherId);
    
    if (!teacher) {
      return { valid: false, message: '教師が見つかりません' };
    }

    // Check teacher constraints
    if (teacher.constraints) {
      // Check unavailable days
      if (teacher.constraints.unavailableDays?.includes(slot.dayOfWeek)) {
        return { valid: false, message: `${teacher.name}先生は${slot.dayOfWeek}曜日はNGです` };
      }

      // Check available days
      if (teacher.constraints.availableDays && 
          !teacher.constraints.availableDays.includes(slot.dayOfWeek)) {
        return { valid: false, message: `${teacher.name}先生は${slot.dayOfWeek}曜日は利用不可です` };
      }
    }

    // Check if teacher is already scheduled at this time
    const teacherBusy = this.schedule.some(entry => 
      entry.teacherId === teacherId &&
      entry.timeSlot.date === slot.date &&
      entry.timeSlot.period === slot.period
    );

    if (teacherBusy) {
      return { valid: false, message: `${teacher.name}先生は既にこの時間に授業があります` };
    }

    // Check if students already have a class at this time
    const studentsBusy = this.schedule.some(entry =>
      entry.department === subject.department &&
      entry.grade === subject.grade &&
      entry.timeSlot.date === slot.date &&
      entry.timeSlot.period === slot.period
    );

    if (studentsBusy) {
      return { valid: false, message: `この時間は既に他の授業が入っています` };
    }

    // Prefer not to schedule on Mondays (soft constraint)
    if (slot.dayOfWeek === '月') {
      // This is a soft constraint, so we might still allow it
      // but with lower priority
    }

    return { valid: true };
  }

  private findAvailableClassroom(
    subject: Subject, 
    slot: TimeSlot, 
    excludeId?: string
  ): Classroom | null {
    for (const classroomId of subject.availableClassroomIds) {
      if (classroomId === excludeId) continue;

      const classroom = this.classrooms.get(classroomId);
      if (!classroom) continue;

      // Check if classroom is available at this time
      const classroomBusy = this.schedule.some(entry =>
        entry.classroomId === classroomId &&
        entry.timeSlot.date === slot.date &&
        entry.timeSlot.period === slot.period
      );

      if (!classroomBusy) {
        return classroom;
      }
    }

    return null;
  }

  private getConstraintScore(subject: Subject): number {
    let score = 0;
    
    // More specific constraints get higher scores
    const teacher = this.teachers.get(subject.teacherIds[0]);
    if (teacher?.constraints) {
      if (teacher.constraints.unavailableDays) {
        score += teacher.constraints.unavailableDays.length * 10;
      }
      if (teacher.constraints.availableDays) {
        score += (5 - teacher.constraints.availableDays.length) * 10;
      }
      if (teacher.constraints.specialTimeStart) {
        score += 20;
      }
      if (teacher.constraints.sequentialSubjects) {
        score += 30;
      }
    }

    if (subject.lessonType === 'コンビ授業') {
      score += 25;
    }

    return score;
  }

  private getDayOffset(day: DayOfWeek): number {
    const offsets: Record<DayOfWeek, number> = {
      '月': 0,
      '火': 1,
      '水': 2,
      '木': 3,
      '金': 4
    };
    return offsets[day];
  }

  validateConstraints(entry: ScheduleEntry, newSlot: TimeSlot): ValidationResult {
    const subject = this.subjects.get(entry.subjectId);
    const teacher = this.teachers.get(entry.teacherId);

    if (!subject || !teacher) {
      return { valid: false, message: 'データが見つかりません' };
    }

    // Re-validate basic scheduling constraints
    const validation = this.validateScheduling(subject, newSlot);
    if (!validation.valid) {
      return validation;
    }

    // Check classroom availability
    const classroomBusy = this.schedule.some(e =>
      e.id !== entry.id &&
      e.classroomId === entry.classroomId &&
      e.timeSlot.date === newSlot.date &&
      e.timeSlot.period === newSlot.period
    );

    if (classroomBusy) {
      const classroom = this.classrooms.get(entry.classroomId);
      return { 
        valid: false, 
        message: `${classroom?.name || '教室'}は既に使用されています` 
      };
    }

    // Advanced constraint validation
    if (teacher.constraints) {
      
      // 1. Sequential subjects constraint (矢板先生の連続4科目)
      if (teacher.constraints.sequentialSubjects) {
        const validation = this.validateSequentialConstraint(teacher, entry, newSlot);
        if (!validation.valid) return validation;
      }

      // 2. Special time constraint (フィオーナ先生の13:15開始 = 3限指定)
      if (teacher.constraints.specialTimeStart) {
        const validation = this.validateSpecialTimeConstraint(teacher, newSlot);
        if (!validation.valid) return validation;
      }

      // 3. Consecutive lessons constraint (木下先生の連続2コマ)
      if (teacher.constraints.preferConsecutiveClasses) {
        const validation = this.validateConsecutiveConstraint(teacher, entry, newSlot);
        if (!validation.valid) return validation;
      }

      // 4. Weekly class limit (森田先生の週3コマ制約)
      if (teacher.constraints.maxClassesPerWeek) {
        const validation = this.validateWeeklyLimitConstraint(teacher, entry, newSlot);
        if (!validation.valid) return validation;
      }
    }

    // 5. Combo lesson constraint (EE/ビジネス + CC/ラボ同時実施)
    if (subject.lessonType === 'コンビ授業' && subject.comboSubjectId) {
      const validation = this.validateComboConstraint(subject, entry, newSlot);
      if (!validation.valid) return validation;
    }

    return { valid: true };
  }

  private validateSequentialConstraint(teacher: Teacher, entry: ScheduleEntry, newSlot: TimeSlot): ValidationResult {
    if (!teacher.constraints?.sequentialSubjects) return { valid: true };

    const sequentialInfo = teacher.constraints.sequentialSubjects;
    const subjectIds = sequentialInfo.subjects;
    
    // Find current subject's position in sequence
    const currentSubject = this.subjects.get(entry.subjectId);
    if (!currentSubject || !subjectIds.includes(currentSubject.name)) {
      return { valid: true }; // Not part of sequential constraint
    }

    // Position in sequence for potential future use
    // const currentIndex = subjectIds.indexOf(currentSubject.name);
    
    // Check if moving to consecutive days is required
    if (sequentialInfo.mustBeConsecutiveDays) {
      // Get all scheduled entries for this teacher's sequential subjects
      const teacherSequentialEntries = this.schedule.filter(e => {
        if (e.id === entry.id) return false; // Exclude the entry being moved
        const sub = this.subjects.get(e.subjectId);
        return e.teacherId === teacher.id && sub && subjectIds.includes(sub.name);
      });

      // Add the new position
      const newEntry = { ...entry, timeSlot: newSlot };
      teacherSequentialEntries.push(newEntry);

      // Sort by day of week
      const dayOrder = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5 };
      teacherSequentialEntries.sort((a, b) => {
        const dayA = dayOrder[a.timeSlot.dayOfWeek];
        const dayB = dayOrder[b.timeSlot.dayOfWeek];
        return dayA - dayB;
      });

      // Verify the sequence is correct
      for (let i = 0; i < teacherSequentialEntries.length - 1; i++) {
        const currentDayOrder = dayOrder[teacherSequentialEntries[i].timeSlot.dayOfWeek];
        const nextDayOrder = dayOrder[teacherSequentialEntries[i + 1].timeSlot.dayOfWeek];
        
        if (nextDayOrder !== currentDayOrder + 1) {
          return { 
            valid: false, 
            message: `${teacher.name}先生の連続授業は${sequentialInfo.subjects.join('→')}の順で連続する曜日に配置する必要があります` 
          };
        }
      }
    }

    return { valid: true };
  }

  private validateSpecialTimeConstraint(teacher: Teacher, newSlot: TimeSlot): ValidationResult {
    if (!teacher.constraints?.specialTimeStart) return { valid: true };

    const specialTime = teacher.constraints.specialTimeStart;
    
    // フィオーナ先生の13:15開始 = 3限指定
    if (specialTime === '13:15' && newSlot.period !== '3限') {
      return { 
        valid: false, 
        message: `${teacher.name}先生は${specialTime}開始のため3限のみ可能です` 
      };
    }

    return { valid: true };
  }

  private validateConsecutiveConstraint(teacher: Teacher, entry: ScheduleEntry, newSlot: TimeSlot): ValidationResult {
    if (!teacher.constraints?.preferConsecutiveClasses) return { valid: true };

    // Get all teacher's classes on the same day (excluding the one being moved)
    const sameDayEntries = this.schedule.filter(e => 
      e.id !== entry.id &&
      e.teacherId === teacher.id &&
      e.timeSlot.dayOfWeek === newSlot.dayOfWeek
    );

    // Add the new entry
    const newEntry = { ...entry, timeSlot: newSlot };
    sameDayEntries.push(newEntry);

    if (sameDayEntries.length > 1) {
      // Sort by period
      const periodOrder = { '1限': 1, '2限': 2, '3限': 3, '4限': 4 };
      sameDayEntries.sort((a, b) => 
        periodOrder[a.timeSlot.period] - periodOrder[b.timeSlot.period]
      );

      // Check if they are consecutive
      for (let i = 0; i < sameDayEntries.length - 1; i++) {
        const currentPeriod = periodOrder[sameDayEntries[i].timeSlot.period];
        const nextPeriod = periodOrder[sameDayEntries[i + 1].timeSlot.period];
        
        if (nextPeriod !== currentPeriod + 1) {
          return { 
            valid: false, 
            message: `${teacher.name}先生の授業は同じ日に連続して配置する必要があります` 
          };
        }
      }
    }

    return { valid: true };
  }

  private validateWeeklyLimitConstraint(teacher: Teacher, entry: ScheduleEntry, newSlot: TimeSlot): ValidationResult {
    if (!teacher.constraints?.maxClassesPerWeek) return { valid: true };

    // Get the week of the new slot
    const newDate = new Date(newSlot.date);
    const weekStart = new Date(newDate);
    weekStart.setDate(newDate.getDate() - newDate.getDay() + 1); // Monday
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    // Count teacher's classes in that week (excluding the entry being moved)
    const weeklyClasses = this.schedule.filter(e => {
      if (e.id === entry.id) return false; // Exclude the entry being moved
      const entryDate = new Date(e.timeSlot.date);
      return e.teacherId === teacher.id && 
             entryDate >= weekStart && 
             entryDate <= weekEnd;
    });

    // Add 1 for the new slot
    const totalWeeklyClasses = weeklyClasses.length + 1;

    if (totalWeeklyClasses > teacher.constraints.maxClassesPerWeek) {
      return { 
        valid: false, 
        message: `${teacher.name}先生の週${teacher.constraints.maxClassesPerWeek}コマ制限を超えています` 
      };
    }

    return { valid: true };
  }

  private validateComboConstraint(subject: Subject, _entry: ScheduleEntry, newSlot: TimeSlot): ValidationResult {
    if (!subject.comboSubjectId) return { valid: true };

    // Find the combo subject's entry at the same time
    const comboEntry = this.schedule.find(e => 
      e.subjectId === subject.comboSubjectId &&
      e.timeSlot.date === newSlot.date &&
      e.timeSlot.period === newSlot.period
    );

    if (!comboEntry) {
      const comboSubject = this.subjects.get(subject.comboSubjectId);
      return { 
        valid: false, 
        message: `コンビ授業のため${comboSubject?.name || '関連科目'}と同時に実施する必要があります` 
      };
    }

    return { valid: true };
  }
}