import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Partner, PaginationParams } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const getPartners = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, per_page = 20, search } = req.query as PaginationParams & { search?: string };
  const offset = (Number(page) - 1) * Number(per_page);

  let query = 'SELECT * FROM partners WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    query += ' AND (name ILIKE $1 OR partner_code ILIKE $1 OR company_name ILIKE $1)';
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    query.replace('SELECT *', 'SELECT COUNT(*)')
  );
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(per_page, offset);

  const result = await pool.query<Partner>(query, params);

  const response: ApiResponse = {
    success: true,
    data: result.rows,
    meta: {
      total,
      page: Number(page),
      per_page: Number(per_page)
    }
  };

  res.json(response);
});

export const getPartnerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Partner>(
    'SELECT * FROM partners WHERE partner_id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'パートナーが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});

export const createPartner = asyncHandler(async (req: Request, res: Response) => {
  const {
    partner_code,
    name,
    company_name,
    contract_unit_price,
    contract_unit,
    contract_unit_currency = 'JPY',
    contact_email,
    contact_tel
  } = req.body;

  if (!partner_code || !name || !company_name || !contract_unit_price || !contract_unit) {
    throw new AppError(400, 'VALIDATION_ERROR', '必須項目が入力されていません');
  }

  const result = await pool.query<Partner>(
    `INSERT INTO partners (
      partner_code, name, company_name, contract_unit_price, contract_unit,
      contract_unit_currency, contact_email, contact_tel
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [partner_code, name, company_name, contract_unit_price, contract_unit, contract_unit_currency, contact_email, contact_tel]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.status(201).json(response);
});

export const updatePartner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    partner_code,
    name,
    company_name,
    contract_unit_price,
    contract_unit,
    contact_email,
    contact_tel
  } = req.body;

  const result = await pool.query<Partner>(
    `UPDATE partners SET
      partner_code = COALESCE($1, partner_code),
      name = COALESCE($2, name),
      company_name = COALESCE($3, company_name),
      contract_unit_price = COALESCE($4, contract_unit_price),
      contract_unit = COALESCE($5, contract_unit),
      contact_email = COALESCE($6, contact_email),
      contact_tel = COALESCE($7, contact_tel)
    WHERE partner_id = $8 AND deleted_at IS NULL
    RETURNING *`,
    [partner_code, name, company_name, contract_unit_price, contract_unit, contact_email, contact_tel, id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'パートナーが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});

export const deletePartner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Partner>(
    'UPDATE partners SET deleted_at = CURRENT_TIMESTAMP WHERE partner_id = $1 AND deleted_at IS NULL RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'パートナーが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'パートナーを削除しました' }
  };

  res.json(response);
});
