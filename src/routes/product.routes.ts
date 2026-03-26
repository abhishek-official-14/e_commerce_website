import { Router } from 'express';
import {
  createProduct,
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
  getProductsSchema,
  productIdParamSchema,
  purchaseProductSchema,
  updateProductSchema
} from '../validators/product.validator';

const router = Router();

router.get('/', validateRequest(getProductsSchema), getAllProducts);
router.get('/:id', validateRequest(productIdParamSchema), getSingleProduct);
router.post('/:id/purchase', auth('user', 'admin'), validateRequest(purchaseProductSchema), purchaseProduct);

router.post('/', auth('admin'), upload.array('images', 5), validateRequest(createProductSchema), createProduct);
router.patch('/:id', auth('admin'), upload.array('images', 5), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', auth('admin'), validateRequest(productIdParamSchema), deleteProduct);

export default router;
