import createHttpError from 'http-errors';

import {prisma} from '../config/prisma';
import {hashPassword, verifyPassword} from '../utils/password';
import type {UserRolePayload} from '../types/user';

class AuthService {
  async register(email: string, password: string): Promise<UserRolePayload> {
    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) {
      throw createHttpError(409, 'Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    return {id: user.id, email: user.email, role: user.role, isActive: user.isActive};
  }

  async validateCredentials(
    email: string,
    password: string
  ): Promise<UserRolePayload & {passwordHash: string}> {
    const user = await prisma.user.findUnique({where: {email}});
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw createHttpError(403, 'Account is disabled');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordHash: user.passwordHash
    };
  }

  async getUserById(id: string): Promise<UserRolePayload | null> {
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) {
      return null;
    }
    if (!user.isActive) {
      return null;
    }
    return {id: user.id, email: user.email, role: user.role, isActive: user.isActive};
  }

  async getUserIncludingInactive(id: string): Promise<(UserRolePayload & {isActive: boolean}) | null> {
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) {
      return null;
    }
    return {id: user.id, email: user.email, role: user.role, isActive: user.isActive};
  }
}

export const authService = new AuthService();
