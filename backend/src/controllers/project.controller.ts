import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Project } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query<Project>('SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query<Project>('SELECT * FROM projects WHERE project_id = $1 AND deleted_at IS NULL', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'プロジェクトが見つかりません');
  res.json({ success: true, data: result.rows[0] });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { project_code, client_id, pm_employee_id, name, service_type, start_date, end_date, contract_amount, budget_revenue, budget_cost, status, description } = req.body;
  const result = await pool.query<Project>(
    `INSERT INTO projects (project_code, client_id, pm_employee_id, name, service_type, start_date, end_date, contract_amount, budget_revenue, budget_cost, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [project_code, client_id, pm_employee_id, name, service_type, start_date, end_date, contract_amount, budget_revenue, budget_cost, status || '進行中', description]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { project_code, client_id, pm_employee_id, name, service_type, start_date, end_date, contract_amount, budget_revenue, budget_cost, status, description } = req.body;
  const result = await pool.query<Project>(
    `UPDATE projects SET project_code = COALESCE($1, project_code), client_id = COALESCE($2, client_id), pm_employee_id = COALESCE($3, pm_employee_id),
     name = COALESCE($4, name), service_type = COALESCE($5, service_type), start_date = COALESCE($6, start_date), end_date = COALESCE($7, end_date),
     contract_amount = COALESCE($8, contract_amount), budget_revenue = COALESCE($9, budget_revenue), budget_cost = COALESCE($10, budget_cost),
     status = COALESCE($11, status), description = COALESCE($12, description)
     WHERE project_id = $13 AND deleted_at IS NULL RETURNING *`,
    [project_code, client_id, pm_employee_id, name, service_type, start_date, end_date, contract_amount, budget_revenue, budget_cost, status, description, id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', 'プロジェクトが見つかりません');
  res.json({ success: true, data: result.rows[0] });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = $1', [id]);
  res.json({ success: true, data: { message: 'プロジェクトを削除しました' } });
});
