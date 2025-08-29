/**
 * 日本の祝日を動的に計算するユーティリティ
 */

interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'fixed' | 'calculated' | 'substitute';
}

/**
 * 指定された年の春分の日を計算
 */
function calculateSpringEquinox(year: number): number {
  // 春分の日の計算式（2000年代以降）
  if (year >= 2000 && year <= 2099) {
    const day = Math.floor(20.8431 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    return day;
  } else if (year >= 2100 && year <= 2150) {
    const day = Math.floor(21.8510 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    return day;
  }
  return 20; // デフォルト値
}

/**
 * 指定された年の秋分の日を計算
 */
function calculateAutumnEquinox(year: number): number {
  // 秋分の日の計算式（2000年代以降）
  if (year >= 2000 && year <= 2099) {
    const day = Math.floor(23.2488 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    return day;
  } else if (year >= 2100 && year <= 2150) {
    const day = Math.floor(24.2488 + 0.242194 * (year - 1851) - Math.floor((year - 1851) / 4));
    return day;
  }
  return 23; // デフォルト値
}

/**
 * 指定された年月の第n週の指定曜日の日付を取得
 * @param year 年
 * @param month 月 (1-12)
 * @param week 第n週 (1-5)
 * @param dayOfWeek 曜日 (0:日曜 1:月曜 ... 6:土曜)
 */
function getNthWeekday(year: number, month: number, week: number, dayOfWeek: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // 第1週の目標曜日の日付を計算
  let targetDate = 1 + (dayOfWeek - firstDayOfWeek + 7) % 7;
  
  // 第n週の日付を計算
  targetDate += (week - 1) * 7;
  
  return targetDate;
}

/**
 * 日付が日曜日かどうかをチェック
 */
function isSunday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0;
}

/**
 * 振替休日を計算
 */
function calculateSubstituteHolidays(holidays: Holiday[]): Holiday[] {
  const substitutes: Holiday[] = [];
  
  holidays.forEach(holiday => {
    const [year, month, day] = holiday.date.split('-').map(Number);
    
    if (isSunday(year, month, day)) {
      // 日曜日の祝日の場合、翌月曜日を振替休日とする
      const nextDay = new Date(year, month - 1, day + 1);
      const substituteDate = nextDay.toISOString().split('T')[0];
      
      substitutes.push({
        date: substituteDate,
        name: `振替休日（${holiday.name}）`,
        type: 'substitute'
      });
    }
  });
  
  return substitutes;
}

/**
 * 指定された年の祝日を計算
 */
function calculateYearHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // 固定日の祝日
  const fixedHolidays = [
    { month: 1, day: 1, name: '元日' },
    { month: 2, day: 11, name: '建国記念の日' },
    { month: 2, day: 23, name: '天皇誕生日' },
    { month: 4, day: 29, name: '昭和の日' },
    { month: 5, day: 3, name: '憲法記念日' },
    { month: 5, day: 4, name: 'みどりの日' },
    { month: 5, day: 5, name: 'こどもの日' },
    { month: 8, day: 11, name: '山の日' },
    { month: 11, day: 3, name: '文化の日' },
    { month: 11, day: 23, name: '勤労感謝の日' },
    { month: 12, day: 23, name: '冬季休暇開始' }, // 学校特有
    { month: 12, day: 24, name: 'クリスマスイブ' },
    { month: 12, day: 25, name: 'クリスマス' },
    { month: 12, day: 29, name: '年末休暇' },
    { month: 12, day: 30, name: '年末休暇' },
    { month: 12, day: 31, name: '大晦日' },
    { month: 1, day: 2, name: '正月休み' },
    { month: 1, day: 3, name: '正月休み' }
  ];
  
  fixedHolidays.forEach(holiday => {
    // 年末年始の処理：12月は当年、1-3月は翌年
    if (holiday.month === 12) {
      // 12月は当年
      const dateStr = `${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`;
      holidays.push({
        date: dateStr,
        name: holiday.name,
        type: 'fixed'
      });
    } else if (holiday.month <= 3) {
      // 1-3月は翌年
      const dateStr = `${year + 1}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`;
      holidays.push({
        date: dateStr,
        name: holiday.name,
        type: 'fixed'
      });
    } else {
      // 4-11月は当年
      const dateStr = `${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`;
      holidays.push({
        date: dateStr,
        name: holiday.name,
        type: 'fixed'
      });
    }
  });
  
  // 計算が必要な祝日
  
  // 成人の日（1月第2月曜日）- 当年も翌年も計算
  const currentComingOfAgeDay = getNthWeekday(year, 1, 2, 1);
  holidays.push({
    date: `${year}-01-${currentComingOfAgeDay.toString().padStart(2, '0')}`,
    name: '成人の日',
    type: 'calculated'
  });
  
  const nextComingOfAgeDay = getNthWeekday(year + 1, 1, 2, 1); // 翌年1月
  holidays.push({
    date: `${year + 1}-01-${nextComingOfAgeDay.toString().padStart(2, '0')}`,
    name: '成人の日',
    type: 'calculated'
  });
  
  // 海の日（7月第3月曜日）
  const marineDay = getNthWeekday(year, 7, 3, 1);
  holidays.push({
    date: `${year}-07-${marineDay.toString().padStart(2, '0')}`,
    name: '海の日',
    type: 'calculated'
  });
  
  // スポーツの日（10月第2月曜日）
  const sportsDay = getNthWeekday(year, 10, 2, 1);
  holidays.push({
    date: `${year}-10-${sportsDay.toString().padStart(2, '0')}`,
    name: 'スポーツの日',
    type: 'calculated'
  });
  
  // 敬老の日（9月第3月曜日）
  const respectForTheAgedDay = getNthWeekday(year, 9, 3, 1);
  holidays.push({
    date: `${year}-09-${respectForTheAgedDay.toString().padStart(2, '0')}`,
    name: '敬老の日',
    type: 'calculated'
  });
  
  // 春分の日 - 当年と翌年
  const currentSpringEquinox = calculateSpringEquinox(year);
  holidays.push({
    date: `${year}-03-${currentSpringEquinox.toString().padStart(2, '0')}`,
    name: '春分の日',
    type: 'calculated'
  });
  
  const nextSpringEquinox = calculateSpringEquinox(year + 1); // 翌年3月
  holidays.push({
    date: `${year + 1}-03-${nextSpringEquinox.toString().padStart(2, '0')}`,
    name: '春分の日',
    type: 'calculated'
  });
  
  // 秋分の日
  const autumnEquinox = calculateAutumnEquinox(year);
  holidays.push({
    date: `${year}-09-${autumnEquinox.toString().padStart(2, '0')}`,
    name: '秋分の日',
    type: 'calculated'
  });
  
  // 振替休日を計算
  const substituteHolidays = calculateSubstituteHolidays(holidays);
  
  return [...holidays, ...substituteHolidays];
}

/**
 * 期間内の祝日を取得する共通処理
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns 期間内のユニークな祝日リスト
 */
function getHolidaysInPeriodBase(startDate: string, endDate: string): Holiday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 関係する年を特定
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  const allHolidays: Holiday[] = [];
  
  // 各年の祝日を計算
  for (let year = startYear; year <= endYear; year++) {
    allHolidays.push(...calculateYearHolidays(year));
  }
  
  // 期間内の祝日のみフィルタリング
  const holidaysInPeriod = allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= start && holidayDate <= end;
  });
  
  // 重複除去（日付ベース）
  const uniqueHolidays = holidaysInPeriod.reduce((acc: Holiday[], current) => {
    if (!acc.some(h => h.date === current.date)) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  return uniqueHolidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 期間内の祝日を取得
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns 期間内の祝日リスト（日付のみ）
 */
export function getHolidaysInPeriod(startDate: string, endDate: string): string[] {
  const holidays = getHolidaysInPeriodBase(startDate, endDate);
  return holidays.map(h => h.date);
}

/**
 * 祝日の詳細情報を取得
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns 期間内の祝日詳細リスト
 */
export function getHolidayDetailsInPeriod(startDate: string, endDate: string): Holiday[] {
  return getHolidaysInPeriodBase(startDate, endDate);
}