# 取引管理システム 設計書

## 1. システム概要

### 1.1 目的
ITコンサルティング、テストアウトソーシング、ライセンス販売という「ストック・フロー・労働集約」が混在するビジネスモデルを、一つのシステムで統合管理する。

### 1.2 システム範囲
- マスタデータ管理（クライアント、プロジェクト、社員、パートナー）
- 実績データ管理（予定、稼働実績、給与実績、売上実績、経費）
- 損益分析（プロジェクト別、PM別、クライアント別）
- レポート・ダッシュボード

### 1.3 非機能要件
- レスポンスタイム: 画面操作は2秒以内、レポート生成は30秒以内
- 可用性: 営業時間内（平日9:00-18:00）の稼働率99%以上
- セキュリティ: 認証・認可機能（JWT）、パスワードハッシュ化（bcrypt）
- 拡張性: 将来的な機能追加に対応可能な設計
- 保守性: コードの可読性、テスト容易性を考慮

---

## 2. システムアーキテクチャ

### 2.1 全体構成
```
┌─────────────────────────────────────────────────────────┐
│                    クライアント層                        │
│  Webブラウザ (Next.js/React)                            │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS
┌───────────────────┴─────────────────────────────────────┐
│                   アプリケーション層                      │
│  REST API Server (Node.js/Express)                      │
│    - マスタ管理                                           │
│    - 実績管理                                             │
│    - 分析・レポート                                       │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│                     データ層                              │
│  PostgreSQL (主データベース)                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技術スタック選定理由

#### フロントエンド
- **Next.js (React)**: 
  - サーバーサイドレンダリング対応で初期表示が高速
  - 豊富なUIコンポーネントライブラリ（Material-UI等）が利用可能
  - TypeScript対応で型安全性を確保

#### バックエンド
- **Node.js/Express**:
  - JavaScriptでフロントエンドと統一、非同期処理に優れる
  - RESTful APIの構築が容易

#### データベース
- **PostgreSQL**:
  - ACID特性を満たすRDBMS
  - JSON型のサポートで柔軟なデータ構造に対応
  - トランザクション管理が重要（給与実績の登録など）
  - 集計関数が豊富でレポート生成に適している

#### キャッシュ
- 現行実装ではキャッシュは未導入

---

## 3. データベース設計

### 3.1 ER図
仕様書のER図を基に、詳細なテーブル設計を行う。

### 3.2 テーブル定義

#### 3.2.1 マスタテーブル

##### clients (顧客マスタ)
```sql
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    client_code VARCHAR(20) UNIQUE NOT NULL,  -- 顧客コード
    name VARCHAR(200) NOT NULL,                -- 顧客名
    industry VARCHAR(100),                     -- 業界
    payment_terms TEXT,                        -- 支払条件
    contact_person VARCHAR(100),               -- 担当者
    contact_email VARCHAR(255),                -- メールアドレス
    contact_tel VARCHAR(20),                   -- 電話番号
    address TEXT,                              -- 住所
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP                       -- 論理削除
);

CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_name ON clients(name);
```

##### projects (プロジェクトマスタ)
```sql
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_code VARCHAR(20) UNIQUE NOT NULL,  -- プロジェクトコード
    client_id INTEGER NOT NULL REFERENCES clients(client_id),
    pm_employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    name VARCHAR(200) NOT NULL,                -- プロジェクト名
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('コンサル', 'テスト', 'ライセンス')),
    start_date DATE NOT NULL,                  -- 開始日
    end_date DATE,                             -- 終了日
    contract_amount DECIMAL(15, 2),            -- 受注金額
    budget_revenue DECIMAL(15, 2),             -- 予算売上
    budget_cost DECIMAL(15, 2),                -- 予算原価
    status VARCHAR(20) DEFAULT '進行中' CHECK (status IN ('進行中', '完了', '一時停止', 'キャンセル')),
    description TEXT,                          -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_pm ON projects(pm_employee_id);
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_service_type ON projects(service_type);
```

##### contracts (契約テーブル)
```sql
CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    contract_number VARCHAR(50) NOT NULL,          -- 契約枝番/契約番号
    start_date DATE NOT NULL,                      -- 契約開始日
    end_date DATE,                                 -- 契約終了日
    contract_amount DECIMAL(15, 2) NOT NULL,       -- 契約金額（売上）
    contract_status VARCHAR(20) DEFAULT '締結済' CHECK (contract_status IN ('締結済', '交渉中', 'キャンセル', '期限切れ')),
    description TEXT,                              -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_status ON contracts(contract_status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
```

**注意:** 1プロジェクトに対し複数の契約を管理できます。これにより、追加契約や契約更新を適切に管理できます。

##### employees (社員マスタ)
```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL, -- 社員コード
    name VARCHAR(100) NOT NULL,                -- 氏名
    name_kana VARCHAR(100),                    -- フリガナ
    department VARCHAR(100),                   -- 所属部署
    position VARCHAR(50),                      -- 役職
    email VARCHAR(255),
    hire_date DATE,                            -- 入社日
    standard_unit_cost DECIMAL(10, 2),         -- 標準単価(/h) - 現在の単価
    standard_unit_cost_currency VARCHAR(3) DEFAULT 'JPY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_department ON employees(department);

-- 標準単価履歴テーブル（3世代保持）
CREATE TABLE employee_cost_history (
    history_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    standard_unit_cost DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,              -- 適用開始日
    effective_to DATE,                         -- 適用終了日
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_history_employee ON employee_cost_history(employee_id);
CREATE INDEX idx_cost_history_period ON employee_cost_history(effective_from, effective_to);
```

##### partners (外部パートナーマスタ)
```sql
CREATE TABLE partners (
    partner_id SERIAL PRIMARY KEY,
    partner_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,                -- 氏名
    company_name VARCHAR(200) NOT NULL,        -- 所属会社
    contract_unit_price DECIMAL(10, 2) NOT NULL, -- 契約単価
    contract_unit VARCHAR(20) NOT NULL CHECK (contract_unit IN ('時給', '日額', '月額')),
    contract_unit_currency VARCHAR(3) DEFAULT 'JPY',
    contact_email VARCHAR(255),
    contact_tel VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_partners_code ON partners(partner_code);
CREATE INDEX idx_partners_name ON partners(name);
CREATE INDEX idx_partners_company ON partners(company_name);
```

#### 3.2.2 トランザクションテーブル

##### assignment_plans (予定・アサイン計画)
```sql
CREATE TABLE assignment_plans (
    plan_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('employee', 'partner')),
    employee_id INTEGER REFERENCES employees(employee_id),
    partner_id INTEGER REFERENCES partners(partner_id),
    target_month DATE NOT NULL,                -- 対象年月（月初日）
    planned_hours DECIMAL(6, 2) NOT NULL,      -- 計画工数（時間）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT check_resource_type CHECK (
        (resource_type = 'employee' AND employee_id IS NOT NULL AND partner_id IS NULL) OR
        (resource_type = 'partner' AND partner_id IS NOT NULL AND employee_id IS NULL)
    )
);

CREATE INDEX idx_plans_project_month ON assignment_plans(project_id, target_month);
CREATE INDEX idx_plans_employee ON assignment_plans(employee_id, target_month);
CREATE INDEX idx_plans_partner ON assignment_plans(partner_id, target_month);
```

##### work_records (稼働実績)
```sql
CREATE TABLE work_records (
    record_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('employee', 'partner')),
    employee_id INTEGER REFERENCES employees(employee_id),
    partner_id INTEGER REFERENCES partners(partner_id),
    work_date DATE NOT NULL,                   -- 稼働日
    hours DECIMAL(6, 2) NOT NULL,              -- 稼働時間
    import_batch_id VARCHAR(50),               -- CSV取込バッチID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_resource_type_work CHECK (
        (resource_type = 'employee' AND employee_id IS NOT NULL AND partner_id IS NULL) OR
        (resource_type = 'partner' AND partner_id IS NOT NULL AND employee_id IS NULL)
    )
);

CREATE INDEX idx_work_project_date ON work_records(project_id, work_date);
CREATE INDEX idx_work_employee_date ON work_records(employee_id, work_date);
CREATE INDEX idx_work_partner_date ON work_records(partner_id, work_date);
CREATE INDEX idx_work_batch ON work_records(import_batch_id);
```

##### monthly_actual_costs (人件費実績)
```sql
CREATE TABLE monthly_actual_costs (
    cost_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    target_month DATE NOT NULL,                -- 対象年月（月初日）
    total_salary DECIMAL(12, 2) NOT NULL,      -- 総支給額（実績給与）
    total_work_hours DECIMAL(8, 2) NOT NULL,   -- 月間総労働時間
    calculated_unit_cost DECIMAL(10, 4),       -- 算出単価（総支給額/総労働時間）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, target_month)
);

