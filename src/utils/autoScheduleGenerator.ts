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
    console.log('🏁 時間割生成開始 - バランス調整版');
    
    // 各学科・学年グループごとにスケジュールを生成
    const groups = [
      { id: 'it-1', name: 'ITソリューション 1年', department: 'ITソリューション' },
      { id: 'it-2', name: 'ITソリューション 2年', department: 'ITソリューション' },
      { id: 'design-1', name: '地域観光デザイン 1年', department: '地域観光デザイン' },
      { id: 'design-2', name: '地域観光デザイン 2年', department: '地域観光デザイン' }
    ];

    for (const group of groups) {
      // 各グループでusedSlotsは個別管理、教師・教室は全体共有
      this.usedSlots = new Set();
      console.log(`\n📚 ${group.name}のスケジュール生成開始`);
      
      const groupSchedule = this.generateGroupSchedule(group, weeks, options);
      schedule.set(group.id, groupSchedule);
      
      console.log(`✅ ${group.name}完了: ${groupSchedule.length}コマ配置`);
    }

    return schedule;
  }

  private generateGroupSchedule(
    group: { id: string; name: string; department: string },
    weeks: number,
    options: GenerationOptions
  ): GeneratedEntry[] {
    const schedule: GeneratedEntry[] = [];
    // 月曜日回避設定（木下先生は例外）
    let daysOfWeek = options.avoidMonday 
      ? ['火', '水', '木', '金'] 
      : ['月', '火', '水', '木', '金'];
      
    // 木下先生の科目は月曜・金曜のみ使用
    const kinoshitaSubjects = this.subjects.filter(s => {
      const teacher = this.teachers.find(t => s.teacherIds.includes(t.id) && t.name === '木下');
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
                         subject.grade === '全学年';
      
      const match = departmentMatch && gradeMatch;
      if (match) {
        console.log(`✅ ${group.name} ← ${subject.name} (${subject.department} ${subject.grade})`);
      }
      
      return match;
    });

    console.log(`${group.name}に関連する科目:`, relevantSubjects.map(s => s.name));

    // 処理済みのコンビ授業を追跡
    const processedComboSubjects = new Set<string>();

    // 各科目を配置
    for (const subject of relevantSubjects) {
      // コンビ授業の場合、既に処理済みならスキップ
      if (subject.lessonType === 'コンビ授業' && processedComboSubjects.has(subject.id)) {
        console.log(`⏩ ${subject.name}は既にコンビで処理済み`);
        continue;
      }

      const sessionsPerWeek = 2; // デフォルト週2回
      const totalSessions = subject.totalClasses || 16;
      let placedSessions = 0;
      
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
      
      for (let week = 1; week <= weeks && placedSessions < totalSessions; week++) {
        const targetSessionsThisWeek = weeklyDistribution[week - 1] || 0;
        if (targetSessionsThisWeek === 0) continue; // この週はスキップ
        
        let weeklyPlaced = 0;
        let failureReasons = []; // 配置失敗の理由を記録

        // 科目ごとに使用する曜日を決定
        let availableDays = [...daysOfWeek];
        
        // 木下先生の科目は月曜・金曜のみ
        if (kinoshitaSubjects.includes(subject.name)) {
          availableDays = ['月', '金'];
          console.log(`  ${subject.name}は木下先生科目：月・金のみ使用`);
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
          
          // 空きコマ最小化のため、既存の授業に近い時間帯を優先
          const dayPriority = this.calculateDayPriority(group.id, week, availableDays);
          
          for (const day of dayPriority) {
            if (weeklyPlaced >= targetSessionsThisWeek) break;

            // 連続配置を優先する時限順序
            const periodPriority = this.calculatePeriodPriority(group.id, week, day, periods);
            
              for (const period of periodPriority) {
                if (weeklyPlaced >= targetSessionsThisWeek) break;

                const slotKey = `${week}-${day}-${period}`;
                
                // スロットが使用済みかチェック
                if (this.usedSlots.has(`${group.id}-${slotKey}`)) {
                  failureReasons.push(`${day}${period}: スロット使用済み`);
                  continue;
                }

                // 休日チェック
                if (this.isHoliday(week, day, options.startDate)) {
                  failureReasons.push(`${day}${period}: 休日`);
                  continue;
                }

                // スケジュール調整要求チェック
                if (this.isScheduleRequestViolated(week, day, period, options.startDate)) {
                  failureReasons.push(`${day}${period}: スケジュール調整要求制約`);
                  continue;
                }

                // 教師の制約をチェック（グローバルで他グループとの重複もチェック）
                const teacher = this.getAvailableTeacher(subject, week, day, period);
                if (!teacher) {
                  failureReasons.push(`${day}${period}: 教師制約(利用不可/上限到達)`);
                  continue;
                }
                
                // より厳密な教師重複チェック
                if (this.isTeacherBusyGlobally(teacher.id, week, day, period)) {
                  failureReasons.push(`${day}${period}: ${teacher.name}先生他グループで使用中`);
                  continue;
                }

                // コンビ授業でない場合の通常処理
                if (!comboSubject) {
                  // 教室の制約をチェック
                  const classroom = this.getAvailableClassroom(subject, week, day, period);
                  if (!classroom) {
                    failureReasons.push(`${day}${period}: 教室制約(利用可能教室なし/使用中)`);
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

    // フィオーナ先生：3限目のみ制約
    if (teacher.name.includes('フィオーナ') && constraints.requiredPeriods) {
      if (!constraints.requiredPeriods.includes(period)) {
        console.log(`❌ フィオーナ先生は3限目のみ利用可能（現在:${period}）`);
        return false;
      }
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
      
      // 月曜日の場合：金曜日に余裕があるかチェック（柔軟制約）
      if (day === '月' && constraints.flexibleScheduling) {
        const fridaySlots = this.getTeacherWeeklySlots(teacher.id, week, '金');
        const fridayCapacity = 4; // 1日最大4コマ
        if (fridaySlots < fridayCapacity - 1) { // 余裕があれば金曜日優先
          console.log(`💡 木下先生：金曜日に余裕があるため金曜日を優先（月曜回避）`);
          return false;
        } else {
          console.log(`✅ 木下先生：金曜日が満杯のため月曜日を利用`);
        }
      }
      
      // 連続2コマの配置可能性をチェック
      return this.checkConsecutiveSlots(teacher.id, week, day, period, 2);
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
    
    // ラウンドロビン方式で真の均等分散
    let currentWeek = 0;
    
    while (remainingSessions > 0) {
      // 現在の週にコマを追加（最大値に達していない場合のみ）
      if (distribution[currentWeek] < maxPerWeek) {
        distribution[currentWeek]++;
        remainingSessions--;
      }
      
      // 次の週に移動（循環）
      currentWeek = (currentWeek + 1) % totalWeeks;
      
      // 全ての週が最大値に達している場合の無限ループを防止
      const allMaxed = distribution.every(week => week >= maxPerWeek);
      if (allMaxed && remainingSessions > 0) {
        console.log(`⚠️ 全ての週が最大${maxPerWeek}コマに達しました。残り${remainingSessions}コマは配置できません。`);
        break;
      }
    }
    
    console.log(`📊 最終配分:`, distribution, `残り:${remainingSessions}`);
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
}