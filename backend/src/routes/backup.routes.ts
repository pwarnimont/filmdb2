import {Router} from 'express';

import {exportBackup, importBackup} from '../controllers/backup.controller';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/export', exportBackup);
router.post('/import', importBackup);

export default router;
