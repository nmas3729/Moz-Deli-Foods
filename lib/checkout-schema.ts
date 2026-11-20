import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const orderRequestSchema = z.object({
  customer: z.object({
    name: text(120),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/),
    email: z.email().max(254),
    instructions: z.string().trim().max(1000).optional().default(""),
  }).strict(),
  fulfillment: z.enum(["COLLECTION", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(500).optional().default(""),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(20),
  }).strict()).min(1).max(20),
}).strict();

export const menuProductUpdateSchema = z.object({
  name: text(120),
  description: z.string().trim().max(1000).nullable(),
  category: text(80),
  image: z.string().trim().max(500).nullable(),
  imageAlt: z.string().trim().max(200).nullable(),
  priceCents: z.number().int().min(1).max(10_000_000).nullable(),
  availability: z.boolean(),
  featured: z.boolean(),
}).strict();

export const restaurantSettingsUpdateSchema = z.object({
  onlineOrderingEnabled: z.boolean(),
  collectionEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  deliveryFeeCents: z.number().int().min(0).max(10_000_000).nullable(),
  minimumOrderCents: z.number().int().min(0).max(10_000_000).nullable(),
  deliveryAreas: z.array(text(120)).max(100),
  collectionEstimateMinutes: z.number().int().min(1).max(600).nullable(),
}).strict();
