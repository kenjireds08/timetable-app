# 📚 AI時間割自動生成システム - プロジェクト概要（ChatGPT連携用）

## 🎯 プロジェクト概要
**クライアント**: アイデアITカレッジ阿蘇  
**目的**: 専門学校向けAI時間割自動生成システムの開発  
**現在フェーズ**: プロトタイプ完成・制約条件の詳細確認中  

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────┐
│           フロントエンド (React)              │
├─────────────────────────────────────────────┤
│  ・タブ管理システム                           │
│  ・ドラッグ&ドロップUI (react-dnd)           │
│  ・リアルタイム制約検証                       │
│  ・Excel/PDF出力機能                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┤
│        3段階スケジューリングエンジン          │
├─────────────────────────────────────────────┤
│  Phase 1: 全学年合同科目配置                  │
│  Phase 2: 共通科目同期配置                    │
│  Phase 3: 専門科目個別配置                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┤
│           制約管理システム                     │
├─────────────────────────────────────────────┤
│  ・教師制約（曜日・時限・連続授業）           │
│  ・教室制約（容量・設備）                     │
│  ・科目制約（コンビ授業・順序）               │
│  ・休日管理（祝日自動計算）                   │
└─────────────────────────────────────────────┘
```

## 📂 ファイル構造
```
timetable-app/
├── src/
│   ├── components/
│   │   ├── BasicSettings.tsx      # 基本設定（期間・休日）
│   │   ├── TeacherManager.tsx     # 教師管理
│   │   ├── SubjectManager.tsx     # 科目管理
│   │   ├── ClassroomManager.tsx   # 教室管理
│   │   ├── SemesterTimetable.tsx  # 半年分時間割表示
│   │   └── ExportButtons.tsx      # Excel/PDF出力
│   ├── utils/
│   │   ├── autoScheduleGenerator.ts  # 3段階スケジューリングエンジン
│   │   ├── holidayCalculator.ts      # 祝日計算
│   │   └── timetableGenerator.ts     # 制約検証
│   └── App.tsx                       # メインアプリケーション
├── docs/                             # 開発ドキュメント
└── public/
    └── semester_schedule.json        # 時間割データ
```

## 🚀 実装済み機能

### 1. 基本機能
- ✅ **4グループ管理**: IT1年、IT2年、TD1年、TD2年
- ✅ **時間割グリッド**: 週5日 × 4時限
- ✅ **ドラッグ&ドロップ**: 授業の手動調整
- ✅ **半年分表示**: 19週間の時間割一覧

### 2. 3段階スケジューリングシステム
```typescript
// Phase 1: 全学年合同科目（4グループ同時）
// 例: クリエイティブコミュニケーションラボ → 全員が「たかねこ」教室

// Phase 2: 共通科目（同学年同時）
// 例: ビジネス実務I → IT1年+TD1年が同じ教室
// コンビ授業: Essential English ⇔ ビジネス日本語（選択制）

// Phase 3: 専門科目（グループ個別）
// 例: プログラミング基礎 → IT1年のみ
```

### 3. 高度な制約管理
```typescript
// 教師制約の例
{
  "フィオーナ先生": {
    "requiredPeriods": ["3限"],  // 3限目のみ
    "unavailablePeriods": ["4限"] // 4限目は準備時間
  },
  "森田先生": {
    "availableDays": ["水", "金"],
    "maxPerWeek": 3
  },
  "矢板先生": {
    "sequentialSubjects": ["情報技術基礎A", "B", "C", "D"] // 連続実施
  }
}
```

### 4. 視覚的表現
- 🤝 **コンビ授業**: 黄色系（選択制授業）
- 🎓 **合同授業**: 紫色系（全グループ）
- 📚 **共通科目**: 青色系（同学年）
- ⚙️ **専門科目**: 緑色系（個別）

### 5. 休日管理
- 日本の祝日自動計算（2025-2026年対応）
- 振替休日対応
- カスタム休日設定

## 📊 データモデル

### Teacher（教師）
```typescript
interface Teacher {
  id: string;
  name: string;
  subjects: string[];  // 担当科目
  constraints: {
    availableDays?: string[];
    unavailableDays?: string[];
    requiredPeriods?: string[];
    maxPerDay?: number;
    maxPerWeek?: number;
  };
}
```

### Subject（科目）
```typescript
interface Subject {
  id: string;
  name: string;
  teacherId: string;
  requiredHours: number;  // 必要授業時間
  targetGroups: string[];  // 対象グループ
  isCombo?: boolean;       // コンビ授業
  comboWith?: string;      // ペア科目
  isJoint?: boolean;       // 合同授業
  isCommon?: boolean;      // 共通科目
}
```

### ScheduleEntry（時間割エントリ）
```typescript
interface ScheduleEntry {
  id: string;
  groupId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  timeSlot: {
    week: number;
    day: string;
    period: string;
  };
}
```

## 💻 技術スタック
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 (カスタム)
- **DnD**: react-dnd
- **Export**: xlsx, jsPDF
- **Date**: date-fns

## 🔄 現在の状況

### 完了済み
1. ✅ プロトタイプ完成
2. ✅ 3段階スケジューリングシステム実装
3. ✅ 複雑な制約条件対応
4. ✅ 視覚的UI/UX改善
5. ✅ 休日管理システム

### 確認待ち事項（クライアント）
- 具体的な教師制約の詳細
- 教室の利用可能条件
- 科目の優先順位
- 特殊な制約条件

## 🤝 今後の役割分担

| 担当 | 役割 |
|------|------|
| **ちーけんさん** | クライアントとのやりとり／仕様確認／資料アップロード／テスト・レビュー |
| **ChatGPT** | 要件整理／Claude Codeへの設計・指示出し／例出力の作成／UI設計支援 |
| **Claude Code** | 実装（GAS/Python/フロントエンド）／データ処理ロジック構築 |

## 📝 ChatGPTへの引き継ぎポイント

### 1. 現在の課題
- クライアントからの詳細制約待ち
- AI API連携の設計（将来実装予定）

### 2. 重要な設計思想
- **3段階配置**: 優先度順での科目配置
- **グループ同期**: 共通科目は同時刻配置
- **制約優先**: すべての制約を満たす配置

### 3. 次期開発予定
- 完全自立型CRUD対応
- AI プロンプト動的生成
- リアルタイム制約検証強化

## 📚 参考ドキュメント
- `docs/development-log-001〜005.md`: 開発履歴
- `docs/SCHEDULING_LOGIC.md`: 3段階システム仕様
- `docs/real_school_subjects_data.md`: 実際の科目データ
- `docs/teacher_requests_and_constraints.md`: 教師制約詳細

---

**プロジェクトURL**: `/Users/kikuchikenji/claude-code-projects/timetable-app/`  
**開発環境起動**: `npm run dev`（http://localhost:5173/）  
**本番環境**: Vercelで自動デプロイ設定済み