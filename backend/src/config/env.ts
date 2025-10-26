import {config} from 'dotenv';

config();

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/filmdb',
  jwtSecret: process.env.JWT_SECRET ?? 'supersecret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'supersecret',
  cookieDomain: process.env.COOKIE_DOMAIN ?? undefined,
  defaultAllowRegistration: process.env.DEFAULT_ALLOW_REGISTRATION !== 'false'
};

export default env;
