import type { Teacher, Subject, Classroom, ScheduleRequest } from '../types';
import { PriorityScheduler } from './priorityScheduler';

interface GeneratedEntry {
  id: string;
  timeSlot: {
    week: number;
    date: string;
    dayOfWeek: string;
    period: string;
  };
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classroomId: string;
  classroomName: string;
}

interface GenerationOptions {
  startDate: string;
  endDate: string;
  avoidMonday: boolean;
  departments: string[];
  holidays?: string[]; // 休日配列を追加
  scheduleRequests?: ScheduleRequest[]; // スケジュール調整要求を追加
}

export class AutoScheduleGenerator {
  private teachers: Teacher[];
  private subjects: Subject[];
  private classrooms: Classroom[];
  private usedSlots: Set<string>;
  private teacherSchedule: Map<string, Set<string>>;
  private classroomSchedule: Map<string, Set<string>>;
  private holidays: string[]; // 休日配列
  private scheduleRequests: ScheduleRequest[]; // スケジュール調整要求

  constructor(teachers: Teacher[], subjects: Subject[], classrooms: Classroom[]) {
    this.teachers = teachers;
    this.subjects = subjects;
    this.classrooms = classrooms;
    this.usedSlots = new Set();
    this.teacherSchedule = new Map();
    this.classroomSchedule = new Map();
    this.holidays = []; // 初期化
    this.scheduleRequests = []; // 初期化
  }

  generateSchedule(options: GenerationOptions): Map<string, GeneratedEntry[]> {
    const schedule = new Map<string, GeneratedEntry[]>();
    const weeks = this.calculateWeeks(options.startDate, options.endDate);
    
    // 休日配列を設定
    this.holidays = options.holidays || [];
    
    // スケジュール調整要求を設定
    this.scheduleRequests = options.scheduleRequests || [];
    console.log('🎌 設定された休日:', this.holidays);
    console.log('📅 設定されたスケジュール調整要求:', this.scheduleRequests);
    
    // 全体初期化（グループ間で教師・教室情報を共有）
    this.teacherSchedule = new Map();
    this.classroomSchedule = new Map();
    this.usedSlots = new Set(); // 全グループ共通のスロット管理
    console.log('🏁 時間割生成開始 - 段階的実装版');
    
    // 教師を制約の厳しさでソート
    const sortedTeachers = PriorityScheduler.sortTeachersByPriority(this.teachers);
    console.log('\n📊 教師優先度ランキング:');
    sortedTeachers.slice(0, 5).forEach((tp, index) => {
      console.log(`  ${index + 1}. ${tp.teacher.name}: 優先度 ${tp.priority} - ${PriorityScheduler.getTeacherConstraintSummary(tp.teacher)}`);
    });
    
    // 固定スケジュール教師を抽出
    const fixedTeachers = PriorityScheduler.getFixedScheduleTeachers(this.teachers);
    if (fixedTeachers.length > 0) {
      console.log('\n🔒 固定スケジュール教師:');
      fixedTeachers.forEach(tp => {
        console.log(`  - ${tp.teacher.name}: ${tp.fixedSchedule?.length}件の固定授業`);
      });
    }
    
    // 各学科・学年グループごとにスケジュールを生成
    const groups = [
      { id: 'it-1', name: 'ITソリューション 1年', department: 'ITソリューション', grade: '1年' },
      { id: 'it-2', name: 'ITソリューション 2年', department: 'ITソリューション', grade: '2年' },
      { id: 'design-1', name: '地域観光デザイン 1年', department: '地域観光デザイン', grade: '1年' },
      { id: 'design-2', name: '地域観光デザイン 2年', department: '地域観光デザイン', grade: '2年' }
    ];

    // 各グループのスケジュールを初期化
    for (const group of groups) {
      schedule.set(group.id, []);
    }

    // Phase 0: 固定スケジュールの事前配置（鈴木先生のデザインとプレゼンテーション）
    console.log('\n🎯 Phase 0: 固定スケジュール教師の事前配置');
    this.placeFixedSchedules(fixedTeachers, groups, options, schedule);

    // Phase 1: 全学年（合同）科目の配置 - 今回はスキップ
    // console.log('\n🎯 Phase 1: 全学年（合同）科目の配置開始');
    // this.placeJointSubjectsForAllGrades(groups, weeks, options, schedule);
    
    // Phase 2: 共通科目の同学年間での同時配置（コンビ授業のみ）
    console.log('\n🎯 Phase 2: コンビ授業の配置開始');
    this.placeCommonSubjectsSynchronized(groups, weeks, options, schedule);
    
    // Phase 3: 各グループの専門科目配置 - 今回はスキップ
    // console.log('\n🎯 Phase 3: 専門科目の個別配置開始');
    // for (const group of groups) {
    //   console.log(`\n📚 ${group.name}の専門科目配置開始`);
    //   const currentSchedule = schedule.get(group.id) || [];
    //   const updatedSchedule = this.generateGroupScheduleSpecialized(group, weeks, options, currentSchedule);
    //   schedule.set(group.id, updatedSchedule);
    //   console.log(`✅ ${group.name}完了: ${updatedSchedule.length}コマ配置`);
    // }

    return schedule;
  }

