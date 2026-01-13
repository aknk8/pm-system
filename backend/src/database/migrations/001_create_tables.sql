-- ============================================================
-- 取引管理システム データベーススキーマ
-- Version: 1.0.0
-- Description: マスタテーブル、トランザクションテーブル、システムテーブルの作成
-- ============================================================

-- ============================================================
-- 1. マスタテーブル
-- ============================================================

-- 1.1 顧客マスタ
CREATE TABLE IF NOT EXISTS clients (
    client_id SERIAL PRIMARY KEY,
    client_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    payment_terms TEXT,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_tel VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_deleted ON clients(deleted_at);

-- 1.2 社員マスタ
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(50),
    email VARCHAR(255),
    hire_date DATE,
    standard_unit_cost DECIMAL(10, 2),
    standard_unit_cost_currency VARCHAR(3) DEFAULT 'JPY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_deleted ON employees(deleted_at);

-- 1.3 社員標準単価履歴テーブル
CREATE TABLE IF NOT EXISTS employee_cost_history (
    history_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    standard_unit_cost DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_history_employee ON employee_cost_history(employee_id);
CREATE INDEX idx_cost_history_period ON employee_cost_history(effective_from, effective_to);

-- 1.4 プロジェクトマスタ
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_code VARCHAR(20) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(client_id),
    pm_employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    name VARCHAR(200) NOT NULL,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('コンサル', 'テスト', 'ライセンス')),
    start_date DATE NOT NULL,
    end_date DATE,
    contract_amount DECIMAL(15, 2),
    budget_revenue DECIMAL(15, 2),
    budget_cost DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT '進行中' CHECK (status IN ('進行中', '完了', '一時停止', 'キャンセル')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_pm ON projects(pm_employee_id);
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_service_type ON projects(service_type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deleted ON projects(deleted_at);

-- 1.5 契約テーブル
CREATE TABLE IF NOT EXISTS contracts (
    contract_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    contract_number VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contract_amount DECIMAL(15, 2) NOT NULL,
    contract_status VARCHAR(20) DEFAULT '締結済' CHECK (contract_status IN ('締結済', '交渉中', 'キャンセル', '期限切れ')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_status ON contracts(contract_status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
CREATE INDEX idx_contracts_deleted ON contracts(deleted_at);

-- 1.6 外部パートナーマスタ
CREATE TABLE IF NOT EXISTS partners (
    partner_id SERIAL PRIMARY KEY,
    partner_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    contract_unit_price DECIMAL(10, 2) NOT NULL,
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
CREATE INDEX idx_partners_deleted ON partners(deleted_at);

-- ============================================================
-- 2. トランザクションテーブル
-- ============================================================

-- 2.1 予定・アサイン計画
CREATE TABLE IF NOT EXISTS assignment_plans (
    plan_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('employee', 'partner')),
    employee_id INTEGER REFERENCES employees(employee_id),
    partner_id INTEGER REFERENCES partners(partner_id),
    target_month DATE NOT NULL,
    planned_hours DECIMAL(6, 2) NOT NULL,
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
CREATE INDEX idx_plans_deleted ON assignment_plans(deleted_at);

-- 2.2 稼働実績
CREATE TABLE IF NOT EXISTS work_records (
    record_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('employee', 'partner')),
    employee_id INTEGER REFERENCES employees(employee_id),
    partner_id INTEGER REFERENCES partners(partner_id),
    work_date DATE NOT NULL,
    hours DECIMAL(6, 2) NOT NULL,
    import_batch_id VARCHAR(50),
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

-- 2.3 人件費実績
CREATE TABLE IF NOT EXISTS monthly_actual_costs (
    cost_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    target_month DATE NOT NULL,
    total_salary DECIMAL(12, 2) NOT NULL,
    total_work_hours DECIMAL(8, 2) NOT NULL,
    calculated_unit_cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, target_month)
);

CREATE INDEX idx_actual_costs_employee_month ON monthly_actual_costs(employee_id, target_month);

-- 2.4 経費・仕入実績
CREATE TABLE IF NOT EXISTS expense_records (
    expense_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    occurred_date DATE NOT NULL,
    description TEXT,
    invoice_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_expense_project_date ON expense_records(project_id, occurred_date);
CREATE INDEX idx_expense_type ON expense_records(expense_type);
CREATE INDEX idx_expense_deleted ON expense_records(deleted_at);

-- 2.5 売上実績
CREATE TABLE IF NOT EXISTS revenue_records (
    revenue_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    revenue_month DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    allocation_type VARCHAR(20) DEFAULT 'monthly' CHECK (allocation_type IN ('monthly', 'one_time')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, revenue_month)
);

CREATE INDEX idx_revenue_project_month ON revenue_records(project_id, revenue_month);

-- ============================================================
-- 3. システムテーブル
-- ============================================================

-- 3.1 ユーザー管理
CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX idx_users_active ON users(is_active);

-- 3.2 監査ログ
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- 3.3 CSV取込ログ
CREATE TABLE IF NOT EXISTS csv_import_logs (
    log_id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_type VARCHAR(50) NOT NULL,
    total_rows INTEGER,
    success_rows INTEGER,
    error_rows INTEGER,
    error_details JSONB,
    imported_by INTEGER REFERENCES users(user_id),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed'))
);

CREATE INDEX idx_import_log_batch ON csv_import_logs(batch_id);
CREATE INDEX idx_import_log_status ON csv_import_logs(status, imported_at);

-- ============================================================
-- 4. ビュー
-- ============================================================

-- 4.1 プロジェクト損益ビュー（標準原価ベース）
CREATE OR REPLACE VIEW v_project_profit_standard AS
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
    COALESCE(SUM(DISTINCT r.amount), 0) AS revenue,
    COALESCE(SUM(CASE
        WHEN wr.resource_type = 'employee'
        THEN wr.hours * emp.standard_unit_cost
        ELSE 0
    END), 0) AS cost_labor_standard,
    COALESCE(SUM(CASE
        WHEN wr.resource_type = 'partner'
        THEN wr.hours * prt.contract_unit_price
        ELSE 0
    END), 0) AS cost_partner,
    COALESCE(SUM(exp.amount), 0) AS cost_other,
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

-- ============================================================
-- 5. トリガー関数（updated_atの自動更新）
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガーの作成
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_plans_updated_at BEFORE UPDATE ON assignment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_records_updated_at BEFORE UPDATE ON work_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_actual_costs_updated_at BEFORE UPDATE ON monthly_actual_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_records_updated_at BEFORE UPDATE ON expense_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_records_updated_at BEFORE UPDATE ON revenue_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
