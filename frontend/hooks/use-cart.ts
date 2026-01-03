"use client";

import { create } from "zustand";
import * as api from "@/lib/api";
import type { Cart, CartItem } from "@/lib/api";

interface CartStore {
  cart: Cart;
  isLoading: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
}

const emptyCart: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
};

export const useCart = create<CartStore>((set, get) => ({
  cart: emptyCart,
  isLoading: false,
  isOpen: false,

  setOpen: (open) => set({ isOpen: open }),

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const { cart } = await api.getCart();
      set({ cart, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      set({ isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity = 1) => {
    try {
      set({ isLoading: true });
      await api.addToCart(productId, variantId, quantity);
      await get().fetchCart();
      set({ isOpen: true });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      set({ isLoading: true });
      await api.updateCartItem(itemId, quantity);
      await get().fetchCart();
    } catch (error) {
      console.error("Failed to update cart:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  removeItem: async (itemId) => {
    try {
      set({ isLoading: true });
      await api.removeFromCart(itemId);
      await get().fetchCart();
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  applyCoupon: async (code) => {
    try {
      set({ isLoading: true });
      await api.applyCoupon(code);
      await get().fetchCart();
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to apply coupon",
      };
    }
  },

  removeCoupon: async () => {
    try {
      set({ isLoading: true });
      await api.removeCoupon();
      await get().fetchCart();
    } catch (error) {
      console.error("Failed to remove coupon:", error);
      set({ isLoading: false });
    }
  },
}));
