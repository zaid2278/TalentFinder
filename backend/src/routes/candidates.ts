import { Router } from 'express';
import { candidateController } from '../controllers/candidateController.js';
import { requireTenant } from '../middleware/requireTenant.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Parse-only endpoint (no tenant required; does not create a candidate)
router.post('/parse-cv', upload.single('cv'), candidateController.parseCv);

router.use(requireTenant);

router.get('/', candidateController.list);
router.post('/', upload.single('cv'), candidateController.create);
router.get('/:id', candidateController.getById);
router.put('/:id', upload.single('cv'), candidateController.update);
router.delete('/:id', candidateController.remove);

export default router;
