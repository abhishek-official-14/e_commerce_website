import { Router } from 'express';
import { addItemToCart, getMyCart, removeItemFromCart, updateCartItemQuantity } from '../controllers/cart.controller';
import { auth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { addToCartSchema, removeFromCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();

router.use(auth('user', 'admin'));
router.get('/me', getMyCart);
router.post('/items', validateRequest(addToCartSchema), addItemToCart);
router.patch('/items', validateRequest(updateCartItemSchema), updateCartItemQuantity);
router.delete('/items/:productId', validateRequest(removeFromCartSchema), removeItemFromCart);

export default router;
