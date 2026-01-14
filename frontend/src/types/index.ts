export interface User {
  user_id: number;
  username: string;
  role: 'admin' | 'manager' | 'user';
  employee_id?: number;
}

export interface Client {
  client_id: number;
  client_code: string;
  name: string;
  industry?: string;
  payment_terms?: string;
  contact_person?: string;
  contact_email?: string;
  contact_tel?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  employee_id: number;
  employee_code: string;
  name: string;
  name_kana?: string;
  department?: string;
  position?: string;
  email?: string;
  hire_date?: string;
  standard_unit_cost?: number;
  standard_unit_cost_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  partner_id: number;
  partner_code: string;
  name: string;
  company_name: string;
  contract_unit_price: number;
  contract_unit: '時給' | '日額' | '月額';
  contract_unit_currency: string;
  contact_email?: string;
  contact_tel?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  project_id: number;
  project_code: string;
  client_id: number;
  pm_employee_id: number;
  name: string;
  service_type: 'コンサル' | 'テスト' | 'ライセンス';
  start_date: string;
  end_date?: string;
  contract_amount?: number;
  budget_revenue?: number;
  budget_cost?: number;
  status: '進行中' | '完了' | '一時停止' | 'キャンセル';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  contract_id: number;
  project_id: number;
  contract_number: string;
  start_date: string;
  end_date?: string;
  contract_amount: number;
  contract_status: '締結済' | '交渉中' | 'キャンセル' | '期限切れ';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectProfit {
  project_id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  pm_name: string;
  service_type: string;
  revenue: number;
  cost_labor: number;
  cost_partner: number;
  cost_other: number;
  total_cost: number;
  profit: number;
  profit_rate: number;
}

export interface ProjectProfitReport {
  project_id: number;
  project_code: string;
  project_name: string;
  client_id: number;
  client_name: string;
  pm_employee_id: number;
  pm_name: string;
  service_type: string;
  contract_amount: number | null;
  revenue: number | null;
  cost_labor_standard: number | null;
  cost_partner: number | null;
  cost_other: number | null;
  profit_standard: number | null;
}

export interface ClientRevenueReport {
  client_id: number;
  client_name: string;
  total_revenue: number | null;
}

export interface AssignmentPlan {
  plan_id: number;
  project_id: number;
  resource_type: 'employee' | 'partner';
  employee_id?: number | null;
  partner_id?: number | null;
  target_month: string;
  planned_hours: number;
  created_at: string;
  updated_at: string;
}

export interface WorkRecord {
  record_id: number;
  project_id: number;
  resource_type: 'employee' | 'partner';
  employee_id?: number | null;
  partner_id?: number | null;
  work_date: string;
  hours: number;
  import_batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyActualCost {
  cost_id: number;
  employee_id: number;
  target_month: string;
  total_salary: number;
  total_work_hours: number;
  calculated_unit_cost?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRecord {
  expense_id: number;
  project_id: number;
  expense_type: string;
  amount: number;
  currency: string;
  occurred_date: string;
  description?: string;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueRecord {
  revenue_id: number;
  project_id: number;
  revenue_month: string;
  amount: number;
  currency: string;
  allocation_type: 'monthly' | 'one_time';
  description?: string;
  created_at: string;
  updated_at: string;
}
