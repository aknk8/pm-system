# セットアップガイド

## クイックスタート

### 前提条件
- Node.js 20以上がインストールされている
- PostgreSQLがインストールされ、起動している
- PostgreSQLに接続できるユーザー（デフォルト: postgres）

### 1. PostgreSQLデータベースの作成

PostgreSQLに接続し、データベースを作成します。

**Windows (コマンドプロンプト or PowerShell):**
```cmd
psql -U postgres
```

**PostgreSQL内で実行:**
```sql
CREATE DATABASE transaction_management;
\q
```

データベースが既に存在する場合はスキップしてください。

### 2. 環境設定の確認

バックエンドの`.env`ファイルが既に作成されています。
PostgreSQLの接続情報を確認・修正してください。

**backend/.env:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transaction_management
DB_USER=postgres
DB_PASSWORD=postgres  ← ここをPostgreSQLのパスワードに変更
```

### 3. データベースのセットアップ

マイグレーション（テーブル作成）と初期データ投入を実行します。

```bash
cd backend
npm run db:setup
```

これにより以下が実行されます：
- テーブル作成（clients, employees, projects, contracts, users等）
- 管理者ユーザーの作成
  - ユーザー名: `admin`
  - パスワード: `admin123`
- サンプルデータの投入

### 4. バックエンドの起動

新しいターミナル/コマンドプロンプトを開いて：

```bash
cd backend
npm run dev
```

`http://localhost:3001` でバックエンドAPIが起動します。

### 5. フロントエンドの起動

さらに別のターミナル/コマンドプロンプトを開いて：

```bash
cd frontend
npm run dev
```

`http://localhost:3000` でフロントエンドが起動します。

### 6. ログイン

ブラウザで `http://localhost:3000` にアクセスし、以下の情報でログインします：

- **ユーザー名**: `admin`
- **パスワード**: `admin123`

## トラブルシューティング

### データベース接続エラー

**エラー:** `connection to database failed`

**解決策:**
1. PostgreSQLが起動していることを確認
   ```bash
   # Windows
   net start postgresql-x64-14  # バージョンは環境に合わせる

   # または、サービスから起動
   services.msc → PostgreSQL を探して起動
   ```

2. `.env`ファイルのDB_PASSWORDが正しいか確認

3. データベースが作成されているか確認
   ```bash
   psql -U postgres -l
   ```

### ポート使用エラー

**エラー:** `Port 3000 is already in use` または `Port 3001 is already in use`

**解決策:**
既に起動しているプロセスを終了するか、別のポートを使用してください。

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <プロセスID> /F
```

### マイグレーションエラー

**エラー:** テーブルが既に存在する

**解決策:**
データベースを削除して再作成：

```sql
DROP DATABASE transaction_management;
CREATE DATABASE transaction_management;
```

その後、`npm run db:setup`を再実行。

## 本番環境デプロイ

### バックエンド

1. ビルド
   ```bash
   cd backend
   npm run build
   ```

2. 環境変数を本番用に設定

3. 起動
   ```bash
   npm start
   ```

### フロントエンド

1. ビルド
   ```bash
   cd frontend
   npm run build
   ```

2. 起動
   ```bash
   npm start
   ```

または、Vercel/Netlifyなどにデプロイ可能です。

## 機能一覧

ログイン後、以下の機能が利用できます：

### マスタ管理
- クライアント管理
- 社員管理（標準原価履歴管理）
- パートナー管理
- プロジェクト管理
- 契約管理

### 実績管理
- アサイン計画
- 稼働実績（CSV取込対応）
- 月次給与実績
- 売上実績
- 経費実績

### 分析・レポート
- ダッシュボード
- プロジェクト別損益（標準原価/実績原価切替）
- PM別分析
- クライアント別収益

詳細は[README.md](README.md)を参照してください。
