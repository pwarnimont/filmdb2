import {UserRolePayload} from '../types/user';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      currentUser?: UserRolePayload;
    }
  }
}

export {};
