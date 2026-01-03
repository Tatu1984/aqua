// ==================== SITE CONFIG ====================

export const SITE_CONFIG = {
  name: "Aqua",
  description: "Premium Aquarium Products & Livestock",
  url: "https://aqua.store",
  ogImage: "/og-image.jpg",
  currency: "INR",
  country: "IN",
  locale: "en-IN",
} as const;

// ==================== THEME ====================

export const COLORS = {
  primary: {
    DEFAULT: "#0A1628",
    50: "#E8F4FC",
    100: "#C5E4F7",
    200: "#8BC9EF",
    300: "#51AEE7",
    400: "#1793DF",
    500: "#0D6EAD",
    600: "#0A5589",
    700: "#073D65",
    800: "#052541",
    900: "#0A1628",
  },
  accent: {
    DEFAULT: "#00D4FF",
    50: "#E5FBFF",
    100: "#CCF7FF",
    200: "#99EFFF",
    300: "#66E7FF",
    400: "#33DFFF",
    500: "#00D4FF",
    600: "#00AACC",
    700: "#008099",
    800: "#005566",
    900: "#002B33",
  },
  coral: {
    DEFAULT: "#FF6B4A",
    50: "#FFF0ED",
    100: "#FFE1DB",
    200: "#FFC3B7",
    300: "#FFA593",
    400: "#FF876F",
    500: "#FF6B4A",
    600: "#FF3D14",
    700: "#DC2600",
    800: "#A41D00",
    900: "#6C1300",
  },
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

// ==================== ORDER STATUS ====================

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-100 text-gray-800",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially Refunded",
};

// ==================== STOCK STATUS ====================

export const STOCK_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  BACKORDER: "Available for Backorder",
};

export const STOCK_STATUS_COLORS: Record<string, string> = {
  IN_STOCK: "text-green-600",
  LOW_STOCK: "text-yellow-600",
  OUT_OF_STOCK: "text-red-600",
  BACKORDER: "text-blue-600",
};

// ==================== SHIPPING ====================

export const LIVESTOCK_SHIPPING_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
] as const;

// ==================== PAGINATION ====================

export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

// ==================== API ENDPOINTS ====================

export const API_ROUTES = {
  // Auth
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
  AUTH_REFRESH: "/api/auth/refresh",

  // Products
  PRODUCTS: "/api/products",
  PRODUCT: (slug: string) => `/api/products/${slug}`,

  // Categories
  CATEGORIES: "/api/categories",
  CATEGORY: (slug: string) => `/api/categories/${slug}`,

  // Cart
  CART: "/api/cart",
  CART_ADD: "/api/cart/add",
  CART_UPDATE: "/api/cart/update",
  CART_REMOVE: "/api/cart/remove",
  CART_COUPON: "/api/cart/coupon",

  // Checkout
  CHECKOUT: "/api/checkout",
  CHECKOUT_VERIFY: "/api/checkout/verify",

  // Orders
  ORDERS: "/api/orders",
  ORDER: (id: string) => `/api/orders/${id}`,

  // Customer
  CUSTOMER_PROFILE: "/api/customer/profile",
  CUSTOMER_ADDRESSES: "/api/customer/addresses",
  CUSTOMER_WISHLIST: "/api/customer/wishlist",

  // Search
  SEARCH: "/api/search",
  SEARCH_SUGGEST: "/api/search/suggest",

  // Reviews
  REVIEWS: (productId: string) => `/api/products/${productId}/reviews`,

  // CMS
  PAGES: "/api/cms/pages",
  PAGE: (slug: string) => `/api/cms/pages/${slug}`,
  BANNERS: "/api/cms/banners",
} as const;

// ==================== WATER PARAMETERS ====================

export const WATER_PARAM_RANGES = {
  temperature: { min: 18, max: 32, unit: "°C" },
  ph: { min: 5.5, max: 8.5, unit: "" },
  hardness: { min: 0, max: 30, unit: "dGH" },
} as const;

// ==================== FISH DIFFICULTY ====================

export const DIFFICULTY_LEVELS = {
  BEGINNER: {
    label: "Beginner Friendly",
    description: "Easy to care for, hardy species",
    color: "green",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    description: "Requires some experience",
    color: "yellow",
  },
  ADVANCED: {
    label: "Advanced",
    description: "Requires expert care",
    color: "red",
  },
} as const;
