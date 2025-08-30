import type { Teacher } from '../types';

interface TeacherPriority {
  teacher: Teacher;
  priority: number;
  fixedSchedule?: FixedSchedule[];
}

interface FixedSchedule {
  week: number;
  date: string;
  dayOfWeek: string;
  period?: string;
  subject: string;
  notes?: string;
}

/**
 * 教師の制約優先度を計算し、厳しい制約から配置するためのユーティリティ
 */
export class PriorityScheduler {
  /**
   * 教師を制約の厳しさでソート
   * 1. requireConfirmed（完全固定）が最優先
   * 2. 曜日・時限が細かく指定されている
   * 3. NG条件が多い
   * 4. 変更対応困難フラグ
   */
  static sortTeachersByPriority(teachers: Teacher[]): TeacherPriority[] {
    const priorityList: TeacherPriority[] = [];
    
    for (const teacher of teachers) {
      let priority = 0;
      let fixedSchedule: any[] = [];
      
      // requireConfirmedフラグがある場合は最優先（鈴木先生など）
      if ((teacher as any).requireConfirmed) {
        priority += 1000;
      }

      // 確定スケジュールがある場合
      if (teacher.constraints?.fixed && Array.isArray(teacher.constraints.fixed)) {
        priority += 500;
        
        // 鈴木先生のデザインとプレゼンテーション16コマ
        if (teacher.name === '鈴木俊良') {
          // 正しい週番号での配置（開始日を9/29として計算）
          const schedules = [
            { week: 3, date: '2025-10-15', dayOfWeek: '水', period: '3限' },
            { week: 4, date: '2025-10-22', dayOfWeek: '水', period: '1限' },  // 田上先生の3,4限、森田先生の2限を避けて1限に
            { week: 5, date: '2025-10-29', dayOfWeek: '水', period: '3限' },
            { week: 6, date: '2025-11-05', dayOfWeek: '水', period: '3限' },
            { week: 7, date: '2025-11-12', dayOfWeek: '水', period: '3限' },
            { week: 8, date: '2025-11-19', dayOfWeek: '水', period: '3限' },
            { week: 9, date: '2025-11-26', dayOfWeek: '水', period: '3限' },
            { week: 10, date: '2025-12-03', dayOfWeek: '水', period: '3限' },
            { week: 11, date: '2025-12-10', dayOfWeek: '水', period: '3限' },
            { week: 12, date: '2025-12-17', dayOfWeek: '水', period: '3限' },
            { week: 13, date: '2025-12-24', dayOfWeek: '水', period: '3限' },
            { week: 15, date: '2026-01-07', dayOfWeek: '水', period: '3限' },
            { week: 16, date: '2026-01-14', dayOfWeek: '水', period: '3限' },
            // 1/19(月)の連続授業
            { week: 17, date: '2026-01-19', dayOfWeek: '月', period: '3限' },
            { week: 17, date: '2026-01-19', dayOfWeek: '月', period: '4限' },
            // 1/21(水)の最終授業
            { week: 17, date: '2026-01-21', dayOfWeek: '水', period: '3限' },
          ];
          
          schedules.forEach(lesson => {
            fixedSchedule.push({
              ...lesson,
              subject: 'デザインとプレゼンテーション'
            });
          });
        }
        
        // 田上先生のキャリア実践I - 10/22(水)3,4限
        if (teacher.name === '田上寛美') {
          fixedSchedule.push(
            { week: 4, date: '2025-10-22', dayOfWeek: '水', period: '3限', subject: 'キャリア実践I' },
            { week: 4, date: '2025-10-22', dayOfWeek: '水', period: '4限', subject: 'キャリア実践I' }
          );
        }
        
        // 孫寧平先生の固定スケジュール
        if (teacher.name === '孫寧平') {
          // データベース概論：10-11月の木曜3,4限（第1週〜第8週）
          for (let week = 1; week <= 8; week++) {
            const date = new Date('2025-09-29');
            date.setDate(date.getDate() + (week - 1) * 7 + 3); // 木曜日
            const dateStr = date.toISOString().split('T')[0];
            
            fixedSchedule.push(
              { week, date: dateStr, dayOfWeek: '木', period: '3限', subject: 'データベース概論' },
              { week, date: dateStr, dayOfWeek: '木', period: '4限', subject: 'データベース概論' }
            );
          }
          
          // データベース設計：11/27（第9週）も追加してから12-1月
          // 第9週（11/27）のデータベース設計
          const week9Date = new Date('2025-09-29');
          week9Date.setDate(week9Date.getDate() + 8 * 7 + 3); // 第9週の木曜日
          const week9DateStr = week9Date.toISOString().split('T')[0];
          fixedSchedule.push(
            { week: 9, date: week9DateStr, dayOfWeek: '木', period: '3限', subject: 'データベース設計' },
            { week: 9, date: week9DateStr, dayOfWeek: '木', period: '4限', subject: 'データベース設計' }
          );
          
          // データベース設計：12-1月の木曜3,4限（第10週〜第17週）
          for (let week = 10; week <= 17; week++) {
            const date = new Date('2025-09-29');
            date.setDate(date.getDate() + (week - 1) * 7 + 3); // 木曜日
            const dateStr = date.toISOString().split('T')[0];
            
            // 休日・成果発表会期間はスキップ
            if (dateStr === '2026-01-01') continue; // 元日
            
            fixedSchedule.push(
              { week, date: dateStr, dayOfWeek: '木', period: '3限', subject: 'データベース設計' },
              { week, date: dateStr, dayOfWeek: '木', period: '4限', subject: 'データベース設計' }
            );
          }
        }
        
        // 井手先生の次世代地域リーダー学は後で実装
      }

      // 孫寧平先生の特殊制約
      if (teacher.name === '孫寧平') {
        priority += 750; // 時期による科目切り替えの複雑な制約
      }

      // フィオーナ先生の特殊制約
      if (teacher.name === 'Fiona') {
        priority += 800; // 木曜3限の特殊開始時刻＋月曜補填
      }

      // Lee先生の固定枠
      if (teacher.name === 'Lee') {
        priority += 700; // 木曜4限、金曜3-4限固定
      }

      // 変更対応困難な教師
      if (teacher.constraints?.changeUnavailable || 
          teacher.constraints?.specialNotes?.includes('授業変更にほぼ絶対対応できない')) {
        priority += 600;
      }

      // NG条件の厳しさ
      const ngDays = teacher.constraints?.ng?.days?.length || 0;
      const ngPeriods = teacher.constraints?.ng?.periods?.length || 0;
      const ngDates = teacher.constraints?.ng?.dates?.length || 0;
      priority += (ngDays * 50) + (ngPeriods * 30) + (ngDates * 20);

      // 利用可能日が限定的
      const availableDays = teacher.constraints?.availableDays?.length || 5;
      if (availableDays <= 2) {
        priority += 200;
      } else if (availableDays <= 3) {
        priority += 100;
      }

      // 隔週授業
      if (teacher.constraints?.wish?.biweekly) {
        priority += 150;
      }

      priorityList.push({
        teacher,
        priority,
        fixedSchedule: fixedSchedule.length > 0 ? fixedSchedule : undefined
      });
    }

    // 優先度の高い順にソート
    return priorityList.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 固定スケジュールを持つ教師を抽出
   */
  static getFixedScheduleTeachers(teachers: Teacher[]): TeacherPriority[] {
    const sorted = this.sortTeachersByPriority(teachers);
    return sorted.filter(tp => tp.fixedSchedule && tp.fixedSchedule.length > 0);
  }

  /**
   * 指定した週・曜日・時限が固定スケジュールと競合するかチェック
   */
  static isSlotConflictWithFixed(
    week: number, 
    dayOfWeek: string, 
    period: string,
    fixedTeachers: TeacherPriority[]
  ): boolean {
    for (const tp of fixedTeachers) {
      if (!tp.fixedSchedule) continue;
      
      for (const schedule of tp.fixedSchedule) {
        if (schedule.week === week && 
            schedule.dayOfWeek === dayOfWeek) {
          // 時限指定がある場合はチェック
          if (schedule.period) {
            const periods = schedule.period.split(',').map(p => p.replace('限', '').trim());
            const checkPeriod = period.replace('限', '');
            if (periods.includes(checkPeriod)) {
              return true;
            }
          } else {
            // 時限指定がない場合は全時限ブロック
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 教師の制約情報を文字列で取得（デバッグ用）
   */
  static getTeacherConstraintSummary(teacher: Teacher): string {
    const constraints: string[] = [];
    
    if ((teacher as any).requireConfirmed) {
      constraints.push('【完全固定】');
    }
    
    if (teacher.constraints?.confirmed && teacher.constraints.confirmed.length > 0) {
      constraints.push(`確定: ${teacher.constraints.confirmed.length}件`);
    }
    
    if (teacher.constraints?.ng?.days) {
      constraints.push(`NG曜日: ${teacher.constraints.ng.days.join(',')}`);
    }
    
    if (teacher.constraints?.ng?.periods) {
      constraints.push(`NG時限: ${teacher.constraints.ng.periods.join(',')}`);
    }
    
    if (teacher.constraints?.wish?.biweekly) {
      constraints.push(`隔週: ${teacher.constraints.wish.biweekly}週`);
    }
    
    if (teacher.constraints?.changeUnavailable) {
      constraints.push('変更不可');
    }
    
    return constraints.length > 0 ? constraints.join(' / ') : '制約なし';
  }
}