CREATE INDEX idx_actual_costs_employee_month ON monthly_actual_costs(employee_id, target_month);
```

##### expense_records (経費・仕入実績)
```sql
CREATE TABLE expense_records (
    expense_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    expense_type VARCHAR(50) NOT NULL,         -- 費目（ライセンス仕入/旅費/その他）
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    occurred_date DATE NOT NULL,               -- 発生日
    description TEXT,                          -- 備考
    invoice_number VARCHAR(100),               -- 請求書番号
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_expense_project_date ON expense_records(project_id, occurred_date);
CREATE INDEX idx_expense_type ON expense_records(expense_type);
```

##### revenue_records (売上実績 - 全サービス種別の月次売上実績)
```sql
CREATE TABLE revenue_records (
    revenue_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    revenue_month DATE NOT NULL,               -- 売上計上月（月初日）
    amount DECIMAL(12, 2) NOT NULL,            -- 売上金額
    currency VARCHAR(3) DEFAULT 'JPY',
    allocation_type VARCHAR(20) DEFAULT 'monthly' CHECK (allocation_type IN ('monthly', 'one_time')),
    description TEXT,                          -- 備考
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, revenue_month)          -- 同じプロジェクト・同じ月の重複防止
);

CREATE INDEX idx_revenue_project_month ON revenue_records(project_id, revenue_month);
```

#### 3.2.3 システムテーブル

##### users (ユーザー管理)
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    employee_id INTEGER REFERENCES employees(employee_id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_employee ON users(employee_id);
```

##### audit_logs (監査ログ)
```sql
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,               -- 操作種別
    table_name VARCHAR(100),                   -- 対象テーブル
    record_id INTEGER,                         -- 対象レコードID
    old_values JSONB,                          -- 変更前の値
    new_values JSONB,                          -- 変更後の値
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
```

##### csv_import_logs (CSV取込ログ)
```sql
CREATE TABLE csv_import_logs (
    log_id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_type VARCHAR(50) NOT NULL,          -- 'work_record'など
    total_rows INTEGER,
    success_rows INTEGER,
    error_rows INTEGER,
    error_details JSONB,                       -- エラー詳細
    imported_by INTEGER REFERENCES users(user_id),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed'))
);

CREATE INDEX idx_import_log_batch ON csv_import_logs(batch_id);
CREATE INDEX idx_import_log_status ON csv_import_logs(status, imported_at);
```

### 3.3 ビュー定義

#### プロジェクト損益ビュー（標準原価ベース）
```sql
CREATE VIEW v_project_profit_standard AS
SELECT 
    p.project_id,
    p.project_code,
    p.name AS project_name,
    p.client_id,
    c.name AS client_name,
    p.pm_employee_id,
    e.name AS pm_name,
    p.service_type,
    p.contract_amount,
    -- 売上（実績データから集計）
    COALESCE(SUM(DISTINCT r.amount), 0) AS revenue,
    -- 直接原価（人件費：標準原価ベース）
    COALESCE(SUM(CASE 
        WHEN wr.resource_type = 'employee' 
        THEN wr.hours * emp.standard_unit_cost 
        ELSE 0 
    END), 0) AS cost_labor_standard,
    -- 直接原価（外部パートナー）
    COALESCE(SUM(CASE 
        WHEN wr.resource_type = 'partner' 
        THEN wr.hours * prt.contract_unit_price 
        ELSE 0 
    END), 0) AS cost_partner,
    -- 直接原価（その他経費）
    COALESCE(SUM(exp.amount), 0) AS cost_other,
    -- 利益
    COALESCE(SUM(DISTINCT r.amount), 0) 
    - COALESCE(SUM(CASE WHEN wr.resource_type = 'employee' THEN wr.hours * emp.standard_unit_cost ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN wr.resource_type = 'partner' THEN wr.hours * prt.contract_unit_price ELSE 0 END), 0)
    - COALESCE(SUM(exp.amount), 0) AS profit_standard
FROM projects p
LEFT JOIN clients c ON p.client_id = c.client_id
LEFT JOIN employees e ON p.pm_employee_id = e.employee_id
LEFT JOIN revenue_records r ON p.project_id = r.project_id
LEFT JOIN work_records wr ON p.project_id = wr.project_id
LEFT JOIN employees emp ON wr.employee_id = emp.employee_id
LEFT JOIN partners prt ON wr.partner_id = prt.partner_id
LEFT JOIN expense_records exp ON p.project_id = exp.project_id
WHERE p.deleted_at IS NULL
GROUP BY p.project_id, p.project_code, p.name, p.client_id, c.name, 
         p.pm_employee_id, e.name, p.service_type, p.contract_amount;
```

