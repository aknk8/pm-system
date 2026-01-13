// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}

// User & Auth Types
export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  employee_id?: number;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  user_id: number;
  username: string;
  role: string;
}

// Master Data Types
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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Employee {
  employee_id: number;
  employee_code: string;
  name: string;
  name_kana?: string;
  department?: string;
  position?: string;
  email?: string;
  hire_date?: Date;
  standard_unit_cost?: number;
  standard_unit_cost_currency: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface EmployeeCostHistory {
  history_id: number;
  employee_id: number;
  standard_unit_cost: number;
  effective_from: Date;
  effective_to?: Date;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Project {
  project_id: number;
  project_code: string;
  client_id: number;
  pm_employee_id: number;
  name: string;
  service_type: 'コンサル' | 'テスト' | 'ライセンス';
  start_date: Date;
  end_date?: Date;
  contract_amount?: number;
  budget_revenue?: number;
  budget_cost?: number;
  status: '進行中' | '完了' | '一時停止' | 'キャンセル';
  description?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Contract {
  contract_id: number;
  project_id: number;
  contract_number: string;
  start_date: Date;
  end_date?: Date;
  contract_amount: number;
  contract_status: '締結済' | '交渉中' | 'キャンセル' | '期限切れ';
  description?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Transaction Data Types
export interface AssignmentPlan {
  plan_id: number;
  project_id: number;
  resource_type: 'employee' | 'partner';
  employee_id?: number;
  partner_id?: number;
  target_month: Date;
  planned_hours: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface WorkRecord {
  record_id: number;
  project_id: number;
  resource_type: 'employee' | 'partner';
  employee_id?: number;
  partner_id?: number;
  work_date: Date;
  hours: number;
  import_batch_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyActualCost {
  cost_id: number;
  employee_id: number;
  target_month: Date;
  total_salary: number;
  total_work_hours: number;
  calculated_unit_cost?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseRecord {
  expense_id: number;
  project_id: number;
  expense_type: string;
  amount: number;
  currency: string;
  occurred_date: Date;
  description?: string;
  invoice_number?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface RevenueRecord {
  revenue_id: number;
  project_id: number;
  revenue_month: Date;
  amount: number;
  currency: string;
  allocation_type: 'monthly' | 'one_time';
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// System Types
export interface AuditLog {
  log_id: number;
  user_id?: number;
  action: string;
  table_name?: string;
  record_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: Date;
}

export interface CSVImportLog {
  log_id: number;
  batch_id: string;
  file_name: string;
  import_type: string;
  total_rows?: number;
  success_rows?: number;
  error_rows?: number;
  error_details?: any;
  imported_by?: number;
  imported_at: Date;
  status: 'processing' | 'completed' | 'failed';
}

// Report Types
export interface ProjectProfit {
  project_id: number;
  project_code: string;
  project_name: string;
  client_id: number;
  client_name: string;
  pm_employee_id: number;
  pm_name: string;
  service_type: string;
  contract_amount?: number;
  revenue: number;
  cost_labor: number;
  cost_partner: number;
  cost_other: number;
  total_cost: number;
  profit: number;
  profit_rate: number;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

export interface ProjectFilters extends PaginationParams, DateRangeParams {
  client_id?: number;
  pm_employee_id?: number;
  service_type?: string;
  status?: string;
}
