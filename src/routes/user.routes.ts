import { Router } from 'express';
import {
  addAddress,
  addToWishlist,
  deleteAddress,
  getAllUsers,
  getMyProfile,
  getMyWishlist,
  removeFromWishlist,
  updateAddress,
  updateUserBlockStatus
} from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  addressIdParamSchema,
  createAddressSchema,
  productIdParamSchema,
  updateAddressSchema,
  updateUserBlockStatusSchema
} from '../validators/user.validator';

const router = Router();

router.get('/me', auth('user', 'admin'), getMyProfile);
router.get('/wishlist', auth('user', 'admin'), getMyWishlist);
router.post('/wishlist/:productId', auth('user', 'admin'), validateRequest(productIdParamSchema), addToWishlist);
router.delete('/wishlist/:productId', auth('user', 'admin'), validateRequest(productIdParamSchema), removeFromWishlist);

router.post('/addresses', auth('user', 'admin'), validateRequest(createAddressSchema), addAddress);
router.patch('/addresses/:addressId', auth('user', 'admin'), validateRequest(updateAddressSchema), updateAddress);
router.delete('/addresses/:addressId', auth('user', 'admin'), validateRequest(addressIdParamSchema), deleteAddress);

router.get('/', auth('admin'), getAllUsers);
router.patch('/:id/block-status', auth('admin'), validateRequest(updateUserBlockStatusSchema), updateUserBlockStatus);

export default router;
