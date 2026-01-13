import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/error-handler';

export const getWorkRecords = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM work_records ORDER BY work_date DESC LIMIT 100');
  res.json({ success: true, data: result.rows });
});

export const importWorkRecords = asyncHandler(async (req: Request, res: Response) => {
  // CSV import logic will be implemented here
  res.json({ success: true, data: { message: 'CSV取込機能は実装予定です' } });
});

export const createWorkRecord = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, resource_type, employee_id, partner_id, work_date, hours } = req.body;
  const result = await pool.query(
    `INSERT INTO work_records (project_id, resource_type, employee_id, partner_id, work_date, hours)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [project_id, resource_type, employee_id, partner_id, work_date, hours]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateWorkRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { hours } = req.body;
  const result = await pool.query(
    'UPDATE work_records SET hours = $1 WHERE record_id = $2 RETURNING *',
    [hours, id]
  );
  res.json({ success: true, data: result.rows[0] });
});

export const deleteWorkRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM work_records WHERE record_id = $1', [id]);
  res.json({ success: true, data: { message: '稼働実績を削除しました' } });
});
