import {Router} from 'express';

import {
  createCamera,
  deleteCamera,
  getCamera,
  listCameras,
  updateCamera
} from '../controllers/camera.controller';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listCameras);
router.post('/', createCamera);
router.get('/:id', getCamera);
router.put('/:id', updateCamera);
router.delete('/:id', deleteCamera);

export default router;
