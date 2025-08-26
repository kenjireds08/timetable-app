# フィオーナ先生の月曜補填ロジック設計書

**作成日**: 2025年8月26日  
**更新日**: 2025年8月26日

## 📋 概要

フィオーナ先生の木曜3限が13:15開始（15分遅れ）のため、半期で不足する授業時間を月曜日に補填するロジックの設計仕様。

## 🔢 不足時間の計算

### 基本情報
- **通常授業時間**: 1コマ90分
- **実際の3限授業時間**: 75分（13:15-14:30）
- **不足時間**: 15分/週
- **実施週数**: 16週（9月末〜1月末、休日・行事除く）
- **総不足時間**: 15分 × 16週 = **240分**

### 補填必要コマ数
- **240分 ÷ 90分 = 2.67コマ**
- **実施案**: 月曜3限×2回 + 月曜4限×1回 = 270分（30分余裕）

## 📅 月曜補填候補日の選定ロジック

### 1. 除外条件
```typescript
interface ExclusionCriteria {
  // 固定除外日
  fixedExclusions: [
    '2025-12-22',  // やまめ（全学年行事）
    '2026-01-26',  // 成果発表会準備
    '2026-01-27',  // 成果発表会当日
    '2026-01-28',  // 成果発表会振り返り
  ];
  
  // 期間除外
  periodExclusions: [
    { start: '2026-01-29', end: '2026-02-06' }  // 補講期間
  ];
  
  // 祝日（自動計算）
  nationalHolidays: Holiday[];
  
  // カスタム休日
  customHolidays: string[];
}
```

### 2. 候補日選定アルゴリズム
```typescript
function selectMondayMakeupDates(
  semesterStart: Date,
  semesterEnd: Date,
  exclusions: ExclusionCriteria
): MondayMakeupPlan {
  
  // Step 1: 全月曜日を取得
  const allMondays = getAllMondays(semesterStart, semesterEnd);
  
  // Step 2: 除外条件でフィルタ
  const availableMondays = allMondays.filter(date => {
    return !isExcluded(date, exclusions);
  });
  
  // Step 3: 優先順位付け
  const prioritizedMondays = prioritizeMondays(availableMondays, {
    preferEarly: false,      // 早い時期より分散を優先
    avoidConsecutive: true,  // 連続週は避ける
    balanceDistribution: true  // 月ごとに均等配分
  });
  
  // Step 4: 最適な3回を選定
  return {
    period3Sessions: prioritizedMondays.slice(0, 2),  // 3限×2
    period4Session: prioritizedMondays[2],            // 4限×1
    totalMinutes: 270,
    shortageMinutes: 240,
    surplus: 30
  };
}
```

## 🎨 UI設計

### 1. 補填日程提案ダイアログ
```typescript
interface MakeupProposalDialog {
  title: 'フィオーナ先生の月曜補填日程';
  
  // 不足時間表示
  shortageInfo: {
    weeklyShortage: 15;      // 分/週
    totalWeeks: 16;          // 週数
    totalShortage: 240;      // 総不足分
    requiredSessions: 2.67;  // 必要コマ数
  };
  
  // 提案日程
  proposedDates: {
    date: string;
    period: 3 | 4;
    status: 'available' | 'conflict' | 'holiday';
    conflictReason?: string;
  }[];
  
  // アクション
  actions: {
    accept: () => void;      // 提案を承認
    modify: () => void;      // 手動で調整
    regenerate: () => void;  // 再生成
  };
}
```

### 2. 時間割グリッドでの表示
```typescript
interface MakeupIndicator {
  icon: '🔄';
  tooltip: 'フィオーナ補填授業（月曜{period}限）';
  color: 'purple';  // 特殊授業として紫色
  badge: '補填';
}
```

