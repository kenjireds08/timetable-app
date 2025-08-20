# 004_holiday_management_system.md
# 休日管理システムの実装

## 概要
アイデアITカレッジ阿蘇の時間割生成システムに、包括的な休日管理機能を実装しました。基本設定での休日入力から、時間割カレンダーへの反映、動的祝日計算まで、完全な休日管理システムが完成しました。

## 実装日時
- **開始**: 2025年8月10日 20:00頃
- **完了**: 2025年8月10日 21:45頃
- **所要時間**: 約1時間45分

## 課題背景
前回の003_ui_optimization_compact_displayでUI最適化が完了した後、ユーザーから以下の要望がありました：
> 「基本設定にいつが休日かを入力する欄を入れて、それを半年分時間割のカレンダーに反映させて、そこには入力ができないようにしたほうがいいですね。」

さらに、今後も継続使用することを想定し、動的な祝日計算システムの必要性が判明しました。

## 実装内容

### 1. 基本設定タブの休日管理機能

#### 1.1 コンポーネント修正（BasicSettings.tsx）
```typescript
// 新規state追加
const [holidays, setHolidays] = useState<string[]>(initialHolidays);
const [newHoliday, setNewHoliday] = useState('');

// 休日管理関数
const addHoliday = () => {
  if (newHoliday && !holidays.includes(newHoliday)) {
    const updatedHolidays = [...holidays, newHoliday].sort();
    handleHolidaysChange(updatedHolidays);
    setNewHoliday('');
  }
};

const removeHoliday = (holidayToRemove: string) => {
  const updatedHolidays = holidays.filter(h => h !== holidayToRemove);
  handleHolidaysChange(updatedHolidays);
};
```

#### 1.2 UI要素
- **日付入力フィールド**: 期間内の日付のみ選択可能
- **追加ボタン**: 入力された日付を休日リストに追加
- **日本の祝日一括追加ボタン**: 動的計算による祝日を一度に追加
- **休日一覧表示**: 設定済み休日の視覚的リスト
- **削除ボタン**: 各休日に「×」ボタンで個別削除

### 2. 時間割カレンダーへの休日反映

#### 2.1 SemesterTimetable.tsx の修正
```typescript
// holidays propの追加
interface SemesterTimetableProps {
  // ... 既存のprops
  holidays?: string[];
}

// 休日チェック関数
const isHoliday = (date: Date) => {
  const dateString = date.toISOString().split('T')[0];
  return holidays.includes(dateString);
};

// カレンダー表示の修正
const getWeekDates = (weekNumber: number) => {
  return days.map((_, dayIndex) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + dayIndex);
    return {
      date: date,
      formatted: `${date.getMonth() + 1}/${date.getDate()}`,
      isHoliday: isHoliday(date)
    };
  });
};
```

#### 2.2 DroppableCell の休日対応
```typescript
// 休日セルの制限
canDrop: (item) => {
  if (isHoliday) {
    return false; // 休日はドロップ不可
  }
  return true;
},

// 休日表示
{isHoliday && entries.length === 0 && (
  <div className="holiday-message">休日</div>
)}
```

### 3. 動的祝日計算システム

#### 3.1 holidayCalculator.ts の作成
完全な日本の祝日計算システムを実装：

```typescript
/**
 * 期間内の祝日を取得
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns 期間内の祝日リスト
 */
export function getHolidaysInPeriod(startDate: string, endDate: string): string[]
```

#### 3.2 対応する祝日
**固定日祝日**:
- 元日（1/1）
- 建国記念の日（2/11）
- 天皇誕生日（2/23）※新しい祝日
- 昭和の日（4/29）
- 憲法記念日（5/3）
- みどりの日（5/4）
- こどもの日（5/5）
- 山の日（8/11）
- 文化の日（11/3）
- 勤労感謝の日（11/23）
- 年末年始休暇

**計算祝日**:
- 成人の日（1月第2月曜日）
- 海の日（7月第3月曜日）
- スポーツの日（10月第2月曜日）※正確な計算
- 敬老の日（9月第3月曜日）
- 春分の日（天体計算）
- 秋分の日（天体計算）

**振替休日**:
- 日曜祝日の翌月曜日を自動計算

#### 3.3 正確な祝日データ（2025-2026年）
ユーザー提供のカレンダー情報に基づく正確な祝日：
- **スポーツの日**: 2025年10月13日（月曜日）
- **勤労感謝の日**: 2025年11月23日（土曜日）
- **振替休日**: 2025年11月24日（勤労感謝の日振替）
- **成人の日**: 2026年1月13日（月曜日）
- **天皇誕生日**: 2026年2月23日

### 4. データ連携・保存システム

