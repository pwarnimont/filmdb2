import jwt from 'jsonwebtoken';

import env from '../config/env';
import {UserRolePayload} from '../types/user';

export interface TokenPayload extends UserRolePayload {
  type: 'access' | 'refresh';
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export function signAccessToken(user: UserRolePayload): string {
  const payload: TokenPayload = {...user, type: 'access'};
  return jwt.sign(payload, env.jwtSecret, {expiresIn: ACCESS_TOKEN_TTL});
}

export function signRefreshToken(user: UserRolePayload): string {
  const payload: TokenPayload = {...user, type: 'refresh'};
  return jwt.sign(payload, env.jwtRefreshSecret, {expiresIn: REFRESH_TOKEN_TTL});
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid access token');
  }
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return payload;
}
