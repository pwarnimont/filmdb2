import type {NextFunction, Request, Response} from 'express';
import createHttpError from 'http-errors';

import type {UserRole} from '../types/user';

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser || req.currentUser.role !== role) {
      return next(createHttpError(403, 'Forbidden'));
    }
    next();
  };
}
