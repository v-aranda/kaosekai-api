import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tokenHash?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthenticated.' });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({ message: 'Unauthenticated.' });
      return;
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      tokenHash: string;
    };

    // Check if token exists in database and is not expired
    const tokenRecord = await prisma.token.findUnique({
      where: { token: decoded.tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      res.status(401).json({ message: 'Unauthenticated.' });
      return;
    }

    // Check if token is expired
    if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ message: 'Unauthenticated.' });
      return;
    }

    // Update last_used_at
    await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach user to request
    req.user = {
      id: Number(tokenRecord.user.id),
      name: tokenRecord.user.name,
      email: tokenRecord.user.email,
    };
    req.tokenHash = decoded.tokenHash;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthenticated.' });
  }
};
