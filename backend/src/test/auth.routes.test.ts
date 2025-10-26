import request from 'supertest';

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

const {authService} = jest.requireMock('../services/auth.service');
const {settingsService} = jest.requireMock('../services/settings.service');

describe('Auth routes', () => {
  let app: typeof import('../app').default;

  beforeAll(() => {
    app = require('../app').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns allowRegistration config', async () => {
    settingsService.getAllowRegistration.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/auth/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({allowRegistration: false});
  });

  it('logs in user and returns payload', async () => {
    authService.validateCredentials.mockResolvedValue({
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
