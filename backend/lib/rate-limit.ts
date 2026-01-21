import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: For production with multiple instances, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  // Maximum requests allowed in the window
  limit: number;
  // Time window in milliseconds
  windowMs: number;
  // Key prefix for different rate limit types
  prefix?: string;
}

// Default configurations for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  auth: { limit: 5, windowMs: 15 * 60 * 1000, prefix: "auth" }, // 5 per 15 min
  // Search endpoints
  search: { limit: 60, windowMs: 60 * 1000, prefix: "search" }, // 60 per minute
  // Upload endpoints
  upload: { limit: 20, windowMs: 60 * 60 * 1000, prefix: "upload" }, // 20 per hour
  // General API endpoints
  api: { limit: 100, windowMs: 60 * 1000, prefix: "api" }, // 100 per minute
  // Webhook endpoints
  webhook: { limit: 100, windowMs: 60 * 1000, prefix: "webhook" }, // 100 per minute
} as const;

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "unknown";
}

/**
 * Check rate limit for a request
 * Returns null if within limit, or error response if exceeded
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const clientId = getClientId(request);
  const key = `${config.prefix || "default"}:${clientId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null;
  }

  if (entry.count >= config.limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(entry.resetTime / 1000).toString(),
        },
      }
    );
  }

  // Increment counter
  entry.count++;
  return null;
}

/**
 * Rate limit middleware wrapper for route handlers
 */
export function withRateLimit<T>(
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: unknown[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<T | NextResponse> => {
    const rateLimitResponse = checkRateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request, ...args);
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  request: NextRequest,
  config: RateLimitConfig
): Record<string, string> {
  const clientId = getClientId(request);
  const key = `${config.prefix || "default"}:${clientId}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      "X-RateLimit-Limit": config.limit.toString(),
      "X-RateLimit-Remaining": config.limit.toString(),
    };
  }

  return {
    "X-RateLimit-Limit": config.limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, config.limit - entry.count).toString(),
    "X-RateLimit-Reset": Math.ceil(entry.resetTime / 1000).toString(),
  };
}
