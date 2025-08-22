# プロジェクト構造

## ディレクトリ構造
```
timetable-app/
├── .serena/              # Serena MCPの設定・メモリ
│   ├── project.yml       # プロジェクト設定
│   └── memories/         # 作業履歴・知識保存
├── docs/                 # ドキュメント
│   ├── INDEX.md          # ドキュメント一覧
│   ├── development-log-001.md  # 初期プロトタイプ
│   ├── development-log-002.md  # 体験プロトタイプ
│   ├── development-log-003.md  # UI最適化
│   ├── development-log-004.md  # 休日管理システム
│   ├── development-log-005.md  # 3段階同期システム
│   ├── SCHEDULING_LOGIC.md     # スケジューリング詳細仕様
│   └── PROJECT_SUMMARY_FOR_CHATGPT.md  # ChatGPT連携資料
├── public/               # 静的ファイル
├── src/                  # ソースコード
│   ├── assets/           # 画像等のアセット
│   ├── components/       # Reactコンポーネント
│   │   ├── BasicSettings.tsx         # 基本設定タブ
│   │   ├── TeacherManager.tsx        # 教師管理タブ
│   │   ├── SubjectManager.tsx        # 科目管理タブ
│   │   ├── ClassroomManager.tsx      # 教室管理タブ
│   │   ├── SemesterTimetable.tsx     # 半年分時間割タブ
│   │   ├── TimetableGrid.tsx         # 時間割グリッド
│   │   ├── DraggableEntry.tsx        # ドラッグ可能エントリ
│   │   ├── LoadingAnimation.tsx      # ローディング演出
│   │   ├── ExportButtons.tsx         # 単週Export
│   │   └── SemesterExportButtons.tsx # 半年分Export
│   ├── data/             # モックデータ
│   │   └── mockData.ts   # テスト用データ
│   ├── types/            # 型定義
│   │   └── index.ts      # 全型定義集約
│   ├── utils/            # ユーティリティ
│   │   ├── autoScheduleGenerator.ts  # 3段階スケジューリング
│   │   ├── holidayCalculator.ts      # 祝日計算
│   │   └── timetableGenerator.ts     # 時間割生成ロジック
│   ├── App.tsx           # メインコンポーネント
│   ├── App.css           # アプリスタイル
│   ├── main.tsx          # エントリポイント
│   └── index.css         # グローバルスタイル
├── .gitignore            # Git除外設定
├── eslint.config.js      # ESLint設定
├── index.html            # HTMLテンプレート
├── package.json          # パッケージ定義
├── package-lock.json     # 依存関係ロック
├── tsconfig.json         # TypeScript設定
├── tsconfig.app.json     # アプリ用TS設定
├── tsconfig.node.json    # Node用TS設定
├── vite.config.ts        # Vite設定
└── README.md             # プロジェクト説明
```

## 主要コンポーネントの役割

### App.tsx
- メインコンポーネント
- タブ管理
- 状態管理の中心
- 各マネージャーコンポーネントの統合

### autoScheduleGenerator.ts
- 3段階スケジューリングの中核
- Phase 1: 全学年合同科目
- Phase 2: 共通科目同期
- Phase 3: 専門科目配置
- 制約チェックロジック

### SemesterTimetable.tsx
- 19週間の時間割表示
- ドラッグ&ドロップ対応
- 進捗表示
- Export機能呼び出し

### holidayCalculator.ts
- 2025-2026年の祝日自動計算
- 振替休日対応
- 春分・秋分の計算