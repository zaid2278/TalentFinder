import { Router } from 'express';
import { jobOrderController } from '../controllers/jobOrderController.js';
import { requireTenant } from '../middleware/requireTenant.js';

const router = Router();

router.use(requireTenant);

router.get('/', jobOrderController.list);
router.post('/', jobOrderController.create);
router.get('/:id/matches/insights', jobOrderController.matchInsights);
router.get('/:id/matches', jobOrderController.matches);
router.post('/:id/shortlist', jobOrderController.shortlist);
router.delete('/:id/shortlist', jobOrderController.unshortlist);
router.get('/:id', jobOrderController.getById);
router.put('/:id', jobOrderController.update);
router.delete('/:id', jobOrderController.remove);

export default router;