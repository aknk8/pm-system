import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Employee, EmployeeCostHistory, PaginationParams } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, per_page = 20, search, department } = req.query as PaginationParams & { search?: string; department?: string };
  const offset = (Number(page) - 1) * Number(per_page);

  let query = 'SELECT * FROM employees WHERE deleted_at IS NULL';
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (name ILIKE $${paramIndex} OR employee_code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (department) {
    query += ` AND department = $${paramIndex}`;
    params.push(department);
    paramIndex++;
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(per_page, offset);

  const result = await pool.query<Employee>(query, params);

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

export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Employee>(
    'SELECT * FROM employees WHERE employee_id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', '社員が見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const {
    employee_code,
    name,
    name_kana,
    department,
    position,
    email,
    hire_date,
    standard_unit_cost,
    standard_unit_cost_currency = 'JPY'
  } = req.body;

  if (!employee_code || !name) {
    throw new AppError(400, 'VALIDATION_ERROR', '社員コードと名前は必須です');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<Employee>(
      `INSERT INTO employees (
        employee_code, name, name_kana, department, position, email, hire_date,
        standard_unit_cost, standard_unit_cost_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [employee_code, name, name_kana, department, position, email, hire_date, standard_unit_cost, standard_unit_cost_currency]
    );

    const employee = result.rows[0];

    if (standard_unit_cost) {
      await client.query(
        `INSERT INTO employee_cost_history (employee_id, standard_unit_cost, effective_from)
         VALUES ($1, $2, CURRENT_DATE)`,
        [employee.employee_id, standard_unit_cost]
      );
    }

    await client.query('COMMIT');

    const response: ApiResponse = {
      success: true,
      data: employee
    };

    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employee_code,
    name,
    name_kana,
    department,
    position,
    email,
    hire_date,
    standard_unit_cost
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query<Employee>(
      'SELECT * FROM employees WHERE employee_id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (currentResult.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', '社員が見つかりません');
    }

    const currentEmployee = currentResult.rows[0];

    const result = await client.query<Employee>(
      `UPDATE employees SET
        employee_code = COALESCE($1, employee_code),
        name = COALESCE($2, name),
        name_kana = COALESCE($3, name_kana),
        department = COALESCE($4, department),
        position = COALESCE($5, position),
        email = COALESCE($6, email),
        hire_date = COALESCE($7, hire_date),
        standard_unit_cost = COALESCE($8, standard_unit_cost)
      WHERE employee_id = $9 AND deleted_at IS NULL
      RETURNING *`,
      [employee_code, name, name_kana, department, position, email, hire_date, standard_unit_cost, id]
    );

    if (standard_unit_cost && standard_unit_cost !== currentEmployee.standard_unit_cost) {
      await client.query(
        `UPDATE employee_cost_history SET effective_to = CURRENT_DATE
         WHERE employee_id = $1 AND effective_to IS NULL`,
        [id]
      );

      await client.query(
        `INSERT INTO employee_cost_history (employee_id, standard_unit_cost, effective_from)
         VALUES ($1, $2, CURRENT_DATE)`,
        [id, standard_unit_cost]
      );

      const historyCount = await client.query(
        `SELECT COUNT(*) FROM employee_cost_history WHERE employee_id = $1`,
        [id]
      );

      if (parseInt(historyCount.rows[0].count) > 3) {
        await client.query(
          `DELETE FROM employee_cost_history
           WHERE history_id IN (
             SELECT history_id FROM employee_cost_history
             WHERE employee_id = $1
             ORDER BY effective_from ASC
             LIMIT 1
           )`,
          [id]
        );
      }
    }

    await client.query('COMMIT');

    const response: ApiResponse = {
      success: true,
      data: result.rows[0]
    };

    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<Employee>(
    'UPDATE employees SET deleted_at = CURRENT_TIMESTAMP WHERE employee_id = $1 AND deleted_at IS NULL RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', '社員が見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: { message: '社員を削除しました' }
  };

  res.json(response);
});

export const getCostHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query<EmployeeCostHistory>(
    `SELECT * FROM employee_cost_history
     WHERE employee_id = $1
     ORDER BY effective_from DESC`,
    [id]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
});

export const addCostHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { standard_unit_cost, effective_from } = req.body;

  if (!standard_unit_cost || !effective_from) {
    throw new AppError(400, 'VALIDATION_ERROR', '標準単価と適用開始日は必須です');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE employee_cost_history SET effective_to = $1
       WHERE employee_id = $2 AND effective_to IS NULL AND effective_from < $1`,
      [effective_from, id]
    );

    const result = await client.query<EmployeeCostHistory>(
      `INSERT INTO employee_cost_history (employee_id, standard_unit_cost, effective_from)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, standard_unit_cost, effective_from]
    );

    await client.query(
      `UPDATE employees SET standard_unit_cost = $1 WHERE employee_id = $2`,
      [standard_unit_cost, id]
    );

    await client.query('COMMIT');

    const response: ApiResponse = {
      success: true,
      data: result.rows[0]
    };

    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
