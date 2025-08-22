# CLAUDE.md - 高校時間割自動作成システム

## 📋 プロジェクト概要
- **プロジェクト名**: AI時間割自動生成システム
- **クライアント**: アイデアITカレッジ阿蘇（専門学校）
- **目的**: 教師の要望や制約を考慮した最適化時間割システム
- **現在フェーズ**: プロトタイプ完成・制約条件の詳細確認中

## 🏗️ 技術スタック
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7.1.0
- **State Management**: React Hooks (useState)
- **DnD**: react-dnd 16.0.1
- **Export**: xlsx 0.18.5, jsPDF 3.0.1
- **Date**: date-fns 4.1.0
- **UI Icons**: lucide-react 0.539.0
- **Language**: TypeScript 5.8.3

## 🗂️ ファイル構造
```
/Users/kikuchikenji/claude-code-projects/timetable-app/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── BasicSettings.tsx          # 基本設定（期間・休日）
│   │   ├── AdvancedTeacherManager.tsx # 教師管理（高度）
│   │   ├── SubjectManager.tsx         # 科目管理
│   │   ├── ClassroomManager.tsx       # 教室管理
│   │   ├── SemesterTimetable.tsx      # 半年分時間割（メイン表示）
│   │   ├── TimetableGrid.tsx          # 週次時間割グリッド
│   │   ├── DraggableEntry.tsx         # ドラッグ可能な授業エントリ
│   │   ├── ExportButtons.tsx          # 単週Export
│   │   ├── SemesterExportButtons.tsx  # 半年分Export
│   │   └── LoadingAnimation.tsx       # ローディング表示
│   ├── utils/               # ビジネスロジック
│   │   ├── autoScheduleGenerator.ts   # 3段階スケジューリングエンジン（コア）
│   │   ├── holidayCalculator.ts       # 祝日自動計算
│   │   └── timetableGenerator.ts      # 時間割生成補助
│   ├── types/               # 型定義
│   │   └── index.ts                   # 全型定義集約
│   ├── data/                # モックデータ
│   │   └── mockData.ts               # 初期データ
│   └── App.tsx              # メインコンポーネント
├── docs/                    # ドキュメント
│   ├── development-log-001〜006.md   # 開発履歴
│   ├── SCHEDULING_LOGIC.md            # 3段階システム仕様
│   ├── ACCEPTANCE_CRITERIA.md         # 受け入れ基準
│   ├── IMPLEMENTATION_STATUS_FOR_CHATGPT.md  # 実装状況
│   └── PROJECT_SUMMARY_FOR_CHATGPT.md       # プロジェクト概要
└── public/
    ├── config/
    │   └── school-config.sample.json  # 設定ファイルサンプル
    ├── perfect_schedule.json          # 完璧な時間割例
    └── semester_schedule.json         # 時間割データ
```

## 🚀 主要機能

### 1. 3段階スケジューリングシステム
```typescript
// Phase 1: 全学年合同科目（4グループ同時）
// 例: クリエイティブコミュニケーションラボ → 全員が「たかねこ」教室

// Phase 2: 共通科目（同学年同時）
// 例: ビジネス実務I → IT1年+TD1年が同じ教室
// コンビ授業: Essential English ⇔ ビジネス日本語（選択制）

// Phase 3: 専門科目（グループ個別）
// 例: プログラミング基礎 → IT1年のみ
```

### 2. 高度な制約管理
- **教師制約**: 曜日・時限・連続授業・最大授業数
- **教室制約**: 容量・設備・利用可能性
- **科目制約**: コンビ授業・順序・合同授業
- **休日管理**: 祝日自動計算・カスタム休日

### 3. グループ管理
- **4グループ**: IT1年、IT2年、TD1年、TD2年
- **時間割グリッド**: 週5日 × 4時限
- **半年分表示**: 19週間の時間割一覧

### 4. UI/UX機能
- **ドラッグ&ドロップ**: 授業の手動調整
- **リアルタイム制約検証**: ドロップ時のバリデーション
- **色分け表示**: 科目タイプごとの視覚的区別
- **Excel/PDF出力**: 単週・半年分両対応

## 📊 データモデル

### 主要インターフェース
```typescript
interface Teacher {
  id: string;
  name: string;
  type: '常勤' | '非常勤';
  constraints?: TeacherConstraints;
}

interface Subject {
  id: string;
  name: string;
  teacherIds: string[];
  department: 'ITソリューション' | '地域観光デザイン' | '共通';
  grade: '1年' | '2年' | '全学年';
  totalClasses: number;
  lessonType: '通常' | 'コンビ授業' | '合同';
  availableClassroomIds: string[];
}

interface ScheduleEntry {
  id: string;
  groupId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  timeSlot: { week: number; day: string; period: string; };
}
```

