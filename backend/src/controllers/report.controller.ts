import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getProjectProfit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cost_type = 'standard' } = req.query;

  const result = await pool.query(
    'SELECT * FROM v_project_profit_standard WHERE project_id = $1',
    [id]
  );

  res.json({ success: true, data: result.rows[0] || null });
});

export const getPMProfit = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id } = req.params;

  const result = await pool.query(
    'SELECT * FROM v_project_profit_standard WHERE pm_employee_id = $1',
    [employee_id]
  );

  res.json({ success: true, data: result.rows });
});

export const getClientRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT c.client_id, c.name AS client_name,
     SUM(r.amount) AS total_revenue
     FROM clients c
     LEFT JOIN projects p ON c.client_id = p.client_id
     LEFT JOIN revenue_records r ON p.project_id = r.project_id
     WHERE c.client_id = $1
     GROUP BY c.client_id, c.name`,
    [id]
  );

  res.json({ success: true, data: result.rows[0] || null });
});
