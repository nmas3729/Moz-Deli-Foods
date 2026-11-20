"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type PersistOptions } from "zustand/middleware";
import type { CartItem, MenuProduct } from "@/types";

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  setIsOpen: (open: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  addItem: (product: MenuProduct, quantity?: number) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

type PersistedCart = Pick<CartStore, "items">;
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.category === "string"
    && typeof item.price === "number"
    && Number.isFinite(item.price)
    && typeof item.quantity === "number"
    && Number.isInteger(item.quantity)
    && item.quantity > 0
    && typeof item.featured === "boolean"
    && (item.availability === "available" || item.availability === "unavailable" || item.availability === "pending-confirmation")
    && typeof item.listingNote === "string"
    && (item.preOrderRequired === undefined || typeof item.preOrderRequired === "boolean");
}

const persistOptions: PersistOptions<CartStore, PersistedCart> = {
  name: "moz-deli-cart-v2",
  storage: createJSONStorage(() => typeof window === "undefined" ? memoryStorage : window.localStorage),
  skipHydration: true,
  partialize: (state) => ({ items: state.items }),
  merge: (persistedState, currentState) => {
    const persistedItems = (persistedState as PersistedCart | undefined)?.items;
    if (persistedItems !== undefined && (!Array.isArray(persistedItems) || !persistedItems.every(isCartItem))) {
      console.warn("Ignoring malformed Moz Deli cart data.");
    }
    return {
      ...currentState,
      items: Array.isArray(persistedItems) && persistedItems.every(isCartItem) ? persistedItems : [],
    };
  },
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
};

export const useCartStore = create<CartStore>()(
  persist<CartStore, [], [], PersistedCart>(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addItem: (product, quantity = 1) => {
        let added = false;
        const price = product.price;
        set((state) => {
          if (product.availability !== "available"
            || price === null
            || !Number.isInteger(quantity)
            || quantity < 1
            || quantity > 20) return state;

          const existing = state.items.find((item) => item.id === product.id);
          if ((existing?.quantity ?? 0) + quantity > 20) return state;

          added = true;
          const items = existing
            ? state.items.map((item) => item.id === product.id
              ? { ...product, price, quantity: item.quantity + quantity }
              : item)
            : [...state.items, { ...product, price, quantity }];

          return { items, isOpen: true };
        });
        return added;
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (!Number.isInteger(quantity) || quantity > 20) return;
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => item.id === id ? { ...item, quantity } : item),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    persistOptions,
  ),
);
