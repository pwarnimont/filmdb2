import {Router} from 'express';

import {createUser, listUsers, resetUserPassword, updateUser} from '../controllers/admin-user.controller';
import {getRegistrationSetting, updateRegistrationSetting} from '../controllers/admin.controller';
import {requireAuth} from '../middleware/auth';
import {requireRole} from '../middleware/role';

const router = Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/settings/registration', getRegistrationSetting);
router.put('/settings/registration', updateRegistrationSetting);

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/password', resetUserPassword);

export default router;
