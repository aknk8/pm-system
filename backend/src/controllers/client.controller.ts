import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Client, PaginationParams } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, per_page = 20, search } = req.query as PaginationParams & { search?: string };
  const offset = (Number(page) - 1) * Number(per_page);

  let query = 'SELECT * FROM clients WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    query += ' AND (name ILIKE $1 OR client_code ILIKE $1)';
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    query.replace('SELECT *', 'SELECT COUNT(*)')
  );
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(per_page, offset);

  const result = await pool.query<Client>(query, params);

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

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Client>(
    'SELECT * FROM clients WHERE client_id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'クライアントが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const {
    client_code,
    name,
    industry,
    payment_terms,
    contact_person,
    contact_email,
    contact_tel,
    address
  } = req.body;

  if (!client_code || !name) {
    throw new AppError(400, 'VALIDATION_ERROR', 'クライアントコードと名前は必須です');
  }

  const result = await pool.query<Client>(
    `INSERT INTO clients (
      client_code, name, industry, payment_terms, contact_person,
      contact_email, contact_tel, address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [client_code, name, industry, payment_terms, contact_person, contact_email, contact_tel, address]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.status(201).json(response);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    client_code,
    name,
    industry,
    payment_terms,
    contact_person,
    contact_email,
    contact_tel,
    address
  } = req.body;

  const result = await pool.query<Client>(
    `UPDATE clients SET
      client_code = COALESCE($1, client_code),
      name = COALESCE($2, name),
      industry = COALESCE($3, industry),
      payment_terms = COALESCE($4, payment_terms),
      contact_person = COALESCE($5, contact_person),
      contact_email = COALESCE($6, contact_email),
      contact_tel = COALESCE($7, contact_tel),
      address = COALESCE($8, address)
    WHERE client_id = $9 AND deleted_at IS NULL
    RETURNING *`,
    [client_code, name, industry, payment_terms, contact_person, contact_email, contact_tel, address, id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'クライアントが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Client>(
    'UPDATE clients SET deleted_at = CURRENT_TIMESTAMP WHERE client_id = $1 AND deleted_at IS NULL RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'クライアントが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'クライアントを削除しました' }
  };

  res.json(response);
});
