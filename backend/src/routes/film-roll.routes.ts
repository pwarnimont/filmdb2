import {Router} from 'express';

import {
  createFilmRoll,
  deleteDevelopment,
  deleteFilmRoll,
  getFilmRoll,
  listFilmRolls,
  markDeveloped,
  updateFilmRoll,
  upsertDevelopment
} from '../controllers/film-roll.controller';
import {requireAuth} from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listFilmRolls);
router.post('/', createFilmRoll);
router.get('/:id', getFilmRoll);
router.put('/:id', updateFilmRoll);
router.delete('/:id', deleteFilmRoll);
router.post('/:id/mark-developed', markDeveloped);
router.post('/:id/development', upsertDevelopment);
router.put('/:id/development', upsertDevelopment);
router.delete('/:id/development', deleteDevelopment);

export default router;
