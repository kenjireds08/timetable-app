# 001_initial_prototype.md

## プロジェクト開始日
2025年8月9日

## 概要
専門学校向けのAI時間割自動生成システムのプロトタイプを作成

## 要件定義
アイデアITカレッジ阿蘇の2025年度後期における授業時間割を、講師・教室・科目・生徒にまつわる複雑な制約条件をすべて満たした上で自動的に生成するWebアプリケーション。

## 実装した機能

### ✅ 完成した機能
1. **プロジェクトの初期セットアップ** - React + TypeScript + Vite
2. **データモデルとTypeScript型定義** - Teacher, Subject, Classroom, ScheduleEntry等
3. **グリッド形式のタイムテーブル** - Excelライクな時間割表示
4. **教師・科目・教室の管理画面** - CRUD機能完備
5. **時間割生成エンジンの基本実装** - 制約条件を考慮した自動生成
6. **ドラッグ&ドロップ機能** - react-dndを使用した直感的操作
7. **制約条件のリアルタイム検証** - 移動時の制約チェック
8. **スタイリング** - シンプルで見やすいデザイン

### 🔧 技術スタック
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: react-dnd, lucide-react
- **Styling**: CSS3 (カスタム)
- **Date Handling**: date-fns

### 📊 データ構造
```typescript
- Teacher: 教師情報（制約条件含む）
- Subject: 科目情報（コンビ授業対応）
- Classroom: 教室情報
- ScheduleEntry: 時間割エントリ
- TimeSlot: 時間枠定義
```

### 🎨 デザイン改善
- グラデーション背景 → シンプルなライトグレー
- 色合いを青系で統一
- テキストの視認性向上
- 教室管理の文字色修正

## 未実装の重要機能（要件定義書より）
1. **教師個別の特殊制約条件**
   - 矢板さんの4科目連続実施
   - 森田さんの水・金限定 + 週3コマ
   - 木下さんの月・金連続2コマ
   - フィオーナさんの13:15開始
   - その他教師の個別要望
2. **コンビ授業の完全対応**
3. **PDF/Excelエクスポート機能**
4. **ダッシュボード機能**（充足率、稼働率表示）
5. **より高度な最適化アルゴリズム**

## プロジェクト構造
```
/Users/kikuchikenji/claude-code-projects/timetable-app/
├── src/
│   ├── types/index.ts          - 型定義
│   ├── data/mockData.ts        - モックデータ
│   ├── utils/timetableGenerator.ts - 生成エンジン
│   ├── components/
│   │   ├── TimetableGrid.tsx   - メイン時間割表示
│   │   ├── TeacherManager.tsx  - 教師管理
│   │   ├── SubjectManager.tsx  - 科目管理
│   │   └── DraggableEntry.tsx  - D&D要素
│   ├── App.tsx                 - メインアプリ
│   └── App.css                 - スタイリング
├── docs/                       - ドキュメント管理
└── README.md
```

## 次のステップ候補
1. 制約条件の詳細実装
2. エクスポート機能追加
3. ダッシュボード充実
4. 生成エンジンの高度化

## 開発サーバー
```bash
cd /Users/kikuchikenji/claude-code-projects/timetable-app
npm run dev
# http://localhost:5173/
```

## 約束事
- 大きな修正・変更時は必ずdocs/にドキュメント作成
- 番号順（001, 002, 003...）で管理
- チャット履歴がなくても引き継ぎ可能な状態を維持