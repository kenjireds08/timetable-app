# 013. コンビ授業同時配置機能の実装

## 実装日
2025年8月29日

## 概要
コンビ授業（Essential English ↔ ビジネス日本語）を確実に同じ時限に配置する機能を実装。

## 問題点
- 従来の実装では、コンビ授業が別々の時限に配置される可能性があった
- 学生が選択可能な形式（同じ時限に2つの選択肢）にする必要があった

## 実装内容

### 1. 型定義の拡張
```typescript
// src/types/index.ts
export interface Subject {
  // ...既存フィールド
  comboPairId?: string;     // コンビ授業のペアID
  comboRole?: 'A' | 'B';    // コンビ授業での役割
}
```

### 2. データ更新
```typescript
// src/data/mockData.ts
// Essential English I
comboPairId: 'combo-EE1-BJ1',
comboRole: 'A',

// ビジネス日本語 I  
comboPairId: 'combo-EE1-BJ1',
comboRole: 'B',
```

### 3. スケジューラー改修

#### Phase 2.5の新設
- コンビ授業専用の配置フェーズを追加
- `placeComboPairs()`メソッドで同時配置を保証

#### 処理フロー
1. comboPairIdを持つ科目をグループ化
2. ペアごとに処理
3. 両方の教師・教室が利用可能なスロットを探索
4. 木曜1,2限を優先的に配置
5. 全グループに両方の科目を同時配置

### 4. 特徴
- **同時配置保証**: A/B両方が配置可能な場合のみ配置
- **片割れ防止**: 一方だけの配置を防ぐ
- **優先スロット**: 木曜1,2限を優先
- **教室の分離**: 異なる2教室を確保

## 実装ファイル
- `/src/types/index.ts` - 型定義
- `/src/data/mockData.ts` - データ更新
- `/src/utils/autoScheduleGenerator.ts` - スケジューラー改修
- `/src/utils/testComboPlacement.ts` - テストユーティリティ

## 動作確認方法

### 1. UIでの確認
- 時間割生成後、木曜1限・2限を確認
- Essential English と ビジネス日本語が同時配置されているか

### 2. コンソールログ
```
🎯 Phase 2.5: コンビ授業のペア同時配置開始
🤝 コンビペア配置: Essential English I ↔ ビジネス日本語 I (1年)
✅ 第1週 木曜1限: Essential English I & ビジネス日本語 I 同時配置成功
```

### 3. 検証ツール
```typescript
import { validateComboPlacement, getComboStatistics } from './utils/testComboPlacement';

// 検証実行
const validation = validateComboPlacement(schedule);
if (!validation.isValid) {
  console.error('コンビ授業配置エラー:', validation.issues);
}

// 統計取得
const stats = getComboStatistics(schedule);
console.log('木曜1限配置数:', stats.thursdayPeriod1);
console.log('木曜2限配置数:', stats.thursdayPeriod2);
```

## 次のステップ
1. ✅ コンビ授業の同時配置実装
2. ⬜ UIでの表示改善（コンビA/Bラベル）
3. ⬜ 整合性チェック機能の追加
4. ⬜ エラーハンドリングの強化

## 注意事項
- Phase 2（共通科目）でコンビ授業をスキップするよう修正済み
- Phase 2.5で専用処理を行うことで重複配置を防止
- 教室の競合を避けるため、必ず異なる教室を割り当て