# 取引管理システム

## 概要
ITコンサルティング、テストアウトソーシング、ライセンス販売という「ストック・フロー・労働集約」が混在するビジネスモデルを、一つのシステムで統合管理するWebアプリケーションです。

## 主な機能

### マスタ管理
- クライアント管理
- プロジェクト管理
- 契約管理
- 社員管理（標準原価履歴管理含む）
- 外部パートナー管理

### 実績管理
- 予定・アサイン計画
- 勤務実績CSVインポート
- 月次給与実績登録
- 月次売上実績登録
- 諸経費・ライセンス仕入登録

### 分析・レポート
- 総合ダッシュボード
- プロジェクト別損益レポート（標準原価/実績原価切替）
- PM別・部署別集計
- クライアント別収益レポート
- 稼働・コスト乖離分析

## システム構成

```
transaction_management/
├── backend/              # バックエンドAPI (Node.js/Express/TypeScript)
├── frontend/             # フロントエンド (Next.js/React/TypeScript)
├── specification_transaction_manegement.md  # システム仕様書
└── design_transaction_management.md          # システム設計書
```

## 技術スタック

### バックエンド
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **ORM**: pg (node-postgres)

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Material-UI (MUI)
- **Language**: TypeScript
- **State Management**: React Hooks
- **HTTP Client**: Axios

## セットアップ手順

### 前提条件
- Node.js 20以上
- PostgreSQL 14以上
- npm または yarn

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd transaction_manegement
```

### 2. データベースのセットアップ
PostgreSQLでデータベースを作成します。

```sql
CREATE DATABASE transaction_management;
```

### 3. バックエンドのセットアップ
```bash
cd backend
npm install
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定
npm run db:migrate  # マイグレーション実行
npm run dev         # 開発サーバー起動
```

バックエンドは `http://localhost:3001` で起動します。

### 4. フロントエンドのセットアップ
新しいターミナルを開いて:

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.localファイルを確認（デフォルトはlocalhost:3001）
npm run dev  # 開発サーバー起動
```

フロントエンドは `http://localhost:3000` で起動します。

### 5. 初期ユーザーの作成
データベースに直接管理者ユーザーを作成します。

```sql
-- パスワード: admin123 (bcryptでハッシュ化済み)
INSERT INTO users (username, password_hash, role, is_active)
VALUES (
  'admin',
  '$2b$10$rKvVXqjH9YqKf8F9CZNXQuE5GwJ5uQx3XqZXvZr4nF6MqHYyYqYyO',
  'admin',
  true
);
```

または、Node.jsコンソールでパスワードをハッシュ化:

```javascript
const bcrypt = require('bcrypt');
const password = 'your_password';
bcrypt.hash(password, 10, (err, hash) => {
  console.log(hash);
});
```

### 6. ログイン
ブラウザで `http://localhost:3000` にアクセスし、作成したユーザーでログインします。

## 開発

### バックエンド開発
```bash
cd backend
npm run dev      # 開発サーバー（ホットリロード）
npm run build    # ビルド
npm start        # 本番サーバー起動
npm test         # テスト実行
```

### フロントエンド開発
```bash
cd frontend
npm run dev      # 開発サーバー
npm run build    # ビルド
npm start        # 本番サーバー起動
npm run lint     # リント実行
```

## デプロイ

### バックエンド
```bash
cd backend
npm run build
npm start
```

環境変数を本番環境に合わせて設定してください。

### フロントエンド
```bash
cd frontend
npm run build
npm start
```

または、Vercelなどのホスティングサービスにデプロイできます。

## API仕様
バックエンドのAPIエンドポイントは以下の通りです:

- **認証**: `/api/v1/auth/*`
- **マスタ管理**: `/api/v1/clients`, `/api/v1/employees`, `/api/v1/partners`, `/api/v1/projects`, `/api/v1/contracts`
- **実績管理**: `/api/v1/assignment-plans`, `/api/v1/work-records`, `/api/v1/monthly-actual-costs`, `/api/v1/expenses`, `/api/v1/revenues`
- **分析・レポート**: `/api/v1/reports/*`, `/api/v1/dashboard/*`

詳細は[backend/README.md](backend/README.md)を参照してください。

## ドキュメント
- [仕様書](specification_transaction_manegement.md) - システム要件と業務フロー
- [設計書](design_transaction_management.md) - アーキテクチャ、データベース設計、API設計
- [バックエンドREADME](backend/README.md) - バックエンドのセットアップと開発ガイド
- [フロントエンドREADME](frontend/README.md) - フロントエンドのセットアップと開発ガイド

## ライセンス
MIT

## サポート
問題が発生した場合は、Issueを作成してください。
