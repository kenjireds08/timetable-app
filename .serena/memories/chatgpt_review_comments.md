# ChatGPTレビューコメント（2025年8月21日）

## 優先度高 - クライアント回答後すぐ必要

### 1. フィオーナ先生の補填計算（240分→月曜3コマ）

#### A. 木曜実施可能週の算出
```typescript
// 入力
startDate: string
endDate: string  
holidays: string[]  // 単日
blockedWeeks: WeekBlock[]  // 週単位ブロック

// 処理
1. 学期内の全木曜日を列挙
2. holidays除外
3. blockedWeeks除外（成果発表会1/26-28、補講1/29-2/6）
4. 週単位でカウント

// 出力
availableThursdayCount: number
availableThursdayDates: string[]
```

#### B. 240分→3コマ変換
- 不足分 = 15分 × 木曜3限実施回数
- 補填: 月曜3限×2（150分）+ 4限×1（90分）= 240分

#### C. 月曜候補日選定
**フィルタ条件**:
1. 曜日=月
2. holidaysに含まれない
3. blockedWeeksに該当しない
4. 当該グループの3限・4限が空き
5. 12/22（やまめ）除外

**優先度スコアリング**:
- 12/22: 完全除外
- 前半優先（週番号小 +2）
- 当日コマ数少（+1）
- 連続配置可能（+2）

### 2. ブロック週の実装

#### A. 型定義案
```typescript
export interface WeekBlock {
  id: string;           // "event-showcase-2025"
  label: string;        // "成果発表会"
  startDate: string;    // "2026-01-26"
  endDate: string;      // "2026-01-28"
  affects: ('all'|'students'|'teachers')[];
  reason?: string;
}
```

#### B. holidays vs blockedWeeks
- holidays: 単日休校・行事（12/22等）
- blockedWeeks: 連続期間の全面ブロック
- 検証順序: blockedWeeks → holidays → 個別制約

#### C. UI表示
- 週ヘッダに「⚠️成果発表会」バッジ
- 全セルグレーアウト+ツールチップ
- canDrop=false

## 優先度中 - 改善提案

### 3. 設定の外部化

#### JSONスキーマ案（/public/config/school-config.json）
```json
{
  "semester": {
    "startDate": "2025-09-29",
    "endDate": "2026-02-06"
  },
  "holidays": ["2025-12-22"],
  "blockedWeeks": [
    {
      "id": "event-showcase-2025",
      "label": "成果発表会",
      "startDate": "2026-01-26",
      "endDate": "2026-01-28",
      "affects": ["all"]
    },
    {
      "id": "makeup-period-2025",
      "label": "補講期間",
      "startDate": "2026-01-29",
      "endDate": "2026-02-06",
      "affects": ["all"]
    }
  ],
  "specialConstraints": {
    "fiona": {
      "makeupPolicy": "mon-3x2-plus-mon-4x1",
      "blockMon4WhenMon3": true
    },
    "kinoshita": {
      "days": ["月","金"],
      "preferConsecutive": true
    }
  }
}
```

### 4. エラーUI改善
- トースト: DnD失敗は右上5秒
- セル内バッジ: 🚫行事、⚠️教師重複
- 詳細ダイアログ: 失敗理由Top5表示

## 優先度低 - 拡張

### 5. 科目名正規化
```typescript
export function normalizeSubjectName(name: string): string {
  // Ⅰ↔I, Ⅱ↔II, Ⅲ↔III
  // 末尾タグ[共通][合同][コンビ]は保持
}
```

## 実装TODO（Claude Code担当）

### 追加・修正ファイル
1. `types/index.ts`: WeekBlock型追加
2. `utils/holidayCalculator.ts`: isBlocked()追加
3. `utils/autoScheduleGenerator.ts`:
   - suggestFionaMakeupSlots()（純関数）
   - applyMakeupSlots()（副作用）
4. `components/SemesterTimetable.tsx`: ブロック表示
5. `public/config/school-config.json`: 外部設定

### 実装方針
- 関数の純化: 候補抽出と確定反映を分離
- 最小ユニットテスト: 日付判定、不足分計算
- ログレベル化: debug/info/warn

### ブランチ戦略
- feature/fiona-makeup-slots
- feature/blocked-weeks
- feature/subject-normalization
- feature/error-ui-improvement