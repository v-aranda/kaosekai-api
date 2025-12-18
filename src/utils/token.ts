import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export const generateToken = (userId: number, tokenHash: string): string => {
  // Garantimos que o valor seja tratado como o tipo esperado pela biblioteca
  const expiresIn = (process.env.JWT_EXPIRES_IN || '30d') as SignOptions['expiresIn'];
  
  return jwt.sign(
    { userId, tokenHash },
    process.env.JWT_SECRET!,
    { expiresIn }
  );
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};