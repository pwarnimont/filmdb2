import {Router} from 'express';

import adminRoutes from './admin.routes';
import backupRoutes from './backup.routes';
import authRoutes from './auth.routes';
import filmRollRoutes from './film-roll.routes';
import printRoutes from './print.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/film-rolls', filmRollRoutes);
router.use('/prints', printRoutes);
router.use('/backups', backupRoutes);
router.use('/admin', adminRoutes);

export default router;