  /**
   * Phase 0: 固定スケジュール教師の事前配置
   * 鈴木先生のような完全固定スケジュールを最初に配置
   */
  private placeFixedSchedules(
    fixedTeachers: any[],
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    options: GenerationOptions,
    schedule: Map<string, GeneratedEntry[]>
  ): void {
    for (const tp of fixedTeachers) {
      if (!tp.fixedSchedule) continue;
      
      console.log(`\n📌 ${tp.teacher.name}の固定スケジュール配置`);
      console.log(`  配置予定: ${tp.fixedSchedule.length}コマ`);
      
      for (const fixed of tp.fixedSchedule) {
        // 休日チェック
        if (this.isHoliday(fixed.date)) {
          console.warn(`⚠️ ${fixed.date}は休日のためスキップ`);
          continue;
        }
        
        // 成果発表会期間チェック（1/26-1/28）
        const fixedDate = new Date(fixed.date);
        const presentationStart = new Date('2026-01-26');
        const presentationEnd = new Date('2026-01-28');
        if (fixedDate >= presentationStart && fixedDate <= presentationEnd) {
          console.warn(`⚠️ ${fixed.date}は成果発表会期間のためスキップ`);
          continue;
        }
        
        // 該当科目を探す
        const subject = this.subjects.find(s => 
          s.teacherIds.includes(tp.teacher.id) && 
          (s.name.includes('デザイン') || s.name.includes('プレゼン') || 
           s.name.includes('次世代') || s.name.includes('キャリア'))
        );
        
        if (!subject) {
          console.warn(`⚠️ ${tp.teacher.name}の科目が見つかりません`);
          continue;
        }
        
        // 教室を確保
        let classroom;
        if (subject.name.includes('デザイン')) {
          // デザインとプレゼンテーションは通常教室
          classroom = this.classrooms.find(c => 
            c.name === 'ICT1' || c.name === 'ICT2' || c.name === 'しらかわ'
          ) || this.classrooms[0];
        } else {
          // その他は大教室優先
          classroom = this.classrooms.find(c => c.name === 'たかねこ') || 
                     this.classrooms.find(c => c.capacity && c.capacity >= 60) ||
                     this.classrooms[0];
        }
        
        if (!classroom) {
          console.warn(`⚠️ 教室が見つかりません`);
          continue;
        }
        
        // 対象グループの決定
        let targetGroups;
        if (subject.name.includes('デザイン')) {
          // デザインとプレゼンテーションは1年生のIT・TD両方
          targetGroups = groups.filter(g => g.grade === '1年');
        } else if (subject.grade === '全学年') {
          targetGroups = groups;
        } else {
          targetGroups = groups.filter(g => g.grade === subject.grade);
        }
        
        for (const group of targetGroups) {
          const entry: GeneratedEntry = {
            id: `${group.id}-${subject.id}-${fixed.week}-${fixed.dayOfWeek}-${fixed.period}`,
            timeSlot: {
              week: fixed.week,
              date: fixed.date,
              dayOfWeek: fixed.dayOfWeek,
              period: fixed.period
            },
            subjectId: subject.id,
            subjectName: `${subject.name} [固定]`,
            teacherId: tp.teacher.id,
            teacherName: tp.teacher.name,
            classroomId: classroom.id,
            classroomName: classroom.name
          };
          
          const currentSchedule = schedule.get(group.id) || [];
          currentSchedule.push(entry);
          schedule.set(group.id, currentSchedule);
          
          // スロットを使用中にマーク
          const slotKey = `${group.id}-${fixed.week}-${fixed.dayOfWeek}-${fixed.period}`;
          this.usedSlots.add(slotKey);
        }
        
        // 教師・教室スケジュールに追加
        this.addToTeacherSchedule(tp.teacher.id, fixed.week, fixed.dayOfWeek, fixed.period);
        this.addToClassroomSchedule(classroom.id, fixed.week, fixed.dayOfWeek, fixed.period);
        
        console.log(`✅ ${fixed.date} ${fixed.dayOfWeek}曜 ${fixed.period}: ${fixed.subject}`);
      }
      
      console.log(`  完了: ${tp.teacher.name}の固定スケジュール配置完了`);
    }
  }

