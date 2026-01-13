import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getMonthlyCosts = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM monthly_actual_costs ORDER BY target_month DESC');
  res.json({ success: true, data: result.rows });
});

export const createMonthlyCost = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id, target_month, total_salary, total_work_hours } = req.body;
  const calculated_unit_cost = total_salary / total_work_hours;
  const result = await pool.query(
    `INSERT INTO monthly_actual_costs (employee_id, target_month, total_salary, total_work_hours, calculated_unit_cost)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [employee_id, target_month, total_salary, total_work_hours, calculated_unit_cost]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateMonthlyCost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { total_salary, total_work_hours } = req.body;
  const calculated_unit_cost = total_salary / total_work_hours;
  const result = await pool.query(
    `UPDATE monthly_actual_costs SET total_salary = $1, total_work_hours = $2, calculated_unit_cost = $3
     WHERE cost_id = $4 RETURNING *`,
    [total_salary, total_work_hours, calculated_unit_cost, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

export const deleteMonthlyCost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM monthly_actual_costs WHERE cost_id = $1', [id]);
  res.json({ success: true, data: { message: '給与実績を削除しました' } });
});
