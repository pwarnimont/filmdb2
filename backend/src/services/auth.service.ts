import createHttpError from 'http-errors';

import type {UserRolePayload} from '../types/user';
import {prisma} from '../config/prisma';
import {hashPassword, verifyPassword} from '../utils/password';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

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

    if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
      throw createHttpError(429, 'Too many login attempts. Please try again later.');
    }

    if (!user.isActive) {
      throw createHttpError(403, 'Account is disabled');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await prisma.user.update({
          where: {id: user.id},
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
          }
        });
        throw createHttpError(429, 'Too many login attempts. Please try again later.');
      }

      await prisma.user.update({
        where: {id: user.id},
        data: {failedLoginAttempts: attempts}
      });

      throw createHttpError(401, 'Invalid credentials');
    }

    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: {id: user.id},
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null
        }
      });
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
