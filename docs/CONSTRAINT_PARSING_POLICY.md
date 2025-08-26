# 制約条件解析方針

## 概要
講師の自然言語による制約条件記述を、システムが処理可能な構造化データに変換する方針。

## データモデル

### 制約ルール構造
```typescript
interface ConstraintRule {
  id: string;
  strength: 'HARD' | 'SOFT';  // NG=HARD, 希望=SOFT
  period?: {
    start: string;  // YYYY-MM-DD
    end: string;    // YYYY-MM-DD
  };
  days?: ('月'|'火'|'水'|'木'|'金')[];
  periods?: ('1限'|'2限'|'3限'|'4限')[];
  completeByDate?: string;  // 締切日
  confidence: number;  // 抽出信頼度 0-1
  note?: string;  // 補足情報
  originalText?: string;  // 元の記述（監査用）
}
```

## 解析ルール

### 1. 強度の判定
- **HARD（必須）**: NG欄に記載された内容
- **SOFT（希望）**: 希望欄に記載された内容

### 2. 期間の解析

#### デフォルト処理
- 期間未指定 → 学期全体（2025-09-29 〜 2026-02-06）
- 「学期中」「後期」「全期間」→ 学期全体

#### 期間パターン認識
```javascript
// パターン例
"4月から6月" → { start: "2025-04-01", end: "2025-06-30" }
"12/10-12/20" → { start: "2025-12-10", end: "2025-12-20" }
"1月以降" → { start: "2026-01-01", end: "2026-02-06" }
"8月末まで" → { start: "2025-09-29", end: "2025-08-31" } // 締切として処理
```

### 3. 曜日の解析

#### 曜日パターン
```javascript
// 単独
"月曜" | "月曜日" → ["月"]
"月" → ["月"]

// 複数
"月火" | "月・火" | "月曜と火曜" → ["月", "火"]
"月火木金" → ["月", "火", "木", "金"]

// 範囲
"月〜水" | "月曜から水曜" → ["月", "火", "水"]
```

### 4. 時限の解析

#### 時限パターン
```javascript
// 単独
"1限" | "1時限" | "一限" → ["1限"]
"午前" | "午前中" → ["1限", "2限"]
"午後" → ["3限", "4限"]

// 複数
"1-2限" | "1・2限" → ["1限", "2限"]
"3,4限" → ["3限", "4限"]

// 連続
"3-4限連続" → ["3限", "4限"] + consecutive: true
```

### 5. 特殊条件の解析

#### 締切条件
```javascript
"8月末までに完了" → completeByDate: "2025-08-31"
"1月中に終わらせたい" → completeByDate: "2026-01-31"
```

#### 集約条件
```javascript
"週1日に集約" → consolidation: { type: "weekly", days: 1 }
"なるべく月火に" → preferredDays: ["月", "火"]
```

#### 連続授業
```javascript
"2コマ連続" → consecutive: { count: 2 }
"連続授業希望" → consecutive: { preferred: true }
```

## 信頼度算出

### 信頼度レベル
- **0.9-1.0**: 明確な指定（曜日・時限が明記）
- **0.7-0.8**: 一般的表現（午前、午後など）
- **0.5-0.6**: あいまいな表現（なるべく、できれば）
- **0.0-0.4**: 解析困難（要確認）

### 信頼度による処理
```javascript
if (confidence >= 0.7) {
  // 自動適用
  applyRule(rule);
} else {
  // 要確認フラグ
  flagForReview(rule);
  showWarning("解析信頼度が低いため確認が必要です");
}
```

## 実装例

### 入力例1
```
NG: "4月から6月は金曜日NG、毎週水曜日の1-2限は会議"
```

### 解析結果1
```json
[
  {
    "id": "rule-001",
    "strength": "HARD",
    "period": {
      "start": "2025-04-01",
      "end": "2025-06-30"
    },
    "days": ["金"],
    "confidence": 0.9,
    "originalText": "4月から6月は金曜日NG"
  },
  {
    "id": "rule-002",
    "strength": "HARD",
    "days": ["水"],
    "periods": ["1限", "2限"],
    "confidence": 0.95,
    "originalText": "毎週水曜日の1-2限は会議"
  }
]
```

### 入力例2
```
希望: "なるべく月火に集中させて、8月末までに終わらせたい"
```

### 解析結果2
```json
[
  {
    "id": "rule-003",
    "strength": "SOFT",
    "days": ["月", "火"],
    "note": "集約希望",
    "confidence": 0.8,
    "originalText": "なるべく月火に集中"
  },
  {
    "id": "rule-004",
    "strength": "SOFT",
    "completeByDate": "2025-08-31",
    "confidence": 0.85,
    "originalText": "8月末までに終わらせたい"
  }
]
```

## スケジューラーでの利用

### 処理フロー
```javascript
// 1. HARD制約でフィルタリング
function filterByHardConstraints(slots, rules) {
  return slots.filter(slot => {
    const hardRules = rules.filter(r => r.strength === 'HARD');
    return !violatesAnyRule(slot, hardRules);
  });
}

// 2. SOFT制約でスコアリング
function scoreByPreferences(slots, rules) {
  const softRules = rules.filter(r => r.strength === 'SOFT');
  return slots.map(slot => ({
    ...slot,
    score: calculatePreferenceScore(slot, softRules)
  }));
}

// 3. 締切考慮の前倒し
function prioritizeByDeadline(slots, deadline) {
  if (!deadline) return slots;
  
  const deadlineDate = new Date(deadline);
  return slots.map(slot => {
    const slotDate = new Date(slot.date);
    const daysUntilDeadline = (deadlineDate - slotDate) / (1000 * 60 * 60 * 24);
    
    // 締切に近いほど高スコア
    slot.urgencyBonus = Math.max(0, 100 - daysUntilDeadline);
    slot.score += slot.urgencyBonus;
    
    return slot;
  });
}
```

## エラー処理

### 配置不可時のメッセージ
```typescript
function getConstraintViolationMessage(rule: ConstraintRule): string {
  if (rule.strength === 'HARD') {
    if (rule.days && rule.periods) {
      return `${rule.days.join('・')}の${rule.periods.join('・')}はNG`;
    }
    if (rule.days) {
      return `${rule.days.join('・')}はNG`;
    }
    if (rule.period) {
      return `${rule.period.start}〜${rule.period.end}は配置不可`;
    }
  }
  return rule.originalText || '制約条件により配置不可';
}
```

## 今後の拡張

### Phase 1（基本実装）
- 曜日・時限の基本解析
- HARD/SOFT判定
- 単純なパターンマッチング

### Phase 2（高度化）
- 期間の柔軟な解析
- 締切・前倒しロジック
- 信頼度に基づく自動/手動判定

### Phase 3（AI活用）
- 自然言語処理の精度向上
- 文脈を考慮した解析
- あいまいな表現の推論

---

**ステータス**: 方針策定完了  
**最終更新**: 2025/08/22  
**次のアクション**: クライアントからの制約条件確定後、実装開始