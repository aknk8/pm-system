import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getAssignmentPlans = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM assignment_plans WHERE deleted_at IS NULL ORDER BY target_month DESC');
  res.json({ success: true, data: result.rows });
});

export const createAssignmentPlan = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, resource_type, employee_id, partner_id, target_month, planned_hours } = req.body;
  const result = await pool.query(
    `INSERT INTO assignment_plans (project_id, resource_type, employee_id, partner_id, target_month, planned_hours)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [project_id, resource_type, employee_id, partner_id, target_month, planned_hours]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateAssignmentPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { planned_hours } = req.body;
  const result = await pool.query(
    'UPDATE assignment_plans SET planned_hours = $1 WHERE plan_id = $2 RETURNING *',
    [planned_hours, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

export const deleteAssignmentPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('UPDATE assignment_plans SET deleted_at = CURRENT_TIMESTAMP WHERE plan_id = $1', [id]);
  res.json({ success: true, data: { message: 'アサイン計画を削除しました' } });
});
