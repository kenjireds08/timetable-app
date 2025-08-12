import type { Teacher, Subject, Classroom, ScheduleRequest } from '../types';

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
    console.log('🏁 時間割生成開始 - グループ連携版');
    
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

    // Phase 1: 全学年（合同）科目の配置
    console.log('\n🎯 Phase 1: 全学年（合同）科目の配置開始');
    this.placeJointSubjectsForAllGrades(groups, weeks, options, schedule);
    
    // Phase 2: 共通科目の同学年間での同時配置
    console.log('\n🎯 Phase 2: 共通科目の同学年合同授業配置開始');
    this.placeCommonSubjectsSynchronized(groups, weeks, options, schedule);
    
    // Phase 3: 各グループの専門科目配置
    console.log('\n🎯 Phase 3: 専門科目の個別配置開始');
    for (const group of groups) {
      console.log(`\n📚 ${group.name}の専門科目配置開始`);
      const currentSchedule = schedule.get(group.id) || [];
      const updatedSchedule = this.generateGroupScheduleSpecialized(group, weeks, options, currentSchedule);
      schedule.set(group.id, updatedSchedule);
      console.log(`✅ ${group.name}完了: ${updatedSchedule.length}コマ配置`);
    }

    return schedule;
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
                
                this.markSlotUsedForSpecificGroups(gradeGroupList, week, day, period);
                this.addToTeacherSchedule(teacher.id, week, day, period);
                this.addToClassroomSchedule(classroom.id, week, day, period);
                
                weeklyPlaced++;
                placedSessions++;
                
                console.log(`✅ ${subject.name} 第${week}週${day}曜${period}に${grade}グループ同じ教室(${classroom.name})で合同配置成功`);
              }
            }
          }
        }
        
        console.log(`📊 ${subject.name}(${grade}): ${placedSessions}/${totalSessions}コマ配置完了`);
      }
    }
  }

  private generateGroupSchedule(
    group: { id: string; name: string; department: string },
    weeks: number,
    options: GenerationOptions
  ): GeneratedEntry[] {
    const schedule: GeneratedEntry[] = [];
    // 基本の曜日設定（月曜日は後回しにするが使用可能）
    let daysOfWeek = ['火', '水', '木', '金']; // 優先曜日
    let fallbackDays = ['月']; // 予備曜日（後回し）
    
    // 特定の教師は指定曜日を優先使用
    const kinoshitaSubjects = this.subjects.filter(s => {
      const teacher = this.teachers.find(t => s.teacherIds.includes(t.id) && t.name === '木下');
      return teacher !== undefined;
    }).map(s => s.name);
    
    const fionaSubjects = this.subjects.filter(s => {
      const teacher = this.teachers.find(t => s.teacherIds.includes(t.id) && t.name.includes('Fiona'));
      return teacher !== undefined;
    }).map(s => s.name);
    
    console.log('木下先生の科目:', kinoshitaSubjects);
    const periods = ['1限', '2限', '3限', '4限'];
    
    // グループに関連する科目を取得
    const relevantSubjects = this.subjects.filter(subject => {
      // 学科マッチング（共通科目は全学科対象）
      const departmentMatch = subject.department === group.department || 
                              subject.department === '共通';
      
      // 学年マッチング（全学年は1年・2年両方対象）
      const targetGrade = group.name.includes('1年') ? '1年' : '2年';
      const gradeMatch = subject.grade === targetGrade || 
                         subject.grade === '全学年' || subject.grade === '全学年（合同）';
      
      const match = departmentMatch && gradeMatch;
      if (match) {
        console.log(`✅ ${group.name} ← ${subject.name} (${subject.department} ${subject.grade})`);
      }
      
      return match;
    });

    console.log(`${group.name}に関連する科目:`, relevantSubjects.map(s => s.name));

    // 処理済みのコンビ授業を追跡
    const processedComboSubjects = new Set<string>();

    // 科目の処理順序をランダム化して配置の公平性を向上
    const subjectsToProcess = [...relevantSubjects];
    
    // Fisher-Yatesアルゴリズムでシャッフル
    for (let i = subjectsToProcess.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [subjectsToProcess[i], subjectsToProcess[j]] = [subjectsToProcess[j], subjectsToProcess[i]];
    }
    
    console.log(`🔀 ${group.name}の科目処理順序:`, subjectsToProcess.map(s => s.name));

    // 各科目を配置
    for (const subject of subjectsToProcess) {
      // コンビ授業の場合、既に処理済みならスキップ
      if (subject.lessonType === 'コンビ授業' && processedComboSubjects.has(subject.id)) {
        console.log(`⏩ ${subject.name}は既にコンビで処理済み`);
        continue;
      }

      const sessionsPerWeek = 2; // デフォルト週2回
      const totalSessions = subject.totalClasses || 16;
      let placedSessions = 0;
      let subjectFailureReasons: string[] = []; // 科目全体の配置失敗理由を記録
      
      console.log(`\n🎯 ${subject.name}の配置開始 (${totalSessions}コマ)`);
      
      // コンビ授業の相手科目を取得
      const comboSubject = subject.lessonType === 'コンビ授業' && subject.comboSubjectId 
        ? this.subjects.find(s => s.id === subject.comboSubjectId)
        : null;
        
      if (comboSubject) {
        console.log(`🤝 コンビ授業: ${subject.name} ↔ ${comboSubject.name}`);
      }

      // バランスの取れた配置：全期間に均等分散
      const weeklyDistribution = this.calculateWeeklyDistribution(totalSessions, weeks, sessionsPerWeek);
      console.log(`📊 ${subject.name}の週間配分:`, weeklyDistribution);
      
      // 週の処理順序をランダム化して配置の偏りを減らす
      const weekOrder = Array.from({ length: weeks }, (_, i) => i + 1);
      // 配分がある週のみを抽出してシャッフル
      const activeWeeks = weekOrder.filter(week => weeklyDistribution[week - 1] > 0);
      
      // Fisher-Yatesアルゴリズムでシャッフル
      for (let i = activeWeeks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeWeeks[i], activeWeeks[j]] = [activeWeeks[j], activeWeeks[i]];
      }
      
      console.log(`🔀 ${subject.name}の処理順序 (シャッフル済み):`, activeWeeks);
      
      for (const week of activeWeeks) {
        if (placedSessions >= totalSessions) break;
        
        const targetSessionsThisWeek = weeklyDistribution[week - 1] || 0;
        if (targetSessionsThisWeek === 0) continue; // この週はスキップ
        
        let weeklyPlaced = 0;
        let weekFailureReasons: string[] = []; // 週単位の配置失敗の理由を記録

        // 科目ごとに使用する曜日を決定
        let availableDays: string[] = [];
        let secondaryDays: string[] = [];
        
        // 木下先生の科目は月曜・金曜のみ
        if (kinoshitaSubjects.includes(subject.name)) {
          availableDays = ['金', '月']; // 金曜優先、月曜は必要時使用
          console.log(`  ${subject.name}は木下先生科目：金曜優先、月曜も使用可`);
        }
        // Fiona先生の科目は月曜3限固定
        else if (fionaSubjects.includes(subject.name)) {
          availableDays = ['月']; // 月曜のみ
          console.log(`  ${subject.name}はFiona先生科目：月曜3限固定`);
        }
        // その他の科目は火水木金を優先、月曜は予備
        else {
          availableDays = [...daysOfWeek]; // 火水木金を優先
          secondaryDays = [...fallbackDays]; // 月曜は後回し
          console.log(`  ${subject.name}：火水木金優先、月曜は予備日`);
        }
        
        // 1. まず同日連続配置を試行
        const consecutivePlaced = this.tryConsecutivePlacement(
          group, subject, week, availableDays, periods, sessionsPerWeek, options.startDate, schedule
        );
        
        weeklyPlaced += consecutivePlaced;
        placedSessions += consecutivePlaced;
        
        // 2. 連続配置で足りない場合は通常配置
        if (weeklyPlaced < targetSessionsThisWeek) {
          const remainingSessions = targetSessionsThisWeek - weeklyPlaced;
          
          // まず優先曜日で配置を試行
          let allAvailableDays = [...availableDays];
          
          // 月曜日の積極的活用判定
          const shouldUseMondayAggressively = this.shouldUseMondayAggressively(
            group.id, week, subject, placedSessions, totalSessions, remainingSessions
          );
          
          // Fiona先生以外の科目で配置が困難な場合は、月曜日も積極的に使用
          if (!fionaSubjects.includes(subject.name)) {
            if (shouldUseMondayAggressively || weeklyPlaced < targetSessionsThisWeek) {
              allAvailableDays = [...availableDays, ...secondaryDays];
              if (shouldUseMondayAggressively) {
                console.log(`📅 ${subject.name}: 月曜日を積極的に活用 (配置困難状況)`);
              }
            }
          }
          
          // 空きコマ最小化のため、既存の授業に近い時間帯を優先
          const dayPriority = this.calculateDayPriority(group.id, week, allAvailableDays);
          
          for (const day of dayPriority) {
            if (weeklyPlaced >= targetSessionsThisWeek) break;

            // Fiona先生の科目は3限のみ
            let availablePeriods = [...periods];
            if (fionaSubjects.includes(subject.name)) {
              availablePeriods = ['3限']; // Fiona先生は3限固定
              console.log(`  Fiona先生の${subject.name}：3限のみ使用`);
            }

            // 連続配置を優先する時限順序
            const periodPriority = this.calculatePeriodPriority(group.id, week, day, availablePeriods);
            
              for (const period of periodPriority) {
                if (weeklyPlaced >= targetSessionsThisWeek) break;

                const slotKey = `${week}-${day}-${period}`;
                
                // スロットが使用済みかチェック
                if (this.usedSlots.has(`${group.id}-${slotKey}`)) {
                  weekFailureReasons.push(`${day}${period}: スロット使用済み`);
                  continue;
                }

                // 休日チェック
                if (this.isHoliday(week, day, options.startDate)) {
                  weekFailureReasons.push(`${day}${period}: 休日`);
                  continue;
                }

                // スケジュール調整要求チェック
                if (this.isScheduleRequestViolated(week, day, period, options.startDate)) {
                  weekFailureReasons.push(`${day}${period}: スケジュール調整要求制約`);
                  continue;
                }
                
                // Fiona先生の特殊時間制約：月曜4限は常に使用不可（Fiona先生が3限にいる可能性があるため）
                if (this.shouldBlockMondayFourthPeriod(week, day, period)) {
                  weekFailureReasons.push(`${day}${period}: Fiona先生の特殊時間により4限使用不可`);
                  continue;
                }

                // 教師の制約をチェック（グローバルで他グループとの重複もチェック）
                const teacher = this.getAvailableTeacher(subject, week, day, period);
                if (!teacher) {
                  weekFailureReasons.push(`${day}${period}: 教師制約(利用不可/上限到達)`);
                  continue;
                }
                
                // より厳密な教師重複チェック
                if (this.isTeacherBusyGlobally(teacher.id, week, day, period)) {
                  weekFailureReasons.push(`${day}${period}: ${teacher.name}先生他グループで使用中`);
                  continue;
                }

                // コンビ授業でない場合の通常処理
                if (!comboSubject) {
                  // 教室の制約をチェック
                  const classroom = this.getAvailableClassroom(subject, week, day, period);
                  if (!classroom) {
                    weekFailureReasons.push(`${day}${period}: 教室制約(利用可能教室なし/使用中)`);
                    continue;
                  }

                  // 通常のエントリーを作成
                  const entry: GeneratedEntry = {
                    id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
                    timeSlot: {
                      week,
                      date: this.calculateDate(options.startDate, week, day),
                      dayOfWeek: day,
                      period
                    },
                    subjectId: subject.id,
                    subjectName: subject.name,
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    classroomId: classroom.id,
                    classroomName: classroom.name
                  };

                  schedule.push(entry);
                  this.usedSlots.add(`${group.id}-${slotKey}`);
                  this.addToTeacherSchedule(teacher.id, week, day, period);
                  this.addToClassroomSchedule(classroom.id, week, day, period);
                  
                  weeklyPlaced++;
                  placedSessions++;
                  
                } else {
                  // コンビ授業の処理
                  const success = this.placeComboClass(
                    group, subject, comboSubject, teacher, week, day, period, options.startDate, schedule
                  );
                  
                  if (success) {
                    console.log(`✅ コンビ授業配置成功: ${subject.name} & ${comboSubject.name}`);
                    processedComboSubjects.add(subject.id);
                    processedComboSubjects.add(comboSubject.id);
                    weeklyPlaced++;
                    placedSessions++;
                  } else {
                    console.log(`❌ コンビ授業配置失敗: ${subject.name} & ${comboSubject.name}`);
                    continue;
                  }
                }
              }
            }
          }
        
        // 週単位での配置失敗時のログ出力
        if (weeklyPlaced < targetSessionsThisWeek) {
          const unplacedCount = targetSessionsThisWeek - weeklyPlaced;
          console.log(`⚠️ ${subject.name} 第${week}週: ${unplacedCount}コマ配置失敗`);
          console.log(`   配置失敗理由:`, weekFailureReasons.slice(0, 5)); // 最初の5つの理由を表示
          // 週単位の失敗理由を科目全体の記録に追加
          subjectFailureReasons.push(...weekFailureReasons);
        }
      }
      
      // 科目全体での配置完了後のログ
      const unplacedSessions = totalSessions - placedSessions;
      if (unplacedSessions > 0) {
        console.log(`🔴 ${subject.name}: ${unplacedSessions}/${totalSessions}コマが配置できませんでした`);
        
        // 配置失敗の詳細理由をsubjectに記録（UI表示用）
        if (!subject.placementFailures) {
          subject.placementFailures = [];
        }
        subject.placementFailures.push({
          reason: '時間割の空きスロット不足',
          unplacedCount: unplacedSessions,
          totalCount: totalSessions,
          details: subjectFailureReasons.length > 0 ? subjectFailureReasons.slice(0, 3) : ['教師・教室の制約により配置困難']
        });
      } else {
        console.log(`✅ ${subject.name}: 全${totalSessions}コマ配置完了`);
      }
    }

    // 未配置科目の再試行処理
    const unplacedSubjects = subjectsToProcess.filter(subject => {
      if (subject.placementFailures && subject.placementFailures.length > 0) {
        const failure = subject.placementFailures[0];
        return failure.unplacedCount > 0;
      }
      return false;
    });
    
    if (unplacedSubjects.length > 0) {
      console.log(`🔄 未配置科目の再試行開始: ${unplacedSubjects.length}科目`);
      
      // より柔軟な制約で再試行
      const retrySchedule = this.retryUnplacedSubjects(
        group, unplacedSubjects, weeks, options, schedule
      );
      
      if (retrySchedule.length > schedule.length) {
        console.log(`✅ 再試行で${retrySchedule.length - schedule.length}コマ追加配置成功`);
        // scheduleの内容を更新
        schedule.length = 0;
        schedule.push(...retrySchedule);
      }
    }

    console.log(`${group.name}のスケジュール生成完了:`, schedule.length, '件');
    return schedule;
  }

  private getAvailableTeacher(subject: Subject, week: number, day: string, period: string): Teacher | null {
    const availableTeachers = this.teachers.filter(teacher => 
      subject.teacherIds.includes(teacher.id)
    );

    for (const teacher of availableTeachers) {
      // 教師制約の詳細チェック
      if (!this.checkTeacherConstraints(teacher, subject, week, day, period)) {
        continue;
      }
      
      // 時間枠の空きをチェック
      const slotKey = `${week}-${day}-${period}`;
      const teacherSlots = this.teacherSchedule.get(teacher.id) || new Set();
      
      if (!teacherSlots.has(slotKey)) {
        console.log(`✅ ${teacher.name}先生 ${day}曜日${period}使用可能`);
        return teacher;
      } else {
        console.log(`❌ ${teacher.name}先生 ${day}曜日${period}は既に使用中`);
      }
    }
    return null;
  }

  private checkTeacherConstraints(teacher: Teacher, subject: Subject, week: number, day: string, period: string): boolean {
    const constraints = teacher.constraints;
    if (!constraints) return true;

    // 基本的な利用不可日チェック
    if (constraints.unavailableDays?.includes(day as any)) {
      console.log(`❌ ${teacher.name}先生は${day}曜日NG (unavailableDays制約)`);
      return false;
    }

    // 基本的な利用可能日チェック
    if (constraints.availableDays) {
      const dayMap: { [key: string]: string } = {
        '月': 'monday', '火': 'tuesday', '水': 'wednesday', '木': 'thursday', '金': 'friday'
      };
      const englishDay = dayMap[day];
      if (!constraints.availableDays.includes(englishDay as any)) {
        console.log(`❌ ${teacher.name}先生は${day}曜日利用不可 (availableDays制約)`);
        return false;
      }
    }

    // 指定時限制約チェック（Fiona先生など）
    if (constraints.requiredPeriods) {
      if (!constraints.requiredPeriods.includes(period as any)) {
        console.log(`❌ ${teacher.name}先生は${period}利用不可 (requiredPeriods制約: ${constraints.requiredPeriods.join(', ')}のみ)`);
        return false;
      }
    }

    // 週あたりの最大授業数チェック
    if (constraints.maxClassesPerWeek) {
      const weeklySlots = this.getTeacherWeeklySlots(teacher.id, week);
      if (weeklySlots >= constraints.maxClassesPerWeek) {
        console.log(`❌ ${teacher.name}先生は週${constraints.maxClassesPerWeek}コマ上限に達しています`);
        return false;
      }
    }

    // 1日あたりの最大授業数チェック
    if (constraints.maxClassesPerDay) {
      const dailySlots = this.getTeacherDailySlots(teacher.id, week, day);
      if (dailySlots >= constraints.maxClassesPerDay) {
        console.log(`❌ ${teacher.name}先生は1日${constraints.maxClassesPerDay}コマ上限に達しています`);
        return false;
      }
    }

    // 特殊制約処理
    return this.checkSpecialConstraints(teacher, subject, week, day, period);
  }

  private checkSpecialConstraints(teacher: Teacher, subject: Subject, week: number, day: string, period: string): boolean {
    const constraints = teacher.constraints;
    if (!constraints) return true;

    // Fiona先生：月曜3限固定、特殊時間（13:15開始）、4限使用不可
    if (teacher.name.includes('Fiona')) {
      // 月曜日以外はNG
      if (day !== '月') {
        console.log(`❌ Fiona先生は月曜日のみ利用可能（現在:${day}曜日）`);
        return false;
      }
      
      // 3限以外はNG
      if (period !== '3限') {
        console.log(`❌ Fiona先生は3限のみ利用可能（現在:${period}）`);
        return false;
      }
      
      // 特殊開始時刻のため、同日4限は使用不可（別の教師も）
      // この制約は他の科目配置で考慮される
      console.log(`✅ Fiona先生：月曜3限で配置可能（13:15開始のため4限は空ける）`);
    }

    // 森田先生：週3コマまとめて配置制約（水曜日か金曜日）
    if (teacher.name.includes('森田') && constraints.weeklyGrouping) {
      const relatedSubjects = ['卒業制作', '進級制作', 'Web基礎'];
      if (relatedSubjects.includes(subject.name)) {
        // 水曜日か金曜日のみ
        if (day !== '水' && day !== '金') {
          console.log(`❌ 森田先生の授業は水曜日・金曜日のみ配置可能`);
          return false;
        }
        
        // 週3コマ制限
        const weeklyCount = this.getTeacherSubjectWeeklyCount(teacher.id, week, relatedSubjects);
        if (weeklyCount >= 3) {
          console.log(`❌ 森田先生は週3コマ制限に達しています`);
          return false;
        }
      }
    }

    // 木下先生：金曜日優先、満杯なら月曜日利用（柔軟な制約）
    if (teacher.name.includes('木下') && constraints.preferConsecutiveClasses) {
      // 金曜日・月曜日以外は不可
      if (day !== '月' && day !== '金') {
        console.log(`❌ 木下先生は月曜・金曜のみ利用可能`);
        return false;
      }
      
      // 月曜日の場合：より柔軟な判定
      if (day === '月' && constraints.flexibleScheduling) {
        // 1. 金曜日の使用状況を確認
        const fridaySlots = this.getTeacherWeeklySlots(teacher.id, week, '金');
        const fridayCapacity = 4; // 1日最大4コマ
        
        // 2. 全体的な配置状況を考慮
        const totalWeeklySlots = this.getTeacherWeeklySlots(teacher.id, week);
        const maxWeeklySlots = constraints.maxClassesPerWeek || 8;
        
        // 3. 科目の配置緊急度を判定
        const placementUrgency = this.calculatePlacementUrgency(teacher.id, subject.name);
        
        // 金曜日に余裕があっても、以下の場合は月曜日利用を許可：
        // - 週全体の使用率が50%以上
        // - 配置緊急度が高い
        // - 金曜日が75%以上使用済み
        const allowMondayUsage = 
          totalWeeklySlots / maxWeeklySlots >= 0.5 ||
          placementUrgency > 0.7 ||
          fridaySlots / fridayCapacity >= 0.75;
        
        if (!allowMondayUsage && fridaySlots < fridayCapacity - 1) {
          console.log(`💡 木下先生：金曜日優先 (金曜${fridaySlots}/${fridayCapacity}コマ, 週${totalWeeklySlots}/${maxWeeklySlots}コマ)`);
          return false;
        } else {
          console.log(`✅ 木下先生：月曜日利用OK (金曜${fridaySlots}/${fridayCapacity}, 緊急度${placementUrgency.toFixed(2)})`);
        }
      }
      
      // 連続2コマの配置可能性をチェック（必須ではない）
      const canPlaceConsecutive = this.checkConsecutiveSlots(teacher.id, week, day, period, 2);
      if (!canPlaceConsecutive) {
        console.log(`💭 木下先生：連続配置不可だが単発配置で進行`);
      }
      return true; // 連続配置できなくても配置を許可
    }

    // 宮嵜先生：木曜優先→金曜→その他（水曜は絶対NG）
    if (teacher.name.includes('宮嵜')) {
      // 水曜日は絶対NG
      if (day === '水') {
        console.log(`❌ 宮嵜先生：水曜日は絶対NG`);
        return false;
      }
      
      // 木曜日を最優先
      if (day === '木') {
        console.log(`✅ 宮嵜先生：木曜日（最優先）で配置`);
        return true;
      }
      
      // 金曜日を次優先
      if (day === '金') {
        console.log(`✅ 宮嵜先生：金曜日（次優先）で配置`);
        return true;
      }
      
      // 火曜・月曜は第三優先
      if (day === '火' || day === '月') {
        console.log(`✅ 宮嵜先生：${day}曜日で配置（第三優先）`);
        return true;
      }
    }

    // 矢板先生：順序制約（ドローン座学→ドローンプログラミング）
    if (teacher.name.includes('矢板') && constraints.sequentialSubjects) {
      if (subject.name === 'ドローンプログラミング') {
        // ドローン座学が既に配置済みかチェック
        const prerequisiteCompleted = this.checkPrerequisiteCompleted('ドローン座学', week);
        if (!prerequisiteCompleted) {
          console.log(`❌ 矢板先生：ドローン座学が未配置のためドローンプログラミングは配置不可`);
          return false;
        }
      }
    }

    return true;
  }

  private getTeacherWeeklySlots(teacherId: string, week: number, day?: string): number {
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    let count = 0;
    teacherSlots.forEach(slot => {
      if (day) {
        // 特定の曜日のコマ数をカウント
        if (slot.startsWith(`${week}-${day}-`)) count++;
      } else {
        // 週全体のコマ数をカウント
        if (slot.startsWith(`${week}-`)) count++;
      }
    });
    return count;
  }

  private getTeacherDailySlots(teacherId: string, week: number, day: string): number {
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    let count = 0;
    teacherSlots.forEach(slot => {
      if (slot.startsWith(`${week}-${day}-`)) count++;
    });
    return count;
  }

  private getTeacherSubjectWeeklyCount(teacherId: string, week: number, subjectNames: string[]): number {
    // この実装は簡略化版 - 実際はスケジュール内容を確認
    return this.getTeacherWeeklySlots(teacherId, week);
  }

  private checkConsecutiveSlots(teacherId: string, week: number, day: string, period: string, requiredCount: number): boolean {
    const periods = ['1限', '2限', '3限', '4限'];
    const currentPeriodIndex = periods.indexOf(period);
    
    if (currentPeriodIndex + requiredCount > periods.length) return false;
    
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    
    // 連続する時限が空いているかチェック
    for (let i = 0; i < requiredCount; i++) {
      const checkPeriod = periods[currentPeriodIndex + i];
      const slotKey = `${week}-${day}-${checkPeriod}`;
      if (teacherSlots.has(slotKey)) {
        return false;
      }
    }
    
    return true;
  }

  private calculateDayPriority(groupId: string, week: number, availableDays: string[]): string[] {
    // 各曜日の既存授業数を計算
    const dayScores = availableDays.map(day => {
      const existingCount = this.getGroupDaySlots(groupId, week, day);
      return {
        day,
        score: existingCount, // 既存授業が多い日を優先（詰める効果）
        hasClasses: existingCount > 0
      };
    });

    // ソート優先順位：
    // 1. 既存授業がある日を優先
    // 2. 既存授業数が多い順
    return dayScores
      .sort((a, b) => {
        if (a.hasClasses && !b.hasClasses) return -1;
        if (!a.hasClasses && b.hasClasses) return 1;
        return b.score - a.score;
      })
      .map(item => item.day);
  }

  private calculatePeriodPriority(groupId: string, week: number, day: string, allPeriods: string[]): string[] {
    const existingPeriods = this.getGroupDayPeriods(groupId, week, day);
    
    // グループの週間授業負荷を計算
    const weeklyLoad = this.getGroupWeeklyLoad(groupId, week);
    const shouldPrioritizeEarlyEnd = this.shouldPrioritizeEarlyFinish(groupId, week, day);
    
    if (existingPeriods.length === 0) {
      // 授業がない日の時限優先度を決定
      if (shouldPrioritizeEarlyEnd) {
        // 早めに終わる日を作る：1-2限優先
        console.log(`⏰ ${day}曜日は早めに終了させる日として設定`);
        return ['1限', '2限', '3限', '4限'];
      } else {
        // 通常の配置：バランス重視
        return this.getBalancedPeriodOrder(groupId, week);
      }
    }

    // 既存授業がある場合の時限優先度計算
    const periodIndexes = allPeriods.map((period, index) => ({ period, index }));
    const existingIndexes = existingPeriods
      .map(period => allPeriods.indexOf(period))
      .filter(index => index !== -1);

    const priorityScores = periodIndexes.map(({ period, index }) => {
      if (existingPeriods.includes(period)) {
        return { period, score: -1000 }; // 既に使用中
      }

      let score = 0;
      
      // 早期終了優先の場合は後半時限を避ける
      if (shouldPrioritizeEarlyEnd && index >= 2) { // 3限・4限
        score -= 200;
        console.log(`⏰ ${period}は早期終了のため優先度ダウン`);
      }

      // 隣接する時限の優先度計算（通常通り）
      for (const existingIndex of existingIndexes) {
        const distance = Math.abs(index - existingIndex);
        if (distance === 1) {
          score += 100; // 隣接する時限は高優先度
        } else if (distance === 2) {
          score += 50;  // 1つ空いた時限
        } else {
          score += Math.max(0, 10 - distance);
        }
      }

      // 学生負荷軽減のための調整
      if (weeklyLoad > 12 && index >= 3) { // 4限で負荷が高い場合
        score -= 150;
        console.log(`📚 週間負荷高のため${period}の優先度ダウン`);
      }

      return { period, score };
    });

    return priorityScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.period);
  }

  private getGroupDaySlots(groupId: string, week: number, day: string): number {
    let count = 0;
    this.usedSlots.forEach(slot => {
      if (slot.startsWith(`${groupId}-${week}-${day}-`)) {
        count++;
      }
    });
    return count;
  }

  private getGroupDayPeriods(groupId: string, week: number, day: string): string[] {
    const periods: string[] = [];
    this.usedSlots.forEach(slot => {
      const parts = slot.split('-');
      if (parts[0] === groupId && parts[1] === week.toString() && parts[2] === day) {
        periods.push(parts[3]);
      }
    });
    return periods;
  }

  private getGroupWeeklyLoad(groupId: string, week: number): number {
    // 指定週のグループの総コマ数を計算
    let count = 0;
    this.usedSlots.forEach(slot => {
      const parts = slot.split('-');
      if (parts[0] === groupId && parts[1] === week.toString()) {
        count++;
      }
    });
    return count;
  }

  private shouldPrioritizeEarlyFinish(groupId: string, week: number, day: string): boolean {
    // 週の中で早めに終わる日を作るかどうかの判定
    const daysOfWeek = ['月', '火', '水', '木', '金'];
    const currentDayIndex = daysOfWeek.indexOf(day);
    
    // 週の負荷状況を確認
    const weeklyLoad = this.getGroupWeeklyLoad(groupId, week);
    
    // 他の曜日の4限使用状況をチェック
    let fourthPeriodDays = 0;
    for (const checkDay of daysOfWeek) {
      const dayPeriods = this.getGroupDayPeriods(groupId, week, checkDay);
      if (dayPeriods.includes('4限')) {
        fourthPeriodDays++;
      }
    }
    
    // 条件：週の負荷が高く、すでに4限を使っている日が2日以上ある場合
    const shouldPrioritize = weeklyLoad >= 10 && fourthPeriodDays >= 2 && Math.random() < 0.4;
    
    if (shouldPrioritize) {
      console.log(`🎯 ${day}曜日: 早期終了日候補 (週負荷:${weeklyLoad}, 4限日数:${fourthPeriodDays})`);
    }
    
    return shouldPrioritize;
  }

  private getBalancedPeriodOrder(groupId: string, week: number): string[] {
    // バランスを考慮した時限順序を返す
    const weeklyLoad = this.getGroupWeeklyLoad(groupId, week);
    
    if (weeklyLoad < 8) {
      // 負荷が軽い場合：通常順序
      return ['1限', '2限', '3限', '4限'];
    } else if (weeklyLoad < 15) {
      // 中程度の負荷：早い時間を少し優先
      return ['2限', '1限', '3限', '4限'];
    } else {
      // 高負荷：早い時間を優先
      return ['1限', '2限', '3限', '4限'];
    }
  }

  private getConsecutiveStartPriority(groupId: string, week: number, day: string, maxStartIndex: number): number[] {
    const weeklyLoad = this.getGroupWeeklyLoad(groupId, week);
    const fourthPeriodDays = this.countFourthPeriodDays(groupId, week);
    
    // 開始時限のインデックス配列を作成
    const startIndexes = Array.from({ length: maxStartIndex }, (_, i) => i);
    
    // 負荷とバランスに基づく優先順位付け
    return startIndexes.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // 早い時限開始を優先（1限開始=index0が最優先）
      scoreA += (maxStartIndex - a) * 10;
      scoreB += (maxStartIndex - b) * 10;
      
      // 4限まで使う日が多い場合、さらに早い時限を優先
      if (fourthPeriodDays >= 2) {
        if (a + 1 <= 2) scoreA += 50; // 1-2限開始を大幅優遇
        if (b + 1 <= 2) scoreB += 50;
      }
      
      // 週負荷が高い場合の調整
      if (weeklyLoad > 12) {
        if (a === 0) scoreA += 30; // 1限開始を最優先
        if (b === 0) scoreB += 30;
      }
      
      return scoreB - scoreA;
    });
  }

  private countFourthPeriodDays(groupId: string, week: number): number {
    const daysOfWeek = ['月', '火', '水', '木', '金'];
    let count = 0;
    
    for (const day of daysOfWeek) {
      const dayPeriods = this.getGroupDayPeriods(groupId, week, day);
      if (dayPeriods.includes('4限')) {
        count++;
      }
    }
    
    return count;
  }

  private tryConsecutivePlacement(
    group: { id: string; name: string; department: string },
    subject: Subject,
    week: number,
    availableDays: string[],
    periods: string[],
    sessionsNeeded: number,
    startDate: string,
    schedule: GeneratedEntry[]
  ): number {
    if (subject.lessonType === 'コンビ授業') {
      return 0; // コンビ授業は専用処理で行う
    }

    console.log(`🔄 ${subject.name}: 連続配置を試行中 (${sessionsNeeded}コマ)`);

    // 各曜日で連続配置を試行
    for (const day of availableDays) {
      const placed = this.tryDayConsecutivePlacement(
        group, subject, week, day, periods, sessionsNeeded, startDate, schedule
      );
      
      if (placed > 0) {
        console.log(`✅ ${subject.name}: ${day}曜日に${placed}コマ連続配置成功`);
        return placed;
      }
    }

    console.log(`⚠️ ${subject.name}: 連続配置失敗、通常配置に移行`);
    return 0;
  }

  private tryDayConsecutivePlacement(
    group: { id: string; name: string; department: string },
    subject: Subject,
    week: number,
    day: string,
    periods: string[],
    sessionsNeeded: number,
    startDate: string,
    schedule: GeneratedEntry[]
  ): number {
    // 負荷状況を考慮した開始時限の優先順位
    const weeklyLoad = this.getGroupWeeklyLoad(group.id, week);
    const startPriority = this.getConsecutiveStartPriority(group.id, week, day, periods.length - sessionsNeeded + 1);
    
    console.log(`🔄 ${subject.name}連続配置: ${day}曜日 週負荷${weeklyLoad} 開始優先度:`, startPriority);
    
    // 優先順位に従って開始時限を試行
    for (const startPeriodIndex of startPriority) {
      const consecutivePeriods = periods.slice(startPeriodIndex, startPeriodIndex + sessionsNeeded);
      
      // すべてのスロットが利用可能かチェック
      let allAvailable = true;
      const tempEntries: GeneratedEntry[] = [];
      
      for (const period of consecutivePeriods) {
        const slotKey = `${week}-${day}-${period}`;
        
        // スロット使用チェック
        if (this.usedSlots.has(`${group.id}-${slotKey}`)) {
          allAvailable = false;
          break;
        }
        
        // 休日チェック
        if (this.isHoliday(week, day, startDate)) {
          allAvailable = false;
          break;
        }
        
        // スケジュール調整要求チェック
        if (this.isScheduleRequestViolated(week, day, period, startDate)) {
          allAvailable = false;
          break;
        }
        
        // Fiona先生の特殊時間制約チェック
        if (this.shouldBlockMondayFourthPeriod(week, day, period)) {
          allAvailable = false;
          break;
        }
        
        // 教師チェック（グローバル重複もチェック）
        const teacher = this.getAvailableTeacher(subject, week, day, period);
        if (!teacher) {
          allAvailable = false;
          break;
        }
        
        // グローバル教師重複チェック
        if (this.isTeacherBusyGlobally(teacher.id, week, day, period)) {
          allAvailable = false;
          break;
        }
        
        // 教室チェック
        const classroom = this.getAvailableClassroom(subject, week, day, period);
        if (!classroom) {
          allAvailable = false;
          break;
        }
        
        // エントリー準備
        tempEntries.push({
          id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
          timeSlot: {
            week,
            date: this.calculateDate(startDate, week, day),
            dayOfWeek: day,
            period
          },
          subjectId: subject.id,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          classroomId: classroom.id,
          classroomName: classroom.name
        });
      }
      
      // 連続配置が可能な場合
      if (allAvailable && tempEntries.length === sessionsNeeded) {
        // スケジュールに追加
        schedule.push(...tempEntries);
        
        // 使用状況を記録
        for (const entry of tempEntries) {
          const slotKey = `${week}-${day}-${entry.timeSlot.period}`;
          this.usedSlots.add(`${group.id}-${slotKey}`);
          this.addToTeacherSchedule(entry.teacherId, week, day, entry.timeSlot.period);
          this.addToClassroomSchedule(entry.classroomId, week, day, entry.timeSlot.period);
        }
        
        return sessionsNeeded;
      }
    }
    
    return 0;
  }

  private placeComboClass(
    group: { id: string; name: string; department: string },
    subject1: Subject,
    subject2: Subject,
    teacher1: Teacher,
    week: number,
    day: string,
    period: string,
    startDate: string,
    schedule: GeneratedEntry[]
  ): boolean {
    console.log(`🤝 コンビ授業配置試行: ${subject1.name} + ${subject2.name}`);
    
    // 科目1の教師チェック
    if (this.isTeacherBusyGlobally(teacher1.id, week, day, period)) {
      console.log(`❌ ${teacher1.name}先生は${day}曜日${period}に他で授業中`);
      return false;
    }
    
    // 科目2の教師を取得
    const teacher2 = this.getAvailableTeacher(subject2, week, day, period);
    if (!teacher2) {
      console.log(`❌ ${subject2.name}の教師が確保できません`);
      return false;
    }
    
    if (teacher1.id === teacher2.id) {
      console.log(`❌ コンビ授業は異なる教師が必要（${teacher1.name}が重複）`);
      return false;
    }
    
    // 科目1の教室を確保
    const classroom1 = this.getAvailableClassroom(subject1, week, day, period);
    if (!classroom1) {
      console.log(`❌ ${subject1.name}用教室が確保できません`);
      return false;
    }
    
    // 一時的に科目1の教室を使用中にマーク
    const slotKey = `${week}-${day}-${period}`;
    this.addToClassroomSchedule(classroom1.id, week, day, period);
    
    // 科目2の教室を確保（異なる教室）
    const classroom2 = this.getAvailableClassroom(subject2, week, day, period);
    if (!classroom2 || classroom2.id === classroom1.id) {
      console.log(`❌ ${subject2.name}用の別教室が確保できません`);
      // 科目1の教室予約をロールバック
      this.removeFromClassroomSchedule(classroom1.id, week, day, period);
      return false;
    }
    
    // 両方のエントリーを作成
    const entry1: GeneratedEntry = {
      id: `${group.id}-${subject1.id}-${week}-${day}-${period}`,
      timeSlot: {
        week,
        date: this.calculateDate(startDate, week, day),
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
    
    const entry2: GeneratedEntry = {
      id: `${group.id}-${subject2.id}-${week}-${day}-${period}`,
      timeSlot: {
        week,
        date: this.calculateDate(startDate, week, day),
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
    
    // スケジュールに追加
    schedule.push(entry1, entry2);
    
    // 使用状況を記録
    this.usedSlots.add(`${group.id}-${slotKey}`);
    this.addToTeacherSchedule(teacher1.id, week, day, period);
    this.addToTeacherSchedule(teacher2.id, week, day, period);
    // classroom1はすでに追加済み
    // classroom2を追加
    this.addToClassroomSchedule(classroom2.id, week, day, period);
    
    console.log(`✅ ${subject1.name}(${teacher1.name}@${classroom1.name}) + ${subject2.name}(${teacher2.name}@${classroom2.name})`);
    return true;
  }

  private removeFromClassroomSchedule(classroomId: string, week: number, day: string, period: string): void {
    const slotKey = `${week}-${day}-${period}`;
    const classroomSlots = this.classroomSchedule.get(classroomId);
    if (classroomSlots) {
      classroomSlots.delete(slotKey);
    }
  }

  private getAvailableClassroom(subject: Subject, week: number, day: string, period: string): Classroom | null {
    const availableClassrooms = this.classrooms.filter(classroom =>
      subject.availableClassroomIds?.includes(classroom.id) ||
      !subject.availableClassroomIds?.length
    );

    console.log(`教室検索: ${subject.name} - 利用可能教室:`, availableClassrooms.map(c => c.name));

    for (const classroom of availableClassrooms) {
      const slotKey = `${week}-${day}-${period}`;
      const classroomSlots = this.classroomSchedule.get(classroom.id) || new Set();
      
      // 教室がこの時間帯に空いているかチェック
      if (!classroomSlots.has(slotKey)) {
        console.log(`✅ ${classroom.name}教室 ${day}曜日${period}使用可能`);
        return classroom;
      } else {
        console.log(`❌ ${classroom.name}教室 ${day}曜日${period}は使用中`);
      }
    }
    
    console.log(`❌ 全教室が使用中 - ${subject.name}は配置できません`);
    return null;  // 空きがない場合はnullを返す
  }

  private addToTeacherSchedule(teacherId: string, week: number, day: string, period: string): void {
    if (!this.teacherSchedule.has(teacherId)) {
      this.teacherSchedule.set(teacherId, new Set());
    }
    this.teacherSchedule.get(teacherId)!.add(`${week}-${day}-${period}`);
  }

  private addToClassroomSchedule(classroomId: string, week: number, day: string, period: string): void {
    if (!this.classroomSchedule.has(classroomId)) {
      this.classroomSchedule.set(classroomId, new Set());
    }
    this.classroomSchedule.get(classroomId)!.add(`${week}-${day}-${period}`);
  }

  private isTeacherBusyGlobally(teacherId: string, week: number, day: string, period: string): boolean {
    // 全グループの生成済みスケジュールをチェック（教師の重複防止）
    const slotKey = `${week}-${day}-${period}`;
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    
    const isBusy = teacherSlots.has(slotKey);
    if (isBusy) {
      console.log(`⚠️ 教師重複検出: ${teacherId}は${slotKey}で既に授業中`);
    }
    
    return isBusy;
  }

  private isDayAvailable(teacherId: string, week: number, day: string): boolean {
    // 指定曜日に空きコマがあるかチェック
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    const periods = ['1限', '2限', '3限', '4限'];
    
    for (const period of periods) {
      const slotKey = `${week}-${day}-${period}`;
      if (!teacherSlots.has(slotKey)) {
        return true; // 空きコマあり
      }
    }
    return false; // すべて埋まっている
  }

  private checkPrerequisiteCompleted(subjectName: string, currentWeek: number): boolean {
    // 前提科目が現在の週より前に配置済みかチェック
    for (let week = 1; week < currentWeek; week++) {
      // 全グループのスケジュールから該当科目を検索
      // 簡略化：usedSlotsから推定（実際は科目名での検索が必要）
      const hasPrerequisite = Array.from(this.usedSlots).some(slot => {
        return slot.includes(`${week}-`) && slot.includes('ドローン座学');
      });
      if (hasPrerequisite) {
        return true;
      }
    }
    return false;
  }

  private calculateWeeks(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }

  private calculateWeeklyDistribution(totalSessions: number, totalWeeks: number, maxPerWeek: number): number[] {
    console.log(`📊 配分計算: ${totalSessions}コマを${totalWeeks}週に分散 (最大週${maxPerWeek}コマ)`);
    
    const distribution = new Array(totalWeeks).fill(0);
    let remainingSessions = totalSessions;
    
    // 19週全体に均等分散するアルゴリズム
    // まず基本分散：できるだけ全週に均等に配分
    const baseSessionsPerWeek = Math.floor(totalSessions / totalWeeks);
    const extraSessions = totalSessions % totalWeeks;
    
    // 基本配分を設定
    for (let i = 0; i < totalWeeks; i++) {
      distribution[i] = baseSessionsPerWeek;
      remainingSessions -= baseSessionsPerWeek;
    }
    
    // 余りのセッションを分散配置（前半集中を避ける）
    // ランダムな週から開始してバランス良く配分
    const startWeek = Math.floor(Math.random() * totalWeeks);
    let distributionIndex = startWeek;
    
    for (let i = 0; i < extraSessions; i++) {
      // 最大値未満の週を探して配分
      let attempts = 0;
      while (attempts < totalWeeks) {
        if (distribution[distributionIndex] < maxPerWeek) {
          distribution[distributionIndex]++;
          remainingSessions--;
          break;
        }
        distributionIndex = (distributionIndex + 1) % totalWeeks;
        attempts++;
      }
      
      // 次の配分先をランダムにシフト（前半集中を避ける）
      distributionIndex = (distributionIndex + Math.floor(totalWeeks / 3) + 1) % totalWeeks;
    }
    
    // まだ残っているセッションがあれば、全週を巡回して配分
    // ランダムな週から開始
    let currentWeek = Math.floor(Math.random() * totalWeeks);
    let cycleCount = 0;
    
    while (remainingSessions > 0 && cycleCount < totalWeeks * 2) {
      if (distribution[currentWeek] < maxPerWeek) {
        distribution[currentWeek]++;
        remainingSessions--;
        cycleCount = 0; // 配置成功したらカウントリセット
      } else {
        cycleCount++;
      }
      
      currentWeek = (currentWeek + 1) % totalWeeks;
      
      // 全ての週が最大値に達している場合の無限ループを防止
      if (cycleCount >= totalWeeks) {
        const allMaxed = distribution.every(week => week >= maxPerWeek);
        if (allMaxed && remainingSessions > 0) {
          console.log(`⚠️ 全ての週が最大${maxPerWeek}コマに達しました。残り${remainingSessions}コマは配置できません。`);
          break;
        }
      }
    }
    
    console.log(`📊 最終配分 (19週分散版):`, distribution, `残り:${remainingSessions}`);
    return distribution;
  }

  private calculateDate(startDate: string, week: number, dayOfWeek: string): string {
    const start = new Date(startDate);
    const dayMap: { [key: string]: number } = {
      '月': 1,
      '火': 2,
      '水': 3,
      '木': 4,
      '金': 5
    };
    
    // 開始日が月曜日でない場合の調整
    const startDay = start.getDay(); // 0:日曜, 1:月曜...
    const daysToMonday = startDay === 0 ? 1 : (8 - startDay) % 7;
    
    const firstMonday = new Date(start);
    if (startDay !== 1) {
      firstMonday.setDate(start.getDate() + daysToMonday);
    }
    
    // 指定週の指定曜日の日付を計算
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (dayMap[dayOfWeek] - 1));
    
    return targetDate.toISOString().split('T')[0];
  }

  /**
   * 指定された日付が休日かどうかをチェック
   */
  private isHoliday(week: number, dayOfWeek: string, startDate: string): boolean {
    const dateString = this.calculateDate(startDate, week, dayOfWeek);
    const isHoliday = this.holidays.includes(dateString);
    
    if (isHoliday) {
      console.log(`🎌 ${dateString}(${dayOfWeek})は休日のためスキップ`);
    }
    
    return isHoliday;
  }

  /**
   * スケジュール調整要求に違反していないかチェック
   */
  private shouldBlockMondayFourthPeriod(week: number, day: string, period: string): boolean {
    // 月曜日4限のみチェック
    if (day !== '月' || period !== '4限') {
      return false;
    }
    
    // Fiona先生がいる場合、月曜4限は常に使用不可
    const fionaTeacher = this.teachers.find(t => t.name.includes('Fiona'));
    if (!fionaTeacher) return false;
    
    // Fiona先生の科目が存在する場合は常にブロック
    const fionaSubjects = this.subjects.filter(s => s.teacherIds.includes(fionaTeacher.id));
    if (fionaSubjects.length > 0) {
      console.log(`🚫 月曜4限はFiona先生の特殊時間制約により使用不可`);
      return true;
    }
    
    return false;
  }

  private isFionaBlockedSlot(week: number, day: string, period: string): boolean {
    // 月曜日4限のみチェック
    if (day !== '月' || period !== '4限') {
      return false;
    }
    
    // 同じ週の月曜日3限にFiona先生の授業が配置されているかチェック
    const fionaTeacher = this.teachers.find(t => t.name.includes('Fiona'));
    if (!fionaTeacher) return false;
    
    const mondayThirdSlot = `${week}-月-3限`;
    const teacherSlots = this.teacherSchedule.get(fionaTeacher.id) || new Set();
    
    if (teacherSlots.has(mondayThirdSlot)) {
      console.log(`🚫 月曜4限はFiona先生の特殊時間制約により使用不可`);
      return true;
    }
    
    return false;
  }

  private shouldUseMondayAggressively(
    groupId: string, 
    week: number, 
    subject: Subject, 
    placedSessions: number, 
    totalSessions: number,
    remainingSessions: number
  ): boolean {
    // 配置進捗率が低い場合は積極的に月曜日を使用
    const progressRate = placedSessions / totalSessions;
    
    // 残りセッション数が多い場合
    const hasManySessions = remainingSessions > totalSessions * 0.3;
    
    // 他の曜日の使用状況をチェック
    const otherDaysUtilization = this.calculateOtherDaysUtilization(groupId, week);
    
    // 条件判定
    const shouldUse = 
      progressRate < 0.5 ||           // 進捗率50%未満
      hasManySessions ||              // 残りセッションが30%以上
      otherDaysUtilization > 0.7;     // 他曜日の使用率70%以上
    
    if (shouldUse) {
      console.log(`📈 月曜日積極活用判定: 進捗${Math.round(progressRate*100)}%, 残り${remainingSessions}, 他曜日利用率${Math.round(otherDaysUtilization*100)}%`);
    }
    
    return shouldUse;
  }

  private retryUnplacedSubjects(
    group: { id: string; name: string; department: string },
    unplacedSubjects: Subject[],
    weeks: number,
    options: GenerationOptions,
    currentSchedule: GeneratedEntry[]
  ): GeneratedEntry[] {
    const retrySchedule = [...currentSchedule];
    const periods = ['1限', '2限', '3限', '4限'];
    const allDays = ['月', '火', '水', '木', '金']; // 月曜日も含めて積極活用
    
    console.log(`🔄 柔軟制約での再配置開始`);
    
    for (const subject of unplacedSubjects) {
      const targetSessions = subject.totalClasses || 16;
      const currentPlaced = retrySchedule.filter(e => e.subjectName === subject.name).length;
      const remainingNeeded = Math.max(0, targetSessions - currentPlaced);
      
      if (remainingNeeded === 0) continue;
      
      console.log(`🎯 ${subject.name}: ${remainingNeeded}コマの追加配置を試行`);
      
      // 全週・全曜日・全時限で空きスロットを探索
      const availableSlots = this.findAllAvailableSlots(group.id, weeks, allDays, periods, options);
      
      // 優先度付きスロット選択
      const prioritizedSlots = this.prioritizeSlots(availableSlots, subject, group.id);
      
      let placed = 0;
      for (const slot of prioritizedSlots) {
        if (placed >= remainingNeeded) break;
        
        const { week, day, period } = slot;
        
        // 柔軟な教師チェック（制約を緩和）
        const teacher = this.getAvailableTeacherFlexible(subject, week, day, period);
        if (!teacher) continue;
        
        // 教室チェック
        const classroom = this.getAvailableClassroom(subject, week, day, period);
        if (!classroom) continue;
        
        // エントリー作成
        const entry: GeneratedEntry = {
          id: `${group.id}-${subject.id}-${week}-${day}-${period}-retry`,
          timeSlot: {
            week,
            date: this.calculateDate(options.startDate, week, day),
            dayOfWeek: day,
            period
          },
          subjectId: subject.id,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          classroomId: classroom.id,
          classroomName: classroom.name
        };
        
        retrySchedule.push(entry);
        this.usedSlots.add(`${group.id}-${week}-${day}-${period}`);
        this.addToTeacherSchedule(teacher.id, week, day, period);
        this.addToClassroomSchedule(classroom.id, week, day, period);
        
        placed++;
        console.log(`✅ ${subject.name} 第${week}週${day}曜${period}に配置成功`);
      }
      
      console.log(`📊 ${subject.name}: ${placed}/${remainingNeeded}コマ追加配置完了`);
    }
    
    return retrySchedule;
  }

  private findAllAvailableSlots(
    groupId: string, 
    weeks: number, 
    days: string[], 
    periods: string[],
    options: GenerationOptions
  ): Array<{week: number, day: string, period: string}> {
    const slots = [];
    
    for (let week = 1; week <= weeks; week++) {
      for (const day of days) {
        for (const period of periods) {
          const slotKey = `${groupId}-${week}-${day}-${period}`;
          
          if (!this.usedSlots.has(slotKey) && 
              !this.isHoliday(week, day, options.startDate) &&
              !this.isScheduleRequestViolated(week, day, period, options.startDate) &&
              !this.shouldBlockMondayFourthPeriod(week, day, period)) {
            slots.push({ week, day, period });
          }
        }
      }
    }
    
    return slots;
  }

  private prioritizeSlots(
    slots: Array<{week: number, day: string, period: string}>,
    subject: Subject,
    groupId: string
  ): Array<{week: number, day: string, period: string}> {
    return slots.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // 月曜日以外を優先（ただし月曜日も使用可能）
      if (a.day !== '月') scoreA += 10;
      if (b.day !== '月') scoreB += 10;
      
      // 早い週を優先
      scoreA += (20 - a.week);
      scoreB += (20 - b.week);
      
      // 既存授業との近接性
      const dayUtilA = this.getGroupDaySlots(groupId, a.week, a.day);
      const dayUtilB = this.getGroupDaySlots(groupId, b.week, b.day);
      scoreA += dayUtilA * 5;
      scoreB += dayUtilB * 5;
      
      return scoreB - scoreA;
    });
  }

  private getAvailableTeacherFlexible(subject: Subject, week: number, day: string, period: string): Teacher | null {
    const availableTeachers = this.teachers.filter(teacher => 
      subject.teacherIds.includes(teacher.id)
    );

    for (const teacher of availableTeachers) {
      // より柔軟な制約チェック
      if (!this.checkTeacherConstraintsFlexible(teacher, subject, week, day, period)) {
        continue;
      }
      
      const slotKey = `${week}-${day}-${period}`;
      const teacherSlots = this.teacherSchedule.get(teacher.id) || new Set();
      
      if (!teacherSlots.has(slotKey)) {
        console.log(`✅ ${teacher.name}先生 ${day}曜日${period}使用可能 (柔軟制約)`);
        return teacher;
      }
    }
    return null;
  }

  private checkTeacherConstraintsFlexible(teacher: Teacher, subject: Subject, week: number, day: string, period: string): boolean {
    const constraints = teacher.constraints;
    if (!constraints) return true;

    // 基本的な利用不可日チェック（厳格）
    if (constraints.unavailableDays?.includes(day as any)) {
      return false;
    }

    // Fiona先生の特殊制約は維持
    if (teacher.name.includes('Fiona')) {
      return day === '月' && period === '3限';
    }

    // その他の制約は緩和
    // 週・日単位の上限は緩和（ただし大幅な超過は避ける）
    if (constraints.maxClassesPerWeek) {
      const weeklySlots = this.getTeacherWeeklySlots(teacher.id, week);
      if (weeklySlots >= constraints.maxClassesPerWeek + 2) { // +2コマまで許容
        return false;
      }
    }

    if (constraints.maxClassesPerDay) {
      const dailySlots = this.getTeacherDailySlots(teacher.id, week, day);
      if (dailySlots >= constraints.maxClassesPerDay + 1) { // +1コマまで許容
        return false;
      }
    }

    return true;
  }

  private canPlaceForAllGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string,
    startDate: string
  ): boolean {
    // 基本制約チェック
    if (this.isHoliday(week, day, startDate) ||
        this.isScheduleRequestViolated(week, day, period, startDate) ||
        this.shouldBlockMondayFourthPeriod(week, day, period)) {
      return false;
    }
    
    // 全グループがこの時間帯に空いているかチェック
    return groups.every(group => {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      return !this.usedSlots.has(slotKey);
    });
  }

  private canPlaceForSpecificGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string,
    startDate: string
  ): boolean {
    // 基本制約チェック
    if (this.isHoliday(week, day, startDate) ||
        this.isScheduleRequestViolated(week, day, period, startDate) ||
        this.shouldBlockMondayFourthPeriod(week, day, period)) {
      return false;
    }
    
    // 指定グループがこの時間帯に空いているかチェック
    return groups.every(group => {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      return !this.usedSlots.has(slotKey);
    });
  }

  private markSlotUsedForAllGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string
  ): void {
    groups.forEach(group => {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      this.usedSlots.add(slotKey);
    });
  }

  private markSlotUsedForSpecificGroups(
    groups: Array<{ id: string; name: string; department: string; grade: string }>,
    week: number,
    day: string,
    period: string
  ): void {
    groups.forEach(group => {
      const slotKey = `${group.id}-${week}-${day}-${period}`;
      this.usedSlots.add(slotKey);
    });
  }

  private getAvailableClassroomForJoint(subject: Subject, week: number, day: string, period: string): Classroom | null {
    // 合同授業用により大きな教室を優先選択
    const availableClassrooms = this.classrooms.filter(classroom =>
      subject.availableClassroomIds?.includes(classroom.id) ||
      !subject.availableClassroomIds?.length
    );

    // 容量の大きい順にソート
    const sortedClassrooms = availableClassrooms.sort((a, b) => 
      (b.capacity || 0) - (a.capacity || 0)
    );

    for (const classroom of sortedClassrooms) {
      const slotKey = `${week}-${day}-${period}`;
      const classroomSlots = this.classroomSchedule.get(classroom.id) || new Set();
      
      if (!classroomSlots.has(slotKey)) {
        console.log(`✅ 合同授業用教室 ${classroom.name} 使用可能 (容量:${classroom.capacity})`);
        return classroom;
      }
    }
    
    return null;
  }

  private generateGroupScheduleSpecialized(
    group: { id: string; name: string; department: string; grade: string },
    weeks: number,
    options: GenerationOptions,
    currentSchedule: GeneratedEntry[]
  ): GeneratedEntry[] {
    const schedule = [...currentSchedule];
    
    // 専門科目のみを抽出
    const specializedSubjects = this.subjects.filter(subject => {
      return subject.department === group.department && 
             (subject.grade === group.grade || subject.grade === '全学年' || subject.grade === '全学年（合同）') &&
             subject.lessonType !== '合同';
    });
    
    console.log(`${group.name}の専門科目:`, specializedSubjects.map(s => s.name));
    
    // 従来のgenerateGroupScheduleロジックを使用（専門科目のみ）
    for (const subject of specializedSubjects) {
      const totalSessions = subject.totalClasses || 16;
      const weeklyDistribution = this.calculateWeeklyDistribution(totalSessions, weeks, 2);
      let placedSessions = 0;
      
      console.log(`\n🎯 ${subject.name}の配置開始 (${totalSessions}コマ)`);
      
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
            
            const slotKey = `${group.id}-${week}-${day}-${period}`;
            
            if (this.usedSlots.has(slotKey) ||
                this.isHoliday(week, day, options.startDate) ||
                this.isScheduleRequestViolated(week, day, period, options.startDate) ||
                this.shouldBlockMondayFourthPeriod(week, day, period)) {
              continue;
            }
            
            const teacher = this.getAvailableTeacher(subject, week, day, period);
            if (!teacher) continue;
            
            const classroom = this.getAvailableClassroom(subject, week, day, period);
            if (!classroom) continue;
            
            const entry: GeneratedEntry = {
              id: `${group.id}-${subject.id}-${week}-${day}-${period}`,
              timeSlot: {
                week,
                date: this.calculateDate(options.startDate, week, day),
                dayOfWeek: day,
                period
              },
              subjectId: subject.id,
              subjectName: subject.name,
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
            
            console.log(`✅ ${subject.name} 第${week}週${day}曜${period}に配置成功`);
          }
        }
      }
      
      console.log(`📊 ${subject.name}: ${placedSessions}/${totalSessions}コマ配置完了`);
    }
    
    return schedule;
  }

  private calculatePlacementUrgency(teacherId: string, subjectName: string): number {
    // 該当教師の科目の配置進捗を確認
    const relatedSubjects = this.subjects.filter(s => 
      s.teacherIds.includes(teacherId) && s.name === subjectName
    );
    
    if (relatedSubjects.length === 0) return 0;
    
    const subject = relatedSubjects[0];
    const targetTotal = subject.totalClasses || 16;
    
    // 現在の配置数を概算（簡略化）
    const teacherSlots = this.teacherSchedule.get(teacherId) || new Set();
    const currentPlaced = Math.min(teacherSlots.size, targetTotal);
    
    // 緊急度計算：配置率が低いほど緊急度が高い
    const placementRate = currentPlaced / targetTotal;
    const urgency = Math.max(0, 1 - placementRate);
    
    console.log(`🚨 ${subjectName}の配置緊急度: ${urgency.toFixed(2)} (${currentPlaced}/${targetTotal})`);
    return urgency;
  }

  private calculateOtherDaysUtilization(groupId: string, week: number): number {
    const daysToCheck = ['火', '水', '木', '金'];
    const periods = ['1限', '2限', '3限', '4限'];
    
    let usedSlots = 0;
    let totalSlots = daysToCheck.length * periods.length;
    
    for (const day of daysToCheck) {
      for (const period of periods) {
        const slotKey = `${groupId}-${week}-${day}-${period}`;
        if (this.usedSlots.has(slotKey)) {
          usedSlots++;
        }
      }
    }
    
    return usedSlots / totalSlots;
  }

  private isScheduleRequestViolated(week: number, dayOfWeek: string, period: string, startDate: string): boolean {
    const dateString = this.calculateDate(startDate, week, dayOfWeek);
    
    // その日に対するスケジュール調整要求を検索
    const request = this.scheduleRequests.find(req => req.date === dateString);
    if (!request) {
      return false; // 制約なし
    }

    console.log(`📅 ${dateString}にスケジュール調整要求: ${request.description} (${request.type})`);

    switch (request.type) {
      case 'periods-only':
        // 指定時限のみ
        if (!request.periods.includes(period as any)) {
          console.log(`❌ ${period}は許可されていない時限 (許可: ${request.periods.join('・')})`);
          return true;
        }
        break;
        
      case 'start-from':
        // 指定時限から開始
        const allowedPeriods = ['1限', '2限', '3限', '4限'];
        const startIndex = allowedPeriods.indexOf(request.periods[0]);
        const currentIndex = allowedPeriods.indexOf(period);
        if (currentIndex < startIndex) {
          console.log(`❌ ${period}は${request.periods[0]}より前の時限なので不可`);
          return true;
        }
        break;
        
      case 'end-until':
        // 指定時限まで
        const allPeriods = ['1限', '2限', '3限', '4限'];
        const endIndex = allPeriods.indexOf(request.periods[request.periods.length - 1]);
        const currentIdx = allPeriods.indexOf(period);
        if (currentIdx > endIndex) {
          console.log(`❌ ${period}は${request.periods[request.periods.length - 1]}より後の時限なので不可`);
          return true;
        }
        break;
        
      case 'exclude-periods':
        // 指定時限を除外
        if (request.periods.includes(period as any)) {
          console.log(`❌ ${period}は除外対象の時限`);
          return true;
        }
        break;
    }

    return false; // 制約に違反していない
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
    console.log(`🤝 ${groups.length}グループ共通コンビ授業配置試行: ${subject1.name} + ${subject2.name}`);
    
    // 教師を確保
    const teacher1 = this.getAvailableTeacher(subject1, week, day, period);
    if (!teacher1) {
      console.log(`❌ ${subject1.name}の教師が確保できません`);
      return false;
    }
    
    const teacher2 = this.getAvailableTeacher(subject2, week, day, period);
    if (!teacher2) {
      console.log(`❌ ${subject2.name}の教師が確保できません`);
      return false;
    }
    
    if (teacher1.id === teacher2.id) {
      console.log(`❌ コンビ授業は異なる教師が必要（${teacher1.name}が重複）`);
      return false;
    }
    
    // 各科目の教室を確保
    const classroom1 = this.getAvailableClassroom(subject1, week, day, period);
    if (!classroom1) {
      console.log(`❌ ${subject1.name}の教室が確保できません`);
      return false;
    }
    
    const classroom2 = this.getAvailableClassroom(subject2, week, day, period);
    if (!classroom2) {
      console.log(`❌ ${subject2.name}の教室が確保できません`);
      return false;
    }
    
    if (classroom1.id === classroom2.id) {
      console.log(`❌ コンビ授業は異なる教室が必要（${classroom1.name}が重複）`);
      return false;
    }
    
    // 全グループに2つのエントリ（科目1と科目2）を作成
    for (const group of groups) {
      // 科目1のエントリ
      const entry1: GeneratedEntry = {
        id: `${group.id}-${subject1.id}-${week}-${day}-${period}`,
        timeSlot: {
          week,
          date: this.calculateDate(startDate, week, day),
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
      
      // 科目2のエントリ
      const entry2: GeneratedEntry = {
        id: `${group.id}-${subject2.id}-${week}-${day}-${period}`,
        timeSlot: {
          week,
          date: this.calculateDate(startDate, week, day),
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
      
      const currentSchedule = schedule.get(group.id) || [];
      currentSchedule.push(entry1);
      currentSchedule.push(entry2);
      schedule.set(group.id, currentSchedule);
    }
    
    // リソースを使用中にマーク
    this.markSlotUsedForSpecificGroups(groups, week, day, period);
    this.addToTeacherSchedule(teacher1.id, week, day, period);
    this.addToTeacherSchedule(teacher2.id, week, day, period);
    this.addToClassroomSchedule(classroom1.id, week, day, period);
    this.addToClassroomSchedule(classroom2.id, week, day, period);
    
    console.log(`✅ ${groups.length}グループコンビ授業配置完了: ${subject1.name}(${teacher1.name}@${classroom1.name}) + ${subject2.name}(${teacher2.name}@${classroom2.name})`);
    return true;
  }
}