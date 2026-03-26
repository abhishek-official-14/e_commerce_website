import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', auth('admin'), getDashboardStats);

export default router;
