import {Router} from 'express';

import {register, login, logout, refresh, getMe, getAuthConfig} from '../controllers/auth.controller';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);

export default router;
