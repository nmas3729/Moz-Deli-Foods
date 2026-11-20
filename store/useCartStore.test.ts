import { beforeEach, describe, expect, it } from "vitest";
import { menuItems } from "@/data/menu";
import { useCartStore } from "./useCartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false, hasHydrated: true });
  });

  it("adds items, combines quantities, and enforces the per-item limit", () => {
    const prawns = menuItems.find((item) => item.id === "queen-prawns");
    if (!prawns) throw new Error("Queen Prawns test item is missing.");

    expect(useCartStore.getState().addItem(prawns, 2)).toBe(true);
    expect(useCartStore.getState().addItem(prawns, 19)).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it("does not add products that are unavailable for online ordering", () => {
    const prawns = menuItems.find((item) => item.id === "queen-prawns");
    if (!prawns) throw new Error("Queen Prawns test item is missing.");

    expect(useCartStore.getState().addItem({ ...prawns, availability: "pending-confirmation" })).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
