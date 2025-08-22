# 開発用コマンド集

## 基本コマンド

### 開発サーバー起動
```bash
npm run dev
```
- URL: http://localhost:5173/
- ホットリロード対応

### ビルド
```bash
npm run build
```
- distフォルダに本番用ビルドを生成

### リンター実行
```bash
npm run lint
```
- ESLintでコード品質チェック

### プレビューサーバー
```bash
npm run preview
```
- ビルド後の本番環境をローカルでプレビュー

## Git関連
```bash
git status           # 変更状況確認
git add -A          # 全変更をステージング
git commit -m "メッセージ"  # コミット（日本語メッセージ）
git push origin main # リモートへプッシュ
git pull origin main # リモートから最新取得
```

## プロジェクト管理
```bash
ls -la              # ファイル一覧
cd docs/            # ドキュメントフォルダへ移動
pwd                 # 現在のディレクトリ確認
```

## システムコマンド（macOS）
```bash
open .              # Finderで現在のフォルダを開く
killall node        # Node.jsプロセスを終了
lsof -i :5173       # ポート5173の使用状況確認
```

## パッケージ管理
```bash
npm install         # 依存関係インストール
npm list            # インストール済みパッケージ一覧
npm update          # パッケージ更新
```

## トラブルシューティング
```bash
rm -rf node_modules package-lock.json && npm install  # 依存関係リセット
```