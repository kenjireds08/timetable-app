# コードスタイル規約

## TypeScript/React規約

### ファイル命名
- コンポーネント: PascalCase (例: SubjectManager.tsx)
- ユーティリティ: camelCase (例: autoScheduleGenerator.ts)
- 型定義: types/index.ts に集約

### TypeScript設定
- strict: true
- target: ES2020
- module: ESNext
- jsx: react-jsx

### React規約
- 関数コンポーネントを使用
- React.FCの使用を避ける（型推論を活かす）
- hooksは`use`プレフィックス
- propsはインターフェースで定義

### インポート順序
1. React関連
2. 外部ライブラリ
3. 内部コンポーネント
4. ユーティリティ
5. 型定義
6. スタイル

### 状態管理
- useStateでローカル状態管理
- 複雑な状態はuseReducer検討
- グローバル状態は現在なし（必要に応じてContext API）

## CSS規約
- BEM命名規則を基本とする
- グローバルスタイルはindex.css
- コンポーネント固有はApp.css

## コメント
- 日本語でコメント記載
- 複雑なロジックには必ずコメント
- TODOコメントは`// TODO: 内容`形式

## 定数
- 大文字スネークケース（例: TIME_PERIODS）
- types/index.tsまたは各ファイル冒頭に定義

## エラーハンドリング
- try-catchで適切にエラーキャッチ
- ユーザー向けメッセージは日本語
- console.errorでデバッグ情報出力

## Git規約
- コミットメッセージは日本語
- プレフィックス使用:
  - feat: 新機能
  - fix: バグ修正
  - docs: ドキュメント
  - style: スタイル変更
  - refactor: リファクタリング
  - test: テスト追加・修正