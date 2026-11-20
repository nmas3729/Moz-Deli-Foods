export type MenuCategory = string;
export type Availability = "available" | "unavailable" | "pending-confirmation";

export type MenuProduct = {
  id: string;
  name: string;
  description?: string | null;
  category: MenuCategory;
  image?: string | null;
  imageAlt?: string | null;
  price: number | null;
  availability: Availability;
  featured: boolean;
  preOrderRequired?: boolean;
  requiresPreOrder?: boolean;
  variations?: string[];
  extras?: string[];
  dietaryInformation?: string[];
  listingNote: string;
};

export type CartItem = Omit<MenuProduct, "price"> & { price: number; quantity: number };
