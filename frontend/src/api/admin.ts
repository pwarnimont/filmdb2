import client from './client';
import type {AdminUserSummary, UserRole} from '../types/api';

export async function fetchRegistrationSetting(): Promise<{allowRegistration: boolean}> {
  const {data} = await client.get<{allowRegistration: boolean}>('/admin/settings/registration');
  return data;
}

export async function updateRegistrationSetting(allowRegistration: boolean): Promise<{
  allowRegistration: boolean;
}> {
  const {data} = await client.put<{allowRegistration: boolean}>(
    '/admin/settings/registration',
    {
      allowRegistration
    }
  );
  return data;
}

interface UpdateAdminUserPayload {
  role?: UserRole;
  isActive?: boolean;
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const {data} = await client.get<{users: AdminUserSummary[]}>('/admin/users');
  return data.users;
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload
): Promise<AdminUserSummary> {
  const {data} = await client.put<{user: AdminUserSummary}>(`/admin/users/${id}`, payload);
  return data.user;
}

export async function resetAdminUserPassword(id: string, password: string): Promise<void> {
  await client.put(`/admin/users/${id}/password`, {password});
}
