# データアーキテクチャ改善提案（将来実装）

## 📅 記録日時
2025-08-27 16:45

## 🎯 現状の課題
現在、`mockData.ts`に科目情報と教師制約が混在しており、以下の問題がある：
- 更新サイクルが異なるデータが同居
- 講師交代や科目変更時の差分管理が困難
- Googleフォーム連携時の自動化が難しい
- 整合性チェックが複雑

## 💡 ChatGPT提案：データソースの分離

### 推奨ディレクトリ構造
```
/public/config/
  term_settings_2025H2.json         ← 期間・週数・基本ポリシー
  classrooms.json                   ← 教室マスタ（容量・設備）
  events_blackouts_2025H2.json      ← 祝日/学内行事/補講週などブロック日

  subjects_catalog_2025H2.json      ← ★科目サマリ（カリキュラム定義）
  teachers_roster_2025H2.json       ← ★講師名簿（ID/表示名/所属）
  teacher_constraints_2025H2.json   ← ★講師要望（Googleフォーム取込先）
```

### 分離のメリット
1. **更新サイクルが独立**
   - 科目編成：学務サイドの決定物
   - 教師要望：毎年・毎学期で個別変動

2. **責任範囲が明確**
   - サマリ：カリキュラム定義
   - 要望：制約条件
   - 混在による「どっちが正？」問題を回避

3. **将来の変更に強い**
   - 講師交替：roster + constraints のみ更新
   - 科目変更：catalog のみ更新
   - 差分管理が容易

4. **Googleフォーム連携が簡単**
   - 要望はフォーム→JSON/CSV自動変換パイプライン可能
   - 講師IDベースで名寄せ事故防止

5. **整合性チェックの自動化**
   - catalog ↔ constraints ↔ roster の突合
   - 不整合の自動検出とレポート生成

## 📝 実装方針（将来）

### Phase 1: データ構造の分離
```json
// subjects_catalog_2026H1.json
{
  "version": "2026-H1",
  "subjects": [{
    "id": "sub-ess1",
    "name": "Essential English I",
    "department": "共通",
    "grade": "1年",
    "totalClasses": 16,
    "isCombo": true,
    "comboWith": "sub-bjn1",
    "candidateTeacherIds": ["t-natsui"],
    "availableClassroomIds": ["c1", "c4", "c5"]
  }]
}

// teachers_roster_2026H1.json
{
  "version": "2026-H1",
  "teachers": [{
    "id": "t-suzuki",
    "displayName": "鈴木 俊良",
    "type": "常勤",
    "department": "共通"
  }]
}

// teacher_constraints_2026H1.json（現在の形式を踏襲）
{
  "version": "2026-H1",
  "teachers": [{
    "id": "t-suzuki",
    "confirmed": ["水曜固定"],
    "ng": {},
    "wish": {}
  }]
}
```

### Phase 2: 読み込み層の実装
- `src/lib/loadCatalog.ts` - JSON群を読み込んでメモリ上でマージ
- mockData.ts依存から脱却
- UI表示は合成結果を参照

### Phase 3: 整合性チェック機能
- teacherId未解決チェック
- 科目名表記揺れチェック（I/II vs Ⅰ/Ⅱ）
- コンビ授業の相互参照チェック
- 教室容量チェック
- 固定授業と行事の衝突チェック

### Phase 4: Googleフォーム連携
- フォーム回答 → CSV → JSON自動変換
- 講師IDベースの自動マッピング
- 差分レビューとコミット

## 🚀 移行計画

### 2025年後期（現在）
- **現状維持**：時間的制約により`mockData.ts`で運用
- 動作確認と安定性を優先

### 2026年前期以降
- データ分離アーキテクチャへ移行
- 段階的な移行計画：
  1. JSONファイル群の作成
  2. 読み込み層の実装とテスト
  3. UIの段階的切り替え
  4. 旧形式の廃止

## 💰 ROI（投資対効果）
- **初期投資**: 約2-3日の開発工数
- **削減効果**: 
  - 毎学期の更新作業：8時間 → 2時間（75%削減）
  - エラー対応：年4回×4時間 → ほぼゼロ
  - Googleフォーム連携による自動化

## 🔗 参考資料
- ChatGPT提案（2025-08-27）
- 現在の実装：`/src/data/mockData.ts`
- 将来の実装例：上記JSON構造

## 📌 重要な決定事項
**2025年後期は時間的制約により現状維持。2026年前期から段階的に改善実施。**

---
*この文書は将来の改善に向けた提案書として保存。実装は2026年以降を予定。*