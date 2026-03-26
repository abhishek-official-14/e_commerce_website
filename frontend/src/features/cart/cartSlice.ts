import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { CartItem, CartResponse, Product } from '../../types';

const CART_STORAGE_KEY = 'cartItems';

const getSavedCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const persistCart = (items: CartItem[]) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: getSavedCart(),
  loading: false,
  error: null
};

export const fetchMyCart = createAsyncThunk<CartItem[]>('cart/fetchMyCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart/me');
    return (data.data as CartResponse).items;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch cart');
  }
});

export const addItemToCartApi = createAsyncThunk<CartItem[], { productId: string; quantity?: number }>(
  'cart/addItemToCartApi',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/cart/items', { productId, quantity });
      return (data.data as CartResponse).items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to add item to cart');
    }
  }
);

export const updateCartItemApi = createAsyncThunk<CartItem[], { productId: string; quantity: number }>(
  'cart/updateCartItemApi',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/cart/items', { productId, quantity });
      return (data.data as CartResponse).items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update cart item');
    }
  }
);

export const removeItemFromCartApi = createAsyncThunk<CartItem[], string>('cart/removeItemFromCartApi', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/items/${productId}`);
    return (data.data as CartResponse).items;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message ?? 'Failed to remove item from cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const existingItem = state.items.find((item) => item.product._id === action.payload._id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1 });
      }

      persistCart(state.items);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.product._id !== action.payload);
      persistCart(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((productItem) => productItem.product._id === action.payload.productId);

      if (!item) {
        return;
      }

      item.quantity = Math.max(1, action.payload.quantity);
      persistCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      persistCart(state.items);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        persistCart(state.items);
      })
      .addCase(fetchMyCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addItemToCartApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCartApi.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        persistCart(state.items);
      })
      .addCase(addItemToCartApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCartItemApi.fulfilled, (state, action) => {
        state.items = action.payload;
        persistCart(state.items);
      })
      .addCase(removeItemFromCartApi.fulfilled, (state, action) => {
        state.items = action.payload;
        persistCart(state.items);
      });
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