  private placeJointSubjectsForAllGrades(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    weeks: number,
    options: GenerationOptions,
    schedule: Map<string, GeneratedEntry[]>
  ): void {
    // 全学年（合同）科目を抽出
    const jointSubjects = this.subjects.filter(subject => 
      subject.department === '共通' && (subject.grade === '全学年' || subject.grade === '全学年（合同）')
    );
    
    console.log(`🎓 全学年（合同）科目: ${jointSubjects.map(s => s.name).join(', ')}`);
    
    for (const subject of jointSubjects) {
      // 鈴木先生の科目は既に固定配置済みならスキップ
      if (subject.teacherIds.some(tid => {
        const teacher = this.teachers.find(t => t.id === tid);
        return teacher && (teacher as any).requireConfirmed;
      })) {
        console.log(`⏩ ${subject.name}は固定スケジュール済み`);
        continue;
      }
      
      const totalSessions = subject.totalClasses || 16;
      const weeklyDistribution = this.calculateWeeklyDistribution(totalSessions, weeks, 2);
      let placedSessions = 0;
      
      console.log(`\n🎯 ${subject.name}の4グループ同時配置開始 (${totalSessions}コマ)`);
      
      // 全週をチェックして配置
      for (let week = 1; week <= weeks && placedSessions < totalSessions; week++) {
        const targetSessionsThisWeek = weeklyDistribution[week - 1] || 0;
        if (targetSessionsThisWeek === 0) continue;
        
        let weeklyPlaced = 0;
        
        // 曜日・時限で全グループが空いているスロットを探す
        const availableDays = ['火', '水', '木', '金', '月']; // 月曜は最後
        const periods = ['1限', '2限', '3限', '4限'];
        
        for (const day of availableDays) {
          if (weeklyPlaced >= targetSessionsThisWeek) break;
          
          for (const period of periods) {
            if (weeklyPlaced >= targetSessionsThisWeek) break;
            
            // 固定スケジュールとの競合チェック
            const fixedTeachers = PriorityScheduler.getFixedScheduleTeachers(this.teachers);
            if (PriorityScheduler.isSlotConflictWithFixed(week, day, period, fixedTeachers)) {
              continue;
            }
            
            // 全グループが同時に空いているかチェック
            const canPlaceAll = this.canPlaceForAllGroups(groups, week, day, period, options.startDate);
            if (!canPlaceAll) continue;
            
            // 教師チェック
            const teacher = this.getAvailableTeacher(subject, week, day, period);
            if (!teacher) continue;
            
            // 教室チェック（合同授業用の大教室）
            const classroom = this.getAvailableClassroomForJoint(subject, week, day, period);
            if (!classroom) continue;
            
            // 全グループに同時配置
            for (const group of groups) {
              const entry: GeneratedEntry = {
                id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
                timeSlot: {
                  week,
                  date: this.calculateDate(options.startDate, week, day),
                  dayOfWeek: day,
                  period
                },
                subjectId: subject.id,
                subjectName: `${subject.name} [合同]`,
                teacherId: teacher.id,
                teacherName: teacher.name,
                classroomId: classroom.id,
                classroomName: classroom.name
              };
              
              const currentSchedule = schedule.get(group.id) || [];
              currentSchedule.push(entry);
              schedule.set(group.id, currentSchedule);
            }
            
            // スロットを全グループで使用中にマーク
            this.markSlotUsedForAllGroups(groups, week, day, period);
            this.addToTeacherSchedule(teacher.id, week, day, period);
            this.addToClassroomSchedule(classroom.id, week, day, period);
            
            weeklyPlaced++;
            placedSessions++;
            
            console.log(`✅ ${subject.name} 第${week}週${day}曜${period}に全グループ配置成功`);
          }
        }
      }
      
      console.log(`📊 ${subject.name}: ${placedSessions}/${totalSessions}コマ配置完了`);
    }
  }

