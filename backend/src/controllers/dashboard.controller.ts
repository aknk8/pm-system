import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const revenueResult = await pool.query('SELECT SUM(amount) AS total_revenue FROM revenue_records');
  const projectsResult = await pool.query('SELECT COUNT(*) AS total_projects FROM projects WHERE deleted_at IS NULL AND status = $1', ['進行中']);

  res.json({
    success: true,
    data: {
      total_revenue: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
      total_projects: parseInt(projectsResult.rows[0]?.total_projects || 0)
    }
  });
});

export const getPMRanking = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT pm_employee_id, pm_name, SUM(profit_standard) AS total_profit
     FROM v_project_profit_standard
     GROUP BY pm_employee_id, pm_name
     ORDER BY total_profit DESC
     LIMIT 10`
  );

  res.json({ success: true, data: result.rows });
});

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT project_id, project_code, project_name, profit_standard
     FROM v_project_profit_standard
     WHERE profit_standard < 0
     ORDER BY profit_standard ASC`
  );

  res.json({ success: true, data: result.rows });
});
