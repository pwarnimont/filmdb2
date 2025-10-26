import createHttpError from 'http-errors';

import {authService} from '../services/auth.service';

jest.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn().mockResolvedValue(true)
}));

const {prisma} = jest.requireMock('../config/prisma');
const {hashPassword, verifyPassword} = jest.requireMock('../utils/password');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user when email is available', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: 'hashed-password',
      role: 'USER',
      isActive: true
    });

    const result = await authService.register('user@test.com', 'password123');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({where: {email: 'user@test.com'}});
    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result).toEqual({id: 'user-1', email: 'user@test.com', role: 'USER'});
  });

  it('throws conflict when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true
    });

    await expect(authService.register('user@test.com', 'password123')).rejects.toBeInstanceOf(
      createHttpError.HttpError
    );
  });

  it('validates credentials successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: 'hashed-password',
      role: 'USER',
      isActive: true
    });

    const result = await authService.validateCredentials('user@test.com', 'password123');

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(verifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(result).toMatchObject({
      id: 'user-1',
      email: 'user@test.com'
    });
  });
});
