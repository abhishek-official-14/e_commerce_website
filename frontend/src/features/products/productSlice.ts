import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { Product, ProductQueryParams, ProductResponse } from '../../types';

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: Required<ProductQueryParams>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 9,
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 0
  },
  meta: {
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1
  }
};

export const fetchProducts = createAsyncThunk<ProductResponse, ProductQueryParams | undefined>(
  'products/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products', { params });
      return {
        data: data.data as Product[],
        meta: data.meta as ProductResponse['meta']
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk<Product, string>('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data as Product;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch product');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    updateFilters(state, action: { payload: Partial<ProductQueryParams> }) {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { updateFilters } = productSlice.actions;
export default productSlice.reducer;
