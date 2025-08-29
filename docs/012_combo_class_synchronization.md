# 012 コンビ授業同時並行化と整合性チェック機能実装

## 実装日時
2025年8月29日

## 実装内容

### 1. データモデルの拡張
Subject型に以下のプロパティを追加：
- `isJointAllGrades?: boolean` - 全学年合同フラグ（クリエイティブコミュニケーションラボ等）
- `comboPairId?: string` - コンビ授業ペアID（同じIDの科目は同時配置）
- `comboRole?: 'A' | 'B'` - コンビ授業での役割
- `preferredClassrooms?: string[]` - 優先教室リスト
- `fixedClassroomId?: string` - 固定教室（合同科目等）

### 2. スケジューラーの改善

#### Phase 1: 全学年合同科目の配置
- `isJointAllGrades`フラグを使用して全学年合同科目を識別
- 固定教室（c1:たかねこ）の自動割り当て
- TD専門の合同科目は、TD1年+TD2年のみを対象に配置

#### Phase 2: コンビ授業の同時並行配置
- `comboPairId`を使用してペア科目を識別
- 同じ時限に必ずA/B両方を配置（片方のみの配置を禁止）
- Essential English（IT向け）とビジネス日本語（TD向け）を同時配置
- 2教室を同時に確保して配置

### 3. mockData.tsの更新
全科目に新しいプロパティを追加：
- 全学年合同4科目に`isJointAllGrades: true`と`fixedClassroomId: 'c1'`を設定
- コンビ授業に`comboPairId`と`comboRole`を設定
- 孫先生の科目に`preferredClassrooms: ['c1']`を設定

### 4. 整合性チェック機能（ConsistencyChecker）
以下のエラーと警告を検出：
- **エラー（赤）**：
  - コンビ授業のA/B片方のみ配置されている
  - 合同科目がc1以外で配置されている
  - 鈴木先生の固定回（1/19, 1/21）が欠落している
- **警告（黄）**：
  - 特定教師のconfirmed/ng/wishがすべて空
  - 重要教師のconfirmedが空

### 5. 科目管理タブとの連動強化
- handleGenerateTimetableでmockSubjectsから最新プロパティを取得
- 生成時に必要なプロパティをsubjectsに統合

## 修正したファイル
1. `/src/types/index.ts` - Subject型の拡張
2. `/src/data/mockData.ts` - 全科目データの更新
3. `/src/utils/autoScheduleGenerator.ts` - スケジューラーロジックの改善
4. `/src/App.tsx` - データ連動の強化
5. `/src/components/ConsistencyChecker.tsx` - 新規作成
6. `/src/components/SemesterTimetable.tsx` - 整合性チェック機能の統合

## テスト観点
1. 木曜1・2限にEssential Englishとビジネス日本語が同時配置されるか
2. 合同4科目がc1固定で配置されるか
3. 1/19(月)14-15連続、1/21(水)ふりかえりが反映されるか
4. 月曜は原則空でFiona補填のみが配置されるか
5. 整合性チェックでエラー0、警告は必要に応じて対応

## 次のステップ
1. ブロック週機能（成果発表会、補講期間）の実装
2. エラーUI改善（トースト通知、日本語化）
3. 科目名正規化（Ⅰ⇔I、Ⅱ⇔IIの統一）