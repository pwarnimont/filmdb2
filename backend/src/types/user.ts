export type UserRole = 'USER' | 'ADMIN';

export interface UserRolePayload {
  id: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}
