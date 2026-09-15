import { Router } from 'express';
import { skillController } from '../controllers/skillController.js';

const router = Router();

router.get('/', skillController.list);

export default router;