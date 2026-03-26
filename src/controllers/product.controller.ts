import { Request, Response } from 'express';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';
import { Product } from '../models/product.model';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products'
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new ApiError(500, 'Image upload failed'));
          return;
        }

        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const parseImagesFromBody = (images: unknown): string[] => {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images.map(String);
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.map(String) : [images];
    } catch {
      return [images];
    }
  }

  return [];
};

const getUploadedImageUrls = async (files: Express.Multer.File[] | undefined): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadToCloudinary(file.buffer)));
};

const recomputeRatings = (reviews: { rating: number }[]) => {
  const totalReviews = reviews.length;
  const averageRating = totalReviews === 0 ? 0 : Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(2));
  return { totalReviews, averageRating };
};

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const uploadedImageUrls = await getUploadedImageUrls(req.files as Express.Multer.File[] | undefined);
  const bodyImages = parseImagesFromBody(req.body.images);

  const product = await Product.create({
    ...req.body,
    images: [...bodyImages, ...uploadedImageUrls]
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      ...product.toObject(),
      inStock: product.stock > 0
    }
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const uploadedImageUrls = await getUploadedImageUrls(req.files as Express.Multer.File[] | undefined);
  const bodyImages = parseImagesFromBody(req.body.images);

  const nextImages = bodyImages.length > 0 || uploadedImageUrls.length > 0 ? [...bodyImages, ...uploadedImageUrls] : undefined;

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(nextImages ? { images: nextImages } : {})
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: {
      ...updatedProduct?.toObject(),
      inStock: (updatedProduct?.stock ?? 0) > 0
    }
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);

  if (!deleted) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {
    isActive: true
  };

  if (req.query.search) {
    query.$text = { $search: String(req.query.search) };
  }

  if (req.query.category) {
    query.category = String(req.query.category);
  }

  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {})
    };
  }

  const [products, total] = await Promise.all([
    Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: products.map((product) => ({
      ...product.toObject(),
      inStock: product.stock > 0
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('reviews.user', 'name');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      inStock: product.stock > 0
    }
  });
});

export const purchaseProduct = catchAsync(async (req: Request, res: Response) => {
  const quantity = Number(req.body.quantity ?? 1);

  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock < quantity) {
    throw new ApiError(400, 'Product is out of stock for requested quantity');
  }

  product.stock -= quantity;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Purchase validated and stock updated',
    data: {
      ...product.toObject(),
      inStock: product.stock > 0
    }
  });
});


export const addOrUpdateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('reviews.user', 'name');
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const { rating, comment } = req.body as { rating: number; comment: string };

  const existingReview = product.reviews.find((review) => review.user.toString() === userId);
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.updatedAt = new Date();
  } else {
    product.reviews.push({
      user: userId as any,
      rating,
      comment
    });
  }

  const ratings = recomputeRatings(product.reviews);
  product.totalReviews = ratings.totalReviews;
  product.averageRating = ratings.averageRating;

  await product.save();
  await product.populate('reviews.user', 'name');

  res.status(200).json({ success: true, message: 'Review submitted successfully', data: product });
});

export const deleteMyReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.reviews = product.reviews.filter((review) => review.user.toString() !== userId);
  const ratings = recomputeRatings(product.reviews);
  product.totalReviews = ratings.totalReviews;
  product.averageRating = ratings.averageRating;
  await product.save();

  res.status(200).json({ success: true, message: 'Review removed', data: product });
});
