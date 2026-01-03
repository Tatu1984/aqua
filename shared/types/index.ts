// ==================== USER TYPES ====================

export type UserRole = "CUSTOMER" | "ADMIN" | "EDITOR" | "OPS";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  type: "SHIPPING" | "BILLING";
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// ==================== PRODUCT TYPES ====================

export type ProductType = "SIMPLE" | "VARIABLE" | "LIVESTOCK" | "DIGITAL";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";

export interface LivestockData {
  minTemp: number;
  maxTemp: number;
  minPh: number;
  maxPh: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  careGuide?: string;
  compatibility?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  type: ProductType;
  status: ProductStatus;
  categoryId?: string;
  category?: Category;

  price: number;
  compareAtPrice?: number;

  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  allowBackorder: boolean;

  isLivestock: boolean;
  livestockData?: LivestockData;
  shippingRestricted: boolean;
  allowedCities: string[];
  expressOnly: boolean;

  isFeatured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttributeValue[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
  isVideo: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  image?: string;
  attributes: { name: string; value: string }[];
}

export interface ProductAttributeValue {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
}

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  sortOrder: number;
  isVisible: boolean;
  productCount?: number;
}

// ==================== CART TYPES ====================

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
    stockQuantity: number;
    stockStatus: StockStatus;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  coupon?: {
    code: string;
    discount: number;
  };
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

// ==================== ORDER TYPES ====================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;

  shippingAddress?: Address;
  shippingMethod?: string;
  trackingNumber?: string;

  paymentMethod?: string;

  items: OrderItem[];
  timeline: OrderTimelineEntry[];

  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

export interface OrderTimelineEntry {
  id: string;
  status: string;
  comment?: string;
  isPublic: boolean;
  createdAt: Date;
}

// ==================== COUPON TYPES ====================

export type CouponType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
}

// ==================== REVIEW TYPES ====================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
  rating: number;
  title?: string;
  content?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isVerified: boolean;
  createdAt: Date;
}

// ==================== CMS TYPES ====================

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  video?: string;
  link?: string;
  buttonText?: string;
  position: string;
  isActive: boolean;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content?: PageBlock[];
  seoTitle?: string;
  seoDescription?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface PageBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  attributes?: Record<string, string[]>;
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "rating";
}
