import { Router } from 'express';
import { recruiterController } from '../controllers/recruiterController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', requireAdmin, recruiterController.list);
router.post('/', requireAdmin, recruiterController.create);

export default router;
