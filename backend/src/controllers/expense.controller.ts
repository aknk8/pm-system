import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM expense_records WHERE deleted_at IS NULL ORDER BY occurred_date DESC');
  res.json({ success: true, data: result.rows });
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, expense_type, amount, currency, occurred_date, description, invoice_number } = req.body;
  const result = await pool.query(
    `INSERT INTO expense_records (project_id, expense_type, amount, currency, occurred_date, description, invoice_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [project_id, expense_type, amount, currency || 'JPY', occurred_date, description, invoice_number]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { expense_type, amount, occurred_date, description, invoice_number } = req.body;
  const result = await pool.query(
    `UPDATE expense_records SET expense_type = COALESCE($1, expense_type), amount = COALESCE($2, amount),
     occurred_date = COALESCE($3, occurred_date), description = COALESCE($4, description), invoice_number = COALESCE($5, invoice_number)
     WHERE expense_id = $6 RETURNING *`,
    [expense_type, amount, occurred_date, description, invoice_number, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('UPDATE expense_records SET deleted_at = CURRENT_TIMESTAMP WHERE expense_id = $1', [id]);
  res.json({ success: true, data: { message: '経費を削除しました' } });
});
