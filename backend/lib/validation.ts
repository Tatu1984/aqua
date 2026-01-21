import { z } from "zod";

/**
 * Common validation schemas for API endpoints
 */

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .transform((email) => email.toLowerCase());

// Phone validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number (10 digits starting with 6-9)")
  .optional();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Postal code validation (Indian format)
export const postalCodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Invalid postal code (6 digits)");

// Address schema
export const addressSchema = z.object({
  firstName: z.string().min(1, "First name required").max(100),
  lastName: z.string().max(100).optional(),
  phone: phoneSchema,
  addressLine1: z.string().min(1, "Address required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City required").max(100),
  state: z.string().min(1, "State required").max(100),
  postalCode: postalCodeSchema,
  country: z.string().max(100).default("India"),
});

// Cart item schema
export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100, "Maximum 100 items"),
});

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variantId: z.string().uuid("Invalid variant ID").optional().nullable(),
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(100),
  image: z.string().url().optional(),
});

// Create order schema
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  email: emailSchema,
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().max(50).optional(),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
});

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().max(200, "Search query too long").optional().default(""),
  category: z.string().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popular"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Review schema
export const reviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

// Product schema (for admin)
export const createProductSchema = z.object({
  name: z.string().min(1, "Name required").max(255),
  sku: z.string().min(1, "SKU required").max(100),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(["SIMPLE", "VARIABLE"]).default("SIMPLE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  categoryId: z.string().uuid().optional().nullable(),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  manageStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"]).default("IN_STOCK"),
  isLivestock: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  images: z.array(z.union([
    z.string().url(),
    z.object({ url: z.string().url(), alt: z.string().max(255).optional() }),
  ])).optional(),
});

// Coupon validation schema
export const couponValidationSchema = z.object({
  code: z.string().min(1, "Coupon code required").max(50),
  subtotal: z.number().min(0),
  items: z.array(z.object({
    productId: z.string().uuid(),
    categoryId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
  })).optional(),
});

/**
 * Helper function to validate request body
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0].message,
    };
  }
  return { success: true, data: result.data };
}

/**
 * Helper function to validate query params
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return validateBody(schema, params);
}