---

## 4. API設計

### 4.1 API設計方針
- RESTful API設計を採用
- JSON形式でのデータ送受信
- 認証: JWT (JSON Web Token)
- バージョニング: `/api/v1/` プレフィックス

### 4.2 主要APIエンドポイント

#### 4.2.1 認証API
```
POST   /api/v1/auth/login          # ログイン
POST   /api/v1/auth/logout         # ログアウト
POST   /api/v1/auth/refresh        # トークンリフレッシュ
```

#### 4.2.2 マスタ管理API

##### クライアント管理
```
GET    /api/v1/clients             # 一覧取得
GET    /api/v1/clients/:id         # 詳細取得
POST   /api/v1/clients             # 作成
PUT    /api/v1/clients/:id         # 更新
DELETE /api/v1/clients/:id         # 削除（論理削除）
```

##### プロジェクト管理
```
GET    /api/v1/projects            # 一覧取得
GET    /api/v1/projects/:id        # 詳細取得
POST   /api/v1/projects            # 作成
PUT    /api/v1/projects/:id        # 更新
DELETE /api/v1/projects/:id        # 削除
```

##### 契約管理
```
GET    /api/v1/contracts                    # 一覧取得
GET    /api/v1/contracts/:id                # 詳細取得
POST   /api/v1/contracts                    # 作成
PUT    /api/v1/contracts/:id                # 更新
DELETE /api/v1/contracts/:id                # 削除（論理削除）
```

##### 社員マスタ管理
```
GET    /api/v1/employees           # 一覧取得
GET    /api/v1/employees/:id       # 詳細取得
POST   /api/v1/employees           # 作成
PUT    /api/v1/employees/:id       # 更新
DELETE /api/v1/employees/:id       # 削除
```

##### パートナーマスタ管理
```
GET    /api/v1/partners            # 一覧取得
GET    /api/v1/partners/:id        # 詳細取得
POST   /api/v1/partners            # 作成
PUT    /api/v1/partners/:id        # 更新
DELETE /api/v1/partners/:id        # 削除
```

#### 4.2.3 実績管理API

##### 予定・アサイン計画
```
GET    /api/v1/assignment-plans              # 一覧取得
POST   /api/v1/assignment-plans              # 登録
PUT    /api/v1/assignment-plans/:id          # 更新
DELETE /api/v1/assignment-plans/:id          # 削除
```

##### 勤務実績CSVインポート
```
POST   /api/v1/work-records/import           # CSV取込（現行はメッセージ返却のみ）
GET    /api/v1/work-records                  # 実績一覧取得
POST   /api/v1/work-records                  # 実績登録
PUT    /api/v1/work-records/:id              # 実績更新（稼働時間のみ）
DELETE /api/v1/work-records/:id              # 実績削除
```

##### 月次給与実績
```
GET    /api/v1/monthly-actual-costs          # 一覧取得
POST   /api/v1/monthly-actual-costs          # 登録
PUT    /api/v1/monthly-actual-costs/:id      # 更新
DELETE /api/v1/monthly-actual-costs/:id      # 削除
```

##### 経費・仕入実績
```
GET    /api/v1/expenses                      # 一覧取得
GET    /api/v1/expenses/:id                  # 詳細取得
POST   /api/v1/expenses                      # 登録
PUT    /api/v1/expenses/:id                  # 更新
DELETE /api/v1/expenses/:id                  # 削除
```

##### 売上実績
```
GET    /api/v1/revenues                      # 一覧取得
POST   /api/v1/revenues                      # 登録
PUT    /api/v1/revenues/:id                  # 更新
DELETE /api/v1/revenues/:id                  # 削除
```

#### 4.2.4 分析・レポートAPI

##### プロジェクト損益レポート
```
GET    /api/v1/reports/projects/:id/profit   # プロジェクト損益取得
```

##### PM別損益レポート
```
GET    /api/v1/reports/pm/:employee_id/profit  # PM別損益取得
```

##### クライアント別収益レポート
```
GET    /api/v1/reports/clients/:id/revenue     # クライアント別収益取得
```

##### 稼働・コスト乖離分析
現行実装では未対応

