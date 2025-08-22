# Development Log 006 - 自動記録システム設定

## 日付
2024-08-22

## 実施内容
### Obsidian自動記録システムの構築
- プロジェクト専用フォルダ作成完了
- 記録の棲み分けルール確立

## 記録管理ルール

### 1. プロジェクトフォルダ内（/docs/）で管理
**技術的・正式なドキュメント**
- 仕様書（ACCEPTANCE_CRITERIA.md等）
- 開発ログ（development-log-XXX.md）
- 実装状況（IMPLEMENTATION_STATUS.md）
- テスト仕様（TEST_SPECIFICATIONS.md）
- UI仕様（UI_COPY_RULES.md）

### 2. Obsidianで自動管理
**日常的な記録・メモ**
- `/Projects/timetable-app/daily/` - 日次作業記録
- `/Projects/timetable-app/meetings/` - 打ち合わせメモ
- `/Projects/timetable-app/issues/` - バグ・課題記録

## 自動記録タイミング
1. **機能実装時** → docsに番号付きログ作成
2. **日次作業** → Obsidian daily/に記録
3. **エラー発生** → Obsidian issues/に記録
4. **打ち合わせ** → Obsidian meetings/に記録

## 次回作業予定
- 継続的な自動記録の実施
- 必要に応じた記録形式の調整

## 関連ファイル
- Obsidian: `/Users/kikuchikenji/Obsidian/Projects/timetable-app/`
- グローバル設定: `~/.claude/CLAUDE.md`