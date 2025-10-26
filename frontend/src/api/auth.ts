import client from './client';
import type {AuthUser} from '../types/api';

interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
  };
}

export async function fetchAuthConfig(): Promise<{allowRegistration: boolean}> {
  const {data} = await client.get<{allowRegistration: boolean}>('/auth/config');
  return data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const {data} = await client.post<AuthResponse>('/auth/login', {email, password});
  return data.user;
}

export async function register(email: string, password: string): Promise<AuthUser> {
  const {data} = await client.post<AuthResponse>('/auth/register', {email, password});
  return data.user;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}

export async function refreshSession(): Promise<AuthUser> {
  const {data} = await client.post<AuthResponse>('/auth/refresh');
  return data.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const {data} = await client.get<{user: AuthUser}>('/auth/me');
    return data.user;
  } catch (error) {
    return null;
  }
}