  private placeCommonSubjectsSynchronized(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    weeks: number,
    options: GenerationOptions,
    schedule: Map<string, GeneratedEntry[]>
  ): void {
    // 共通科目を学年別にグループ化
    const gradeGroups = {
      '1年': groups.filter(g => g.grade === '1年'),
      '2年': groups.filter(g => g.grade === '2年')
    };
    
    // コンビ授業の処理済み追跡
    const processedComboSubjects = new Set<string>();
    
    for (const [grade, gradeGroupList] of Object.entries(gradeGroups)) {
      console.log(`\n📚 ${grade}共通科目の合同授業配置開始`);
      
      const commonSubjects = this.subjects.filter(subject =>
        subject.department === '共通' && 
        (subject.grade === grade || subject.grade === '全学年' || subject.grade === '全学年（合同）') &&
        subject.lessonType !== '合同'
      );
      
      for (const subject of commonSubjects) {
        if (subject.grade === '全学年' || subject.grade === '全学年（合同）') continue; // 合同授業は既に処理済み
        
        // 固定スケジュール教師の科目はスキップ
        if (subject.teacherIds.some(tid => {
          const teacher = this.teachers.find(t => t.id === tid);
          return teacher && (teacher as any).requireConfirmed;
        })) {
          console.log(`⏩ ${subject.name}は固定スケジュール済み`);
          continue;
        }
        
        // コンビ授業の場合、既に処理済みならスキップ
        if (subject.lessonType === 'コンビ授業' && processedComboSubjects.has(subject.id)) {
          console.log(`⏩ ${subject.name}は既にコンビで処理済み`);
          continue;
        }
        
        const totalSessions = subject.totalClasses || 16;
        const weeklyDistribution = this.calculateWeeklyDistribution(totalSessions, weeks, 2);
        let placedSessions = 0;
        
        // コンビ授業の相手科目を取得
        const comboSubject = subject.lessonType === 'コンビ授業' && subject.comboSubjectId 
          ? this.subjects.find(s => s.id === subject.comboSubjectId)
          : null;
        
        if (comboSubject) {
          console.log(`\n🎯 ${subject.name}の${grade}コンビ授業配置開始 (${totalSessions}コマ)`);
          console.log(`🤝 コンビペア: ${subject.name} ↔ ${comboSubject.name}`);
        } else {
          console.log(`\n🎯 ${subject.name}の${grade}合同授業配置開始 (${totalSessions}コマ)`);
        }
        
        // 配置処理（全学年合同と同様だが対象グループが異なる）
        for (let week = 1; week <= weeks && placedSessions < totalSessions; week++) {
          const targetSessionsThisWeek = weeklyDistribution[week - 1] || 0;
          if (targetSessionsThisWeek === 0) continue;
          
          let weeklyPlaced = 0;
          const availableDays = ['火', '水', '木', '金', '月'];
          const periods = ['1限', '2限', '3限', '4限'];
          
          for (const day of availableDays) {
            if (weeklyPlaced >= targetSessionsThisWeek) break;
            
            for (const period of periods) {
              if (weeklyPlaced >= targetSessionsThisWeek) break;
              
              // 固定スケジュールとの競合チェック
              const fixedTeachers = PriorityScheduler.getFixedScheduleTeachers(this.teachers);
              if (PriorityScheduler.isSlotConflictWithFixed(week, day, period, fixedTeachers)) {
                continue;
              }
              
              // 同学年グループが同時に空いているかチェック
              const canPlaceAll = this.canPlaceForSpecificGroups(gradeGroupList, week, day, period, options.startDate);
              if (!canPlaceAll) continue;
              
              if (comboSubject) {
                // コンビ授業の処理
                const success = this.placeComboClassForGroups(
                  gradeGroupList, subject, comboSubject, week, day, period, options.startDate, schedule
                );
                
                if (success) {
                  console.log(`✅ ${grade}コンビ授業配置成功: ${subject.name} & ${comboSubject.name} 第${week}週${day}曜${period}`);
                  processedComboSubjects.add(subject.id);
                  processedComboSubjects.add(comboSubject.id);
                  
                  weeklyPlaced++;
                  placedSessions++;
                } else {
                  continue;
                }
              } else {
                // 通常の共通科目処理
                const teacher = this.getAvailableTeacher(subject, week, day, period);
                if (!teacher) continue;
                
                const classroom = this.getAvailableClassroom(subject, week, day, period);
                if (!classroom) continue;
                
                // 同学年グループに同じ教室で同時配置（共通授業）
                for (const group of gradeGroupList) {
                  const entry: GeneratedEntry = {
                    id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
                    timeSlot: {
                      week,
                      date: this.calculateDate(options.startDate, week, day),
                      dayOfWeek: day,
                      period
                    },
                    subjectId: subject.id,
                    subjectName: `${subject.name} [共通]`,
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    classroomId: classroom.id, // 同じ教室で合同授業
                    classroomName: classroom.name
                  };
                  
                  const currentSchedule = schedule.get(group.id) || [];
                  currentSchedule.push(entry);
                  schedule.set(group.id, currentSchedule);
                }
                
                // スロットを使用中にマーク
                this.markSlotUsedForSpecificGroups(gradeGroupList, week, day, period);
                this.addToTeacherSchedule(teacher.id, week, day, period);
                this.addToClassroomSchedule(classroom.id, week, day, period);
                
                weeklyPlaced++;
                placedSessions++;
                
                console.log(`✅ ${subject.name} 第${week}週${day}曜${period}に${grade}合同配置成功`);
              }
            }
          }
        }
        
        console.log(`📊 ${subject.name}: ${placedSessions}/${totalSessions}コマ配置完了`);
      }
    }
  }

