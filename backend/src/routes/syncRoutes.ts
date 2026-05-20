import { Router } from 'express';
import { pullSync, pushSync } from '../controllers/syncController';

const router = Router();

router.get('/pull', pullSync);
router.post('/push', pushSync);

export default router;
