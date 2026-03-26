import { Router } from 'express';
import {
  addOrUpdateReview,
  createProduct,
  deleteMyReview,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  purchaseProduct,
  updateProduct
} from '../controllers/product.controller';
import { auth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createProductSchema,
  createReviewSchema,
  getProductsSchema,
  productIdParamSchema,
  purchaseProductSchema,
  updateProductSchema
} from '../validators/product.validator';

const router = Router();

router.get('/', validateRequest(getProductsSchema), getAllProducts);
router.get('/:id', validateRequest(productIdParamSchema), getSingleProduct);
router.post('/:id/purchase', auth('user', 'admin'), validateRequest(purchaseProductSchema), purchaseProduct);
router.post('/:id/reviews', auth('user', 'admin'), validateRequest(createReviewSchema), addOrUpdateReview);
router.delete('/:id/reviews/me', auth('user', 'admin'), validateRequest(productIdParamSchema), deleteMyReview);

router.post('/', auth('admin'), upload.array('images', 5), validateRequest(createProductSchema), createProduct);
router.patch('/:id', auth('admin'), upload.array('images', 5), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', auth('admin'), validateRequest(productIdParamSchema), deleteProduct);

export default router;