##### ダッシュボード
```
GET    /api/v1/dashboard/summary               # サマリー情報取得
GET    /api/v1/dashboard/pm-ranking            # PM別利益ランキング
GET    /api/v1/dashboard/alerts                # アラート情報（赤字プロジェクト等）
```

### 4.3 APIレスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // データ
  }
}
```
※ 現行実装では `meta` は未使用

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラー",
    "details": [
      {
        "field": "name",
        "message": "名前は必須です"
      }
    ]
  }
}
```

### 4.4 認証・認可

#### JWT認証フロー
1. ユーザーがログイン（username/password）
2. サーバーがJWTトークンを発行
3. クライアントが以降のリクエストでトークンをヘッダーに含める
   - `Authorization: Bearer <token>`
4. サーバーがトークンを検証し、ユーザー情報を取得

#### ロールベースアクセス制御（RBAC）
- **admin**: 全機能アクセス可能
- **manager**: マスタ管理、実績管理、レポート閲覧
- **user**: 実績登録、自身のデータ閲覧のみ

---

## 5. 画面設計

### 5.1 画面一覧

#### 5.1.1 認証画面
- ログイン画面

#### 5.1.2 マスタ管理画面
- クライアント管理画面
- プロジェクト管理画面
- **契約管理画面**
- 社員マスタ管理画面
- パートナーマスタ管理画面

#### 5.1.3 実績管理画面
- 予定・アサイン計画画面
- 稼働実績画面
- 月次給与実績登録画面
- 売上実績画面
- 経費実績画面

#### 5.1.4 分析・レポート画面
- 総合ダッシュボード
- プロジェクト別損益レポート
- PM別損益レポート
- クライアント別収益レポート

### 5.2 主要画面の詳細設計

#### 5.2.1 総合ダッシュボード
**機能:**
- サマリー表示（総売上、進行中プロジェクト数）
- 各管理/レポート画面へのナビゲーション

#### 5.2.2 プロジェクト別損益レポート
**機能:**
- プロジェクト選択による損益サマリー表示（標準原価ベース）

**表示項目:**
- クライアント
- PM
- サービス種別
- 契約金額
- 売上
- 労務原価（標準）
- 外注費
- その他原価
- 利益（標準）

#### 5.2.3 勤務実績CSVインポート画面
現行実装では未対応（APIはメッセージ返却のみ）

#### 5.2.4 月次売上実績登録画面
**機能:**
- 売上実績の登録・編集・一覧表示
- 配賦種別（monthly/one_time）の指定

**表示項目:**
- プロジェクト
- 対象月
- 金額
- 配賦種別
- 通貨

**機能詳細:**
- 一覧表示: テーブル形式で売上実績を表示
- 新規登録/編集: モーダルで登録
- 削除: 確認ダイアログ

#### 5.2.5 契約管理画面
**機能:**
- 契約情報の登録・編集・一覧表示
- 契約ステータス管理

**表示項目:**
- プロジェクト
- 契約番号
- 契約開始日・契約終了日
- 契約金額
- 契約ステータス

**機能詳細:**
- 一覧表示: テーブル形式で契約情報を表示
- 新規登録/編集: モーダルで登録
- 削除: 確認ダイアログ

## 6. ビジネスロジック設計

### 6.1 コスト計算ロジック

#### 6.1.1 標準原価ベース計算
```javascript
// プロジェクトの標準原価（人件費）計算
function calculateStandardCost(projectId, startDate, endDate) {
  const workRecords = getWorkRecords(projectId, startDate, endDate);
  
  let totalCost = 0;
  for (const record of workRecords) {
    if (record.resource_type === 'employee') {
      const employee = getEmployee(record.employee_id);
      totalCost += record.hours * employee.standard_unit_cost;
    }
  }
  
  return totalCost;
}
```

#### 6.1.2 人件費実績ベース計算
現行実装では未対応（標準原価ベースのみ）

### 6.2 売上実績管理ロジック

#### 6.2.1 月次売上実績登録
全てのサービス種別で月次の売上実績を登録する。
現行実装では単純登録のみ行い、重複チェックや自動按分は未対応。

#### 6.2.2 ライセンス販売の自動按分（補助機能）
現行実装では未対応

#### 6.2.3 契約ベースの自動按分（補助機能）
現行実装では未対応

### 6.3 CSVインポート処理
現行実装では未対応（APIはメッセージ返却のみ）

