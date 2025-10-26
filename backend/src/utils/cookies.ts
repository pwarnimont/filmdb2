import type {Response} from 'express';

import env from '../config/env';

const isProduction = env.nodeEnv === 'production';

export function setAuthCookies(
  res: Response,
  tokens: {accessToken: string; refreshToken: string}
): void {
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
    maxAge: 15 * 60 * 1000,
    domain: env.cookieDomain,
    path: '/'
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: env.cookieDomain,
    path: '/'
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', {
    domain: env.cookieDomain,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
    path: '/'
  });
  res.clearCookie('refreshToken', {
    domain: env.cookieDomain,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
    path: '/'
  });
}
