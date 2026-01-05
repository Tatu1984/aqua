// For server-side requests, we need the full backend URL
// For client-side requests, relative paths go through the rewrite proxy
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use relative path (goes through next.config.ts rewrites)
    return "";
  }
  // Server-side: use direct backend URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

// Products
export async function getProducts(params?: {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.featured) searchParams.set("featured", "true");
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sort) searchParams.set("sort", params.sort);

  const query = searchParams.toString();
  return fetcher<{
    products: ProductListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/products${query ? `?${query}` : ""}`);
}

export async function getProduct(slug: string) {
  return fetcher<{ product: ProductDetail; relatedProducts: ProductListItem[] }>(
    `/api/products/${slug}`
  );
}

// Categories
export async function getCategories() {
  return fetcher<{ categories: CategoryItem[] }>("/api/categories");
}

export async function getCategory(slug: string) {
  return fetcher<{ category: CategoryDetail }>(`/api/categories/${slug}`);
}

// Cart
export async function getCart() {
  return fetcher<{ cart: Cart }>("/api/cart");
}

export async function addToCart(productId: string, variantId?: string, quantity = 1) {
  return fetcher<{ success: boolean }>("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId, variantId, quantity }),
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return fetcher<{ success: boolean }>("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ itemId, quantity }),
  });
}

export async function removeFromCart(itemId: string) {
  return fetcher<{ success: boolean }>(`/api/cart?itemId=${itemId}`, {
    method: "DELETE",
  });
}

export async function applyCoupon(code: string) {
  return fetcher<{ success: boolean; coupon: { code: string; discount: number } }>(
    "/api/cart/coupon",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    }
  );
}

export async function removeCoupon() {
  return fetcher<{ success: boolean }>("/api/cart/coupon", {
    method: "DELETE",
  });
}

// Types
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  category?: string;
  categorySlug?: string;
  stockStatus: string;
  stockQuantity: number;
  isLivestock: boolean;
  livestockData?: {
    minTemp: number;
    maxTemp: number;
    minPh: number;
    maxPh: number;
    difficulty: string;
  };
  isFeatured: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  stockStatus: string;
  stockQuantity: number;
  isLivestock: boolean;
  livestockData?: {
    minTemp: number;
    maxTemp: number;
    minPh: number;
    maxPh: number;
    difficulty: string;
    careGuide?: string;
  };
  expressOnly: boolean;
  shippingRestricted: boolean;
  allowedCities: string[];
  category?: { name: string; slug: string };
  images: { id: string; url: string; alt?: string }[];
  variants: {
    id: string;
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    stockStatus: string;
    stockQuantity: number;
    image?: string;
    attributes?: Record<string, string>;
  }[];
  reviews: {
    items: {
      id: string;
      rating: number;
      title?: string;
      content?: string;
      author: string;
      createdAt: string;
    }[];
    count: number;
    average: number;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  children: { id: string; name: string; slug: string }[];
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  productCount: number;
  parent?: { name: string; slug: string };
  children: { id: string; name: string; slug: string; image?: string }[];
}

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
    stockStatus: string;
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Cart {
  id?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  coupon?: {
    code: string;
    discount: number;
  };
}
