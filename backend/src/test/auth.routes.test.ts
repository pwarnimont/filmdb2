import request from 'supertest';

import app from '../app';
import {authService} from '../services/auth.service';
import {settingsService} from '../services/settings.service';

jest.mock('../services/settings.service', () => ({
  settingsService: {
    getAllowRegistration: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    validateCredentials: jest.fn(),
    getUserById: jest.fn()
  }
}));

jest.mock('../utils/token', () => ({
  signAccessToken: jest.fn().mockReturnValue('access-token'),
  signRefreshToken: jest.fn().mockReturnValue('refresh-token'),
  verifyRefreshToken: jest.fn().mockReturnValue({
    id: 'user-1',
    email: 'user@test.com',
    role: 'USER',
    isActive: true,
    type: 'refresh'
  })
}));

jest.mock('../utils/cookies', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn()
}));

const authServiceMock = authService as jest.Mocked<typeof authService>;
const settingsServiceMock = settingsService as jest.Mocked<typeof settingsService>;

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns allowRegistration config', async () => {
    settingsServiceMock.getAllowRegistration.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/auth/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({allowRegistration: false});
  });

  it('logs in user and returns payload', async () => {
    authServiceMock.validateCredentials.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'USER',
      isActive: true,
      passwordHash: 'hash'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@test.com', password: 'password123'});

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({id: 'user-1', email: 'user@test.com', role: 'USER', isActive: true});
    expect(res.body.tokens.accessToken).toBe('access-token');
  });
});
