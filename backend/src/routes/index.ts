import {Router} from 'express';

import authRoutes from './auth.routes';
import filmRollRoutes from './film-roll.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/film-rolls', filmRollRoutes);
router.use('/admin', adminRoutes);

export default router;
