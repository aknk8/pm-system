# 取引管理システム フロントエンド

## 概要
取引管理システムのWebフロントエンドアプリケーション

## 技術スタック
- Next.js 14
- React 18
- TypeScript
- Material-UI (MUI)
- Axios

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を`.env.local`にコピーして、環境変数を設定してください。

```bash
cp .env.example .env.local
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## ビルド

```bash
npm run build
npm start
```

## 画面一覧

### 認証
- `/login` - ログイン画面

### ダッシュボード
- `/dashboard` - ダッシュボード（ホーム画面）

### マスタ管理
- `/clients` - クライアント管理
- `/employees` - 社員管理
- `/partners` - パートナー管理
- `/projects` - プロジェクト管理
- `/contracts` - 契約管理

### 実績管理
- `/work-records` - 稼働実績
- `/revenues` - 売上実績
- `/expenses` - 経費実績
- `/monthly-costs` - 月次給与実績

### 分析・レポート
- `/reports/projects` - プロジェクト別損益
- `/reports/pm` - PM別分析
- `/reports/clients` - クライアント別分析

## プロジェクト構造
```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # ルートレイアウト
│   │   ├── page.tsx      # ホームページ
│   │   ├── login/        # ログイン画面
│   │   ├── dashboard/    # ダッシュボード
│   │   ├── clients/      # クライアント管理
│   │   └── ...
│   ├── lib/              # ユーティリティ
│   │   └── api.ts        # APIクライアント
│   └── types/            # TypeScript型定義
├── public/               # 静的ファイル
├── package.json
├── tsconfig.json
└── next.config.js
```

## API連携
バックエンドAPIとの連携は`src/lib/api.ts`で管理されています。
JWTトークンは自動的にLocalStorageから取得され、リクエストヘッダーに付与されます。

## ライセンス
MIT
