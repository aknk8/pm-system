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
