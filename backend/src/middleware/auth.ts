import type {NextFunction, Request, Response} from 'express';
import createHttpError from 'http-errors';

import {verifyAccessToken} from '../utils/token';
import {authService} from '../services/auth.service';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      throw createHttpError(401, 'Authentication required');
    }
    const payload = verifyAccessToken(token);
    const user = await authService.getUserIncludingInactive(payload.id);
    if (!user || !user.isActive) {
      throw createHttpError(401, 'Authentication required');
    }
    req.currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    next();
  } catch (error) {
    next(createHttpError(401, 'Authentication required'));
  }
}

export async function attachOptionalUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      return next();
    }
    const payload = verifyAccessToken(token);
    const user = await authService.getUserIncludingInactive(payload.id);
    if (!user || !user.isActive) {
      return next();
    }
    req.currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  } catch (error) {
    // ignore invalid token for optional attach
  }
  next();
}
