import { Router } from 'express';
import { submissionController } from '../controllers/submissionController.js';
import { requireTenant } from '../middleware/requireTenant.js';

const router = Router();

router.use(requireTenant);

router.get('/', submissionController.list);

export default router;