### 3. 教師管理画面での表示
```tsx
// AdvancedTeacherManagerV2での表示
<div className="bg-purple-50 border border-purple-200 rounded p-2">
  <h4 className="font-semibold text-purple-700">補填計画</h4>
  <ul className="text-sm">
    <li>不足時間: 240分（15分×16週）</li>
    <li>補填予定: 月曜3限×2 + 月曜4限×1</li>
    <li>
      候補日: 
      {makeupDates.map(date => (
        <span key={date} className="ml-2 px-2 py-1 bg-white rounded">
          {format(date, 'MM/dd')}
        </span>
      ))}
    </li>
  </ul>
</div>
```

## 🔧 実装詳細

### 1. データ構造
```typescript
// teachers.json内の特殊設定
{
  "id": "t_fiona",
  "special": {
    "startOffsetMinutes": 15,
    "makeupMinutes": 240,
    "makeupNote": "月曜3コマで補填",
    "makeupPlan": {
      "requiredSessions": [
        { "day": "monday", "period": 3, "count": 2 },
        { "day": "monday", "period": 4, "count": 1 }
      ]
    }
  }
}
```

### 2. 自動スケジューリングとの統合
```typescript
// autoScheduleGenerator.tsへの追加
class ScheduleGenerator {
  
  // Phase 4: 特殊補填処理（新規追加）
  private applySpecialMakeups(): void {
    const teachersWithMakeup = this.teachers.filter(t => t.special?.makeupMinutes);
    
    for (const teacher of teachersWithMakeup) {
      const makeupPlan = this.calculateMakeupPlan(teacher);
      this.assignMakeupSessions(makeupPlan);
    }
  }
  
  private calculateMakeupPlan(teacher: DetailedTeacher): MakeupPlan {
    // 1. 不足時間から必要コマ数を計算
    const requiredMinutes = teacher.special.makeupMinutes;
    const sessionMinutes = 90;
    const requiredSessions = Math.ceil(requiredMinutes / sessionMinutes);
    
    // 2. 利用可能な月曜日を特定
    const availableMondays = this.findAvailableMondays(teacher);
    
    // 3. 最適な配分を決定
    return this.optimizeMakeupDistribution(
      availableMondays,
      requiredSessions,
      teacher.special.makeupPlan
    );
  }
}
```

## 📊 実装優先順位

### Phase 1: 基礎実装（必須）
1. ✅ teachers.jsonにspecial.makeupMinutes追加
2. ⬜ 不足時間の自動計算ロジック
3. ⬜ 利用可能月曜日の検出機能

### Phase 2: UI実装（推奨）
1. ⬜ 補填日程提案ダイアログ
2. ⬜ 時間割グリッドでの補填表示
3. ⬜ 教師管理画面での補填計画表示

### Phase 3: 高度な機能（オプション）
1. ⬜ 手動での補填日調整機能
2. ⬜ 補填実績の追跡
3. ⬜ 補填レポートのExport

## 🚦 受け入れ基準

### 必須要件
- [ ] 15分×16週=240分の不足を正確に計算
- [ ] 月曜3限×2 + 月曜4限×1の配置を提案
- [ ] 行事・祝日・補講期間を自動除外
- [ ] 時間割グリッドに補填授業を表示

### 推奨要件
- [ ] 補填日を均等に分散配置
- [ ] 連続週を避ける
- [ ] 手動調整可能なUI

### オプション要件
- [ ] 補填実績の記録
- [ ] 不足時間の進捗表示
- [ ] Export時の補填情報含有

## 📝 備考

### 考慮事項
1. **柔軟性**: 学校側の要望で補填方法が変更される可能性
2. **透明性**: 補填理由と計算根拠を明示
3. **調整可能性**: 自動提案後も手動調整できること

### 関連ファイル
- `/src/utils/autoScheduleGenerator.ts`: スケジューリングエンジン
- `/src/types/teacher.ts`: 教師型定義
- `/public/config/teachers.json`: 教師データ
- `/src/components/AdvancedTeacherManagerV2.tsx`: 教師管理UI

### 次のステップ
1. 学校側に補填方法の確認（8/28水曜）
2. 確認後、Phase 1の実装開始
3. UI実装とテスト
4. 本番データでの検証

---

**設計者**: Claude Code  
**レビュー予定**: ちーけんさん、ChatGPT