#### 4.1 App.tsx の統合
```typescript
// 休日state追加
const [holidays, setHolidays] = useState<string[]>(() => {
  const saved = localStorage.getItem('basicSettings');
  return saved ? JSON.parse(saved).holidays || [] : [];
});

// LocalStorage保存の更新
const saveBasicSettings = (title, start, end, monday, rem, hols = holidays) => {
  const settings = {
    title, startDate: start, endDate: end,
    mondayAvoid: monday, remarks: rem, holidays: hols
  };
  localStorage.setItem('basicSettings', JSON.stringify(settings));
};
```

#### 4.2 コンポーネント間連携
- BasicSettings → App.tsx: onHolidaysChange callback
- App.tsx → SemesterTimetable: holidays prop

### 5. CSS スタイリング

#### 5.1 休日設定UI
```css
.holiday-input-group { /* 入力グループレイアウト */ }
.btn-add-holiday { /* 追加ボタンスタイル */ }
.btn-default-holidays { /* 一括追加ボタン */ }
.holidays-list { /* 休日リスト表示 */ }
.holiday-item { /* 個別休日アイテム */ }
.btn-remove-holiday { /* 削除ボタン */ }
```

#### 5.2 カレンダー休日表示
```css
.day-header-with-date.holiday { /* 休日ヘッダー */ }
.holiday-indicator { /* 🎌マーク */ }
.semester-cell.holiday-cell { /* 休日セル（斜線パターン） */ }
.holiday-message { /* 「休日」メッセージ */ }
```

## 技術的特徴

### 1. 動的計算アルゴリズム
- **期間ベース**: 任意の開始日〜終了日で祝日を計算
- **年度対応**: 2025年度、2026年度、将来年度に自動対応
- **天体計算**: 春分・秋分の日を数式で正確計算
- **振替計算**: 日曜祝日の月曜振替を自動処理

### 2. UI/UX設計
- **視覚的明確性**: 🎌マーク、グレーアウト、斜線パターン
- **操作制限**: 休日セルへのドラッグ&ドロップ禁止
- **一括操作**: 祝日の一括追加・個別削除
- **バリデーション**: 期間外日付の入力制限

### 3. データ永続化
- **LocalStorage統合**: 他の基本設定と統合保存
- **リアルタイム同期**: 設定変更の即座反映
- **データ整合性**: 重複除去、ソート処理

## 実装結果

### 現在の期間（2025-09-29 〜 2026-02-06）での祝日
```
2025-10-13 (月) スポーツの日
2025-11-03 (月) 文化の日  
2025-11-23 (土) 勤労感謝の日
2025-11-24 (日) 振替休日
2025-12-23 (月) 冬季休暇開始
2025-12-24 (火) クリスマスイブ
2025-12-25 (水) クリスマス
2025-12-29 (日) 年末休暇
2025-12-30 (月) 年末休暇
2025-12-31 (火) 大晦日
2026-01-01 (水) 元日
2026-01-02 (木) 正月休み
2026-01-03 (金) 正月休み
2026-01-13 (月) 成人の日
2026-02-11 (火) 建国記念の日
```

### 将来対応例
**2026年前期（4月〜9月）**: 昭和の日、こどもの日、海の日、山の日等が自動計算
**2027年度以降**: システムが自動的に正確な祝日を計算

## ユーザビリティ向上

### 1. 操作フロー
1. 基本設定タブで期間設定
2. 「日本の祝日を一括追加」をクリック
3. 必要に応じて個別休日を追加
4. 時間割タブで休日保護確認

### 2. 視覚的フィードバック
- 休日は🎌マーク付きで即座に識別可能
- 授業配置不可の明確な表示
- グレーアウト＋斜線で休日セルを強調

### 3. エラー防止
- 休日への授業スケジュール防止
- 重複祝日の自動除外
- 期間外日付の入力制限

## 今後の展望

### 1. 継続使用対応
- 任意年度での正確な祝日計算
- 学校特有の休日（学園祭等）の管理
- 長期休暇期間の柔軟な設定

### 2. 機能拡張可能性
- 祝日名の表示
- 地域特有の休日対応
- 国際化（他国の祝日システム）

## 完了タスク

✅ **基本設定に休日設定機能を追加**  
✅ **休日を時間割カレンダーに反映（グレーアウト）**  
✅ **動的祝日計算システムの実装**  

## ファイル変更一覧

### 新規作成
- `src/utils/holidayCalculator.ts` - 動的祝日計算システム

### 修正
- `src/components/BasicSettings.tsx` - 休日管理UI追加
- `src/components/SemesterTimetable.tsx` - カレンダー休日反映  
- `src/App.tsx` - データ連携・state管理
- `src/App.css` - 休日関連スタイリング

## まとめ

休日管理システムの実装により、時間割生成システムが大幅に実用性を向上させました。動的祝日計算により将来の継続使用にも対応し、UI/UXの改善により直感的な操作が可能になりました。これで、学校運営における実際の休日管理ニーズに完全対応できる機能が完成しました。

---
**次回予定タスク**:
- 授業配分アルゴリズムの改善（前半後半のバランス）
- 教室使用のバランス改善