  // 以降の既存メソッドは変更なし（省略）
  // ... 他のすべてのメソッドをそのまま維持 ...
  
  private generateGroupScheduleSpecialized(
    group: { id: string; name: string; department: string; grade: string },
    weeks: number,
    options: GenerationOptions,
    currentSchedule: GeneratedEntry[]
  ): GeneratedEntry[] {
    const schedule: GeneratedEntry[] = [...currentSchedule];
    
    // 専門科目を抽出（共通科目とコンビ授業は既に処理済み）
    const specializedSubjects = this.subjects.filter(subject =>
      subject.department === group.department &&
      subject.grade === group.grade &&
      subject.lessonType !== 'コンビ授業'
    );
    
    console.log(`${group.name}の専門科目: ${specializedSubjects.map(s => s.name).join(', ')}`);
    
    for (const subject of specializedSubjects) {
      // 固定スケジュール教師の科目はスキップ
      if (subject.teacherIds.some(tid => {
        const teacher = this.teachers.find(t => t.id === tid);
        return teacher && (teacher as any).requireConfirmed;
      })) {
        console.log(`⏩ ${subject.name}は固定スケジュール済み`);
        continue;
      }
      
      const totalSessions = subject.totalClasses || 16;
      let placedSessions = 0;
      
      // 週単位での分散配置
      const weeklyDistribution = this.calculateWeeklyDistribution(totalSessions, weeks, 2);
      
      for (let week = 1; week <= weeks && placedSessions < totalSessions; week++) {
        const targetSessionsThisWeek = weeklyDistribution[week - 1] || 0;
        if (targetSessionsThisWeek === 0) continue;
        
        let weeklyPlaced = 0;
        const availableDays = ['火', '水', '木', '金', '月'];
        const periods = ['1限', '2限', '3限', '4限'];
        
        for (const day of availableDays) {
          if (weeklyPlaced >= targetSessionsThisWeek) break;
          
          for (const period of periods) {
            if (weeklyPlaced >= targetSessionsThisWeek) break;
            
            // 固定スケジュールとの競合チェック
            const fixedTeachers = PriorityScheduler.getFixedScheduleTeachers(this.teachers);
            if (PriorityScheduler.isSlotConflictWithFixed(week, day, period, fixedTeachers)) {
              continue;
            }
            
            // スロットチェック
            const slotKey = `${group.id}-${week}-${day}-${period}`;
            if (this.usedSlots.has(slotKey)) continue;
            
            // 休日チェック
            const date = this.calculateDate(options.startDate, week, day);
            if (this.isHoliday(date)) continue;
            
            // 教師チェック
            const teacher = this.getAvailableTeacher(subject, week, day, period);
            if (!teacher) continue;
            
            // 教室チェック
            const classroom = this.getAvailableClassroom(subject, week, day, period);
            if (!classroom) continue;
            
            // 配置
            const entry: GeneratedEntry = {
              id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
              timeSlot: {
                week,
                date,
                dayOfWeek: day,
                period
              },
              subjectId: subject.id,
              subjectName: `${subject.name} [専門]`,
              teacherId: teacher.id,
              teacherName: teacher.name,
              classroomId: classroom.id,
              classroomName: classroom.name
            };
            
            schedule.push(entry);
            this.usedSlots.add(slotKey);
            this.addToTeacherSchedule(teacher.id, week, day, period);
            this.addToClassroomSchedule(classroom.id, week, day, period);
            
            weeklyPlaced++;
            placedSessions++;
          }
        }
      }
      
      console.log(`📊 ${subject.name}: ${placedSessions}/${totalSessions}コマ配置完了`);
    }
    
    return schedule;
  }

