import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import {hashPassword} from '../utils/password';

import type {AdminUserUpdateInput} from '../schemas/admin.schema';
import type {UserRole} from '../types/user';

export interface AdminUserDto {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDto(user: {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

async function ensureAnotherActiveAdmin(excludeUserId: string): Promise<void> {
  const otherAdmin = await prisma.user.findFirst({
    where: {
      id: {not: excludeUserId},
      role: 'ADMIN',
      isActive: true
    }
  });

  if (!otherAdmin) {
    throw createHttpError(400, 'At least one active admin is required');
  }
}

class AdminUserService {
  async listUsers(): Promise<AdminUserDto[]> {
    const users = await prisma.user.findMany({
      orderBy: {createdAt: 'asc'}
    });
    return users.map(toDto);
  }

  async updateUser(id: string, data: AdminUserUpdateInput, actingUserId: string): Promise<AdminUserDto> {
    const existing = await prisma.user.findUnique({where: {id}});
    if (!existing) {
      throw createHttpError(404, 'User not found');
    }

    if (existing.id === actingUserId && data.isActive === false) {
      throw createHttpError(400, 'You cannot disable your own account');
    }

    if (existing.role === 'ADMIN') {
      const willDeactivate = data.isActive === false;
      const willDemote = data.role === 'USER';
      if ((willDeactivate || willDemote) && existing.id !== actingUserId) {
        await ensureAnotherActiveAdmin(existing.id);
      }

      if ((willDeactivate || willDemote) && existing.id === actingUserId) {
        await ensureAnotherActiveAdmin(existing.id);
      }
    }

    const updated = await prisma.user.update({
      where: {id},
      data: {
        role: data.role ?? existing.role,
        isActive: data.isActive ?? existing.isActive
      }
    });

    return toDto(updated);
  }

  async resetPassword(id: string, password: string): Promise<void> {
    const existing = await prisma.user.findUnique({where: {id}});
    if (!existing) {
      throw createHttpError(404, 'User not found');
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: {id},
      data: {passwordHash}
    });
  }
}

export const adminUserService = new AdminUserService();
