import {Router} from 'express';

import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import filmRollRoutes from './film-roll.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/film-rolls', filmRollRoutes);
router.use('/admin', adminRoutes);

export default router;
