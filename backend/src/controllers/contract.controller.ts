import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Contract } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const getContracts = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query<Contract>('SELECT * FROM contracts WHERE deleted_at IS NULL ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

export const getContractById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query<Contract>('SELECT * FROM contracts WHERE contract_id = $1 AND deleted_at IS NULL', [id]);
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', '契約が見つかりません');
  res.json({ success: true, data: result.rows[0] });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const { project_id, contract_number, start_date, end_date, contract_amount, contract_status, description } = req.body;
  const result = await pool.query<Contract>(
    `INSERT INTO contracts (project_id, contract_number, start_date, end_date, contract_amount, contract_status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [project_id, contract_number, start_date, end_date, contract_amount, contract_status || '締結済', description]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { contract_number, start_date, end_date, contract_amount, contract_status, description } = req.body;
  const result = await pool.query<Contract>(
    `UPDATE contracts SET contract_number = COALESCE($1, contract_number), start_date = COALESCE($2, start_date),
     end_date = COALESCE($3, end_date), contract_amount = COALESCE($4, contract_amount), contract_status = COALESCE($5, contract_status),
     description = COALESCE($6, description) WHERE contract_id = $7 AND deleted_at IS NULL RETURNING *`,
    [contract_number, start_date, end_date, contract_amount, contract_status, description, id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'NOT_FOUND', '契約が見つかりません');
  res.json({ success: true, data: result.rows[0] });
});

export const deleteContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('UPDATE contracts SET deleted_at = CURRENT_TIMESTAMP WHERE contract_id = $1', [id]);
  res.json({ success: true, data: { message: '契約を削除しました' } });
});
