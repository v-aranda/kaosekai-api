import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Ensures the authenticated user has one of the allowed roles.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ message: 'Forbidden.' });
      return;
    }

    next();
  };
};