## ⚙️ 開発コマンド
```bash
# 開発サーバー起動
npm run dev              # http://localhost:5173/

# ビルド
npm run build

# 型チェック
npx tsc --noEmit

# Lint
npm run lint

# プレビュー
npm run preview
```

## 🔍 現在の実装状況

### ✅ 完了済み機能
1. **基本機能**: 4グループ管理、時間割グリッド、ドラッグ&ドロップ
2. **3段階スケジューリングシステム**: 全学年合同→共通科目→専門科目
3. **複雑な制約条件対応**: 教師・教室・科目制約の全て
4. **視覚的UI/UX**: 色分け表示、半年分一覧表示
5. **休日管理システム**: 祝日自動計算、カスタム休日
6. **Export機能**: Excel・PDFの両形式対応

### 🔲 実装待ち機能（優先順）
1. **フィオーナ先生の月曜補填機能**
   - 木曜3限の15分遅れ×実施回数 = 不足分自動算出
   - 月曜3限×2 + 月曜4限×1（合計240分）自動候補提示
   - 12/22、成果発表会、補講期間の自動除外

2. **ブロック週機能**
   - 成果発表会（1/26-28）、補講期間（1/29-2/6）対応
   - ドラッグ&ドロップでブロック週への配置禁止
   - 週ヘッダに行事名バッジ表示

3. **エラーUI改善**
   - ドロップ失敗時のトースト通知（日本語）
   - 失敗理由の明確化
   - セル表示改善（🎌休日、⚠️行事ブロック）

4. **科目名正規化**
   - Ⅰ ⇔ I、Ⅱ ⇔ II の統一
   - 末尾タグ[共通][合同][コンビ]の適切な処理

## 🎯 特殊制約・ビジネスルール

### フィオーナ先生の制約
```typescript
// 実装済み: 木曜3限（実際は13:15開始で15分遅れ）、4限
// 実装済み: 月曜4限ブロック（3限使用時）
// 未実装: 15分×16週＝240分の不足分計算・月曜補填提案
```

### 矢板先生の制約
```typescript
// 実装済み: 月曜3限連続2コマ（情報技術基礎A→B→C→D）
```

### 木下先生の制約
```typescript
// 実装済み: 月・金のみ利用可能
```

## 📈 プロジェクト管理

### Obsidian自動記録
- **場所**: `/Users/kikuchikenji/Obsidian/Projects/timetable-app/`
- **日次記録**: `daily/YYYY-MM-DD.md`
- **課題記録**: `issues/`
- **打ち合わせ**: `meetings/`

### ドキュメント管理
- **技術仕様**: `/docs/` フォルダで番号付き管理
- **開発ログ**: `development-log-XXX.md` 形式
- **仕様書**: Markdown形式で詳細記録

## 🔐 セキュリティ・品質

### コード品質
- **TypeScript**: 厳密な型チェック
- **ESLint**: コード品質チェック
- **React 19**: 最新安定版使用

### データ管理
- **localStorage**: ローカルデータ永続化
- **JSON設定**: 外部設定ファイル対応予定
- **Export機能**: Excel/PDF出力でデータ保護

## 🚀 デプロイ・環境

### 開発環境
- **起動**: `npm run dev`
- **ポート**: http://localhost:5173/
- **HMR**: Vite高速リロード

### 本番環境（予定）
- **Vercel**: 自動デプロイ設定済み
- **GitHub**: ソースコード管理
- **商用利用**: Vercel Pro移行予定

## 📞 連絡先・役割分担

### 開発チーム
| 担当 | 役割 |
|------|------|
| **ちーけんさん** | クライアントとのやりとり／仕様確認／資料アップロード／テスト・レビュー |
| **ChatGPT** | 要件整理／Claude Codeへの設計・指示出し／例出力の作成／UI設計支援 |
| **Claude Code** | 実装（React/TypeScript）／データ処理ロジック構築 |

### クライアント
- **アイデアITカレッジ阿蘇**
- **確認待ち**: 具体的な教師制約の詳細、教室利用可能条件、科目優先順位

---

**最終更新**: 2025年8月22日  
**開発状況**: プロトタイプ完成・詳細制約確認中  
**次回マイルストーン**: フィオーナ補填機能・ブロック週対応