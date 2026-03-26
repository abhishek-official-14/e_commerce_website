import { Router } from 'express';
import { getAllUsers, getMyProfile } from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', auth('user', 'admin'), getMyProfile);
router.get('/', auth('admin'), getAllUsers);

export default router;
