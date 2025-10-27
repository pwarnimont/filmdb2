import {Router} from 'express';

import {createPrint, deletePrint, getPrint, listPrints, updatePrint} from '../controllers/print.controller';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listPrints);
router.post('/', createPrint);
router.get('/:id', getPrint);
router.put('/:id', updatePrint);
router.delete('/:id', deletePrint);

export default router;