  // 以下、既存のヘルパーメソッドはすべてそのまま維持
  private canPlaceForAllGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string,
    startDate: string
  ): boolean {
    for (const group of groups) {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      if (this.usedSlots.has(slotKey)) {
        return false;
      }
    }
    
    const date = this.calculateDate(startDate, week, day);
    if (this.isHoliday(date)) {
      return false;
    }
    
    return true;
  }

  private canPlaceForSpecificGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string,
    startDate: string
  ): boolean {
    for (const group of groups) {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      if (this.usedSlots.has(slotKey)) {
        return false;
      }
    }
    
    const date = this.calculateDate(startDate, week, day);
    if (this.isHoliday(date)) {
      return false;
    }
    
    return true;
  }

  private markSlotUsedForAllGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string
  ): void {
    for (const group of groups) {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      this.usedSlots.add(slotKey);
    }
  }

  private markSlotUsedForSpecificGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string
  ): void {
    for (const group of groups) {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      this.usedSlots.add(slotKey);
    }
  }

  private getAvailableClassroomForJoint(
    subject: Subject,
    week: number,
    day: string,
    period: string
  ): Classroom | null {
    // 大教室優先
    const largeClassrooms = this.classrooms.filter(c => 
      c.capacity && c.capacity >= 60 || c.name === 'たかねこ'
    );
    
    for (const classroom of largeClassrooms) {
      const slotKey = `${week}-${day}-${period}`;
      const roomSchedule = this.classroomSchedule.get(classroom.id) || new Set();
      if (!roomSchedule.has(slotKey)) {
        return classroom;
      }
    }
    
    // 通常の教室から探す
    for (const classroom of this.classrooms) {
      const slotKey = `${week}-${day}-${period}`;
      const roomSchedule = this.classroomSchedule.get(classroom.id) || new Set();
      if (!roomSchedule.has(slotKey)) {
        return classroom;
      }
    }
    
    return null;
  }

  private placeComboClassForGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    subject1: Subject,
    subject2: Subject,
    week: number,
    day: string,
    period: string,
    startDate: string,
    schedule: Map<string, GeneratedEntry[]>
  ): boolean {
    // 両方の教師が利用可能かチェック
    const teacher1 = this.getAvailableTeacher(subject1, week, day, period);
    const teacher2 = this.getAvailableTeacher(subject2, week, day, period);
    
    if (!teacher1 || !teacher2) {
      console.log(`❌ コンビ授業: 教師が利用不可 - ${subject1.name}: ${teacher1?.name || 'なし'}, ${subject2.name}: ${teacher2?.name || 'なし'}`);
      return false;
    }
    
    // 2つの異なる教室が利用可能かチェック
    const classroom1 = this.getAvailableClassroom(subject1, week, day, period);
    if (!classroom1) {
      console.log(`❌ コンビ授業: ${subject1.name}の教室が確保できません`);
      return false;
    }
    
    const classroom2 = this.classrooms.find(c => {
      if (c.id === classroom1.id) return false; // 同じ教室は使わない
      const slotKey = `${week}-${day}-${period}`;
      const roomSchedule = this.classroomSchedule.get(c.id) || new Set();
      // subject2の利用可能教室リストに含まれているかチェック
      return !roomSchedule.has(slotKey) && 
             (!subject2.availableClassroomIds || 
              subject2.availableClassroomIds.length === 0 || 
              subject2.availableClassroomIds.includes(c.id));
    });
    
    if (!classroom2) {
      console.log(`❌ コンビ授業: ${subject2.name}の教室が確保できません`);
      return false;
    }
    
    const date = this.calculateDate(startDate, week, day);
    
    // 同じ学年の全グループに両方の授業を配置（学生が選択できるように）
    for (const group of groups) {
      // subject1のエントリ（例：Essential English）
      const entry1: GeneratedEntry = {
        id: `${group.id}-${subject1.id}-${week}-${day}-${period}`,
        timeSlot: {
          week,
          date,
          dayOfWeek: day,
          period
        },
        subjectId: subject1.id,
        subjectName: `${subject1.name} [コンビ]`,
        teacherId: teacher1.id,
        teacherName: teacher1.name,
        classroomId: classroom1.id,
        classroomName: classroom1.name
      };
      
      // subject2のエントリ（例：ビジネス日本語）
      const entry2: GeneratedEntry = {
        id: `${group.id}-${subject2.id}-${week}-${day}-${period}`,
        timeSlot: {
          week,
          date,
          dayOfWeek: day,
          period
        },
        subjectId: subject2.id,
        subjectName: `${subject2.name} [コンビ]`,
        teacherId: teacher2.id,
        teacherName: teacher2.name,
        classroomId: classroom2.id,
        classroomName: classroom2.name
      };
      
      // 両方の授業をスケジュールに追加
      const groupSchedule = schedule.get(group.id) || [];
      groupSchedule.push(entry1);
      groupSchedule.push(entry2);
      schedule.set(group.id, groupSchedule);
      
      console.log(`✅ ${group.name}にコンビ授業配置: ${subject1.name}(${classroom1.name}) & ${subject2.name}(${classroom2.name})`);
    }
    
    // スロットを使用中にマーク（グループ共通）
    for (const group of groups) {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      this.usedSlots.add(slotKey);
    }
    
    // 教師と教室のスケジュールを更新
    this.addToTeacherSchedule(teacher1.id, week, day, period);
    this.addToTeacherSchedule(teacher2.id, week, day, period);
    this.addToClassroomSchedule(classroom1.id, week, day, period);
    this.addToClassroomSchedule(classroom2.id, week, day, period);
    
    return true;
  }

  // 既存のヘルパーメソッド（変更なし）
  private getAvailableTeacher(subject: Subject, week: number, day: string, period: string): Teacher | null {
    const availableTeachers: Teacher[] = [];
    
    // まず、この時間枠に確定条件を持つ教師を探す
    for (const teacherId of subject.teacherIds) {
      const teacher = this.teachers.find(t => t.id === teacherId);
      if (!teacher) continue;
      
      // この教師がこの時間枠に確定条件を持っているか確認
      if (teacher.constraints?.fixed) {
        const dayOfWeek = day as DayOfWeek;
        const hasFixedForThisSlot = teacher.constraints.fixed.some(f => {
          if (f.dayOfWeek !== dayOfWeek || !f.periods.includes(period)) {
            return false;
          }
          
          // 週の範囲チェック
          if (f.startWeek !== undefined && f.endWeek !== undefined) {
            return week >= f.startWeek && week <= f.endWeek;
          }
          
          // 隔週チェック
          if (f.biweekly) {
            const isOddWeek = week % 2 === 1;
            return (f.biweekly === 'odd' && isOddWeek) || 
                   (f.biweekly === 'even' && !isOddWeek);
          }
          
          // 特定日付でない限り、毎週利用可能
          return !f.date;
        });
        
        if (hasFixedForThisSlot) {
          // この時間枠が確定なら、スケジュールが空いているか確認
          const slotKey = `${week}-${day}-${period}`;
          const teacherSched = this.teacherSchedule.get(teacherId) || new Set();
          
          if (!teacherSched.has(slotKey)) {
            console.log(`✅ ${teacher.name}の確定時間枠（${day}${period}）に配置`);
            return teacher; // 確定条件の教師を最優先で返す
          }
        }
      }
    }
    
    // 確定条件を持つ教師がいない場合、通常の処理
    for (const teacherId of subject.teacherIds) {
      const teacher = this.teachers.find(t => t.id === teacherId);
      if (!teacher) continue;
      
      const slotKey = `${week}-${day}-${period}`;
      const teacherSched = this.teacherSchedule.get(teacherId) || new Set();
      
      if (!teacherSched.has(slotKey) && this.checkTeacherConstraints(teacher, day, period, week)) {
        availableTeachers.push(teacher);
      }
    }
    
    if (availableTeachers.length === 0) return null;
    
    // 希望条件を持つ教師を優先
    const teachersWithWish = availableTeachers.filter(t => {
      if (!t.constraints?.wish) return false;
      const dayOfWeek = day as DayOfWeek;
      const periodNum = parseInt(period.replace('限', ''));
      return t.constraints.wish.preferredDays?.includes(dayOfWeek) ||
             t.constraints.wish.preferredPeriods?.includes(periodNum);
    });
    
    if (teachersWithWish.length > 0) {
      return teachersWithWish[0];
    }
    
    // それ以外は最初に見つかった教師
    return availableTeachers[0];
  }

  private checkTeacherConstraints(teacher: Teacher, day: string, period: string, week: number): boolean {
    if (!teacher.constraints) return true;
    
    const constraints = teacher.constraints;
    const dayOfWeek = day as DayOfWeek;
    const periodNum = parseInt(period.replace('限', ''));
    
    // 1. 確定条件チェック（fixed）- 最優先
    if (constraints.fixed && constraints.fixed.length > 0) {
      // 毎週の確定条件（dateがないもの）があるかチェック
      const hasWeeklyFixed = constraints.fixed.some(f => !f.date && f.dayOfWeek);
      
      if (hasWeeklyFixed) {
        // この時間枠が確定条件に含まれているか
        let isInFixedSlot = false;
        
        for (const fixed of constraints.fixed) {
          if (!fixed.date && fixed.dayOfWeek === dayOfWeek && fixed.periods.includes(period)) {
            // 週の範囲指定がある場合
            if (fixed.startWeek !== undefined && fixed.endWeek !== undefined) {
              if (week >= fixed.startWeek && week <= fixed.endWeek) {
                isInFixedSlot = true;
                break;
              }
            }
            // 隔週指定がある場合
            else if (fixed.biweekly) {
              const isOddWeek = week % 2 === 1;
              if ((fixed.biweekly === 'odd' && isOddWeek) || 
                  (fixed.biweekly === 'even' && !isOddWeek)) {
                isInFixedSlot = true;
                break;
              }
            }
            // 特定の制約がない場合は毎週利用可能
            else {
              isInFixedSlot = true;
              break;
            }
          }
        }
        
        // 毎週の確定条件がある教師は、確定時間枠以外では利用不可
        if (!isInFixedSlot) {
          console.log(`❌ ${teacher.name}は確定時間外（${day}${period}）のため利用不可`);
          return false;
        }
      }
      
      // 特定日付の確定条件のチェック
      for (const fixed of constraints.fixed) {
        if (fixed.date) {
          // 特定日付の確定条件は別途処理
          continue;
        }
      }
    }
    
    // 2. NG条件チェック（ng）- 絶対不可
    if (constraints.ng) {
      // NG曜日
      if (constraints.ng.days?.includes(dayOfWeek)) {
        return false;
      }
      // NG時限
      if (constraints.ng.periods?.includes(periodNum)) {
        return false;
      }
      // 特定時間NG（例：月曜10:00-11:00）
      if (constraints.ng.specificTime) {
        const st = constraints.ng.specificTime;
        if (st.day === dayOfWeek) {
          // 時間帯のチェック（簡易的に2限が10:40-12:10と仮定）
          if (periodNum === 2 && st.startTime === '10:00') {
            return false;
          }
        }
      }
    }
    
    // 3. レガシー制約のチェック（後方互換性）
    // 利用可能曜日チェック
    if (constraints.availableDays && !constraints.availableDays.includes(dayOfWeek)) {
      return false;
    }
    
    // 利用不可曜日チェック
    if (constraints.unavailableDays?.includes(dayOfWeek)) {
      return false;
    }
    
    // 隔週チェック（wishにある場合）
    if (constraints.wish?.biweekly) {
      const isOddWeek = week % 2 === 1;
      if (constraints.wish.biweekly === 'odd' && !isOddWeek) return false;
      if (constraints.wish.biweekly === 'even' && isOddWeek) return false;
    }
    
    return true;
  }

  private getAvailableClassroom(subject: Subject, week: number, day: string, period: string): Classroom | null {
    const availableClassrooms = subject.availableClassroomIds.length > 0 
      ? this.classrooms.filter(c => subject.availableClassroomIds.includes(c.id))
      : this.classrooms;
    
    for (const classroom of availableClassrooms) {
      const slotKey = `${week}-${day}-${period}`;
      const roomSchedule = this.classroomSchedule.get(classroom.id) || new Set();
      if (!roomSchedule.has(slotKey)) {
        return classroom;
      }
    }
    
    return null;
  }

  private addToTeacherSchedule(teacherId: string, week: number, day: string, period: string): void {
    const schedule = this.teacherSchedule.get(teacherId) || new Set();
    schedule.add(`${week}-${day}-${period}`);
    this.teacherSchedule.set(teacherId, schedule);
  }

  private addToClassroomSchedule(classroomId: string, week: number, day: string, period: string): void {
    const schedule = this.classroomSchedule.get(classroomId) || new Set();
    schedule.add(`${week}-${day}-${period}`);
    this.classroomSchedule.set(classroomId, schedule);
  }

  private calculateWeeks(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  private calculateWeeklyDistribution(total: number, weeks: number, maxPerWeek: number): number[] {
    const distribution: number[] = [];
    let remaining = total;
    
    for (let week = 0; week < weeks; week++) {
      const sessionsThisWeek = Math.min(maxPerWeek, Math.ceil(remaining / (weeks - week)));
      distribution.push(sessionsThisWeek);
      remaining -= sessionsThisWeek;
    }
    
    return distribution;
  }

  private calculateDate(startDate: string, week: number, dayOfWeek: string): string {
    const start = new Date(startDate);
    const daysFromStart = (week - 1) * 7;
    
    const dayMap: { [key: string]: number } = {
      '月': 0, '火': 1, '水': 2, '木': 3, '金': 4
    };
    
    const targetDayOffset = dayMap[dayOfWeek] || 0;
    const totalDays = daysFromStart + targetDayOffset;
    
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + totalDays);
    
    return targetDate.toISOString().split('T')[0];
  }

  private isHoliday(date: string): boolean {
    return this.holidays.includes(date);
  }
}