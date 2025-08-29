# 科目管理と時間割の連動機能実装

## 実装日時
2025年8月29日

## 概要
科目管理タブと時間割タブを完全に連動させ、時間割で生成・編集された授業が科目管理タブでリアルタイムに反映されるように改善しました。

## 実装内容

### 1. リアルタイム更新機能
- **localStorage監視**: 1秒ごとにlocalStorageの更新を検知
- **タイムスタンプ管理**: データ更新時にタイムスタンプを付与
- **自動同期**: 時間割の変更が即座に科目管理に反映

### 2. 進捗表示の改善
- **緑色（完了）**: 全授業が配置済み（100%）
- **黄色（部分）**: 一部配置済み（1-99%）
- **赤色（未配置）**: 未配置（0%）
- **プログレスバー**: 視覚的な進捗表示
- **詳細情報**: X/Yコマ形式での具体的な数値表示

### 3. 科目名の正規化
- ローマ数字の統一処理（I ⇔ Ⅰ、II ⇔ Ⅱ）
- タグの適切な処理（[共通]、[合同]、[コンビ]）
- 正確なマッチングによる配置状況の把握

### 4. 失敗理由の分析
- 教師の制約（利用可能日、最大コマ数など）
- 教室の制約（利用可能教室の限定）
- わかりやすい日本語での表示

## 技術詳細

### SubjectManager.tsx
```typescript
// localStorageの変更を監視
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'generatedSemesterData' && e.newValue) {
    const data = JSON.parse(e.newValue);
    setSemesterData(data);
    setLastUpdateTime(Date.now());
  }
};

// 同じタブ内でのlocalStorage変更を監視
const checkInterval = setInterval(() => {
  const generatedData = localStorage.getItem('generatedSemesterData');
  if (generatedData) {
    const data = JSON.parse(generatedData);
    const dataTimestamp = data.generatedAt || 0;
    if (dataTimestamp > lastUpdateTime) {
      setSemesterData(data);
      setLastUpdateTime(dataTimestamp);
    }
  }
}, 1000);
```

### SemesterTimetable.tsx
```typescript
// ドラッグ&ドロップ後にlocalStorageを更新
const updatedData = {
  ...newData,
  generatedAt: Date.now()
};
localStorage.setItem('generatedSemesterData', JSON.stringify(updatedData));
```

## 使用方法

1. **基本設定の入力**
   - 教師管理、科目管理、教室管理で必要情報を登録
   - 基本設定で期間や休日を設定

2. **時間割生成**
   - 緑色の「時間割を生成」ボタンをクリック
   - 自動的に半年分の時間割が生成される

3. **科目管理での確認**
   - 科目管理タブを開く
   - 各科目の配置状況が色とプログレスバーで表示される
   - 全科目が緑色になっていることを確認

4. **手動調整**
   - 時間割タブでドラッグ&ドロップで調整
   - 科目管理タブに即座に反映される

## 注意事項
- 時間割の変更は自動保存されます
- ブラウザをリロードしてもデータは保持されます
- 複数タブで開いている場合も同期されます

## 今後の改善案
- 科目管理から直接時間割への配置機能
- 未配置科目の自動配置提案
- 配置最適化アルゴリズムの改善