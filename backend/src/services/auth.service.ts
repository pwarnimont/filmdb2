import createHttpError from 'http-errors';

import type {UserRolePayload} from '../types/user';
import {prisma} from '../config/prisma';
import {hashPassword, verifyPassword} from '../utils/password';

class AuthService {
  async register(email: string, password: string, firstName: string, lastName: string): Promise<UserRolePayload> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({where: {email: normalizedEmail}});
    if (existing) {
      throw createHttpError(409, 'Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    };
  }

  async validateCredentials(
    email: string,
    password: string
  ): Promise<UserRolePayload & {passwordHash: string}> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({where: {email: normalizedEmail}});
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
      firstName: user.firstName,
      lastName: user.lastName,
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
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    };
  }

  async getUserIncludingInactive(id: string): Promise<(UserRolePayload & {isActive: boolean}) | null> {
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    };
  }
}

export const authService = new AuthService();
