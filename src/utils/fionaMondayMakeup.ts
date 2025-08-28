/**
 * フィオーナ先生の月曜補填計算ユーティリティ
 */

interface FionaMakeupPlan {
  requiredMinutes: number;      // 不足分（分）
  makeupSessions: MakeupSession[]; // 補填授業リスト
  totalMakeupMinutes: number;   // 補填合計（分）
  isComplete: boolean;          // 補填完了フラグ
}

interface MakeupSession {
  date: string;      // 日付
  period: string;    // 時限
  minutes: number;   // 授業時間（分）
  week: number;      // 週番号
}

export class FionaMondayMakeupCalculator {
  private static readonly SHORTAGE_PER_WEEK = 15;  // 週あたり不足分（分）
  private static readonly REGULAR_CLASS_MINUTES = 90; // 通常授業時間（分）
  private static readonly FIONA_3RD_PERIOD_MINUTES = 75; // フィオーナ先生3限実質時間（分）
  private static readonly MONDAY_3RD_PERIOD_MINUTES = 75; // 月曜3限も13:15スタートで75分
  
  /**
   * フィオーナ先生の月曜補填計画を作成
   * @param totalWeeks 総授業週数
   * @param startDate 開始日
   * @param holidays 休日リスト
   * @param excludeDates 除外日リスト（行事等）
   */
  static generateMakeupPlan(
    totalWeeks: number,
    startDate: string,
    holidays: string[] = [],
    excludeDates: string[] = []
  ): FionaMakeupPlan {
    // 不足分計算
    const requiredMinutes = this.SHORTAGE_PER_WEEK * totalWeeks;
    
    // 月曜日候補を探す
    const mondayCandidates = this.findMondayCandidates(
      startDate,
      totalWeeks,
      holidays,
      excludeDates
    );
    
    // 補填セッションを割り当て
    const makeupSessions: MakeupSession[] = [];
    let totalMakeupMinutes = 0;
    
    // まず3限を2回割り当て（各75分）
    let assigned3rdPeriod = 0;
    for (const monday of mondayCandidates) {
      if (assigned3rdPeriod >= 2) break;
      
      makeupSessions.push({
        date: monday.date,
        period: '3限',
        minutes: this.MONDAY_3RD_PERIOD_MINUTES, // 月曜3限も75分
        week: monday.week
      });
      totalMakeupMinutes += this.MONDAY_3RD_PERIOD_MINUTES;
      assigned3rdPeriod++;
    }
    
    // 次に4限を1回割り当て（90分）
    let assigned4thPeriod = 0;
    for (const monday of mondayCandidates) {
      if (assigned4thPeriod >= 1) break;
      
      // 既に3限が割り当てられている日はスキップ
      const already3rd = makeupSessions.some(s => s.date === monday.date && s.period === '3限');
      if (already3rd) continue;
      
      makeupSessions.push({
        date: monday.date,
        period: '4限',
        minutes: this.REGULAR_CLASS_MINUTES, // 4限は通常通り90分
        week: monday.week
      });
      totalMakeupMinutes += this.REGULAR_CLASS_MINUTES;
      assigned4thPeriod++;
    }
    
    // 不足がある場合は追加割り当て（通常は240分でぴったりのはず）
    while (totalMakeupMinutes < requiredMinutes && mondayCandidates.length > makeupSessions.length) {
      for (const monday of mondayCandidates) {
        // 既に使用済みの日はスキップ
        const alreadyUsed = makeupSessions.some(s => s.date === monday.date);
        if (alreadyUsed) continue;
        
        // 3限を優先（75分）
        makeupSessions.push({
          date: monday.date,
          period: '3限',
          minutes: this.MONDAY_3RD_PERIOD_MINUTES,
          week: monday.week
        });
        totalMakeupMinutes += this.MONDAY_3RD_PERIOD_MINUTES;
        
        if (totalMakeupMinutes >= requiredMinutes) break;
      }
    }
    
    return {
      requiredMinutes,
      makeupSessions: makeupSessions.sort((a, b) => a.week - b.week),
      totalMakeupMinutes,
      isComplete: totalMakeupMinutes >= requiredMinutes
    };
  }
  
  /**
   * 月曜日候補を探す
   */
  private static findMondayCandidates(
    startDate: string,
    totalWeeks: number,
    holidays: string[],
    excludeDates: string[]
  ): { date: string; week: number }[] {
    const candidates: { date: string; week: number }[] = [];
    const start = new Date(startDate);
    
    // 月曜日まで調整
    const dayOfWeek = start.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    start.setDate(start.getDate() + daysToMonday);
    
    for (let week = 1; week <= totalWeeks; week++) {
      const mondayDate = new Date(start);
      mondayDate.setDate(start.getDate() + (week - 1) * 7);
      const dateStr = mondayDate.toISOString().split('T')[0];
      
      // 休日や除外日はスキップ
      if (holidays.includes(dateStr) || excludeDates.includes(dateStr)) {
        continue;
      }
      
      // 特定の除外期間はスキップ（12/22やまめ、1/26-28成果発表会、1/29-2/6補講期間）
      const month = mondayDate.getMonth() + 1;
      const day = mondayDate.getDate();
      
      // 12/22（やまめ）
      if (month === 12 && day === 22) continue;
      
      // 1/26-28（成果発表会）
      if (month === 1 && day >= 26 && day <= 28) continue;
      
      // 1/29-2/6（補講期間）
      if (month === 1 && day >= 29) continue;
      if (month === 2 && day <= 6) continue;
      
      candidates.push({ date: dateStr, week });
    }
    
    return candidates;
  }
  
  /**
   * 補填計画を文字列で表示
   */
  static formatMakeupPlan(plan: FionaMakeupPlan): string {
    const lines: string[] = [];
    
    lines.push('【フィオーナ先生 月曜補填計画】');
    lines.push('');
    lines.push('＜背景＞');
    lines.push('木曜3限: 13:15開始のため、15分×16週 = 240分不足');
    lines.push('');
    lines.push(`不足時間: ${plan.requiredMinutes}分`);
    lines.push(`補填合計: ${plan.totalMakeupMinutes}分`);
    lines.push(`状態: ${plan.isComplete ? '✅ 補填完了' : '⚠️ 補填不足'}`);
    lines.push('');
    lines.push('補填授業:');
    
    for (const session of plan.makeupSessions) {
      const timeNote = session.period === '3限' ? '（13:15開始）' : '';
      lines.push(`  第${session.week}週 ${session.date}（月）${session.period}${timeNote}: ${session.minutes}分`);
    }
    
    if (plan.totalMakeupMinutes === 240) {
      lines.push('');
      lines.push('✅ 完璧な補填計画: 3限×2回(150分) + 4限×1回(90分) = 240分');
    }
    
    if (!plan.isComplete) {
      const shortage = plan.requiredMinutes - plan.totalMakeupMinutes;
      lines.push('');
      lines.push(`⚠️ 不足分: ${shortage}分`);
      lines.push('追加の月曜日確保が必要です。');
    }
    
    return lines.join('\n');
  }
}