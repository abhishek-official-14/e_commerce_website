import { Router } from 'express';
import { getAllUsers, getMyProfile, updateUserBlockStatus } from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateUserBlockStatusSchema } from '../validators/user.validator';

const router = Router();

router.get('/me', auth('user', 'admin'), getMyProfile);
router.get('/', auth('admin'), getAllUsers);
router.patch('/:id/block-status', auth('admin'), validateRequest(updateUserBlockStatusSchema), updateUserBlockStatus);

export default router;
