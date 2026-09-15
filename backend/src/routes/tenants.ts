import { Router } from 'express';
import { tenantController } from '../controllers/tenantController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', tenantController.list);
router.post('/', requireAdmin, tenantController.create);
router.patch('/:id/status', requireAdmin, tenantController.updateStatus);
router.delete('/:id', requireAdmin, tenantController.remove);

export default router;