### 6.4 損益計算ロジック
現行実装では DB ビュー `v_project_profit_standard` を用いた標準原価ベースの損益のみを提供。

## 7. セキュリティ設計

### 7.1 認証・認可
- JWT（JSON Web Token）による認証
- パスワードはbcrypt等でハッシュ化
- セッションタイムアウト: 8時間
- ロールベースアクセス制御（RBAC）

### 7.2 データ保護
- HTTPS通信の強制
- パスワード等の機密情報は環境変数で管理
- SQLインジェクション対策: プリペアドステートメント使用
- XSS対策: 入力値のサニタイズ、出力時のエスケープ

### 7.3 監査ログ
現行実装では未対応

### 7.4 バックアップ
- データベースの日次バックアップ
- バックアップの保持期間: 30日間

---

## 8. パフォーマンス設計

### 8.1 データベース最適化
- 適切なインデックス設定
- クエリの最適化（N+1問題の回避等）
- ビューの活用（集計処理の高速化）

### 8.2 キャッシュ戦略
現行実装では未対応

### 8.3 ページネーション
現行実装では未対応（一覧は全件取得/表示）

## 9. エラーハンドリング

### 9.1 エラー分類
- **バリデーションエラー**: 入力値の検証エラー（400 Bad Request）
- **認証エラー**: 認証失敗（401 Unauthorized）
- **認可エラー**: 権限不足（403 Forbidden）
- **リソース不存在エラー**: 指定されたIDのリソースが存在しない（404 Not Found）
- **サーバーエラー**: システム内部エラー（500 Internal Server Error）

### 9.2 エラーログ
- エラー発生時はログに記録
- ログレベル: ERROR、WARN、INFO、DEBUG
- ログローテーション: 日次

---

## 10. テスト設計

詳細は `test_plan.md` を参照。

---

## 11. デプロイ設計

### 11.1 環境構成
- **開発環境**: ローカル開発環境
- **ステージング環境**: 本番環境と同等の構成
- **本番環境**: 本番運用環境

### 11.2 デプロイ方法
- コンテナ化（Docker）を推奨
- CI/CDパイプラインの構築（GitHub Actions等）
- デプロイフロー:
  1. コードコミット
  2. 自動テスト実行
  3. ビルド
  4. ステージング環境へデプロイ
  5. 本番環境へデプロイ（承認後）

### 11.3 インフラ構成案
現行実装はローカル単一構成（Next.js + Express + PostgreSQL）を前提。

## 12. 開発フェーズ

### フェーズ1: 基盤構築（2週間）
- プロジェクトセットアップ
- データベース設計・構築
- 認証機能の実装
- 開発環境構築

### フェーズ2: マスタ管理機能（3週間）
- クライアント管理
- プロジェクト管理
- **契約管理**
- 社員マスタ管理
- パートナーマスタ管理

### フェーズ3: 実績管理機能（4週間）
- 予定・アサイン登録
- 給与実績登録
- **月次売上実績登録**
- 経費登録

### フェーズ4: 分析・レポート機能（4週間）
- プロジェクト損益レポート
- PM別・クライアント別レポート
- ダッシュボード

### フェーズ5: テスト・デプロイ（2週間）
- 結合テスト
- パフォーマンステスト
- 本番環境構築
- デプロイ

---

## 13. 課題への対応

### 13.1 CSVの名寄せ
現行実装では未対応

### 13.2 標準原価の履歴管理
- `employee_cost_history`テーブルで履歴を保持
- 履歴は3世代保持（最新を含めて3件）
- 過去の実績データには遡及しない（当時の単価を使用）

### 13.3 月次売上実績の管理
現行実装では手動で売上実績を登録。自動按分は未対応。

## 14. 今後の拡張性

### 14.1 検討事項
- 多通貨対応
- 複数組織（会社）対応
- モバイルアプリ対応
- データエクスポート機能（Excel、PDF）
- スケジュール機能（予定工数の自動計算）
- 通知機能（メール、Slack連携）

---

## 付録A: 用語集

- **標準原価**: 社員ごとに設定された標準的な時給単価
- **実績原価**: 実際の給与支給額から算出した時給単価
- **按分**: 金額や時間を複数のプロジェクトや期間に分配すること
- **名寄せ**: 異なるデータソース間で同一の実体を特定すること

---

## 付録B: 参考資料

- 仕様書: `specification_transaction_manegement.md`
- ER図: 仕様書内のPlantUML定義を参照
