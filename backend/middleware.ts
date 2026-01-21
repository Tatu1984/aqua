import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://aqua-frontend-psi.vercel.app",
];

// Security headers for all responses
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Add HSTS in production
if (process.env.NODE_ENV === "production") {
  securityHeaders["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
}

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations
const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  search: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  upload: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
};

// Get client IP for rate limiting
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// Check rate limit
function checkRateLimit(
  clientIP: string,
  prefix: string,
  config: { limit: number; windowMs: number }
): { allowed: boolean; retryAfter?: number } {
  const key = `${prefix}:${clientIP}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) rateLimitStore.delete(key);
  }
}, 60000);

// Apply security headers to response
function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
}

// Apply CORS headers to response
function applyCorsHeaders(response: NextResponse, origin: string, isAllowed: boolean): void {
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, PATCH, POST, PUT, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  response.headers.set("Access-Control-Expose-Headers", "X-CSRF-Token");
  response.headers.set("Access-Control-Max-Age", "3600"); // 1 hour instead of 24
}

// Verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  error?: string;
}> {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return { authenticated: false, error: "Authentication required" };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("[AUTH] JWT_SECRET not configured");
    return { authenticated: false, error: "Server configuration error" };
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Check for admin or ops roles
    if (!["ADMIN", "OPS", "EDITOR"].includes(role)) {
      return { authenticated: false, error: "Admin access required" };
    }

    return { authenticated: true };
  } catch {
    return { authenticated: false, error: "Invalid or expired token" };
  }
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin);
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    applyCorsHeaders(response, origin, isAllowedOrigin);
    applySecurityHeaders(response);
    return response;
  }

  // Determine rate limit config based on endpoint
  let rateLimitConfig = RATE_LIMITS.api;
  let rateLimitPrefix = "api";

  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/register")) {
    rateLimitConfig = RATE_LIMITS.auth;
    rateLimitPrefix = "auth";
  } else if (pathname.startsWith("/api/search")) {
    rateLimitConfig = RATE_LIMITS.search;
    rateLimitPrefix = "search";
  } else if (pathname.includes("/upload")) {
    rateLimitConfig = RATE_LIMITS.upload;
    rateLimitPrefix = "upload";
  }

  // Check rate limit
  const rateCheck = checkRateLimit(clientIP, rateLimitPrefix, rateLimitConfig);
  if (!rateCheck.allowed) {
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("Retry-After", rateCheck.retryAfter!.toString());
    applySecurityHeaders(response);
    applyCorsHeaders(response, origin, isAllowedOrigin);
    return response;
  }

  // Protect admin routes (except admin auth endpoints if any)
  if (pathname.startsWith("/api/admin")) {
    const authResult = await verifyAdminAuth(request);

    if (!authResult.authenticated) {
      const response = NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
      applySecurityHeaders(response);
      applyCorsHeaders(response, origin, isAllowedOrigin);
      return response;
    }
  }

  // Handle actual request
  const response = NextResponse.next();
  applySecurityHeaders(response);
  applyCorsHeaders(response, origin, isAllowedOrigin);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
