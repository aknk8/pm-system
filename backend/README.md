# 取引管理システム バックエンド

## 概要
ITコンサルティング、テストアウトソーシング、ライセンス販売の統合管理システムのバックエンドAPI

## 技術スタック
- Node.js 20+
- TypeScript
- Express.js
- PostgreSQL
- JWT認証

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を`.env`にコピーして、環境変数を設定してください。

```bash
cp .env.example .env
```

### 3. データベースのセットアップ
PostgreSQLデータベースを作成します。

```sql
CREATE DATABASE transaction_management;
```

### 4. マイグレーションの実行
```bash
npm run db:migrate
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

## API エンドポイント

### 認証
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト
- `POST /api/v1/auth/refresh` - トークンリフレッシュ
- `GET /api/v1/auth/me` - 現在のユーザー情報取得

### マスタ管理
- `/api/v1/clients` - クライアント管理
- `/api/v1/employees` - 社員管理
- `/api/v1/partners` - パートナー管理
- `/api/v1/projects` - プロジェクト管理
- `/api/v1/contracts` - 契約管理

### 実績管理
- `/api/v1/assignment-plans` - アサイン計画
- `/api/v1/work-records` - 稼働実績
- `/api/v1/monthly-actual-costs` - 月次給与実績
- `/api/v1/expenses` - 経費実績
- `/api/v1/revenues` - 売上実績

### 分析・レポート
- `/api/v1/reports/projects/:id/profit` - プロジェクト損益
- `/api/v1/reports/pm/:employee_id/profit` - PM別損益
- `/api/v1/reports/clients/:id/revenue` - クライアント別収益
- `/api/v1/dashboard/summary` - ダッシュボードサマリー
- `/api/v1/dashboard/pm-ranking` - PM別ランキング
- `/api/v1/dashboard/alerts` - アラート情報

## プロジェクト構造
```
backend/
├── src/
│   ├── config/          # 設定ファイル
│   ├── controllers/     # コントローラー
│   ├── routes/          # ルート定義
│   ├── middleware/      # ミドルウェア
│   ├── types/           # TypeScript型定義
│   ├── database/        # データベース関連
│   │   └── migrations/  # マイグレーションファイル
│   └── index.ts         # エントリーポイント
├── package.json
├── tsconfig.json
└── .env.example
```

## 開発
- `npm run dev` - 開発サーバー起動（ホットリロード）
- `npm run build` - ビルド
- `npm start` - 本番サーバー起動
- `npm test` - テスト実行

## 認証
全てのAPIエンドポイント（`/auth/*`を除く）は認証が必要です。
リクエストヘッダーに以下を含めてください：

```
Authorization: Bearer <JWT_TOKEN>
```

## ロール
- `admin` - 全権限
- `manager` - マスタ管理、実績管理、レポート閲覧
- `user` - 実績登録、自身のデータ閲覧

## ライセンス
MIT
