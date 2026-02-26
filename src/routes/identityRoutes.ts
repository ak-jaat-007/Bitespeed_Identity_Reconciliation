import { Router } from 'express';
import { identifyContact } from '../controllers/identityController.js';

const router = Router();

router.post('/identify', identifyContact);

export default router;