import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getRevenues = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM revenue_records ORDER BY revenue_month DESC');
  res.json({ success: true, data: result.rows });
});

export const createRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, revenue_month, amount, currency, allocation_type, description } = req.body;
  const result = await pool.query(
    `INSERT INTO revenue_records (project_id, revenue_month, amount, currency, allocation_type, description)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [project_id, revenue_month, amount, currency || 'JPY', allocation_type || 'monthly', description]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, description } = req.body;
  const result = await pool.query(
    'UPDATE revenue_records SET amount = COALESCE($1, amount), description = COALESCE($2, description) WHERE revenue_id = $3 RETURNING *',
    [amount, description, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

export const deleteRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM revenue_records WHERE revenue_id = $1', [id]);
  res.json({ success: true, data: { message: '売上実績を削除しました' } });
});
