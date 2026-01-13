import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { ApiResponse, User } from '../types';
import { AppError, asyncHandler } from '../middleware/error-handler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'ユーザー名とパスワードは必須です');
  }

  const result = await pool.query<User>(
    'SELECT * FROM users WHERE username = $1 AND is_active = true',
    [username]
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'ユーザー名またはパスワードが間違っています');
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'ユーザー名またはパスワードが間違っています');
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';

  const token = jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      role: user.role
    },
    secret,
    { expiresIn: '8h' } as SignOptions
  );

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        employee_id: user.employee_id
      }
    }
  };

  res.json(response);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: { message: 'ログアウトしました' }
  };

  res.json(response);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', '認証が必要です');
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';

  try {
    const decoded = jwt.verify(token, secret) as any;

    const newToken = jwt.sign(
      {
        user_id: decoded.user_id,
        username: decoded.username,
        role: decoded.role
      },
      secret,
      { expiresIn: '8h' } as SignOptions
    );

    const response: ApiResponse = {
      success: true,
      data: { token: newToken }
    };

    res.json(response);
  } catch (error) {
    throw new AppError(401, 'INVALID_TOKEN', '無効なトークンです');
  }
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', '認証が必要です');
  }

  const result = await pool.query<User>(
    `SELECT user_id, username, employee_id, role, is_active, last_login_at, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [req.user.user_id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'ユーザーが見つかりません');
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
});
