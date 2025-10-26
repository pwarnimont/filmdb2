import createHttpError from 'http-errors';

import type {AdminUserCreateInput, AdminUserUpdateInput} from '../schemas/admin.schema';
import type {UserRole} from '../types/user';
import {prisma} from '../config/prisma';
import {hashPassword} from '../utils/password';

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDto(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
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

  async createUser(data: AdminUserCreateInput): Promise<AdminUserDto> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({where: {email: normalizedEmail}});
    if (existing) {
      throw createHttpError(409, 'A user with this email already exists');
    }

    const role = data.role ?? 'USER';
    const isActive = data.isActive ?? true;
    const passwordHash = await hashPassword(data.password);
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = normalizedEmail;
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        isActive
      }
    });

    return toDto(created);
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

    const trimmedFirst = data.firstName?.trim();
    const trimmedLast = data.lastName?.trim();

    const updated = await prisma.user.update({
      where: {id},
      data: {
        firstName: trimmedFirst ? trimmedFirst : existing.firstName,
        lastName: trimmedLast ? trimmedLast : existing.lastName,
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

  async deleteUser(id: string, actingUserId: string): Promise<void> {
    const existing = await prisma.user.findUnique({where: {id}});
    if (!existing) {
      throw createHttpError(404, 'User not found');
    }

    if (existing.id === actingUserId) {
      throw createHttpError(400, 'You cannot delete your own account');
    }

    if (existing.role === 'ADMIN' && existing.isActive) {
      await ensureAnotherActiveAdmin(existing.id);
    }

    await prisma.user.delete({where: {id}});
  }
}

export const adminUserService = new AdminUserService();
