export type UserRole = 'USER' | 'ADMIN';

export interface UserRolePayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
}
