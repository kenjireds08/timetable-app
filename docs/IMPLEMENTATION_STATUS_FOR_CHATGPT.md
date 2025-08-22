# 現状実装レポート（ChatGPTレビュー用）

## ■ リポジトリ構成

```
timetable-app/
├── src/
│   ├── components/         # UIコンポーネント
│   │   ├── BasicSettings.tsx           # 基本設定（期間・休日）
│   │   ├── TeacherManager.tsx          # 教師管理
│   │   ├── SubjectManager.tsx          # 科目管理  
│   │   ├── ClassroomManager.tsx        # 教室管理
│   │   ├── SemesterTimetable.tsx       # 半年分時間割（メイン表示）
│   │   ├── TimetableGrid.tsx           # 週次時間割グリッド
│   │   ├── DraggableEntry.tsx          # ドラッグ可能な授業エントリ
│   │   ├── ExportButtons.tsx           # 単週Export
│   │   └── SemesterExportButtons.tsx   # 半年分Export
│   ├── utils/              # ビジネスロジック
│   │   ├── autoScheduleGenerator.ts    # 3段階スケジューリングエンジン
│   │   ├── holidayCalculator.ts        # 祝日自動計算
│   │   └── timetableGenerator.ts       # 時間割生成補助
│   ├── types/              # 型定義
│   │   └── index.ts                    # 全型定義集約
│   └── App.tsx             # メインコンポーネント
├── docs/                   # ドキュメント
│   ├── development-log-XXX.md          # 開発履歴
│   └── SCHEDULING_LOGIC.md             # スケジューリング仕様
└── .serena/                # Serena MCP設定
```

### 主要ファイルと役割

| ファイル | 役割 |
|---------|------|
| `autoScheduleGenerator.ts` | 3段階スケジューリングのコア（2198行） |
| `SemesterTimetable.tsx` | 19週分の時間割表示・ドラッグ&ドロップ処理 |
| `SemesterExportButtons.tsx` | Excel/PDF出力 |
| `types/index.ts` | 全型定義（Teacher, Subject, Classroom等） |

## ■ 制約エンジン

### 制約検証の実装箇所

#### 1. 教師制約（`autoScheduleGenerator.ts`）
```typescript
// Line 679-729: checkTeacherConstraints()
- 曜日制約（availableDays）
- 時限制約（availablePeriods）
- 複数教師の同時確保（コンビ授業）

// Line 1789-1820: checkTeacherConstraintsFlexible()
- 柔軟な制約チェック（リトライ時）
```

#### 2. 特殊制約（`autoScheduleGenerator.ts`）
```typescript
// Line 731-859: checkSpecialConstraints()
- 矢板先生：月曜3限連続2コマ
- フィオーナ先生：木曜3限（実際は13:15開始）、4限
- 木下先生：月・金のみ

// Line 1588-1607: isFionaBlockedSlot()
- フィオーナ先生の月曜4限ブロック（3限使用時）
```

#### 3. 休日/行事ブロック
```typescript
// Line 1554-1563: isHoliday()
- holidays配列で管理（日付文字列の配列）
- 現在はBasicSettings.tsxから渡される

// ⚠️ 未実装
- blockedWeeks（成果発表会、補講期間）の概念なし
- 現在は単一日付のみ対応
```

### フィオーナ先生の特殊処理（現状）

```typescript
// Line 1568-1586: shouldBlockMondayFourthPeriod()
- 月曜4限ブロックロジック実装済み

// ⚠️ 未実装
- 15分遅れの累積計算なし
- 月曜3コマ補填の自動配置なし
- 手動で月曜に配置する想定
```

## ■ データソース

### 現在の前提
- **手動入力**：TeacherManager、SubjectManager、ClassroomManagerで手動登録
- **サマリ vs ITS202503**：区別なし（全て手動入力）
- **選択科目**：手動で追加する想定

## ■ UI/ドラッグ&ドロップ

### バリデーション実装（`SemesterTimetable.tsx`）

```typescript
// Line 180-186: canDrop()
- 休日チェック（ドロップ禁止）

// Line 285-419: onDrop()内のバリデーション
- 教師の曜日制約
- 教師の時限制約
- 教室容量
- 他授業との重複
- コンビ授業の同時配置
```

### 進捗表示
```typescript
// App.tsx: Line 1300付近
- 配置済み/総授業数をタブごとに表示
- 科目名正規化は未実装（I/II と Ⅰ/Ⅱ混在）
```

## ■ 時間・週の設定

### コマ時間定義（`types/index.ts`）
```typescript
// Line 110-115
export const TIME_PERIODS = {
  '1限': { start: '09:00', end: '10:30' },
  '2限': { start: '10:40', end: '12:10' },
  '3限': { start: '13:00', end: '14:30' },  // ✅ 正しい
  '4限': { start: '14:40', end: '16:10' },  // ✅ 正しい
};
```

### 学期期間
- BasicSettings.tsxで開始日・終了日を設定
- 週数は自動計算（現在19週）

## ■ 出力形式

### Excel出力（`SemesterExportButtons.tsx`）
- xlsx使用
- 週ごとのシート作成
- 時間表記は正しい（13:00-14:30、14:40-16:10）

### PDF出力
- jspdf + jspdf-autotable使用
- A4横向き、週ごとにページ分割

## ■ 既知課題・TODO

### 🔴 要実装
1. **フィオーナ先生の月曜補填**
   - 15分×16週＝240分の不足分計算
   - 月曜3限×2、4限×1の自動配置
   - 12/22除外処理

2. **ブロック週の概念**
   - 1/26-28：成果発表会
   - 1/29-2/6：補講期間
   - 現在は単一日付の休日のみ

3. **科目名正規化**
   - I/II ⇔ Ⅰ/Ⅱ の統一
   - 末尾タグ [共通][合同][コンビ] の処理

### 🟡 改善余地
1. **エラーメッセージ**
   - ドロップ失敗理由の明確な表示（現在console.logのみ）

2. **設定の外部化**
   - 休日、ブロック週、特殊制約をJSONで管理

3. **可観測性**
   - なぜ配置できないかの理由表示

## ■ テスト手順（現状は手動）

1. 開発サーバー起動：`npm run dev`
2. 基本設定タブで期間・休日設定
3. 教師・科目・教室を登録
4. 「時間割を自動生成」実行
5. 半年分時間割タブで確認
6. ドラッグ&ドロップで調整
7. Excel/PDF出力で確認

## ■ ブランチ戦略（推奨）

```bash
# フィオーナ補填実装用
git checkout -b feature/fiona-makeup-slots

# ブロック週実装用
git checkout -b feature/blocked-weeks

# 実装後
git push origin feature/XXX
# PRでレビュー → mainにマージ
```

## ■ ChatGPTへの回答

**質問：現状どちらをソースにしているか**
→ 全て手動入力。サマリ/ITS202503の区別なし

**質問：フィオーナ先生の実装方針**
→ 月曜4限ブロックは実装済み。240分補填は未実装（手動配置想定）

**質問：休日/行事ブロック**
→ 単一日付の休日のみ実装。週単位ブロックは未実装

**質問：科目名正規化**
→ 未実装。表記ゆれそのまま

**質問：エラー表示**
→ console.logのみ。UIフィードバック弱い

---

**結論：コア機能は完成しているが、フィオーナ補填とブロック週対応が必要**