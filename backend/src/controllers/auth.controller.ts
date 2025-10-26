import type {Request, Response} from 'express';
import createHttpError from 'http-errors';

import {authService} from '../services/auth.service';
import {settingsService} from '../services/settings.service';
import {loginSchema, registerSchema} from '../schemas/auth.schema';
import {asyncHandler} from '../utils/async-handler';
import {setAuthCookies, clearAuthCookies} from '../utils/cookies';
import {signAccessToken, signRefreshToken, verifyRefreshToken} from '../utils/token';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const allowRegistration = await settingsService.getAllowRegistration();
  if (!allowRegistration) {
    throw createHttpError(403, 'Registration is disabled');
  }

  const input = registerSchema.parse(req.body);
  const user = await authService.register(input.email, input.password, input.firstName, input.lastName);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, {accessToken, refreshToken});

  res.status(201).json({
    user,
    tokens: {accessToken}
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await authService.validateCredentials(input.email, input.password);

  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  setAuthCookies(res, {accessToken, refreshToken});
  res.json({
    user: payload,
    tokens: {accessToken}
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.status(204).send();
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) {
    throw createHttpError(401, 'Refresh token missing');
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await authService.getUserById(payload.id);
  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  const accessToken = signAccessToken(user);
  const newRefresh = signRefreshToken(user);
  setAuthCookies(res, {accessToken, refreshToken: newRefresh});

  res.json({
    user,
    tokens: {accessToken}
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.currentUser) {
    throw createHttpError(401, 'Authentication required');
  }
  const user = await authService.getUserById(req.currentUser.id);
  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  res.json({user});
});

export const getAuthConfig = asyncHandler(async (_req: Request, res: Response) => {
  const allowRegistration = await settingsService.getAllowRegistration();
  res.json({allowRegistration});
});
