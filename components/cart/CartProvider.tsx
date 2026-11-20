"use client";

import { useEffect, type ReactNode } from "react";
import { useCartStore } from "@/store/useCartStore";

export function CartProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return children;
}

export function useCart() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  return {
    items,
    isOpen,
    hasHydrated,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}
